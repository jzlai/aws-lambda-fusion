#!/usr/bin/env node
import program from 'commander'
import clear from 'clear'
import chalk from 'chalk'
import fs from 'fs'
import { FusionConfiguration } from './types'
import yaml from 'js-yaml'
import inquirer from 'inquirer'

const dirName = process.cwd().split('/').slice(-1)[0]

async function run () {
  clear()

  program
    .version(require('../package.json').version)
    .description('CLI for generating serverless.yml from fusion configuration')
    .option('-f, --fusion-config <file.json>', 'Path to fusion configuration .json')
    .parse(process.argv)

  if (!process.argv.slice(2).length) {
    program.outputHelp()
  }

  if (program.fusionConfig) {
    if (!fs.existsSync(program.fusionConfig)) {
      console.log(
        chalk.bold(chalk.red('Fusion config does not exist: ') + program.fusionConfig)
      )
      program.help()
    }

    const configBuffer = fs.readFileSync(program.fusionConfig)
    const fusionConfig = JSON.parse(configBuffer.toString()) as FusionConfiguration

    let serverlessYaml: any
    if (fs.existsSync('serverless.yml')) {
      try {
        serverlessYaml = yaml.safeLoad(fs.readFileSync('serverless.yml', 'utf-8'))
        if (serverlessYaml === undefined || typeof serverlessYaml === 'string') {
          console.error(chalk.bold(chalk.red('Please provide a valid serverless.yml')))
          return
        }
      } catch (err) {
        console.error('Error parsing serverless.yml')
      }
    } else {
      console.log(chalk.grey('No serverless.yml detected. Generating new one.'))
      const questions = [
        {
          type: 'input',
          message: 'Name of your service?',
          name: 'serviceName',
          default: dirName
        },
        {
          type: 'list',
          message: 'nodejs runtime?',
          name: 'nodeRuntime',
          choices: ['nodejs12.x', 'nodejs10.x', 'nodejs8.10'],
          default: false
        },
        {
          type: 'input',
          message: 'AWS region?',
          name: 'awsRegion',
          default: 'eu-central-1'
        }
      ]

      const answers = await inquirer.prompt(questions)
      serverlessYaml = {
        service: {
          name: answers.serviceName
        },
        provider: {
          name: 'aws',
          runtime: answers.nodeRuntime,
          region: answers.awsRegion,
          iamRoleStatements: [{
            Effect: 'Allow',
            Action: ['lambda:InvokeFunction', 'lambda:InvokeAsync'],
            Resource: '*'
          }]
        },
        functions: {}
      }
    }

    Object.values(fusionConfig).forEach(fusionGroup => {
      if (serverlessYaml.functions[fusionGroup.entry]) {
        Object.assign(serverlessYaml.functions[fusionGroup.entry], {
          handler: `src/${fusionGroup.entry}.handler`,
          name: fusionGroup.entry
        })
      } else {
        serverlessYaml.functions[fusionGroup.entry] = {
          handler: `src/${fusionGroup.entry}.handler`,
          name: fusionGroup.entry
        }
      }
    })

    const entries = Object.values(fusionConfig).map(fusionGroup => fusionGroup.entry)

    Object.keys(serverlessYaml.functions).forEach(functionName => {
      if (!entries.includes(functionName)) {
        delete serverlessYaml.functions[functionName]
      }
    })

    const dump = yaml.safeDump(serverlessYaml)
    fs.writeFileSync('serverless.yml', dump)
    console.log(
      `${chalk.bold(chalk.blue('Successfully'))} ${chalk.grey('generated serverless.yml')}`
    )
  }
}

run()
