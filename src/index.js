'use strict'
const crypto = require('crypto')
const async_hooks = require('async_hooks')

setInterval(() => {
  let before = process.hrtime()
  const key = crypto.pbkdf2Sync('secret', 'salt', 2000000, 64, 'sha512')
  console.log(`crypto: ${process.hrtime(before)}`)
}, 3000)


class EventLoopStatistics {
  constructor(warningLatency) {
    this.warningLatency = warningLatency
    this.scheduled = false
    this.lastStartTime = process.hrtime()
    this.reset()
    /* async_hooks.createHook({
      init(asyncId, type, triggerAsyncId) {
        schedule()
      },
      before(asyncId) {
        schedule()
      },
      after(asyncId) {
        schedule()
      },
      destroy(asyncId) {
        schedule()
      },
    }).enable(); */
    setInterval(this.schedule.bind(this), getMsTime(warningLatency))
  }

  reset() {
    this.maxLatency = [0, 0]
    this.minLatency = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]
  }

  schedule() {
    if(!this.scheduled) {
      this.scheduled = true
      setImmediate(this.calculate.bind(this))
    }
  }

  calculate() {
    this.scheduled = false
    let now = process.hrtime()
    let diff = diffHrTime(this.lastStartTime, now)
    this.lastStartTime = now

    // Minus wait latency
    diff[0] -= this.warningLatency[0]
    diff[1] -= this.warningLatency[1]
    if(diff[0] > 0 && diff[1] < 0) {
      diff[0] -= 1
      diff[1] += 1000000000
    }

    let min = this.minLatency
    if (diff[0] < min[0] || (diff[0] == min[0] && diff[1] < min[1])) {
      this.minLatency = diff
    }
    let max = this.maxLatency
    if (diff[0] > max[0] || (diff[0] == max[0] && diff[1] > max[1])) {
      this.maxLatency = diff
    }

    if (diff[0] >= this.warningLatency[0] && diff[1] > this.warningLatency[1]) {
      console.info(
        `Latency: limit:${getMsTime(this.warningLatency)}, last:${getMsTime(diff)}, min:${getMsTime(this.minLatency)}, max:${getMsTime(this.maxLatency)}`,
      )
      this.reset()
    }
    //this.schedule()
  }
}

let eventLoopStatistics = new EventLoopStatistics([0, 100000000])

//fs.writeFileSync('log.out', `${util.format(...args)}\n`, { flag: 'a' });


function getMsTime(time) {
  return Math.floor((time[0] * 1000) + (time[1] / 1000000))
}

function diffHrTime(start, stop) {
  // desctructure/capture secs and nanosecs
  var startS = stop[0],
    startNs = stop[1],
    stopS = start[0],
    stopNs = start[1],
    ns = startNs - stopNs, // nanosecs delta, can overflow (will be negative)
    s = startS - stopS // secs delta

  if (ns < 0) {
    // has overflowed
    s -= 1 // cut a second
    ns += 1e9 // add a billion nanosec (to neg number)
  }

  return [s, ns]
}