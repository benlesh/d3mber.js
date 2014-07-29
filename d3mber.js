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
    @param keyName {String} the key of the array property to iterate over
  */
  var ArrayTransition = (function(){
    function ArrayTransition(transition, keyName){
      this.__transition = transition;
      this.__keyName = keyName;
      this.baseArray = function() {
        return transition.__emberObject.get(keyName);
      };
    }

    ArrayTransition.prototype.delay = function(delay) {
      this.__transition.delay(delay);
      return this;
    };

    ArrayTransition.prototype.duration = function(duration) {
      this.__transition.duration(duration);
      return this;
    };

    ArrayTransition.prototype.ease = function(easing) {
      this.__transition.ease(easing);
      return this;
    };

    ArrayTransition.prototype.set = function(keyName, value) {
      var self = this;
      var arr = this.baseArray();

      var valueFn = typeof value === 'function' ? value : function() { return value; };

      arr.forEach(function(item, index) {
        self.__transition.__innerSet(item, keyName, valueFn(item, index));
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
    function Transition(emberObject) {
      var self = this;

      self.__emberObject = emberObject;
      
      self.__timerFn = function(){
        return true;
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
      @default null
      @private
    */
    Transition.prototype.__ease = null;

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
      this.__ease = easing || 'cubic-in-out';
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
      this.__innerSet(this.__emberObject, keyName, value);      
      return this;
    };

    Transition.prototype.__innerSet = function(obj, keyName, value){
      var self = this;
      var easing = self.__ease;
      var a = self.__ease_a;
      var b = self.__ease_b;
      var duration = self.__duration;
      var delay = self.__delay;
      
      
      var valueFn = typeof value === 'function' ? value : function() {
        return value;
      };
      
      var ease = easing ? d3.ease(easing, a, b) : null;
      var oldValue = Ember.get(obj, keyName) || null;
      var interpolator = d3.interpolate(oldValue, valueFn(oldValue));
      
      var kill = false;  
      self.kill = function(){
        kill = true;
      };

      var __transitions = obj.get('__transitions') || {};
      obj.set('__transitions', __transitions);
      var currentTransition = Ember.get(__transitions, keyName);
      
      obj.__transitions[keyName] = self;
      
      // Build the timer function out
      var prevTimerFn = self.__timerFn;
      self.__timerFn = function(elapsed){
        if(kill) {
          obj.set(keyName, undefined);
          return true;
        }
        
        var prev = prevTimerFn(elapsed);
        
        if(currentTransition && currentTransition !== self) {
          oldValue = Ember.get(obj, keyName) || null;
          interpolator = d3.interpolate(oldValue, valueFn(oldValue));
          currentTransition.kill();
          currentTransition = self;
        }
        
        var t = elapsed / duration;
        var v = ease ? ease(t) : t;
        Ember.set(obj, keyName, interpolator(v));

        return prev && elapsed >= duration;
      };

      // make sure the timer is only kicked off once after setup.
      self.__execute();     
    };

    Transition.prototype.__execute = function() {
      var self = this;
      
      if(self.__nextTimeout) {
        clearTimeout(self.__nextTimeout);
      }

      self.__nextTimeout = setTimeout(function(){
        d3.timer(self.__timerFn, self.__delay);
      }, 0);
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

  Ember.d3 = {};
  Ember.d3.Transition = Transition;
}(Ember, d3));