var
  fs = require('fs'),
  rbush = require("rbush"),
  geolib = require("geolib"),
  _ = require("underscore");

var 
  serialLoc = "data/routes-index.json",
  index = null,
  defaultDelta = 0.015,
  defaultLimit = 30;

exports.init = function(folder, app, fn) {
  console.log("Loading stop index...");
  fs.readFile(serialLoc, 'utf8', function(err, serial) {
    index = rbush(9).fromJSON(JSON.parse(serial));
    console.log("Loaded stop index");

    makeHandler(folder, app);

    if (fn) fn();
  });
};

exports.findStops = function(lat, lng, delta, limit) {
  if (delta === undefined) { delta = defaultDelta; }
  if (limit === undefined) { limit = defaultLimit; }

  var 
    boundingBox = [
      lat - delta,
      lng - delta,
      lat + delta,
      lng + delta
    ];

  var stops = _.chain(index.search(boundingBox))
    .sortBy(function(s) {
      return geolib.getDistance(
        { latitude:lat, longitude:lng }, 
        { latitude:s[0], longitude:s[1] }
      );
    })
    .map(function(s) { return s[4]; })
    .first(limit)
    .groupBy("routeTitle")
    .value();

  for (var key in stops) {
    stops[key] = _.chain(stops[key]).groupBy("stopTitle").value();
  }

  return stops;
};

function makeHandler(folder, app) {
  app.get("/" + folder + "/near/:lat/:lng", function(req, res) {
    res.write(
      JSON.stringify(
        exports.findStops(
          parseFloat(req.params.lat),
          parseFloat(req.params.lng),
          defaultDelta,
          defaultLimit
        )
      )
    );
    res.end();
  });
}

// exports.init(function() {
//   var 
//     lat = 37.717022, 
//     lng = -122.4983466, 
//     delta = 1,
//     limit = 20;

//   var stops = exports.findStops(lat, lng, delta, limit)

//   console.log(stops);
// });
