import cpFile from 'cp-file'

export const copyGithubActions = async () => {
  return Promise.all([
    cpFile(
      'node_modules/aws-lambda-fusion/dist/deploy.yml',
      '.github/workflows/deploy.yml'
    ),
    cpFile(
      'node_modules/aws-lambda-fusion/dist/deploy-stg.yml',
      '.github/workflows/deploy-stg.yml'
    ),
  ])
}
