var 
  http = require('http'),
  xml2js = require("xml2js");

var points = {
  agencies:{
    command:"agencyList", 
    args:[],
    parse:function(data, res) {
      xparse(data, function(result) {
        res(
          result
            .body
            .agency
            .map(function(x) { return x.$; })
        );
      });
    }
  },
  routes:{
    command:"routeList",
    args:["a"], // a => agency
    parse:function(data, res) {
      xparse(data, function(result) {
        res(
          result
            .body
            .route
            .map(function(x) { return x.$; })
        );
      });
    }
  },
  route:{
    command:"routeConfig",
    args:["a", "r"], // a => agency, r => route
    parse:function(data, res) {
      xparse(data, function(result) {
        var route = result.body.route[0];

        route.info = route.$;
        delete route.$;

        route.stops = route.stop.map(function(x) { return x.$; });
        delete route.stop;

        route.directions = route.direction.map(function(d) {
          return {
            tag:d.$.tag,
            title:d.$.title,
            name:d.$.name,
            useForUI:d.$.useForUI,
            stops:d.stop.map(function(s) { return s.$.tag; })
          };
        });
        delete route.direction;

        route.paths = route.path.map(function(p) {
          return p.point.map(function(pt) { return pt.$; })
        });
        delete route.path;

        res(route);
      });
    }
  },

  predict:{
    command:"predictions",
    args:["a", "r", "s"],  // a => agency, r => route, s => stop ID
    parse:function(data, res) {
      xparse(data, function(result) {
        var p = result.body.predictions[0];

        p.info = p.$;
        delete p.$;

        p.directions = p.direction.map(function(d) {
          return {
            title:d.$.title,
            times:d.prediction.map(function(p) { return p.$; })
          };
        });
        delete p.direction;

        delete p.message;

        res(p);
      });
    }
  },

  vehicles:{
    command:"vehicleLocations",
    args:["a", "r", "t"],
    parse:function(data, res) {
      xparse(data, function(result) {
        var vs = result.body;

        vs.lastTime = parseInt(vs.lastTime[0].$.time, 10);

        delete vs.$;

        vs.vehicles = vs.vehicle.map(function(v) { return v.$; })
        delete vs.vehicle;

        res(vs);
      });
    }
  }
};

function xparse(x, f) {
  xml2js.parseString(x, { trim:true }, function (err, result) {
    if (err) throw err;
    f(result);
  });  
}

function createHandler(folder, app, key) {
  var route = "/" + folder + "/" + key;
  for (var idx = 0; idx < points[key].args.length; ++idx) {
    if (points[key].args[idx] === "routeIDF") {
      route += "/:agency/:code/:direction?";
    }
    else {
      route += "/:" + points[key].args[idx];
    }
  }

  app.get(route, function(req, res) {
    var options = {
      host: 'webservices.nextbus.com',
      port: 80,
      path:"/service/publicXMLFeed?command=" + points[key].command
    };

    for (var idx = 0; idx < points[key].args.length; ++idx) {
      if (points[key].args[idx] === "routeIDF") {
        options.path += (
          "&routeIDF=" + req.params["agency"] + "~" + req.params["code"] + 
          "~" + req.params["direction"]
        );
      }
      else {
        options.path += (
          "&" + points[key].args[idx] + "=" + req.params[points[key].args[idx]]
        );
      }
    }

    res.setHeader('Content-Type', 'application/json');

    var buffer = "";

    http
      .get(options, function(resp){
        resp
          .on('data', function(chunk){
            buffer += chunk;
          })
          .on("end", function() {
            points[key].parse(buffer, function(p) {
              res.write(JSON.stringify(p));
              res.end();
            });
          });
      })
      .on("error", function(e){
        console.log("Got error: " + e.message);
      });
  });
}

exports.init = function(folder, app, fn) {    
  for (var key in points) {
    if (points.hasOwnProperty(key)) {
      createHandler(folder, app, key);
    }
  }

  fn();
};
