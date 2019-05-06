'use strict'
import global from '../global/global.js'
import { Process } from '../process/process.js'
import { Buffer } from '../safe-buffer/safe-buffer.js'
global.process = Process.getProcess()

// limit of Crypto.getRandomValues()
// https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
var MAX_BYTES = 65536

// Node supports requesting up to this number of bytes
// https://github.com/nodejs/node/blob/master/lib/internal/crypto/random.js#L48
var MAX_UINT32 = 4294967295

var crypto = global.crypto || global.msCrypto

// default to exporting a warning to upgrade browser
export var randomBytes = function oldBrowser () {
  throw new Error('Secure random number generation is not supported by this browser.\nUse Chrome, Firefox or Internet Explorer 11')
}

// check for nodejs and require crypto.randomBytes if available
if (process.release && process.release.name && process.release.name === 'node' && typeof(require) !== 'undefined') {
  randomBytes = require('crypto').randomBytes
} else if (crypto && crypto.getRandomValues) {
  // otherwise overwrite oldBrowser warning if getRandomValues available
  randomBytes = function (size, cb) {
    // phantomjs needs to throw
    if (size > MAX_UINT32) throw new RangeError('requested too many random bytes')

    var bytes = Buffer.allocUnsafe(size)

    if (size > 0) {  // getRandomValues fails on IE if size == 0
      if (size > MAX_BYTES) { // this is the max bytes crypto.getRandomValues
        // can do at once see https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
        for (var generated = 0; generated < size; generated += MAX_BYTES) {
          // buffer.slice automatically checks if the end is past the end of
          // the buffer so we don't have to here
          crypto.getRandomValues(bytes.slice(generated, generated + MAX_BYTES))
        }
      } else {
        crypto.getRandomValues(bytes)
      }
    }

    if (typeof cb === 'function') {
      return process.nextTick(function () {
        cb(null, bytes)
      })
    }

    return bytes
  }
}

export default randomBytes
