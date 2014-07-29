describe('Ember.d3.Transition', function(){
	it('should exist', function(){
		expect(typeof Ember.d3.Transition).toBe('function');
	});

	describe('Transition.prototype.__execute', function(){
		it('should call d3.timer only once', function(){
			spyOn(d3, 'timer');

			var obj = Ember.Object.create();
			var trans = obj.transition();

			trans.__execute();
			trans.__execute();
			trans.__execute();

			waits(30);

			runs(function(){
				expect(d3.timer.calls.length).toBe(1);
			});
		});
	});

	describe('Transition.prototype.__emberObject', function(){
		it('should be the creating instance of an Ember.Object', function(){
			var obj = Ember.Object.create();
			var trans = obj.transition();
			expect(trans.__emberObject).toBe(obj);
		});
	});

	describe('Transition.prototype.__innerSet', function(){
		it('should chain all sets together in __timerFn and call __execute each time it is called', function(){
			var obj = Ember.Object.create();
			var trans = obj.transition();
			var calls = [];

			spyOn(Ember, 'set');
			spyOn(trans, '__execute');

			var args = [
				['foo', 100],
				['bar', 200],
				['baz', 300]
			];

			args.forEach(function(x) {
				trans.set(x[0], x[1]);
			});

			trans.__timerFn(0);

			Ember.set.calls.forEach(function(call, i) {
				expect(call.args[0]).toBe(obj, args[i][0], args[i][1]);
			});

			waits(10);

			runs(function(){
				expect(trans.__execute.calls.length).toBe(3);
			});
		});
	});
});