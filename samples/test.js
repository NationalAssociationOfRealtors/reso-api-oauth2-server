 
"use strict";

//
// A test file demonstrating the operation of the RESO API OAuth2 Server 
//

var fs = require("fs");

(function () {
  var aConfigFile = "./service.conf";
console.log("");
  fs.exists(aConfigFile, function(exists) {
    if (!exists) {
console.log("Configuration file " + aConfigFile + " missing");
console.log("");
      process.exit(0);
    } else {
//
// read configuration file
//
console.log("Using configuration file " + aConfigFile);
      var contents = fs.readFileSync(aConfigFile).toString().split("\n");
      var i;
      var userConfig = {};
      for(i in contents) {
        var line = contents[i];
        var data = line.split(":");
        if (data.length != 1) {
          if (line.substring(0,1) != "#") {
            var aValue = data[1].trim().toUpperCase();
            switch (aValue) {
              case "false":
                aValue = false;
                break;
              case "FALSE":
                aValue = false;
                break;
              case "true":
                aValue = true;
                break;
              case "TRUE":
                aValue = true;
                break;
              default:
                aValue = data[1]
                for( var j = 2; j < data.length; j++){
                  aValue += ":" + data[j]
                }
                aValue = aValue.trim();
            }
            userConfig[data[0]] = aValue;
          }
        }
      }
      startServer(userConfig);
    }
  });
})();

function startServer(userConfig) {
  var oauth2Server=require("reso-api-oauth2-server");
  oauth2Server(userConfig);   
//  oauth2Server();   
}
