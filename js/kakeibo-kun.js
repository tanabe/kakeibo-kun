/**
 *  Application
 */
var Application = (function() {
  var app = {}; 
  app.TOKEN_COOKIE_KEY = "gtoken";
  app.SHEET_COOKIE_KEY = "sheetKey";

  /**
   *  initialize
   */
  app.initialize = function() {
    var self = this;

    //check spread sheet key
    if (!this.getSpreadSheetKey()) {
      this.changeView("setting");
    } else {
      //default view
      this.changeView("input");
    }

    //check google auth token
    if (!this.getGoogleToken()) {
      this.showMessage("Googleの認証画面へリダイレクト中...");
      location.href = "./auth.pl";
    }

    //input view form
    this.initInputForm();

    //input view send button
    $("#sendButton").click(function() {
      if (self.validateInputValue()) {
        self.postData();
      } else {
        alert("入力された金額が正しくありません");
      }
    });

    //detail view load button
    $("#loadJSONButton").click(function() {
      self.loadExpensesJSON();
    });

    //setting view
    this.initSheetKeyInput();
    $("#setSheetKeyButton").click(function(elem) {
      var pattern = /\?key=([^&]+)/;
      if (pattern.test($("#sheetKeyInput").val())) {
        var spreadSheetKey = $("#sheetKeyInput").val().match(/\?key=([^&]+)/)[1];
        self.setSpreadSheetKey(spreadSheetKey);
        self.initSheetKeyInput();
      } else {
        alert("URLが正しくありません");
      }
    });
    $("#resetButton").click(function() {
      if (confirm("保存されている情報を削除しますか？")) {
        self.resetSettings();
      }
    });
  };

  /**
   *  reset setting
   */
  app.resetSettings = function() {
    this.setSpreadSheetKey("");
    this.setGoogleToken("");
    this.initSheetKeyInput();
  };

  /**
   *  validate input value
   */
  app.validateInputValue = function() {
    var result = false;
    var pattern = /^\d+$/;
    if (pattern.test($("#amount").val())) {
      result = true;
    }
    return result;
  };

  /**
   *  initialize sheet key input area
   */
  app.initSheetKeyInput = function() {
    var element = $("#sheetKey");
    if (this.getSpreadSheetKey()) {
      element.text(this.getSpreadSheetKey());
      element.removeClass("unset");
    } else {
      element.text("未設定");
      element.addClass("unset");
    }
  }

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
    if (!token) {
      app.cookieUtil.del(app.TOKEN_COOKIE_KEY);
    } else {
      app.cookieUtil.set(app.TOKEN_COOKIE_KEY, token);
    }
  };

  /**
   *  set spread sheet key
   *  @param key spread sheet key
   *  ex) https://spreadsheets.google.com/ccc?key=xxxxxxxxxxx
   */
  app.setSpreadSheetKey = function(key) {
    if (!key) {
      app.cookieUtil.del(app.SHEET_COOKIE_KEY);
    } else {
      app.cookieUtil.set(app.SHEET_COOKIE_KEY, key);
    }
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
    $.post("./get-data.pl",
      {
        m: year + month
      },
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
    this.showMessage("送信中...");
    $.post("./set-data.pl", {
        date: year + month + $("#dateSelector").val(),
        category: $("#categorySelector").val(),
        out: $("#amount").val(),
        memo: $("#memo").val()
    }, function(data) {
      self.hideLoadingScreen();
      $("#amount").val("");
      $("#memo").val("");
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
      $("#expenses" + this.capitalize(p) + " td").html(this.toCurrency(expenses) + "円");
    }
    $("#expensesTotal td").html(this.toCurrency(total) + "円");
  };

  /**
   *  initialize screen size
   */
  app.initScreenSize = function() {
    var height = $("body").height() - $("h1").height();
    $("#loadingScreen").css("height", height + "px");
    $("#messageScreen").css("height", height + "px");
  };

  /**
   *  show loading screen
   */
  app.showLoadingScreen = function() {
    this.showMessage("読込中...");
  };

  /**
   *  hide loading screen
   */
  app.hideLoadingScreen = function() {
    this.hideMessage();
  };

  /**
   *  change view
   *  @param view type
   */
  app.changeView = function(view) {
    var views = ["setting", "input", "detail", "help"];
    for (var i = 0; i < views.length; i++) {
      $("#" + views[i] + "View").hide();
      //menu item
      $("ul#menu li." + views[i]).removeClass("current");
    }
    //menu item
    $("ul#menu li." + view).addClass("current");
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
  app.initInputForm = function() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var date = now.getDate();
    //var day = ["日", "月", "火", "水", "木", "金", "土"][now.getDay()];
    var totalDate = (new Date(year, now.getMonth() + 1, 0)).getDate();

    //date selector
    $("#datePrefix").html(year + "年" + month + "月");
    $("#dateSuffix").html("日");
    for (var i = 0; i < totalDate; i++) {
      var value = i + 1;
      var selected = (value === date) ? " selected" : "";
      $("#dateSelector").append("<option value='" + value +"'" + selected + ">" + value + "</option>");
    }
  };

  /**
   *  show message screen
   *  @message message
   */
  app.showMessage = function(message) {
    this.initScreenSize();
    $("#messageScreen").show();
    $("#messageScreen p.message span.body").text(message);
  };

  /**
   *  hide message screen
   */
  app.hideMessage = function() {
    $("#messageScreen").hide();
  };

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
  Application.initialize();
});
