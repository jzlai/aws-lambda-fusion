# aws-lambda-fusion

## Installation

```
npm install aws-lambda-fusion
```

or

```
yarn add aws-lambda-fusion
```

## Usage

### Framework

This project is part of the lambda fusion framework.

`aws-lambda-fusion` exposes two different functions: `invokeFunctionSync` and `invokceFunctionAsync`.

### CLI

`aws-lambda-fusion` also comes with two CLI commands.

#### Create serverless.yml

`aws-lambda-fusion -f <url to fusion configuration> -h <name of handler, default: fusionHandler>`

### Create directed acyclic graph JSON file

`aws-lambda-fusion -d <path to directory>`

###

## Examples

```javascript
exports.handler = async (event, context) => {
  // generate unique trace id
  const traceId = new uuid()

  // fetch fusion configuration from remote
  const response = await fetch('http://example.com/fusionConfiguration.json')
  const fusionConfiguration = await response.json()

  //create fusion object
  const fusion = new FunctionFusion(
    fusionConfiguration,
    {
      region: 'eu-central-1',
    },
    __dirname
  )

  // invoke other function
  const response = await fusion.invokeFunctionSync(
    {
      source: '<name of source function>',
      target: '<name of target function>',
      context,
      traceId,
    },
    payload
  )
}
```
