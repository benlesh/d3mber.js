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

    Transition.prototype.register = function(){
      var emberObject = this.emberObject;
      var transitions = emberObject.__transitions = emberObject.__transitions || [];
      transitions.push(this);
    };

    Transition.prototype.unregister = function(){
      var emberObject = this.emberObject;
      var transitions = emberObject.__transitions;
      if(transitions) {
        transitions.splice(transitions.indexOf(this), 1);
      }
    };

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
      this.easer = d3.ease(easing, a, b);
      return this;
    };

    /**
      @method set
      @param keyName {String} the property on the object to transition.
      @param value The value ot transition to. If a {Function} is passed, that 
      function is called, passing the current value at that keyName and the return 
      value of that function is used to determine the final transition value.
    */
    Transition.prototype.set = function(keyName, value){
      this.innerSet(this.emberObject, keyName, value);      
      return this;
    };

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

    Transition.prototype.executionTimeout = null;

    Transition.prototype.execute = function() {
      if(this.executionTimeout) {
        clearTimeout(this.executionTimeout);
      }

      this.executionTimeout = setTimeout(this.executeTimer, 0);
    };

    Transition.prototype.stopPriorTransitions = function(){
      var obj = this.emberObject;
      var transitions = obj.__transitions;
      var setKeys = this.sets.map(function(s){
        return s.keyName;
      });

      if(transitions) {
        var matchedTransitions = transitions.filter(function(transition) {
          var i, len, foreignSet;
          for(i = 0, len = transition.sets.length; i < len; i++) {
            foreignSet = transition.sets[i];
            if(setKeys.indexOf(foreignSet.keyName)) {
              return true;
            }
          }
          return false;
        });

        matchedTransitions.forEach(function(m) {
          m.stop();
        });
      }
    };

    Transition.prototype.executeTimer = function(){
      var delay = this.config.delay;
      this.stopPriorTransitions();
      this.register();
      d3.timer(this.timerCallback, delay);
    };

    Transition.prototype.timerCallback = function(ms) {
      var duration = this.config.duration;
      var completion = ms / duration;
      var sets = this.sets;
      var easer = this.easer;

      sets.forEach(function(set) {
        var t = easer ? easer(completion) : completion;
        var value = set.interpolator(t);
        Ember.set(set.obj, set.keyName, value);
      });

      if(completion >= 1 || this.kill) {
        this.unregister();
        return true;
      }
      return false;
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