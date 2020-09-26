import { FusionGroup } from './types'

export const removeStage = (fusionGroup: FusionGroup) => {
  return fusionGroup.entry.split('-')[0]
}
