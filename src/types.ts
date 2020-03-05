import { Handler } from 'aws-lambda'

export type FusionConfiguration = {
  [lambdaName: string]: FusionGroupId
}

export type FusionGroupId = string

export type LambdaType = {
  name: string
  handler?: Handler
}
