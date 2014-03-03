//  Tool for acquiringig a list of nearby transit stops given a location:
define([
  "backbone", 
  "underscore",
  "API"
], function(
  Backbone, 
  _,
  API
) {
  return Backbone.Model.extend({
    loadByProximity:function(coords, callback) {
      var self = this;

      API.near(coords.lat, coords.lng, function(data) {
        self.set({ stops:data });
        callback();
      });
    },

    //  Get a flat list of stop identifiers for the entire StopList. These are
    //  each written as "<RouteTag>~<StopTag>". Since the list is grouped it 
    //  needs to be flattened twice to return the desired list. 
    getStopIdCodes:function() {
      return _.chain(this.get("stops"))
        
        //  Flatten inner list:
        .map(function(g) { 
          return _.chain(g)
            .reduce(function(x, y) { return x.concat(y); })
            .value();
        })
        //  Flatten outer list:
        .reduce(function(x, y) { return x.concat(y); })

        //  Construct identifier:
        .map(function(s) {
          return s.routeTag + "~" + s.stopTag;
        })
        .value();
    }
  });  
});
