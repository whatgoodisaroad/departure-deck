define(["backbone"], function(Backbone, API) {
  return Backbone.Model.extend({
    coords:null,
    initialized:false,

    setup:function(callback) {
      var 
        hashLocPattern = /^#?([-+0-9\.]+),([-+0-9\.]+)/,
        match = location.hash.match(hashLocPattern),
        self = this;

      if (match) {
        self.set({ coords:{
          lat:parseFloat(match[1]),
          lng:parseFloat(match[2])
        }});

        this.initialized = true;

        if (callback) { callback(); }
      }
      else {
        navigator.geolocation.getCurrentPosition(function(pos) { 
          self.set({ coords:{
            lat:pos.coords.latitude,
            lng:pos.coords.longitude
          }});

          this.initialized = true;

          if (callback) { callback(); }
        });
      }
    }
  });
});
