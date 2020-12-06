const fs = require('fs')
const md5 = require('blueimp-md5')
const getFileMap = require('./utils/files-processor')
const template = require('./utils/template')

const PLUGINNAME = 'CreateMarkDownMapPlugin'

let _options

function CreateMarkDownMapPlugin (options) {
  _options = options
}

CreateMarkDownMapPlugin.prototype.apply = function (compiler) {
  compiler.hooks.emit.tapAsync(PLUGINNAME, async (compilation, callback) => {
    const dirPath = _options.dirPath

    if (!fs.existsSync(dirPath)) {
      throw `[${PLUGINNAME}] invalid \`dirPath\``
    }

    const files = fs.readdirSync(dirPath)
    const fileMap = await getFileMap(dirPath, files, _options.parseOptions, _options.interceptor)

    let targetFileContent = ''
    if (_options.dist.mode === 'variable') {
      if (!_options.dist.path || typeof _options.dist.path !== 'string') {
        throw `[${PLUGINNAME}] \`dist.path\` must be a string`
      }
      targetFileContent = template`mount ${JSON.stringify(fileMap)} under ${_options.dist.path}`
    } else if (_options.dist.mode === 'localStorage') {
      targetFileContent = template`add ${JSON.stringify(fileMap)} to ${'localStorage._posts'}`
    } else if (_options.dist.mode === 'sessionStorage') {
      targetFileContent = template`add ${JSON.stringify(fileMap)} to ${'sessionStorage._posts'}`
    } else {
      if (!_options.dist.path || typeof _options.dist.path !== 'string') {
        targetFileContent = template`export ${JSON.stringify(fileMap)}`
      } else {
        targetFileContent = template`export ${JSON.stringify(fileMap)} as ${_options.dist.path}`
      }
    }
    
    const targetFilePath = `js/${md5(targetFileContent).substring(0, 8)}.js`


    compilation.assets[targetFilePath] = {
      source: function () {
        return targetFileContent
      },
      size: function () {
        return this.source().length
      }
    }

    setTimeout(() => {
      const indexContent = compilation.assets['index.html'].source()
      compilation.assets['index.html'] = {
        source: function () {
          return indexContent.replace('</head>', `<script src="${targetFilePath}"></script></head>`)
        },
        size: function () {
          return this.source().length
        }
      }

      callback()
    }, 0)
  })
}

module.exports = CreateMarkDownMap