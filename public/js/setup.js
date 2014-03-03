//  Configure require and run the app:
requirejs.config({
  paths: {
    text: "requirejs-text/text",

    jquery: '/jquery/dist/jquery.min',
    underscore: "/underscore/underscore",
    backbone: "/backbone/backbone",
    jade: "/jade/jade",

    departure_deck: "/js/app",
    API:"/js/lib/API",
    Locator:"/js/lib/Locator",
    StopList:"/js/lib/StopList",
    Predictions:"/js/lib/Predictions"
  }
});

require(["departure_deck"], function(dd) {
  new dd().run();
});
