/**
 d3mber.js © 2014 Ben Lesh - MIT License
 http://github.com/blesh/d3mber.js
 @module d3mber.js
 @author Ben Lesh <ben@benlesh.com>
*/
(function(Ember, d3) {

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
    function Transition(emberObject) {
      var self = this;

      self.__emberObject = emberObject;
      
      self.__finalizeFn = function(){};

      self.__timerFn = function(elapsed){
        if(elapsed / self.duration > 1) {
          self.__finalizeFn();
          return true;
        } else {
          return false;
        }
      };
    }

    /**
      The delay prior to starting the transition

      @property __delay
      @type Number
      @default 0
      @private
    */
    Transition.prototype.__delay = 0;

    /**
      The duration prior to starting the transition

      @property __duration
      @type Number
      @default 500
      @private
    */
    Transition.prototype.__duration = 500;

    /**
      The type if easing to use for the transition

      @property __ease
      @type String
      @default 'linear'
      @private
    */
    Transition.prototype.__ease = 'linear';

    /**
      Sets the delay for the transition. The delay determines how long
      to wait before firing the transition.

      @method delay
      @param delay {Number} the delay in milliseconds
      @chainable
    */
    Transition.prototype.delay = function(delay){
      this.__delay = delay;
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
      this.__duration = duration;
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
      this.__ease = easing || 'ease';
      this.__ease_a = a || 1;
      this.__ease_b = b || 0.4;
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
      var self = this;
      var obj = self.__emberObject;
      var easing = self.__ease;
      var a = self.__ease_a;
      var b = self.__ease_b;
      var duration = self.__duration;
      var delay = self.__delay;
      
      
      var valueFn = typeof value === 'function' ? value : function() {
        return value;
      };
      
      var ease = d3.ease(easing, a, b);
      var oldValue = obj.get(keyName) || null;
      var interpolator = d3.interpolate(oldValue, valueFn(oldValue));
      
      var kill = false;  
      self.kill = function(){
        kill = true;
      };

      var currentTransition = obj.__transitions[keyName];
      
      obj.__transitions[keyName] = self;
      
      // Build the timer function out
      var nextTimerFn = self.__timerFn;
      self.__timerFn = function(elapsed){
        if(kill) {
          delete obj.__transitions[keyName];
          return true;
        }
        
        if(currentTransition && currentTransition !== self) {
          oldValue = obj.get(keyName) || null;
          interpolator = d3.interpolate(oldValue, valueFn(oldValue));
          currentTransition.kill();
          currentTransition = self;
        }
        
        var t = elapsed / duration;
        var v = ease(t);
        obj.set(keyName, interpolator(v));

        nextTimerFn(elapsed);
      };

      // Build the finalization function out.
      var nextFinalizeFn = self.__finalizeFn;
      self.__finalizeFn = function(){
        obj.set(keyName, valueFn());
        nextFinalizeFn();
      };

      // make sure the timer is only kicked off once after setup.
      next(function() {
        d3.timer(self.__timerFn, delay);
      });
      
      return this;
    };

    return Transition;
  }());

  // timeout from last time next() was called.
  var prevTimeout;

  // only fires the last function passed to it in a single
  // event loop run. (I butchered that description)
  function next(fn) {
    if(prevTimeout) {
      clearTimeout(prevTimeout);
    }

    prevTimeout = setTimeout(fn, 0);
  }

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

  /**
    A hash lookup for transitions pending on this object.

    @property __transitions
    @type Object
    @private
  */
  Ember.Object.prototype.__transitions = {};

  Ember.d3.Transition = Transition;
}(Ember, d3));