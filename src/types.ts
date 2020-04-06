import { Handler } from 'aws-lambda'

export type FusionConfiguration = FusionGroup[]

export type FusionGroup = {
  entry: string;
  lambdas: string[];
}

export type LambdaType = {
  name: string;
  handler?: Handler;
}
