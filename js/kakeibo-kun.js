var Application = (function() {
  var app = {}; 
  app.TOKEN_COOKIE_KEY = "gtoken";
  app.SHEET_COOKIE_KEY = "sheetKey";

  app.setGoogleToken = function(token) {
    app.cookieUtil.set(app.TOKEN_COOKIE_KEY, token);
  };

  app.setSpreadSheetKey = function(key) {
    app.cookieUtil.set(app.SHEET_COOKIE_KEY, key);
  };

  app.getSpreadSheetKey = function() {
    return app.cookieUtil.get(app.SHEET_COOKIE_KEY);
  };

  app.loadJSON = function() {
    //TODO
  };

  app.cookieUtil = {
    set: function(myKey, myVal) {
      var expiresDateObj = new Date();
      if (arguments.length === 3) {
        expiresDateObj = arguments[2];
      } else {
        expiresDateObj.setYear(expiresDateObj.getFullYear() + 1);
      }

      var expiresDate = expiresDateObj.toGMTString().replace(/UTC/, "GTM");
      var tempStr = myKey + "=" + myVal + "; ";
      tempStr +="path=/;";
      tempStr +="expires=" + expiresDate + "; ";
      document.cookie = tempStr;
    },

    get: function(myKey) {
      var cookies = [];
      if (document.cookie) {
        var cookiesStr = document.cookie.split(";");
        for (var i = 0; i < cookiesStr.length; i++) {
          var cookiePair = cookiesStr[i].split("=");
          if (cookiePair.length !== 2) {
            continue; 
          } else {
            cookies[cookiePair[0].replace(/^ *| *$/g, "")] = cookiePair[1].replace(/^ *| *$/g, "");
          }
        }
        return cookies[myKey];
      }
      return null;
    },

    del: function(myKey){
      app.cookieUtil.set(myKey, "", new Date(0));
    }
  };

  return app;
})();

$(function() {
  $("#sheetKey").val(Application.getSpreadSheetKey());
  $("#setSheetKeyButton").click(function(elem) {
    Application.setSpreadSheetKey($("#sheetKey").val());
  });

  $("#addButton").click(function() {
    $.post("./set-data.pl", {
        date: $("#date").val(),
        category: $("#category").val(),
        out: $("#amount").val(),
        memo: $("#memo").val()
    }, function(data) {
      console.log(data);
    });
  });
});
