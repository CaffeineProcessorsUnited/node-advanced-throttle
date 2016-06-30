node-advanced-throttle
====================

### Node.js Transform stream that passes data through at n bytes per second and can be paused.

This module offers a Throttle passthrough stream class, it allows you to
write data to it and it will be passed through in n bytes per second. It
is also possible to pause and resume the steam. This can be used to send
PCM Data to a speaker module in realtime.


Installation
------------

``` bash
$ npm install advanced-throttle
```


Example
-------

Here's an example of throttling a file readstream at 80 bytes per second and outputting the
data to stdout:

``` js
var Throttle = require('advanced-throttle');
var fs       = require('fs');

// create a "Throttle" instance that reads at 80 bytes per second
var throttle = new Throttle(80);
var in = fs.createReadStream('data.txt');
in.pipe(throttle).pipe(process.stdout);

// initialize the break after 80 bytes
setTimeout(function() {
    wait();
}, 1000);

// after 80 bytes wait 1 second for the user to read the text
function wait() {
    if (throttle.isStreamPaused()) {
        throttle.resumeStream();
    } else {
        throttle.pauseStream();
    }
    // either wait 1 second for the 80 bytes to be written or give the user the opportunity to read the text.
    setTimeout(function() {
        wait();
    }, 1000);
}
```


API
---

  - [Throttle()](#contructor)
  - [.pauseStream()](#pauseStream)
  - [.resumeStream()](#resumeStream)
  - [.isStreamPaused()](#isStreamPaused)


<a name="contructor"></a>
## Throttle()

The `Throttle` passthrough stream class is very similar to the node core
`stream.Passthrough` stream, except that you specify a `bps` "bytes per
second" option and data *will not* be passed through faster than the byte
value you specify.

You can invoke with just a `bps` Number and get the rest of the default
options. This should be more common:

``` js
process.stdin.pipe(new Throttle(100 * 1024)).pipe(process.stdout);
```

Or you can pass an `options` Object in, with a `bps` value specified along with
other options:

``` js
var t = new Throttle({ bps: 100 * 1024, chunkSize: 100, highWaterMark: 500 });
```

<a name="pauseStream"></a>
### .pauseStream() : `void`
Pauses the stream but keeps storing data in the internal buffer.

<a name="resumeStream"></a>
### .resumeStream() : `void`
Resumes the stream which will cause all stored data to be written out at the throttled speed.

<a name="isStreamPaused"></a>
### .isStreamPaused() : `boolean`
Returns whether the stream is currently paused or running.

