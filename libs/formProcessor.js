var AccessTokenModel		= require("./mongoose").AccessTokenModel;
var AuthorizationCodeModel	= require("./mongoose").AuthorizationCodeModel;
var ClientModel			= require("./mongoose").ClientModel;
var config			= require("./config");
var fs				= require("fs");
var log				= require("./log")(module);
var randomstring		= require('just.randomstring');
var RefreshTokenModel		= require("./mongoose").RefreshTokenModel;
var UserModel			= require("./mongoose").UserModel;
var validUrl 			= require("valid-url");
var url 			= require("url");

//------------
// Define Code 
//------------

function grantClient(req, res, config) {
//
// subscriber name and password
//
  var authorizedUser = readAuthHeader(req.headers);

//
// return page URI 
//
  var target = returnTarget(config);

//
// generate page with all existing clients identified
//
  ClientModel.find({}, function(err, clients) {
    if (err) return done(err);
    if (clients.length == 0) {
log.info("Trying to register a URL when no API Clients have been defined yet");
      formatNotice(res, target, "RETS Web API URL Registration Failed", "No RETS Web API Clients are Defined");
    } else {
      var selectWidget = "<select name='client_id'>";
      clients.forEach(function(client) {
        selectWidget += "<option value='" + client.clientId + "'>" + client.name + "</option>";
      });
      selectWidget += "</select>";

//
// generate place holder page
//
  var body = 
"<div id='page_title'>Grant a RETS Web API Client Access</div>" +
"<div id='page_body'>" +
"<div class='page_note'>If you would like allow a RETS Web API Client access to your account,<br/>simply select one from the list below.</div>" +
"<form id='main_form' name='input' action='./enable_client' method='post'>" +
"<table id='simple_form_table'>" +
//"<tr><td class='form_table_title'>Client:</td><td class='form_table_value'>" + selectWidget + "</td><td class='form_table_description'>(name of the tool you are using)</td></tr>" +
"<tr><td class='form_table_long_title'>RETS Web API Client:</td><td class='form_table_value'>" + selectWidget + "</td></tr>" +
//"<tr><td class='form_table_title'>redirect_uri:</td><td class='form_table_value'><input type='text' name='redirect_uri'/></td><td class='form_table_description'>(where to go after authentication)</td></tr>" +
"</table>" +
"<input class='form_button' type='submit' value='Submit'/>&nbsp;&nbsp;" +
"<input type='button' class='results_button' onclick='location.href=&#39;" + target + "&#39;' value='Return'>" +
"</form> " +
"</div>";
  res.setHeader("Cache-Control", "public, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Connection", "close");
  res.send(results_template_top+body+results_template_bottom);
    }
  });

};

//------------
// Register Client 
//------------

function registerClient(req, res, config) {
//
// subscriber name and password
//
  var authorizedUser = readAuthHeader(req.headers);
  var target = returnTarget(config);

//
// check for valid URI
//
  if (!validUrl.isUri(req.body.redirect_uri)) {
    var err = "URI is not valid";
    formatNotice(res, target, "RETS Web API Client Registration Failed", err);
    return log.error(err);
  }
  var parsedURI = url.parse(req.body.redirect_uri);
  if (parsedURI.hash) {
    var err = "URI has a fragment";
    formatNotice(res, target, "RETS Web API Client Registration Failed", err);
    return log.error(err);
  }

//
// generate unique values for client_id and client_secret 
//
  var client_id = randomstring(16);
  var client_secret = randomstring(40);
  var clientMap = { name:req.body.client_name,clientId:client_id,clientSecret:client_secret,redirectURI:req.body.redirect_uri };

//
// return page URI 
//
  var target = returnTarget(config);

//
// add client
//
  var client = new ClientModel(clientMap);
  client.save(function(err, client) {
    var detectedDup = false
    var checkError = false;
    if(err) {
      if (err.errors) {
        checkError = true;
      } else { 
        detectedDup = true;
      } 
    }
    if (checkError) {
      formatError(res, err, clientMap, target);
      return log.error(err);
    } else {
      if (detectedDup) {
        client = clientMap;
        ClientModel.findOne({ name: req.body.client_name }, function(err, client) {
          if (err) return done(err);
          if (client) {
log.info("Reusing client - %s",client.clientId );
            result = { client_name:req.body.client_name,client_id:client.clientId,client_secret:client.clientSecret,redirect_uri:client.redirectURI };
            formatClientResult(res, result, target, "RETS Web API Client Already Registered");
          }
        });
      } else {
log.info("New client - %s:%s:%s",client.clientId,client.clientSecret,client.redirectURI);
        result = { client_name:req.body.client_name,client_id:client.clientId,client_secret:client.clientSecret,redirect_uri:client.redirectURI };
        formatClientResult(res, result, target, "RETS Web API Client Registered" );
      }
    }
  });
};

