var
  fs = require('fs'),
  xml2js = require("xml2js"),
  rbush = require("rbush");

console.log("Reading " + process.argv[2] + " ...");

fs.readFile(process.argv[2], 'utf8', function(err, xmlText) {
  if (err) throw err;

  console.log("Read " + process.argv[2] + "\nParsing...");
  
  xml2js.parseString(xmlText, { trim:true }, function (err, dom) {
    if (err) throw err;

    console.log(
      "Parsed " + process.argv[2] + 
      "\nIndexing into R-Tree ..."
    );

    var 
      index = rbush(9),
      route,
      stop,
      stopIdx;

    for (var routeIdx = 0; routeIdx < dom.body.route.length; ++routeIdx) {
      route = dom.body.route[routeIdx];

      for (stopIdx = 0; stopIdx < route.stop.length; ++stopIdx) {
        stop = route.stop[stopIdx];

        index.insert([
          stop.$.lat,
          stop.$.lon,
          stop.$.lat,
          stop.$.lon,
          { 
            routeTitle:route.$.title,
            routeTag:route.$.tag,
            stopTitle:stop.$.title,
            stopTag:stop.$.tag,
            stopId:stop.$.stopId
          }
        ]);  
      }      
    }

    console.log(
      "Constructed Index\nSerializing to " + process.argv[3] + " ..."
    );

    fs.writeFile(
      process.argv[3], 
      JSON.stringify(index.toJSON()), 
      function(err) {
        if (err) { throw err; }
        console.log("Done!");
      }
    );
  });  
});
