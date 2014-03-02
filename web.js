// web.js
var 
  express = require("express"),
  logfmt = require("logfmt"),

  nextbus = require("./controller/nextbus.js"),
  geo = require("./controller/geo.js"),

  app = express();

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
  res.render("index.jade", { pageTitle: "Departure Deck" });
});

var port = Number(process.env.PORT || 5000);

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/bower_components'));

nextbus.init("api", app, function() {
  geo.init(function() {
    app.listen(port, function() {
      console.log("Listening on " + port);
    });
  });
});
