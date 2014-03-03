//  Load stops based on location via geospatial index:
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

//  Load the controller by deserializing the index:
exports.init = function(folder, app, fn) {
  console.log("Loading stop index...");
  fs.readFile(serialLoc, 'utf8', function(err, serial) {
    //  Deserialize
    index = rbush(9).fromJSON(JSON.parse(serial));

    console.log("Loaded stop index");

    //  Create the GET handler:
    makeHandler(folder, app);

    if (fn) fn();
  });
};

//  Find stops in a bounding box of dimension 2*delta around the lat/lng pair,
//  and limit the results by the limit argument.
exports.findStops = function(lat, lng, delta, limit) {
  if (delta === undefined) { delta = defaultDelta; }
  if (limit === undefined) { limit = defaultLimit; }

  //  Create bb:
  var 
    boundingBox = [
      lat - delta,
      lng - delta,
      lat + delta,
      lng + delta
    ];

  //  Search the index for points inside that bb:
  var stops = _.chain(index.search(boundingBox))

    //  Order by linear (not angular) distance from the given lat/lng pair:
    .sortBy(function(s) {
      return geolib.getDistance(
        { latitude:lat, longitude:lng }, 
        { latitude:s[0], longitude:s[1] }
      );
    })

    //  Filter down to the data in this R-Tree entry:
    .map(function(s) { return s[4]; })

    .first(limit)
    .groupBy("routeTitle")
    .value();

  //  Manually create the inner grouping:
  for (var key in stops) {
    stops[key] = _.chain(stops[key]).groupBy("stopTitle").value();
  }

  return stops;
};

//  Create a GET handler to provide stops near a lat/lng:
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
