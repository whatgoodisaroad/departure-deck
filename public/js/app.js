define(["jquery"], function($) {
  return {
    run:function() {
      $.getJSON("/api/routes/sf-muni", function(data) {
        $.each(data, function(i, route) {
          $("<li><span class='route-code'/> <span class='route-title'/></li>")
            .find(".route-code")
              .text(route.tag)
              .end()
            .find(".route-title")
              .text(route.title.replace(new RegExp("^" + route.tag + "-"), ""))
              .end()
            .appendTo(".routes");
        });
      });
    }
  };
});
