App = Ember.Application.create();

App.Router.map(function() {
});

App.IndexRoute = Ember.Route.extend({
  model: function() {

    var grid = d3.range(200).map(function(n) {
      var perRow = 20;
      var x = (n % perRow) * 70;
      var y = Math.floor(n / perRow) * 70;
      var itemStyle = 'position:absolute; left:%@px; top:%@px;'.fmt(x, y);

      return {
        x: x,
        y: y,
        itemStyle: itemStyle,
        n: n
      };
    });

    return {
      foo: 40,
      bgColor: '#ffcccc',
      grid: grid
    };
  }
});

App.IndexController = Ember.ObjectController.extend({
  myStyle: function(){
    var foo = this.get('foo');
    var bgColor = this.get('bgColor');
    
    return 'margin-top:' + this.get('foo') + 'px' +
      ';background-color:' + bgColor;
  }.property('foo'),
  
  actions: {
    moveIt: function(){
      
      // HERE IS THE COOL PART!!!!!
      this.transition().duration(1200)
        .ease()
        .set('foo', 500)
        .set('bgColor', '#00ff00');
    },

    moveGrid: function(){

      this.transition().duration(5000)
        .each('grid')
        .set('itemStyle', function(d) {
          d.x += 500;
          d.y += 500;
          return 'position:absolute; left:%@px; top:%@px;'.fmt(d.x, d.y);
        });
    }
  }
});