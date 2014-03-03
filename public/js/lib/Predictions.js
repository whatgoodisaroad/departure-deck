define([
  "jquery",
  "backbone", 
  "API"
], function(
  $,
  Backbone, 
  API
) {
  return Backbone.Model.extend({
    loadPredictions:function(stopList, callback) {
      var 
        stopIds = stopList.getStopIdCodes(),
        self = this;
      API.predictions("sf-muni", stopIds.join(","), function(ps) {
        self.set({ predictions:ps });
        callback();
      });
    }
  });  
});
