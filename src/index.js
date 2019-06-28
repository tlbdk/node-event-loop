'use strict'
let eventLoopStats = require('event-loop-stats')
const crypto = require('crypto')

setInterval(() => {
  const key = crypto.pbkdf2Sync('secret', 'salt', 100000, 64, 'sha512')
  //console.log('hello')
}, 3000)

let min = [Number.MAX_VALUE, Number.MAX_VALUE]
let max = [0, 0]
let avg = [0, 0]
let interval = 1000
let lastStartTime = process.hrtime()
setInterval(() => {
  let now = process.hrtime()
  let diff = diffHrTime(lastStartTime, now, interval * 1000000)

  lastStartTime = now
  if (diff[0] < min[0] || (diff[0] == min[0] && diff[1] < min[1])) {
    min = diff
  }
  if (diff[0] > max[0] || (diff[0] == max[0] && diff[1] > max[1])) {
    max = diff
  }
  console.info(
    'Latency: last:%ds %dms, min:%ds %dms, max:%ds %dms',
    diff[0],
    diff[1] / 1000000,
    min[0],
    min[1] / 1000000,
    max[0],
    max[1] / 1000000
  )
}, interval)

/*setInterval(() => {
  console.log(doingStuff)
}, 1000)*/

function diffHrTime(start, stop, intervalNs = 0) {
  // desctructure/capture secs and nanosecs
  var startS = stop[0],
    startNs = stop[1],
    stopS = start[0],
    stopNs = start[1],
    ns = startNs - stopNs, // nanosecs delta, can overflow (will be negative)
    s = startS - stopS // secs delta
  let nsSave = ns
  let sSave = s
  if (ns < 0) {
    // has overflowed
    s -= 1 // cut a second
    ns += 1e9 // add a billion nanosec (to neg number)
  }
  ns -= intervalNs
  if (ns < 0) {
    if (s > 0) {
      s -= 1 // cut a second
    }
    ns += 1e9 // add a billion nanosec (to neg number)
  }

  if (s < 0 || ns < 0) {
    console.log(sSave)
    console.log(nsSave)
  }

  return [s, ns]
}
