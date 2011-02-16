/**
 *  Application
 */
var Application = (function() {
  var app = {}; 
  app.TOKEN_COOKIE_KEY = "gtoken";
  app.SHEET_COOKIE_KEY = "sheetKey";

  /**
   *  get google auth token
   *  @return token auth token
   */
  app.getGoogleToken = function() {
    return app.cookieUtil.get(app.TOKEN_COOKIE_KEY);
  };

  /**
   *  set google auth token
   *  @param token auth token
   */
  app.setGoogleToken = function(token) {
    app.cookieUtil.set(app.TOKEN_COOKIE_KEY, token);
  };

  /**
   *  set spread sheet key
   *  @param key spread sheet key
   *  ex) https://spreadsheets.google.com/ccc?key=xxxxxxxxxxx
   */
  app.setSpreadSheetKey = function(key) {
    app.cookieUtil.set(app.SHEET_COOKIE_KEY, key);
  };

  /**
   *  get spread sheet key
   *  @return spread sheet key
   */
  app.getSpreadSheetKey = function() {
    return app.cookieUtil.get(app.SHEET_COOKIE_KEY);
  };

  /**
   *  load expenses JSON
   */
  app.loadExpensesJSON = function() {
    var now = new Date();
    var year = now.getFullYear();
    var month = ((101 + now.getMonth()) + "").substr(1, 2);
    var self = this;
    this.showLoadingScreen();
    $.get("./get-data.pl",
      {m: year + month },
      function(data) {
        self.renderExpenses(data);
        self.hideLoadingScreen();
    });
  };

  /**
   *  post data
   */
  app.postData = function() {
    var now = new Date();
    var year = now.getFullYear();
    var month = ((101 + now.getMonth()) + "").substr(1, 2);
    var self = this;
    this.showLoadingScreen();
    $.post("./set-data.pl", {
        date: year + month + $("#dateSelector").val(),
        category: $("#categorySelector").val(),
        out: $("#amount").val(),
        memo: $("#memo").val()
    }, function(data) {
      self.hideLoadingScreen();
    });
  };
 

  /**
   *  render expenses table
   *  @param data expenses JSON
   */
  app.renderExpenses = function(data) {
    var total = 0;
    for (var p in data) {
      var expenses = data[p];
      total += expenses;
      $("#expenses" + this.capitalize(p) + " td").html(this.toCurrency(expenses));
    }
    $("#expensesTotal td").html(this.toCurrency(total));
  };

  /**
   *  show loading screen
   */
  app.showLoadingScreen = function() {
    $("#loadingScreen").show();
  };

  /**
   *  hide loading screen
   */
  app.hideLoadingScreen = function() {
    $("#loadingScreen").hide();
  };

  /**
   *  change view
   *  @param view type
   */
  app.changeView = function(view) {
    var views = ["setting", "input", "detail"];
    for (var i = 0; i < views.length; i++) {
      $("#" + views[i] + "View").hide();
    }
    var viewId = "#" + view + "View";
    $(viewId).show();
  };

  /**
   *  capitalize
   *  @param target string
   *  @return capitalized string
   */
  app.capitalize = function(target) {
    return target.replace(/((^|\s)+)(\w+)/ig, function() {
        return arguments[1] + arguments[3].substring(0, 1).toUpperCase() + arguments[3].substring(1);
    });     
  };

  /**
   *  number to currency
   *  @param target 
   *  @return currency
   *  @see http://webdev.seesaa.net/article/22769178.html
   */
  app.toCurrency = function(target) {
    var result = new String(target).replace(/,/g, "");
    while (result != (result = result.replace(/^(-?\d+)(\d{3})/, "$1,$2")));
    return result;
  }

  /**
   *  initialize input form
   */
  app.initForm = function() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var date = now.getDate();
    var totalDate = (new Date(year, now.getMonth(), 0)).getDate();

    //date selector
    $("#dateLabel").append(year + "年" + month + "月");
    for (var i = 0; i < totalDate; i++) {
      var value = i + 1;
      var selected = (value === date) ? " selected" : "";
      $("#dateSelector").append("<option value='" + value +"'" + selected + ">" + value + "</option>");
    }

    //category
  }

  /**
   *  Cookie Utility
   */
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

/**
 *  entry point
 */
$(function() {
  //check google auth token
  if (!Application.getGoogleToken()) {
    location.href = "./auth.pl";
  }

  //check spread sheet key
  if (!Application.getSpreadSheetKey()) {
    Application.changeView("setting");
  }

  //input view form
  Application.initForm();

  //input view add button
  $("#addButton").click(function() {
    Application.postData();
  });

  //detail view load button
  $("#loadJSONButton").click(function() {
    Application.loadExpensesJSON();
  });

  //setting view
  $("#sheetKey").val(Application.getSpreadSheetKey());
  $("#setSheetKeyButton").click(function(elem) {
    Application.setSpreadSheetKey($("#sheetKey").val());
  });
});
