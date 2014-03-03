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
  slt,
  tlt
) {
  return Backbone.Model.extend({
    run:function() {
      this.renderStops();
      this.setupTimer();
    },

    renderStops:function() {
      var
        loc = new Locator(),
        self = this;

      loc.setup(function() {
        var stopList = new StopList();

        self.set({ stopList:stopList });

        stopList.loadByProximity(loc.get("coords"), function() {

          $(jade.render(slt, { stops:stopList.get("stops") }))
            .appendTo("body");

          self.setupPredictionUpdater();
        });
      });
    },

    renderTimePredictions:function(callback) {
      var 
        predictions = new Predictions(),
        stopList = this.get("stopList");

      predictions.loadPredictions(stopList, function() {

        var 
          ps = predictions.get("predictions"), 
          p;

        for (var idx = 0; idx < ps.length; ++idx) {
          p = ps[idx];

          $("li[data-stop-tag='" + p.info.stopTag + "']")
            .html(jade.render(tlt, { 
              directions:p.directions,
              rtime:new Date() * 1
            }));

          callback();
        }
      });
    },

    timerPid:null,
    setupTimer:function() {
      var 
        self = this;
        timerStep = function() {
          $("li.secs").each(function() {
            var 
              li = $(this),
              diff = Math.floor(
                (new Date() - new Date(li.data("render-time"))) / 1000
              ),
              pred = parseInt(li.data("seconds"), 10),
              remainder = pred - diff,
              seconds = remainder % 60;

            if (seconds < 10) {
              seconds = "0" + seconds;
            }

            if (remainder > 0) {
              li.text(
                Math.floor(remainder / 60) + ":" + seconds
              );
            }
            else if (remainder > -30) {
              li.text("Now");
            }
            else {
              li.remove();
            }
          });

          // self.timerPid = setTimeout(timerStep, timerInt);
        };

      self.timerPid = setInterval(timerStep, 1000);
    },

    suspendTimer:function() {
      clearTimeout(this.timerPid);
    },

    setupPredictionUpdater:function() {
      var 
        self = this,
        timerInt = 3000,
        timerStep = function() {
          self.suspendTimer()
          self.renderTimePredictions(function() {
            self.setupTimer();
          });
        };
      setInterval(timerStep, 30000);
      timerStep();
    }
  });
});
