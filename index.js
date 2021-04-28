const fs = require('fs')
const md5 = require('blueimp-md5')
const getFileMap = require('./utils/files-processor')
const template = require('./utils/template')
class CreateMarkDownMapPlugin {

  constructor(options = {}) {
    this.options = options
  }

  apply(compiler) {
    const pluginName = CreateMarkDownMapPlugin.name

    const { webpack: { Compilation, sources } } = compiler
    const { RawSource } = sources

    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          // that all assets were already added to the compilation by other plugins.
          stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        async (assets) => {
          const dirPath = this.options.dirPath

          if (!fs.existsSync(dirPath)) {
            throw `[${pluginName}] invalid \`dirPath\``
          }

          const files = fs.readdirSync(dirPath)
          const fileMap = await getFileMap(dirPath, files, this.options.parseOptions, this.options.interceptor)

          let targetFileContent = ''
          const result = this.getTargetFileContent(fileMap)
          if (result.type === 'error') {
            throw `[${pluginName}] ${result.message}`
          } else {
            targetFileContent = result.data
          }

          const targetFilePath = `js/${md5(targetFileContent).substring(0, 8)}.js`

          // Adding new asset to the compilation, so it would be automatically
          compilation.emitAsset(targetFilePath, new RawSource(targetFileContent))

          setTimeout(() => {
            const indexContent = compilation.assets['index.html'].source()
            compilation.updateAsset('index.html', (source) => {
              return new RawSource(indexContent.replace('</head>', `<script src="${targetFilePath}"></script></head>`))
            })
          }, 0)
        }
      )
    })
  }

  getTargetFileContent(fileMap) {
    const dist = this.options.dist
    if (!dist) {
      return {
        type: 'error',
        message: `miss \`options.dist\``
      }
    }
    let targetFileContent = ''
    if (dist.mode === 'variable') {
      if (!dist.path || typeof dist.path !== 'string') {
        return {
          type: 'error',
          message: `\`dist.path\` must be a string`
        }
      }
      targetFileContent = template`mount ${JSON.stringify(fileMap)} under ${dist.path}`
    } else if (dist.mode === 'localStorage') {
      targetFileContent = template`add ${JSON.stringify(fileMap)} to ${'localStorage._posts'}`
    } else if (dist.mode === 'sessionStorage') {
      targetFileContent = template`add ${JSON.stringify(fileMap)} to ${'sessionStorage._posts'}`
    } else {
      if (!dist.path || typeof dist.path !== 'string') {
        targetFileContent = template`export ${JSON.stringify(fileMap)}`
      } else {
        targetFileContent = template`export ${JSON.stringify(fileMap)} as ${dist.path}`
      }
    }
    return {
      type: 'result',
      data: targetFileContent
    }
  }
}

module.exports = CreateMarkDownMapPlugin