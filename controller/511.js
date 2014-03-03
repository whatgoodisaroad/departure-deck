//  API Proxy for 511.org

var 
  fs = require('fs'),
  http = require('http'),
  xml2js = require("xml2js");

//  Setup a list of API functions to proxy:
var points = {
  agencies:{ 
    script:"GetAgencies", 
    args:[], 
    parse:function(data, res) {
      xparse(data, function(result) {
        res(
          result
            .RTT
            .AgencyList[0]
            .Agency
            .map(function(a) { return a.$; })
        );
      });
    }
  },

  routes:{ 
    script:"GetRoutesForAgency", 
    args:["agencyName"], 
    parse:function(data, res) {
      xparse(data, function(result) {
        res(
          result
            .RTT
            .AgencyList[0]
            .Agency[0]
            .RouteList[0]
            .Route
            .map(function(a) { return a.$; })
        );
      });
    }
  },

  stops:{
    script:"GetStopsForRoute",
    args:["routeIDF"],
    parse:function(data, res) {
      xparse(data, function(result) {
        var 
          route = result
            .RTT
            .AgencyList[0]
            .Agency[0]
            .RouteList[0]
            .Route[0],
          stopList = route.hasOwnProperty("StopList") ?
            route.StopList :
            route
              .RouteDirectionList[0]
              .RouteDirection[0]
              .StopList;

        res(
          stopList[0]
            .Stop
            .map(function(a) { return a.$; })
        );
      });
    }
  },

  departures:{
    script:"GetNextDeparturesByStopCode",
    args:["stopCode"],
    parse:function(data, res) {
      xparse(data, function(result) {
        var 
          route = result
            .RTT
            .AgencyList[0]
            .Agency[0]
            .RouteList[0]
            .Route[0],
          stopList = route.hasOwnProperty("StopList") ?
            route.StopList :
            route
              .RouteDirectionList[0]
              .RouteDirection[0]
              .StopList;

        res(
          stopList[0]
            .Stop[0]
            .DepartureTimeList[0]
            .DepartureTime
            .map(function(a) { return parseInt(a, 10); })
        );
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
function createHandler(folder, app, token, key) {

  //  Construct the route based on what arguments this key accepts:
  var route = "/" + folder + "/" + key;
  for (var idx = 0; idx < points[key].args.length; ++idx) {
    if (points[key].args[idx] === "routeIDF") {
      route += "/:agency/:code/:direction?";
    }
    else {
      route += "/:" + points[key].args[idx];
    }
  }

  //  Define a handler based on that route.
  app.get(route, function(req, res) {
    var options = {
      host: 'services.my511.org',
      port: 80,
      path: '/Transit2.0/' + points[key].script + '.aspx?token=' + token
    };

    //  Translate the route parameters into GET parameters for the API.
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
            points[key].parse(buffer, function(p) {

              //  Defer to the parse method for that key:
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

//  Initialize by loading token text and defining function handlers.
exports.init = function(folder, app, fn) {  
  fs.readFile("511.token", 'utf8', function(err, token) {
    if (err) throw err;
    
    for (var key in points) {
      if (points.hasOwnProperty(key)) {
        createHandler(folder, app, token, key);
      }
    }

    fn();
  });
};
