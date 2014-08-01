describe('Ember.d3.Transition', function(){
	it('should exist', function(){
		expect(typeof Ember.d3.Transition).toBe('function');
	});

	describe('config', function(){
		it('should have a default config', function(){
			var obj = Ember.Object.create();
			var trans = obj.transition();

			expect(typeof trans.config).toBe('object');
			expect(trans.config.delay).toBe(0);
			expect(trans.config.duration).toBe(400);
		});
	});

	describe('Transition.prototype.execute', function(){
		it('should call d3.timer only once', function(){
			spyOn(d3, 'timer');

			var obj = Ember.Object.create();
			var trans = obj.transition();

			trans.execute();
			trans.execute();
			trans.execute();

			waits(30);

			runs(function(){
				expect(d3.timer.calls.length).toBe(1);
			});
		});
	});

	describe('Transition.prototype.emberObject', function(){
		it('should be the creating instance of an Ember.Object', function(){
			var obj = Ember.Object.create();
			var trans = obj.transition();
			expect(trans.emberObject).toBe(obj);
		});
	});

	describe('Transition.prototype.set', function(){
		it('should append to .sets and call .execute each time it is called', function(){
			var obj = Ember.Object.create();
			var trans = obj.transition();
			var calls = [];

			spyOn(trans, 'execute');

			var args = [
				['foo', 100],
				['bar', 200],
				['baz', 300]
			];

			args.forEach(function(x) {
				trans.set(x[0], x[1]);
			});

			expect(trans.sets.length).toBe(3);

			waits(10);

			runs(function(){
				expect(trans.execute.calls.length).toBe(3);
			});
		});
	});

	describe('Transition.prototype.ease', function(){
		it('should default to "cubic-in-out"', function(){
			spyOn(d3, 'ease');
			var obj = Ember.Object.create();
			var trans = obj.transition();
			trans.ease();
			expect(d3.ease).toHaveBeenCalledWith('cubic-in-out', undefined, undefined);
		});
	});

	describe('Ember.d3.TEST_MODE', function(){
		beforeEach(function(){
			Ember.d3.TEST_MODE = true;
		});

		afterEach(function(){
			Ember.d3.TEST_MODE = false;
		});

		it('should set values right away and prevent executeTimer from firing', function(){
			var obj = Ember.Object.create();
			var trans = obj.transition();
			trans.executionTimeout = 'unchanged';

			trans.set('foo', 1);
			trans.set('bar', 2);

			expect(obj.get('foo'), 1);
			expect(obj.get('bar'), 2);
			expect(typeof obj.executionTimeout).toBe('undefined');
		});
	});

	describe('Transition.prototype.executeTimer', function(){
		it('should stop the previous transition and begin the timer', function(){
			spyOn(d3, 'timer');
			var obj = Ember.Object.create();
			var oldTransition = jasmine.createSpyObj('oldTransition', ['stop']);
			obj.__transition = oldTransition;

			var trans = obj.transition().delay(1000);
			var mockCallback = function(){};
			spyOn(trans, 'timerCallback').andReturn(mockCallback);

			trans.executeTimer();

			expect(obj.__transition).toBe(trans);
			expect(oldTransition.stop).toHaveBeenCalled();
			expect(trans.timerCallback).toHaveBeenCalled();
			expect(d3.timer).toHaveBeenCalledWith(mockCallback, trans.config.delay);
		});
	});

	describe('Transition.prototype.timerCallback', function(){
		var obj, trans, timerCallback;

		beforeEach(function(){
			obj = Ember.Object.create({
				key1: -1,
				key2: -2,
				key3: -3
			});

			trans = obj.transition().duration(100);
			obj.__transition = {};

			trans.sets = [
				{ obj: obj, keyName: 'key1', interpolator: jasmine.createSpy('interpolator 1').andReturn(0) },
				{ obj: obj, keyName: 'key2', interpolator: jasmine.createSpy('interpolator 2').andReturn(1) },
				{ obj: obj, keyName: 'key3', interpolator: jasmine.createSpy('interpolator 3').andReturn(2) }
			];

			trans.easer = jasmine.createSpy('easing function').andCallFake(function(x) {
				return x;
			});

			timerCallback = trans.timerCallback();
		});

		it('should call the interpolators on each set with the appropriate completion ratio', function(){
			var result = timerCallback(50);
			trans.sets.forEach(function(set, i) {
				expect(set.interpolator).toHaveBeenCalledWith(0.5);
				expect(obj.get(set.keyName)).toBe(i);
			});
    });

    it('should return false (continue) if the passed ms is less than the duration and kill is false', function(){
    	trans.kill = false;
    	var result = timerCallback(50);
			expect(result).toBe(false);
    });

    it('should return true (stop) when ms passed is the same as the duration', function(){
			var result = timerCallback(100);
			expect(result).toBe(true);
			expect(obj.__transition).toBeFalsy();
    });

		it('should return true (stop) when ms passed is the greater as the duration', function(){
			var result = timerCallback(100);
			expect(result).toBe(true);
			expect(obj.__transition).toBeFalsy();
    });

    it('should return true (stop) when kill is true', function() {
			trans.kill = true;
			var result = timerCallback(60);
			expect(result).toBe(true);
			expect(obj.__transition).toBeFalsy();
		});
	});
});










