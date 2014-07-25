d3mber.js
==================

An integration library for Ember.js and D3.js


## Installation

```sh
bower install d3mber
```


## Usage

Adds transitions to Ember objects:

```js
// set some values the normal way (optional)
this.set('height', 500); 
this.set('bgColor', '#ff0000');


// setting values with d3 transitions
// the following will wait 1 second, then
// in 300 ms it will transition height to 1000
// and bgColor from red to blue.
this.transition().duration(300)
	.delay(1000)
	.ease('elastic')
	.set('height', 1000)
	.set('bgColor', '#0000ff');
```