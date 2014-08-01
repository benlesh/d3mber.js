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

			trans.timerCallback(0);

			expect(trans.sets.length).toBe(3);
			
			waits(10);

			runs(function(){
				expect(trans.execute.calls.length).toBe(3);
			});
		});
	});

	describe('Transition.testMode()', function(){
		it('should force the d3 timer to run immediately', function(){
			spyOn(d3, 'timer');
			var d3Timer = d3.timer;

			Ember.d3.Transition.testMode(true);
			var i = 0;
			var duration = 1000;
			d3.timer(function(ms) {
				i++;
				return ms >= duration;
			}, 100);

			waits(0);

			runs(function(){
				expect(i).toBe(duration);
				expect(d3Timer).not.toHaveBeenCalled();
			});
		});

		it('should turn off properly', function(){
			var origTimer = d3.timer;
			Ember.d3.Transition.testMode(true);
			expect(d3.timer).not.toBe(origTimer);
			Ember.d3.Transition.testMode(false);
			expect(d3.timer).toBe(origTimer);
		});
	});
});