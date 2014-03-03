define([
  "backbone", 
  "underscore",
  "API", 
  "jade", 
  "text!stop-list.jade",
  "text!times-list.jade"
], function(
  Backbone, 
  _,
  API,
  jade, 
  slt,
  tlt
) {
  return Backbone.Model.extend({

    loadByProximity:function(coords, callback) {
      var self = this;

      API.near(coords.lat, coords.lng, function(data) {
        self.set({ stops:data });
        callback();
      });
    },

    getStopIdCodes:function() {
      return _.chain(this.get("stops"))
        .map(function(g) { 
          return _.chain(g)
            .reduce(function(x, y) { return x.concat(y); })
            .value();
        })
        .reduce(function(x, y) { return x.concat(y); })
        .map(function(s) { return s.routeTag + "~" + s.stopTag; })
        .value();
    }
  });  
});
