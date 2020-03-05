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

  invokeFunctionAsync (source: string, destination: LambdaType, context: Context, callback: Callback, ...args: any[]) {
    if (this.fusionConfiguration[source] !== this.fusionConfiguration[destination.name]) {
      console.log(`Source "${source}" and destination "${destination.name}" not in same lambda group. Invoking remote request.`)
      const lambda = new Lambda(this.clientConfiguration)
      const params: InvokeAsyncRequest = {
        FunctionName: destination.name,
        InvokeArgs: args
      }
      try {
        const response = lambda.invokeAsync(params)
        console.log('Success', response)
      } catch (error) {
        console.log('Error', error)
      }
    } else {
      if (!destination.handler) {
        throw new Error('Destination handler cannot be called')
      }
      return destination.handler(args, context, callback)
    }
  }

  async invokeFunctionSync (source: string, destination: LambdaType, context: Context, callback: Callback, ...args: any[]) {
    if (this.fusionConfiguration[source] !== this.fusionConfiguration[destination.name]) {
      console.log(`Source "${source}" and destination "${destination.name}" not in same lambda group. Invoking remote request.`)
      const lambda = new Lambda(this.clientConfiguration)
      const params: InvocationRequest = {
        FunctionName: destination.name,
        InvocationType: 'RequestResponse',
        Payload: {
          event: args
        }
      }
      params.Payload = JSON.stringify(params.Payload)
      try {
        const response = await lambda.invoke(params).promise()
        console.log('Success', response.$response.data)
        return response
      } catch (err) {
        console.log('Error', err)
        return err
      }
    } else {
      if (!destination.handler) {
        throw new Error('Destination handler cannot be called')
      }
      return destination.handler(args, context, callback)
    }
  }
}

export default FunctionFusion
