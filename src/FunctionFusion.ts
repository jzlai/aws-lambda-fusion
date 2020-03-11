import { FusionConfiguration, LambdaType } from './types'
import Lambda, { InvokeAsyncRequest, ClientConfiguration, InvocationRequest } from 'aws-sdk/clients/lambda'
import { Context, Callback } from 'aws-lambda'

class FunctionFusion {
  fusionConfiguration: FusionConfiguration
  clientConfiguration: ClientConfiguration

  constructor (fusionConfiguration: FusionConfiguration, clientConfiguration: ClientConfiguration) {
    this.fusionConfiguration = fusionConfiguration
    this.clientConfiguration = clientConfiguration
  }

  invokeFunctionAsync (sourceName: string, destination: LambdaType, context: Context, callback: Callback, ...args: any[]) {
    if (!this.areInSameFusionGroup(sourceName, destination.name)) {
      console.log(`Source "${sourceName}" and destination "${destination.name}" not in same lambda group. Invoking remote request.`)
      const lambda = new Lambda(this.clientConfiguration)
      const params: InvokeAsyncRequest = {
        FunctionName: destination.name,
        InvokeArgs: args
      }
      try {
        const response = lambda.invokeAsync(params)
        console.log('Success', response)
        return response
      } catch (error) {
        console.log('Error', error)
      }
    } else {
      console.log(`Source "${sourceName}" and destination "${destination.name}" in same lambda group. Invoking local request.`)
      if (!destination.handler) {
        throw new Error('Destination handler cannot be called')
      }

      const event = {
        event: args
      }
      return destination.handler(event, context, callback)
    }
  }

  async invokeFunctionSync (sourceName: string, destination: LambdaType, context: Context, callback: Callback, ...args: any[]) {
    if (!this.areInSameFusionGroup(sourceName, destination.name)) {
      console.log(`Source "${sourceName}" and destination "${destination.name}" not in same lambda group. Invoking remote request.`)
      const lambda = new Lambda(this.clientConfiguration)
      const params: InvocationRequest = {
        FunctionName: destination.name,
        InvocationType: 'RequestResponse',
        Payload: {
          args
        }
      }
      params.Payload = JSON.stringify(params.Payload)
      try {
        const response = await lambda.invoke(params).promise()
        console.log('Success', response.$response.data)
        return response
      } catch (err) {
        console.log('Error', err)
        throw err
      }
    } else {
      console.log(`Source "${sourceName}" and destination "${destination.name}" in same lambda group. Invoking local request.`)

      if (!destination.handler) {
        throw new Error('Destination handler cannot be called')
      }
      return destination.handler({ args }, context, callback)
    }
  }

  private areInSameFusionGroup (sourceName: string, destinationName: string) {
    return Object.values(this.fusionConfiguration).some(fusionGroup => {
      console.log(fusionGroup.lambdas.includes(sourceName), fusionGroup.lambdas.includes(destinationName))
      return fusionGroup.lambdas.includes(sourceName) && fusionGroup.lambdas.includes(destinationName)
    })
  }
}

export default FunctionFusion
