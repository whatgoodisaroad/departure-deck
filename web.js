// web.js
var express = require("express");
var logfmt = require("logfmt");
// var prox511 = require("./511.js");
var nextbus = require("./nextbus.js");
var app = express();

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
  // res.send("Hello, Mr. World");
  res.render("index.jade", { });
});

var port = Number(process.env.PORT || 5000);

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/bower_components'));

nextbus.init("api", app, function() {
  app.listen(port, function() {
    console.log("Listening on " + port);
  });
});
