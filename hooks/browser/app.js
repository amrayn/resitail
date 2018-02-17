
  var socket = io.connect('http://localhost:3000');

  $(document).ready(function() {
      socket.emit("client-ready");
  });
  
  $(document).on("click", "#side-bar>.clients input.client", function() {
      var selector = (".line[data-client=" + $(this).attr("name") + "]");
      if ($(this).is(":checked") && $(selector).hasClass("hidden-client")) {
          $(selector).removeClass("hidden-client");
      } else if (!$(this).is(":checked")) {
          $(selector).addClass("hidden-client");
      }
  });
  
  $(document).on("click", "#side-bar>.loggers input.logger", function() {
      var selector = (".line[data-logger=" + $(this).attr("name") + "]");
      if ($(this).is(":checked") && $(selector).hasClass("hidden-logger")) {
          $(selector).removeClass("hidden-logger");
      } else if (!$(this).is(":checked")) {
          $(selector).addClass("hidden-logger");
      }
  });

  socket.on("data", function(data){
      const loggerId = data.logger_id || data.channel_name;
      const clientId = data.client_id || data.channel_name;
      
      const newLine = $("<div>", {
          "text": data.line,
          "class": "line " + 'evt-' + data.event_type + ' ' + ($("#chk-logger-" + loggerId).is(":checked") ? "" : "hidden-logger") + ($("#chk-client-" + clientId).is(":checked") ? "" : "hidden-client"),
          "data-logger": loggerId,
          "data-client": clientId,
      });
      $("#lines").append(newLine);
      
      if ($("#follow").is(":checked")) {
          newLine[0].scrollIntoView(false);
      }
      
      if ($("#side-bar").find(".logger[id=chk-logger-" + loggerId + "]").length == 0) {
          $("#side-bar>.loggers").append($("<input>", {
              "type": "checkbox",
              "checked": true,
              "text": loggerId,
              "class": "logger",
              "id": "chk-logger-" + loggerId,
              "name": loggerId,
          }));

          $("#side-bar>.loggers").append($("<label>", {
              "for": "chk-logger-" + loggerId,
              "text": loggerId,
              "class": "logger-label",
          }));
          $("#side-bar>.loggers").append("<br/>");
      }
      
      if ($("#side-bar").find(".client[id=chk-client-" + clientId + "]").length == 0) {
          $("#side-bar>.clients").append($("<input>", {
              "type": "checkbox",
              "checked": true,
              "text": clientId,
              "class": "client",
              "id": "chk-client-" + clientId,
              "name": clientId,
          }));
          $("#side-bar>.clients").append($("<label>", {
              "for": "chk-client-" + clientId,
              "text": clientId,
              "class": "client-label",
          }));
          $("#side-bar>.clients").append("<br/>");
      }
  });