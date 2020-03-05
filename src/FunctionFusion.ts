import { FusionConfiguration, LambdaType } from './types'
import Lambda, { InvokeAsyncRequest, ClientConfiguration } from 'aws-sdk/clients/lambda'
import { Context, Callback } from 'aws-lambda'

class FunctionFusion {
  fusionConfiguration: FusionConfiguration
  clientConfiguration: ClientConfiguration

  constructor (fusionConfiguration: FusionConfiguration, clientConfiguration: ClientConfiguration) {
    this.fusionConfiguration = fusionConfiguration
    this.clientConfiguration = clientConfiguration
  }

  async invokeFunctionAsync (source: string, destination: LambdaType, context: Context, callback: Callback, ...args: any[]) {
    if (this.fusionConfiguration[source] !== this.fusionConfiguration[destination.name]) {
      console.log(`Source "${source}" and destination "${destination.name}" not in same lambda group. Invoking remote request.`)
      const lambda = new Lambda(this.clientConfiguration)
      const params: InvokeAsyncRequest = {
        FunctionName: destination.name,
        InvokeArgs: args
      }
      const response = await lambda.invokeAsync(params).promise()
      if (response.$response.error) {
        throw new Error(response.$response.error.message)
      }
      console.log('Success', response)
      return response
    } else {
      if (!destination.handler) {
        throw new Error('Destination handler cannot be called')
      }
      return destination.handler(args, context, callback)
    }
  }

  invokeFunctionSync (source: string, destination: LambdaType, context: Context, callback: Callback, ...args: any[]) {
    if (this.fusionConfiguration[source] !== this.fusionConfiguration[destination.name]) {
      console.log(`Source "${source}" and destination "${destination.name}" not in same lambda group. Invoking remote request.`)
      const lambda = new Lambda(this.clientConfiguration)
      const params: InvokeAsyncRequest = {
        FunctionName: destination.name,
        InvokeArgs: args
      }
      const response = lambda.invoke(params)
      console.log('Success', response)
      return response
    } else {
      if (!destination.handler) {
        throw new Error('Destination handler cannot be called')
      }
      return destination.handler(args, context, callback)
    }
  }
}

export default FunctionFusion
