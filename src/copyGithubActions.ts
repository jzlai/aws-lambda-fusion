import cpFile from 'cp-file'

export const copyGithubActions = async () => {
  return cpFile(
    'node_modules/aws-lambda-fusion/dist/deploy.yml',
    '.github/workflows/deploy.yml'
  )
}