//------------
// Enable Client 
//------------

function enableClient (req, res, config) {
//
// subscriber name and password
//
  var authorizedUser = readAuthHeader(req.headers);

//
// return page URI 
//
  var target = returnTarget(config);

  if (req.body.client_id) {
log.info("Using client - %s",req.body.client_id);
    ClientModel.findOne({ clientId:req.body.client_id }, function(err, client) {
      if (err) return done(err);
      if (client) {
//        AuthorizationCodeModel.findOne({ redirectURI: req.body.redirect_uri }, function(err, authCode) {
        AuthorizationCodeModel.findOne({ redirectURI:client.redirectURI }, function(err, authCode) {
          if (err) {
            formatError(res, err, authorizationMap, target);
            return log.error(err);
          }
          if (authCode) {
log.info("Reusing code - %s:%s:%s",authCode.code,authCode.redirectURI,authCode.username);
            result = { showAll:false,name:client.name,code:authCode.code,client_id:client.clientId,client_secret:client.clientSecret,redirect_uri:authCode.redirectURI };
            formatURLResult(res, result, target, "RETS Web API Client Already Enabled");
          } else {
            var usage_code = randomstring(8);
//log.info("New code - %s:%s:%s",usage_code,req.body.redirect_uri,authorizedUser.userid);
log.info("New code - %s:%s:%s",usage_code,client.redirectURI,authorizedUser.userid);
//            var authorizationMap = { code: usage_code, redirectURI: req.body.redirect_uri, username: authorizedUser.userid, password: authorizedUser.password };
            var authorizationMap = { code:usage_code,redirectURI:client.redirectURI,username:authorizedUser.userid,password:authorizedUser.password };
            var authorizationCode = new AuthorizationCodeModel(authorizationMap);
            authorizationCode.save(function(err, authorizationCode) {
              if(err) { 
                formatError(res, err, authorizationMap, target);
                return log.error(err);
              } else {
//                result = { code:usage_code,client_id:client.clientId,client_secret:client.clientSecret,redirect_uri:req.body.redirect_uri };
                result = { showAll:false,name:client.name,code:usage_code,client_id:client.clientId,client_secret:client.clientSecret,redirect_uri:authorizationCode.redirectURI };
                formatURLResult(res, result, target, "RETS Web API Client Enabled");
              }
            });
          } 
        });
      }
    });
  } else {
    formatNotice(res, target, "RETS Web API Client Enablement Failed", "No RETS Web API Clients are Defined");
  }

};

