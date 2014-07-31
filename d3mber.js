/**
 d3mber.js © 2014 Ben Lesh - MIT License
 http://github.com/blesh/d3mber.js
 @module d3mber.js
 @author Ben Lesh <ben@benlesh.com>
*/
(function(Ember, d3) {

  /**
    Contains logic for applying transitions in an array context.

    @namespace Ember.d3
    @class ArrayTransition 
    @constructor
    @param transition {Ember.d3.Transition} the transition object this is built off of.
    @param arrayKeyName {String} the key of the array property to iterate over
  */
  var ArrayTransition = (function(){
    function ArrayTransition(transition, arrayKeyName){
      this.transition = transition;
      this.arrayKeyName = arrayKeyName;
    }

    ArrayTransition.prototype.delay = function(delay) {
      this.transition.delay(delay);
      return this;
    };

    ArrayTransition.prototype.duration = function(duration) {
      this.transition.duration(duration);
      return this;
    };

    ArrayTransition.prototype.ease = function(easing) {
      this.transition.ease(easing);
      return this;
    };

    ArrayTransition.prototype.set = function(keyName, value) {
      var transition = this.transition;
      var obj = transition.emberObject;
      var arr = Ember.get(obj, this.arrayKeyName);

      var valueFn = typeof value === 'function' ? value : function() { return value; };

      arr.forEach(function(item, index) {
        transition.innerSet(item, keyName, valueFn(item, index));
      });

      transition.execute();

      return this;
    };

    return ArrayTransition;
  }());

  /**
    A transition object. contains methods and logic to affect
    setting and getting values on an {Ember.Object} via d3 easing and 
    interpolation.

    @namspace Ember.d3
    @class Transition
  */
  var Transition = (function(){    

    /**
      @constructor
      @param emberObject {Ember.Object} the ember object to perform the transitions on.
    */
    function Transition(emberObject, config) {
      this.emberObject = emberObject;
      this.sets = [];
      this.config = {};
      extend(this.config, Transition.config); // defaults
      extend(this.config, config); // custom      
    }

    /**
      Stops the transition on the next timer tick
      @method stop
    */
    Transition.prototype.stop = function(){
      this.kill = true;
    };

    /**
      The default configuration
      @property config
      @static
    */
    Transition.config = {
      delay: 0,
      duration: 400
    };

    /**
      Sets the delay for the transition. The delay determines how long
      to wait before firing the transition.

      @method delay
      @param delay {Number} the delay in milliseconds
      @chainable
    */
    Transition.prototype.delay = function(delay){
      this.config.delay = delay;
      return this;
    };

    /**
      Sets the duration of the transition. The duration determines how long
      the transition takes to complete.

      @method duration
      @param duration {Number} the duration in milliseconds
      @chainable
    */
    Transition.prototype.duration = function(duration) {
      this.config.duration = duration;
      return this;
    };

    /**
      Sets the type of easing for the transition. 

      @method ease
      @param easing {String} the name of the easing type
      @param a The first easing argument (variable depending on the type of easing)
      @param b The second easing argument (variable depending on the type of easing)
      @chainable
    */
    Transition.prototype.ease = function(easing, a, b) {
      easing = easing || 'cubic-in-out';
      this.easer = d3.ease(easing, a, b);
      return this;
    };

    /**
      Schedules a transitioned change to a property on the object that initialized the 
      transition. Initiates the transition. If more than one set is called on the transition,
      it will still only execute the transition once.

      @method set
      @param keyName {String} the property on the object to transition.
      @param value The value ot transition to. If a {Function} is passed, that 
      function is called, passing the current value at that keyName and the return 
      value of that function is used to determine the final transition value.
    */
    Transition.prototype.set = function(keyName, value){
      this.innerSet(this.emberObject, keyName, value); 
      this.execute();     
      return this;
    };

    /**
       Adds a set model to the sets collection with the appropriate information and interpolator.
       @method innerSet
       @private
    */
    Transition.prototype.innerSet = function(obj, keyName, value){
      var oldValue = Ember.get(obj, keyName);
      var newValue = typeof value === 'function' ? value(oldValue) : value;
      var interpolator = d3.interpolate(oldValue, newValue);
      this.sets.push({ 
        obj: obj,
        keyName: keyName,
        newValue: newValue,
        oldValue: oldValue,
        interpolator: interpolator
      });
    };

    /**
      Identifies the last timeout marker from when execute() was called
      @property executionTimeout
      @private
    */
    Transition.prototype.executionTimeout = null;

    /**
      Starts the execution of the transition. Multiple calls to this method in the same
      code block will only cause the transition to trigger once. Called by set() automatically.
      @method execute
      @private
    */
    Transition.prototype.execute = function() {
      var executionTimeout = this.executionTimeout;
      var self = this;

      if(executionTimeout) {
        clearTimeout(executionTimeout);
      }

      this.executionTimeout = setTimeout(function(){
        self.executeTimer()
      }, 0);
    };

    /**
      Immediately executes the transition. Also stops any previous transition on the ember object.
      @method executeTimer
      @private
    */
    Transition.prototype.executeTimer = function(){
      var delay = this.config.delay;
      var emberObject = this.emberObject;
      var previousTransition = emberObject.__transition;
      var timerCallback = this.timerCallback();

      if(previousTransition) {
        previousTransition.stop();
        delete emberObject.__transition;
      }

      emberObject.__transition = this;
      this.transitioning = true;
      d3.timer(timerCallback, delay);
    };

    /**
      Creates the callback for each d3.timer tick.
      @method timerCallback
      @return {Boolean} true if the timer should stop.
      @private
    */
    Transition.prototype.timerCallback = function() {
      var duration = this.config.duration;
      var sets = this.sets;
      var easer = this.easer;
      var emberObject = this.emberObject;
      var self = this;

      return function(ms) {
        var completion = ms / duration;
        var t = easer ? easer(completion) : completion;
        sets.forEach(function(set) {
          var value = set.interpolator(t);
          Ember.set(set.obj, set.keyName, value);
        });

        if(completion >= 1 || self.kill) {
          delete emberObject.__transition;
          return true;
        }
        return false;
      };
    };

    /**
      Starts building an array transition from this transition.
      @method each
      @param keyName {String} the key of the array property to enumerate
      @return {ArrayTransition}
    */
    Transition.prototype.each = function(keyName) {
      return new ArrayTransition(this, keyName);
    };

    return Transition;
  }());

  


  /**
    This library extends the Ember.Object.prototype
    @namespace Ember
    @class Object
  */

  /*
    Creates a new transition for the object.
    @method transition
    @returns {Ember.d3.Transition}
  */
  Ember.Object.prototype.transition = function() {
    return new Transition(this);
  };

  var origTimerFn = d3.timer;

  /**
    Enables or disables test mode. Used to force the timer to execute immediately.

    @method testMode
    @param test {Boolean} enable or disable test mode.
    @param o {Object} an optional configuration object
    @example

            Ember.d3.Transition.testMode(true, {
              timerMax: 100000, // default
            });
  */
  Transition.testMode = function(test, o){
    var config = {
      timerMax: 100000
    };

    if(o) {
      for(var key in o) {
        if(o.hasOwnProperty(key)) {
          config[key] = o[key];
        }
      }
    }

    if(test) {
      d3.timer = function(fn) {
        var i = 1;
        while(!fn(i++) && i < config.timerMax) {}
      };
    } else {
      d3.timer = origTimerFn;
    }
  };

  Ember.d3 = {
    Transition: Transition,
    ArrayTransition: ArrayTransition,
  };

  function extend(target, source) {
    if(!target || !source) {
      return;
    }

    for(var key in source) {
      if(source.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }
  }
}(Ember, d3));