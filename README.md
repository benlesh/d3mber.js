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
this.set('foo', 25);


// setting values with d3 transitions
// the following will wait 1 second, then
// in 300 ms it will transition height to 1000
// and bgColor from red to blue.
this.transition().duration(300)
	.delay(1000)
	.ease('elastic')
	.set('height', 1000)
	.set('bgColor', '#0000ff')
	.set('foo', function(currentValue) {
		return currentValue * 1.25;
	});
```

Also has helpers to transition items in arrays:

```js
// set some property to an array of things
var things = [];
var i;
for(i = 0; i < 100; i++) {
	things.push({
		foo: i * 10,
		bar: i * 10,
		baz: '#000000'
	});
}
this.set('things', things);


// setting values with d3 transitions using the `.each()` helper

this.transition().duration(1200)
	.delay(500)
	.ease('elastic')
	.each('things')
		.set('foo', function(d, i) {
			return d.foo + 100;
		})
		.set('bar', 300)
		.set('baz', '#ff0000');

```