//------------
// Register and Enable Client (onestep) 
//------------
function registerAndEnableClient (req, res, config) {
//
// subscriber name and password
//
  var authorizedUser = readAuthHeader(req.headers);

//
// client code and secret
//
  var client_id = randomstring(16);
  var client_secret = randomstring(40);
  var clientMap = { name:req.body.client_name,clientId:client_id,clientSecret:client_secret,redirectURI:req.body.redirect_uri };
  var usage_code = randomstring(8);
  var authorizationMap = { code:usage_code,redirectURI:req.body.redirect_uri,username:authorizedUser.userid,password:authorizedUser.password };

//
// return page URI 
//
  var target = returnTarget(config);

//
// add client
//
  var client = new ClientModel(clientMap);
  client.save(function(err, client) {
    var detectedDup = false
    var checkError = false;
    if(err) {
      if (err.errors) {
        checkError = true;
      } else { 
        detectedDup = true;
      } 
    }
    if (checkError) {
      formatError(res, err, clientMap, target);
      return log.error(err);
    } else {
      if (detectedDup) {
        client = clientMap;
log.info("Reusing client - %s",client.clientId);
        ClientModel.findOne({ name: req.body.client_name }, function(err, client) {
//        ClientModel.findOne({ clientId: req.body.client_id }, function(err, client) {
          if (err) return done(err);
          if (client) {
            AuthorizationCodeModel.findOne({ redirectURI: req.body.redirect_uri }, function(err, authCode) {
              if (err) {
                formatError(res, err, authorizationMap, target);
                return log.error(err);
              }
              if (authCode) {
log.info("Reusing code - %s:%s:%s",authCode.code,authCode.redirectURI,authCode.username);
                result = { showAll:true,name:client.name,code:authCode.code,client_id:client.clientId,client_secret:client.clientSecret,redirect_uri:authCode.redirectURI };
                formatURLResult(res, result, target, "RETS Web API Client Enabled");
              } else {
log.info("New code - %s:%s:%s",usage_code,req.body.redirect_uri,authorizedUser.userid);
                var authorizationCode = new AuthorizationCodeModel(authorizationMap);
                authorizationCode.save(function(err, authorizationCode) {
                  if(err) { 
                    formatError(res, err, authorizationMap, target);
                    return log.error(err);
                  } else {
                    result = { showAll:true,name:client.name,code:usage_code,client_id:client.clientId,client_secret:client.clientSecret,redirect_uri:req.body.redirect_uri };
                    formatURLResult(res, result, target, "RETS Web API Client Enabled");
                  }
                });
              } 
            });
          }
        });
      } else {
log.info("New client - %s:%s",client.clientId,client.clientSecret);
        var authorizationCode = new AuthorizationCodeModel(authorizationMap);
        authorizationCode.save(function(err, authorizationCode) {
          if(err) {
log.info("Deleting client - %s:%s",client.clientId,client.clientSecret);
            ClientModel.remove({ _id: client._id }, function (err) {
              if (err) return done(err);
            });
            formatError(res, err, authorizationMap, target);
            return log.error(err);
          } else {
log.info("New code - %s:%s:%s",authorizationCode.code,authorizationCode.redirectURI,authorizationCode.username);
            var result = { showAll:true,name:client.name,code:usage_code,client_id:client_id,client_secret:client_secret,redirect_uri:req.body.redirect_uri };
            formatURLResult(res, result, target, "RETS Web API Client Enabled");
          }
        });      
      }
    }
  });
};

function confirmGrant (req, res, config) {

//
// subscriber name and password
//
  var authorizedUser = readAuthHeader(req.headers);

console.dir(req.body.client_id);
console.dir(req.body.redirect_uri);

  var target = baseTarget(config);
console.dir(target);

//
// generate confirmation page
//
  var results_top = 
"<!DOCTYPE html>" +
"<html>" +
"<head>" +
"<title>RETS Web API OAuth2 Authentication</title>" +
"<link rel='stylesheet' href='" + target + "/css/oauth2.css'/>" +
"</head>" +
"<body>";

  var body = 
"<div id='page_body'>" +
"<form id='confirmation_form' name='input' action='" + target + "/oauth/auth_confirmed' method='post'>" +
"<table id='confirmation_table'>" +
//"<tr><td class='confirmation_title'>Third Party Request Received</td></tr>" +
"<tr><td class='confirmation_text'>Grant access to your Subscriber Account?</td></tr>" +
"</table>" +
"<input type='hidden' name='client_id' value='" + req.body.client_id + "'/>" +
"<input type='hidden' name='redirect_uri' value='" + req.body.redirect_uri + "'/>" +
"<input class='yes_button' type='submit' value='YES'/>&nbsp;&nbsp;" +
"<input type='button' class='no_button' onclick='location.href=&#39;" + target + "/oauth/auth_denied" + "&#39;' value='NO'>" +
"<div class='confirmation_subtitle'>Consider the implications of this action</div>" +
"</form> " +
"</div>";

  var results_bottom =
"<div class='page_footer'>An open source project of the Center for REALTOR&reg; Technology (CRT)</div>" +
"<div class='page_footer'>Visit the <a href='http://crt.blogs.realtor.org'>CRT blog</a> for more technology projects</div>" +
"</body>" +
"</html>";

  res.setHeader("Cache-Control", "public, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Connection", "close");
  res.send(results_top+body+results_bottom);

};

