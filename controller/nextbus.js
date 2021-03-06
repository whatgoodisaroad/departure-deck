//  API Proxy for NextBus.com

var 
  http = require('http'),
  xml2js = require("xml2js");

//  Setup a list of API functions to proxy:
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

  predictions:{
    command:"predictionsForMultiStops",
    args:["a", "stops"],  // a => agency, stops => stop list
    parse:function(data, res) {
      xparse(data, function(result) {
        if (!result.body || !result.body.predictions) {
          res([]);
        }
        else {
          var ps = result.body.predictions.map(function(p) {
            return {
              info:p.$,
              directions:p.direction ?
                p.direction.map(function(d) {
                  return {
                    title:d.$.title,
                    times:d.prediction.map(function(p) { return p.$; })
                  };
                }) :
                []
            }
          });
          res(ps);
        }
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

//  Helper for parsing XML input:
function xparse(x, f) {
  xml2js.parseString(x, { trim:true }, function (err, result) {
    if (err) throw err;
    f(result);
  });  
}

//  Define a GET handler in Express.
function createHandler(folder, app, key) {

    //  Construct the route based on what arguments this key accepts:
  var route = "/" + folder + "/" + key;
  for (var idx = 0; idx < points[key].args.length; ++idx) {
    if (points[key].args[idx] === "stops") {
      route += "/:stops";
    }
    else {
      route += "/:" + points[key].args[idx];
    }
  }

  //  Define a handler based on that route.
  app.get(route, function(req, res) {
    var options = {
      host: 'webservices.nextbus.com',
      port: 80,
      path:"/service/publicXMLFeed?command=" + points[key].command
    };

    //  Translate the route parameters into GET parameters for the API.
    for (var idx = 0; idx < points[key].args.length; ++idx) {
      if (points[key].args[idx] === "stops") {
        options.path += req.params["stops"]
          .split(",")
          .map(function(s) { return "&stops=" + s.replace("~", "|"); })
          .join("");
      }
      else {
        options.path += (
          "&" + points[key].args[idx] + "=" + req.params[points[key].args[idx]]
        );
      }
    }
    options.path = options.path.replace(/\s/g, "%20");

    //  We'll be returning JSON
    res.setHeader('Content-Type', 'application/json');

    //  Read the response into a buffer for XML parsing:
    var buffer = "";
    http
      .get(options, function(resp){
        resp
          .on('data', function(chunk){
            buffer += chunk;
          })
          .on("end", function() {
            try {
              //  Defer to the parse method for that key:
              points[key].parse(buffer, function(p) {
                res.write(JSON.stringify(p));
                res.end();
              });
            }
            catch (exc) {
              res.write("[]");
              res.end();
            }
          });
      })
      .on("error", function(e){
        console.log("Got error: " + e.message);
      });
  });
}

//  Initialize by defining function handlers.
exports.init = function(folder, app, fn) {    
  for (var key in points) {
    if (points.hasOwnProperty(key)) {
      createHandler(folder, app, key);
    }
  }

  fn();
};
