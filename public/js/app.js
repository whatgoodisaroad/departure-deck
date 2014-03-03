//  Main client script for the application:
define([
  "jquery", 
  "backbone",
  "Locator", 
  "StopList",
  "Predictions",
  "jade", 
  "text!stop-list.jade",
  "text!times-list.jade"
], function(
  $, 
  Backbone,
  Locator, 
  StopList,
  Predictions,
  jade,
  slt,  //  Stop List Template
  tlt   //  Time List Template
) {
  return Backbone.Model.extend({
    run:function() {
      this.renderStops();
      this.setupTimer();
    },

    //  Render the stop locations given by the location service passed into a
    //  StopList. Render the results using the stop\list template.
    renderStops:function() {
      var
        loc = new Locator(),
        self = this;

      loc.setup(function() {
        var coords = loc.get("coords");

        //  Display coordinates in the header:
        $(".coords-disp").text(coords.lat + ", " + coords.lng);

        var stopList = new StopList();
        self.set({ stopList:stopList });

        //  Load the stops:
        stopList.loadByProximity(coords, function() {

          //  Render the stops:
          $(jade.render(slt, { stops:stopList.get("stops") }))
            .appendTo(".container");

          // Setup the timer to update departure predictions;
          self.setupPredictionUpdater();
        });
      });
    },

    //  Load a new list of predictions for the current StopList:
    renderTimePredictions:function(callback) {
      var 
        predictions = new Predictions(),
        stopList = this.get("stopList");

      predictions.loadPredictions(stopList, function() {
        var ps = predictions.get("predictions"), p;
        
        //  Render each prediction using the time template and write it into the 
        //  DOM elements for that stop:
        for (var idx = 0; idx < ps.length; ++idx) {
          p = ps[idx];
          $("li[data-stop-tag='" + p.info.stopTag + "']")
            .html(jade.render(tlt, { 
              directions:p.directions,
              rtime:new Date() * 1,
              _:_
            }));
        }

        callback();
      });
    },

    //  Setup the interval for updating the departure prediction times:
    timerPid:null,
    setupTimer:function() {
      var 
        self = this,
        timerInt = 1000;
        timerStep = function() {

          //  For each prediction element:
          $("li.secs").each(function() {
            var 
              li = $(this),

              //  Find elapsed seconds since the prediction was loaded/rendered:
              diff = Math.floor(
                (new Date() - new Date(li.data("render-time"))) / 1000
              ),

              //  Find the number of seconds declared in the prediction:
              pred = parseInt(li.data("seconds"), 10),

              //  Get the remaining time:
              remainder = pred - diff,

              seconds = remainder % 60;
            
            //  L-pad a zero to seconds:
            if (seconds < 10) {
              seconds = "0" + seconds;
            }

            //  Render differently based on how many seconds are left:
            if (remainder > 0) {
              li.text(
                Math.floor(remainder / 60) + ":" + seconds
              );
            }

            //  The bus train is probably stopped or stopping here:
            else if (remainder > -30) {
              li.text("Now");
            }

            //  Its time is passed, get rid of that prediction. If the train/bus
            //  is just severely delayed, it will be re-added when the 
            //  predictions are reloaded.
            else {
              li.remove();
            }
          });

          //  Setup the timer for the next iteration. This approach is safer 
          //  than window.setInterval because the step may, in the worst case,
          //  take longer than timerInt milliseconds to run.
          self.timerPid = setTimeout(timerStep, timerInt);
        };

      //  Start the interval:
      timerStep();
    },

    //  Stop updating prediction times:
    suspendTimer:function() {
      clearTimeout(this.timerPid);
    },

    //  Setup a timer to load predictions:
    setupPredictionUpdater:function() {
      var 
        self = this,
        timerInt = 30000,
        timerStep = function() {
          self.suspendTimer()
          self.renderTimePredictions(function() {
            self.setupTimer();
          });
          setTimeout(timerStep, timerInt);
        };
      timerStep();
    }
  });
});