//------------
// Register Grant 
// http POST https://localhost:1340/oauth/auth response_type=code client_id=ez_reso redirect_uri=http://crt.realtors.org scope=optional state=optional --verify=no
//------------
function registerGrant (req, res, config) {

//
// subscriber name and password
//
  var authorizedUser = readAuthHeader(req.headers);

//
// return page URI 
//
  var target = returnTarget(config);

  if (req.body.client_id) {
log.info("Looking for client - %s",req.body.client_id);
    ClientModel.findOne({ clientId:req.body.client_id }, function(err, client) {
      if (err) return done(err);
      if (client) {
        AuthorizationCodeModel.findOne({ redirectURI:client.redirectURI }, function(err, authCode) {
          if (err) {
            formatError(res, err, authorizationMap, target);
            return log.error(err);
          }

//
// redirect URI has a query, use a different join character 
//
          var uriJoin = "?";
          var parsedURI = url.parse(req.body.redirect_uri);
          if (parsedURI.query) {
            uriJoin = "&";
          }

          if (authCode) {
log.info("Reusing code - %s:%s:%s",authCode.code,authCode.redirectURI,authCode.username);
            result = { code:authCode.code };
            res.status(302);
            res.setHeader("Location", client.redirectURI + uriJoin + "code=" + authCode.code);
            res.send(result);
          } else {
            var usage_code = randomstring(8);
log.info("New code - %s:%s:%s",usage_code,client.redirectURI,authorizedUser.userid);
            var authorizationMap = { code:usage_code,redirectURI:client.redirectURI,username:authorizedUser.userid,password:authorizedUser.password };
            var authorizationCode = new AuthorizationCodeModel(authorizationMap);
            authorizationCode.save(function(err, authorizationCode) {
              if(err) { 
                formatError(res, err, authorizationMap, target);
                var errorMap = { "error":"invalid_client", "error_description":"Can't get information about this clientId: Not Found" };
                res.status(302);
                res.setHeader("Location", client.redirectURI);
                res.send(errorMap);
                return log.error(err);
              } else {
                result = { code:usage_code };
                res.status(302);
                res.setHeader("Location", client.redirectURI + uriJoin + "code=" + usage_code);
                res.send(result);
              }
            });
          } 
        });
      } else {
        var errorMap = { "error":"invalid_client", "error_description":"Can't get information about this clientId: Not Found" };
        res.status(400);
        res.setHeader("Cache-Control", "public, max-age=0");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Connection", "close");
        res.send(errorMap);
      }
    });
  } else {
    var errorMap = { "error":"invalid_client", "error_description":"Can't get information about this clientId: No client requested" };
    res.status(400);
    res.setHeader("Cache-Control", "public, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Connection", "close");
    res.send(errorMap);
  }

};

//------------
// read templates
//------------
log.info("Reading display templates");
var results_template_top;
fs.readFile("./templates/results_top.tmpl", "utf8", function(err, data) {
  if (err) throw err;
  results_template_top = data;
});
var results_template_bottom;
fs.readFile("./templates/results_bottom.tmpl", "utf8", function(err, data) {
  if (err) throw err;
  results_template_bottom = data;
});

//------------
// ui endpoint
//------------
exports.confirmGrant = confirmGrant;
exports.grantClient = grantClient;
exports.registerClient = registerClient;
exports.enableClient = enableClient;
exports.registerAndEnableClient = registerAndEnableClient;
exports.registerGrant = registerGrant;

//------------

function formatClientResult(res, result, target, title) {
  var body = 
"<div id='page_title'>" + title + "</div>" +
"<div id='page_body'>" +
"<div class='page_note'>You will need the following information, along with a code that one of our <br/>Subscribers will provide for you, inorder to request an OAuth2 token for our service.</div>" +
"<div id='results_layout'>" +
"<table id='results_table'>" +
"<tr><td class='results_table_title'>Name:</td><td class='results_table_value'>" + result.client_name + "<span class='form_table_description'>(Subscribers will use this)</span></td></tr>" +
"<tr><td>&nbsp;</td><td>&nbsp;</td></tr>" +
"<tr><td class='results_table_title'>client_id:</td><td class='results_table_value'>" + result.client_id + "</td></tr>" +
"<tr><td class='results_table_title'>client_secret:</td><td class='results_table_value'>" + result.client_secret + "</td></tr>" +
"<tr><td class='results_table_title'>redirect_uri:</td><td class='results_table_value'>" + result.redirect_uri + "</td></tr>" +
"</table>" +
"<input type='button' class='results_button' onclick='location.href=&#39;" + target + "&#39;' value='Return'>" +
"</div>" +
"<div class='page_note'>Subscribers need to <a href='./enable_client.html'>request a code</a>, using the name &quot;" + result.client_name + "&quot;, so that you can<br/>request an OAuth2 token.  After you have a token, you can provide the Subscriber service.</div>" +
"</div>";
  res.setHeader("Cache-Control", "public, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Connection", "close");
  res.send(results_template_top+body+results_template_bottom);
}

