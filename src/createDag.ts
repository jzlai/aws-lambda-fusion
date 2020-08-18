import fs from 'fs'
import path from 'path'

type DAG = {
  [key: string]: string[]
}

export const createDag = (dirName: string) => {
  const dirPath = path.join(process.cwd(), dirName)
  const files = fs.readdirSync(dirPath)
  let dag: DAG = {}
  for (let file of files) {
    if (file === 'fusionHandler.js') {
      continue
    }
    const content = fs.readFileSync(`${dirPath}/${file}`).toString()
    const regexp = /invokeFunction(?:Sync|Async).*?target:.*?"(.*?)"/gs
    const source = file.split('.').slice(0, -1).join('.')
    let match
    while ((match = regexp.exec(content)) !== null) {
      const target = match[1]
      if (dag[source]) {
        dag[source].push(target)
      } else {
        dag[source] = [target]
      }
    }
  }

  fs.writeFileSync('dag.json', JSON.stringify(dag))
}
