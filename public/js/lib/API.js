define(["jquery"], function($) {
  return {
    agencies:function(f) {
      $.getJSON("/api/agencies", f);
    },
    routes:function(agency, f) {
      $.getJSON("/api/routes/" + agency, f);
    },
    route:function(agency, route, f) {
      $.getJSON("/api/routes/" + agency + "/" + route, f);
    },
    predict:function(agency, route, stop, f) {
      $.getJSON("/api/predict/" + agency + "/" + route + "/" + stop, f);
    },
    predictions:function(agency, stops, f) {
      $.getJSON("/api/predictions/" + agency + "/" + stops, f);
    },
    near:function(lat, lng, f) {
      $.getJSON("/api/near/" + lat + "/" + lng, f);
    }
  };
});