function formatURLResult(res, result, target, title) {
  var body = 
"<div id='page_title'>" + title + "</div>" +
"<div id='page_body'>" +
"<div class='page_note'>Use this information to request OAUth2 tokens for your RETS Web API Client.</div>" +
"<div id='results_layout'>" +
"<table id='results_table'>" +
"<tr><td class='results_table_title'>Name:</td><td class='results_table_value'>" + result.name + "<span class='form_table_description'>(for your records)</span></td></tr>" +
"<tr><td>&nbsp;</td><td>&nbsp;</td></tr>";

  if (result.showAll) {
    body +=
"<table id='results_table'>" +
"<tr><td class='results_table_title'>code:</td><td class='results_table_value'>" + result.code + "</td></tr>" +
"<tr><td class='results_table_title'>client_id:</td><td class='results_table_value'>" + result.client_id + "</td></tr>" +
"<tr><td class='results_table_title'>client_secret:</td><td class='results_table_value'>" + result.client_secret + "</td></tr>" +
"<tr><td class='results_table_title'>redirect_uri:</td><td class='results_table_value'>" + result.redirect_uri + "</td></tr>" +
"</table>";
  } else {
    body +=
"<tr><td class='results_table_title'>Code:</td><td class='results_table_value'>" + result.code + "<span class='form_table_description'>(give this to your vendor)</span></td></tr>" +
//"<tr><td>&nbsp;</td><td>&nbsp;</td></tr>" +
//"<tr><td class='results_table_title'>client_id:</td><td class='results_table_value'>" + result.client_id + "</td></tr>" +
//"<tr><td class='results_table_title'>client_secret:</td><td class='results_table_value'>" + result.client_secret + "</td></tr>" +
//"<tr><td class='results_table_title'>redirect_uri:</td><td class='results_table_value'>" + result.redirect_uri + "</td></tr>" +
"</table>";
  }

  body +=
"<input type='button' class='results_button' onclick='location.href=&#39;" + target + "&#39;' value='Return'>" +
"</div>" +
"<div class='page_note'>If you are not sure what to do with this information, or do not know<br/>how to configure your client, contact your RETS Web API Client vendor.</div>" +
"</div>";
  res.setHeader("Cache-Control", "public, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Connection", "close");
  res.send(results_template_top+body+results_template_bottom);
}

function formatError(res, errorHolder, objectMap, target) {
  var errorMessage = "";

//
// error detail by field name (Validation, not Mongo)
//
//
  var detailMessage = "";
  if (errorHolder.errors) {
    errorMessage = errorHolder.message;
    detailMessage += "<ol style='error_list'>";
    var keys = Object.keys(objectMap);
    var messageCount = 0;
    var index;
    for (index = 0; index < keys.length; ++index) {
      if (errorHolder.errors[keys[index]]) {
        detailMessage += "<li>" + errorHolder.errors[keys[index]].message + "</li>";
        ++messageCount;
      }
    }
    detailMessage += "</ol>";
  } else {
    errorMessage = errorHolder.err;
  }

//
// generate error page
//
  var body = 
"<div id='page_title'>RETS Web API OAuth2 Registration Failed</div>" +
"<div id='page_body'>" +
"<div class='error_text'>" +
"<div class='error_highlight'>" +
errorHolder.message + 
"</div>" +
detailMessage +
"<input type='button' class='results_button' onclick='location.href=&#39;" + target + "&#39;' value='Return'>" +
"</div>" +
"</div>";
  res.setHeader("Cache-Control", "public, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Connection", "close");
  res.send(results_template_top+body+results_template_bottom);
}

function formatNotice(res, target, title, notice) {
  var body = 
"<div id='page_title'>" + title + "</div>" +
"<div id='page_body'>" +
"<div class='error_text'>" +
"<div class='error_highlight'>" + notice + "</div>" +
"<input type='button' class='results_button' onclick='location.href=&#39;" + target + "&#39;' value='Return'>" +
"</div>" +
"</div>";
  res.setHeader("Cache-Control", "public, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Connection", "close");
  res.send(results_template_top+body+results_template_bottom);
}

