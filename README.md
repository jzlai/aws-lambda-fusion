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

This project is part of the Function-Fusion framework.

`aws-lambda-fusion` exposes two different functions: `invokeFunctionSync` and `invokceFunctionAsync`.

### CLI

`aws-lambda-fusion` also comes with two CLI commands.

#### Create serverless.yml

`aws-lambda-fusion -f <url to fusion configuration> -h <name of handler, default: fusionHandler>`

### Create directed acyclic graph JSON file

`aws-lambda-fusion -d <root of your project>`

## Usage

First, you need to manually create a deployment configuration. By default every logical function should be inside its own deployment unit, i.e., for every function there is its own lambda. Upload this file to a S3 bucket of your choice and make it publically available.

#### Example

If your application has 3 functions:

```json
[
  {
    "entry": "handler0",
    "lambdas": ["function1"]
  },
  {
    "entry": "handler1",
    "lambdas": ["function2"]
  },
  {
    "entry": "handler2",
    "lambdas": ["function3"]
  }
]
```

The `entry` property specifies which AWS Lambda should be invoked.

Afterward, you need to create an entry handler for any incoming requests. This handler delegates requests to the correct target function.

```javascript
exports.handler = async (event, context, callback) => {
  let traceId = ''

  // fetch deployment configuration from remote
  const response = await fetch('https://example.com/fusionConfiguration.json')
  const fusionConfiguration = await response.json()

  // create new traceId if none exists
  if (event.traceId) {
    traceId = event.traceId
  } else {
    traceId = uuid()
  }

  const target = event.target
  const source = event.source

  if (!target) {
    throw Error('Error. No target found in event', event)
  }

  const fusion = new FunctionFusion(
    fusionConfiguration,
    {
      region: 'eu-central-1',
    },
    __dirname
  )
  let args = []
  if (event.args) {
    args = [...event.args]
  }

  return fusion.invokeFunctionSync(
    { source, target, context, traceId },
    ...args
  )
}
```

Finally, every AWS handler needs to be wrapped inside the `handlerWrapper` function that is exported by this library. `handlerWrapper` adds traceId logs at the start and end of the Lambda invocation. This is needed for the `log-aggregator` to work. Invoke other functions by using either `invokeFunctionSync` or `invokeFunctionAsync`.

```javascript
const { handlerWrapper } = require('aws-lambda-fusion')

const handler = async (event, context) => {
  const traceId = event.traceId

  // fetch deployment configuration from remote
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

exports.handler = async handlerWrapper(event, context, callback) => {
  const traceId = event.traceId;
  return handlerWrapper({
    event,
    context,
    callback,
    handler: internalHandler,
    traceId,
    lambdaName: 'name of source function',
  });
}
```

### Deployment

#### Prerequisites

- Installed [Serverless](https://www.serverless.com/) framework

#### Step 1

Generate a `serverless.yml`

```
aws-lambda-fusion -f <url to fusion configuration> -h <name of handler, default: fusionHandler>
```

The `-h` option should point to the entry handler you created in the previous step. By default the entry handler is named `fusionHandler`. This creates a `serverless.yml` file. You might need to adjust `iamRoleStatements` according to your needs.

#### Step 2

The Optimizer needs a Github Action to trigger a deployment from. You can do this easily with our CLI:

```
aws-lambda-fusion --github-actions
```

Afterward, add your `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to your repository's [secrets](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository).

#### Step 3

Deploy your application to staging

```
serverless deploy --stage stg
```

#### Step 4

If you deployed the Optimizer and Feedback framework previously you are done. Otherwise, refer to their README's on how to install and deploy them.
