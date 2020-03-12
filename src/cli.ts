#!/usr/bin/env node
import program from 'commander'
import figlet from 'figlet'
import clear from 'clear'
import chalk from 'chalk'
import fs from 'fs'
import { FusionConfiguration } from './types'
import yaml from 'js-yaml'
import inquirer from 'inquirer'

const dirName = process.cwd().split('/').slice(-1)[0]

async function run () {
  clear()
  console.log(
    chalk.yellow(
      figlet.textSync('lambda-fusion', { horizontalLayout: 'controlled smushing' })
    )
  )

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
      }
    ]

    const answers = await inquirer.prompt(questions)

    const configBuffer = fs.readFileSync(program.fusionConfig)
    const fusionConfig = JSON.parse(configBuffer.toString()) as FusionConfiguration

    const serverlessYaml = {
      service: {
        name: answers.serviceName
      },
      custom: {
        webpack: {
          webpackConfig: './webpack.config.js',
          includeModules: true
        }
      },
      plugins: ['serverless-webpack'],
      provider: {
        name: 'aws',
        runtime: answers.nodeRuntime,
        region: 'eu-central-1',
        iamRoleStatements: [{
          Effect: 'Allow',
          Action: ['lambda:InvokeFunction', 'lambda:InvokeAsync'],
          Resource: '*'
        }]
      },
      functions: {}
    } as any
    Object.values(fusionConfig).forEach((fusionGroup, index) => {
      serverlessYaml.functions[index] = {
        handler: `src/${fusionGroup.entry}.handler`,
        name: fusionGroup.entry
      }
    })
    console.log()
    const dump = yaml.safeDump(serverlessYaml)
    fs.writeFileSync('serverless.yml', dump)
    console.log(
      `${chalk.bold(chalk.blue('Successfully'))} ${chalk.grey('generated serverless.yml')}`
    )
  }
}

run()