function formatPlaceholder(res, target) {
  var body = 
"<div id='page_title'>Place Holder</div>" +
"<div id='page_body'>" +
"<div class='error_text'>" +
"<div class='error_highlight'>Temporary Page</div>" +
"<input type='button' class='results_button' onclick='location.href=&#39;" + target + "&#39;' value='Return'>" +
"</div>" +
"</div>";
  res.setHeader("Cache-Control", "public, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Connection", "close");
  res.send(results_template_top+body+results_template_bottom);
}

function baseTarget(config) {
  var target;
  if (config.get("encrypted_traffic")) {
    target = "https://";
  } else {
    target = "https://";
  }
  target += config.get("domain") + ":" + config.get("port");
  return target;
}

function returnTarget(config) {
/*
  var target;
  if (config.get("encrypted_traffic")) {
    target = "https://";
  } else {
    target = "https://";
  }
  target += config.get("domain") + ":" + config.get("port") + "/" + config.get("entry_point");
  return target;
*/
  return baseTarget(config) + "/" + config.get("entry_point");
}

function readAuthHeader(headers) {
  var authorization = headers['authorization'];
  var parts = authorization.split(' ')
//  var scheme = parts[0];
  var credentials = new Buffer(parts[1], 'base64').toString().split(':');
  var user = {userid:credentials[0],password:credentials[1]};

  return user;
}

/*
//
// generate result page
//
  res.setHeader("Cache-Control", "public, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Connection", "close");
  var results_template_body = 
"<div id='page_title'>RESO API Client has been Registered</div>" +
"<div id='page_body'>" +
"<div id='results_layout'>" +
"<table id='results_table'>" +
"<tr><td class='results_table_title'>code:</td><td class='results_table_value'>" + client_code + "</td></tr>" +
"<tr><td class='results_table_title'>client_id:</td><td class='results_table_value'>" + req.body.client_id + "</td></tr>" +
"<tr><td class='results_table_title'>client_secret:</td><td class='results_table_value'>" + client_secret + "</td></tr>" +
"<tr><td class='results_table_title'>redirect_uri:</td><td class='results_table_value'>" + req.body.redirect_uri + "</td></tr>" +
"</table>" +
"<input type='button' class='results_button' onclick='location.href=&#39;" + target + "&#39;' value='Return'>" +
"</div>" +
"</div>";
  res.send(results_template_top+results_template_body+results_template_bottom);
*/

/*
          if (!authCode) { 
            var authorizationMap = { code: client_code, redirectURI: req.body.redirect_uri, username: userid, password: password };
            var authorizationCode = new AuthorizationCodeModel(authorizationMap);
            authorizationCode.save(function(err, authorizationCode) {
              if (err) return done(err);
              var result = { code:client_code, client_id:req.body.client_id, client_secret:client_secret, redirect_uri:req.body.redirect_uri };
              formatResult(res, result, target);
            });
          } else {
log.info("New code - %s:%s",authorizationCode.code,authorizationCode.redirectURI,authorizationCode.username,authorizationCode.password);
            var result = { code:client_code, client_id:req.body.client_id, client_secret:client_secret, redirect_uri:req.body.redirect_uri };
            formatResult(res, result, target);
          }
        });      
          } else {
            var result;
            if (authCode.redirectURI != req.body.redirect_uri) { 
log.info("Reuse code - %s:%s",authCode.code,authCode.redirectURI,authCode.username,authCode.password);
              result = { code:client_code, client_id:req.body.client_id, client_secret:client_secret, redirect_uri:req.body.redirect_uri };
            } else {
              var authorizationMap = { code: client_code, redirectURI: req.body.redirect_uri, username: userid, password: password };
              var authorizationCode = new AuthorizationCodeModel(authorizationMap);
              authorizationCode.save(function(err, authorizationCode) {
                if(err) { 
                  return log.error(err);
                } else {
console.dir(authorizationCode);
                  result = { code:client_code, client_id:req.body.client_id, client_secret:client_secret, redirect_uri:req.body.redirect_uri };
                }
              });
            }  
            formatResult(res, result, target);
          }
*/
