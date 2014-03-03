//  A clean interface for acquiring the location of the user (can be via HTML5 
//  or the URL hash.
define(["backbone"], function(Backbone) {
  return Backbone.Model.extend({
    coords:null,
    initialized:false,

    setup:function(callback) {
      var 
        hashLocPattern = /^#?([-+0-9\.]+),([-+0-9\.]+)/,
        match = location.hash.match(hashLocPattern),
        self = this;

      //  Does the lat/lng appear to be written in the hash?
      if (match) {
        self.set({ coords:{
          lat:parseFloat(match[1]),
          lng:parseFloat(match[2])
        }});
        this.initialized = true;

        if (callback) { callback(); }
      }

      //  Else attempt HTML5
      else if (Modernizr.geolocation) {
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
