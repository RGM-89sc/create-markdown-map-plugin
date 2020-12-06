const uglify = require('uglify-js')

function template ([ mode, command = '' ], content, field) {
  if (mode.trim() === 'export') {
    if (command.trim() === 'as' && field) {
      return `export { ${field}: ${content} }`
    }
    return `export default ${content}`
  }

  if (mode.trim() === 'mount' && (command.trim() === 'under' || command.trim() === 'to')) {
    const fieldQuene = field.split('.').filter(item => item)

    return uglify.minify(`
      (function () {
        var target = null, fieldQuene = ${JSON.stringify(fieldQuene)}
        var firstField = fieldQuene.shift()
        if (firstField === 'window') {
          target = window
        } else {
          if (window[firstField] && window[firstField] instanceof Object) {
            target = window[firstField]
          } else {
            window[firstField] = {}
            target = window[firstField]
          }
        }
        while (fieldQuene.length) {
          var curField = fieldQuene.shift()
          
          if (target[curField] && target[curField] instanceof Object) {
            target = target[curField]
          } else {
            target[curField] = {}
            if (fieldQuene.length === 0) {
              target[curField] = ${content}
            } else {
              target = target[curField]
            }
          }
        }
      })()
    `).code
  }

  if (mode.trim() === 'add' && command.trim() === 'to') {
    const [ type, fieldName ] = field.split('.').filter(item => item)
    if (!fieldName || !(['sessionStorage', 'localStorage'].includes(type))) {
      return content
    }
    if (type === 'sessionStorage') {
      return uglify.minify(`
        (function () {
          window.sessionStorage.setItem('${fieldName}', JSON.stringify(${content}))
        })()
      `).code
    }

    if (type === 'localStorage') {
      return uglify.minify(`
        (function () {
          window.localStorage.setItem('${fieldName}', JSON.stringify(${content}))
        })()
      `).code
    }
  }

  return content
}

module.exports = template