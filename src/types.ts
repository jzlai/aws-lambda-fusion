import { Handler, Context } from 'aws-lambda'

export type FusionConfiguration = FusionGroup[]

export type FusionGroup = {
  entry: string
  lambdas: string[]
}

export type LambdaType = {
  name: string
  handler?: Handler
}

export type InvokeParams = {
  source: string
  target: string
  context: Context
  traceId: string
}
