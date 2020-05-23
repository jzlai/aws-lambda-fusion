import { FusionConfiguration, LambdaType, InvokeParams } from './types'
import Lambda, {
  ClientConfiguration,
  InvocationRequest,
} from 'aws-sdk/clients/lambda'
import { Context, Callback, Handler } from 'aws-lambda'
import { PromiseResult } from 'aws-sdk/lib/request'
import { AWSError } from 'aws-sdk/lib/error'

class FunctionFusion {
  fusionConfiguration: FusionConfiguration
  clientConfiguration: ClientConfiguration
  dirName: string

  constructor(
    fusionConfiguration: FusionConfiguration,
    clientConfiguration: ClientConfiguration,
    dirName: string
  ) {
    this.fusionConfiguration = fusionConfiguration
    this.clientConfiguration = clientConfiguration
    this.dirName = dirName
  }

  async invokeFunctionAsync(params: InvokeParams, ...args: any[]) {
    return this.invoke(params, 'Event', args)
  }

  async invokeFunctionSync(params: InvokeParams, ...args: any[]) {
    return this.invoke(params, 'RequestResponse', args)
  }

  private async invoke(
    params: InvokeParams,
    InvocationType: 'Event' | 'RequestResponse' | 'DryRun',
    args: any[]
  ) {
    const { source, target, context } = params
    if (!this.areInSameFusionGroup(params.source, params.target)) {
      console.log(
        `Source "${source}" and destination "${target}" not in same lambda group. Invoking remote request.`
      )
      const lambda = new Lambda(this.clientConfiguration)
      console.log(`Looking for entry for ${target}`)
      const entry = this.fusionConfiguration.find((config) =>
        config.lambdas.includes(target)
      )?.entry

      if (!entry) {
        throw Error('No entry lambda found')
      }

      const params: InvocationRequest = {
        FunctionName: entry,
        InvocationType,
        Payload: {
          args,
        },
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
      console.log(
        `Source "${source}" and destination "${target}" in same lambda group. Invoking local request.`
      )

      const { handler } = require(`${this.dirName}/${target}`)

      let res: Partial<PromiseResult<
        Lambda.InvocationResponse,
        AWSError
      >> = {} as any
      const cb = (err: Error | string | null | undefined, result: any) => {
        res = this.generateResponse(err, result)
      }
      const directResponse = await handler({ args }, context, cb)
      if (directResponse) {
        return this.generateResponse(null, directResponse)
      }
      return res
    }
  }

  private generateResponse(
    err: Error | string | null | undefined,
    result: any
  ) {
    let res: Partial<PromiseResult<
      Lambda.InvocationResponse,
      AWSError
    >> = {} as any
    if (!err) {
      res = {
        StatusCode: 200,
        Payload: result,
      }
    } else {
      res = {
        StatusCode: 200,
        FunctionError: 'Unhandled',
      }
      if (typeof err === 'string') {
        res.Payload = {
          errorType: 'Error',
          errorMessage: err,
          trace: [],
        }
      } else {
        res.Payload = {
          errorType: 'Error',
          errorMessage: err.message,
          trace: err.stack,
        }
      }
    }
    return res
  }

  private areInSameFusionGroup(sourceName: string, destinationName: string) {
    return (
      this.fusionConfiguration.some((fusionGroup) => {
        return (
          fusionGroup.lambdas.includes(sourceName) &&
          fusionGroup.lambdas.includes(destinationName)
        )
      }) || sourceName === undefined
    )
  }
}

export default FunctionFusion

type HandlerWrapperArgs = {
  event: Event
  context: Context
  callback: Callback
  handler: Handler
  traceId?: string
  lambdaName?: string
}
export const handlerWrapper = async ({
  event,
  context,
  callback,
  handler,
  traceId,
  lambdaName,
}: HandlerWrapperArgs) => {
  console.log(
    JSON.stringify({
      traceId,
      starttime: Date.now(),
      lambdaName,
    })
  )

  const result = await handler(event, context, callback)

  console.log(
    JSON.stringify({
      traceId,
      endtime: Date.now(),
      lambdaName,
    })
  )

  return result
}
