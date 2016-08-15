var assert = require('assert');
var Parser = require('stream-parser');
var inherits = require('util').inherits;
var Transform = require('stream').Transform;

if (!Transform) Transform = require('readable-stream/transform');

module.exports = Throttle;

function Throttle (options) {
  if (!(this instanceof Throttle)) return new Throttle(options);

  if ('number' == typeof options) options = { bps: options };
  options = options || {};
  options.lowWaterMark = options.lowWaterMark || 0;
  options.highWaterMark = options.highWaterMark || 0;
  if (null == options.bps) throw new Error('"bps" bytes-per-second option was not provieded');
  options.chunkSize = options.chunkSize || options.bps / 10 ;

  Transform.call(this, options);

  this.bps = options.bps;
  this.chunkSize = Math.max(1, options.chunkSize);

  this.totalBytes = 0;
  this.startTime = Date.now();
  this.lastTime =  this.startTime;
  this.pauseTime = 0;

  this.destroyed = false;
  this.streampause = false;

  this._passthroughChunk();
}
inherits(Throttle, Transform);


Parser(Throttle.prototype);

Throttle.prototype.pauseStream = function() {
  this.streampause = true;
};

Throttle.prototype.resumeStream = function() {
  this.streampause = false;
};

Throttle.prototype.isStreamPaused = function() {
  return this.streampause;
};

Throttle.prototype.destroy = function() {
  if (this.destroyed) {
    return;
  }
  this.destroyed = true;

  if (typeof this.fd === 'number') {
    this.close();
  }
};

Throttle.prototype._passthroughChunk = function () {
  this._passthrough(this.chunkSize, this._onchunk);
  this.totalBytes += this.chunkSize;
};

Throttle.prototype._onchunk = function (output, done) {
  if (this.destroyed) {
    return;
  }
  if (this.streampause) {
    var now = Date.now();
    this.pauseTime += now - this.lastTime;
    this.lastTime = now;
  } else {
    this.lastTime = Date.now();
  }
  var self = this;
  var totalSeconds = (this.lastTime - this.startTime - this.pauseTime) / 1000;
  var expected = totalSeconds * this.bps;
  function d () {
    self._passthroughChunk();
    done();
  }

  if (this.totalBytes > expected) {
    // Use this byte count to calculate how many seconds ahead we are.
    var remainder = this.totalBytes - expected;
    var sleepTime = remainder / this.bps * 1000;
    //console.error('sleep time: %d', sleepTime);
    if (sleepTime > 0) {
      setTimeout(function() { this._onchunk(output, done) }.bind(this), sleepTime);
    } else {
      setTimeout(function() { this._onchunk(output, done) }.bind(this), 0);
    }
  } else if (this.totalBytes < expected) {
    d();
  } else {
    setTimeout(function() { this._onchunk(output, done) }.bind(this), 0);
  }
};
