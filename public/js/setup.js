require.config({
  paths: {
    jquery: '/jquery/dist/jquery.min',
    underscore: "/underscore/underscore",
    backbone: "/backbone/backbone",
    departure_deck: "/js/app"
}
});

require(["departure_deck"], function(dd) {
  dd.run();
});
