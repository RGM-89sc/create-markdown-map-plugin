const path = require('path')
const fs = require('fs')
const md5 = require('blueimp-md5')
const marked = require('marked')

async function getFileMap (dirPath, files, parseOptions = {}, interceptor) {
  marked.setOptions(parseOptions || {})

  let fileMap = {}
  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const filePath = path.join(dirPath, files[i])
      const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' })
      const fileId = md5(fileContent).substring(0, 8)
      const fileStats = fs.statSync(filePath)

      const content = typeof interceptor === 'function' ? await interceptor(marked, fileContent) : marked(fileContent)

      fileMap[fileId] = {
        name: files[i].replace(/\.md$/, ''),
        stat: {
          size: fileStats.size,  // 文件大小（字节）
          mtime: fileStats.mtime,  // 上次修改的时间戳
          birthtime: fileStats.birthtime,  // 创建文件的时间戳
        },
        content: content
      }
    }
  }

  return fileMap
}

module.exports = getFileMap