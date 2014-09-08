
var AuthorizationCodeModel = require("./libs/mongoose").AuthorizationCodeModel
  , basicAuth = require('basic-auth')
  , bodyParser = require("body-parser")
  , ClientModel	= require("./libs/mongoose").ClientModel
  , config = require("./libs/config")
  , crypto = require("crypto")
  , express = require("express")
  , favicon = require('serve-favicon')
  , fs = require("fs")
  , https = require('https')
  , log	= require("./libs/log")(module)
  , morgan = require("morgan")
  , oauth2 = require("./libs/oauth2")
  , path = require("path")
  , passport = require("passport")
  , validUrl = require("valid-url")
  , url	= require("url");

function resoOAuth2(){   

  var app = express();

//var pathToPublic = __dirname;
  var pathToPublic = ".";

  app.use(favicon(pathToPublic + '/public/images/reso.ico', { maxAge: 2592000000 }));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(morgan("dev")); // log all requests
  app.use(passport.initialize()); // needed to enable OAuth2 middleware
  app.use(express.static(path.join(pathToPublic, "public")));

//
// jade
//
  app.set('views', path.join(__dirname, 'views'));
//  app.set('views', path.join(pathToPublic, 'views'));
  app.set("view engine", "jade");
  app.set("view options", {pretty:false});
//  app.set("view options", {pretty:true});

  var target = baseTarget(config);
  var applicationName = "RETS Web API OAuth2 Server";
  var cssFile = target + "/css/oauth2.css"; 
//  var cssFile = openTarget(config) + "/css/oauth2.css"; 
  var footer1 = "An open source project of the Center for REALTOR&reg; Technology (CRT)"
  var footer2 = "Visit the <a href='http://crt.blogs.realtor.org'>CRT blog</a> for more technology projects";
  var templateHeader = {
    applicationName: applicationName, 
    css: cssFile, 
    footer1: footer1, 
    footer2: footer2 
  }

  app.get("/", function(req, res, next){
    res.render("home", { 
      templateHeader: templateHeader, 
      page_title: "Welcome to the</br>RETS Web API OAuth2 Server" 
    });
  });

//
// authentication
//
  var auth = function (req, res, next) {
    function unauthorized(res) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      return res.status(401).end();
    };

    var user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
      return unauthorized(res);
    };

    if (user.name === "test" && user.pass === "testpass") {
      return next();
    } else {
      return unauthorized(res);
    };
  };

//
// Register OneStep 
//
  app.get("/register_onestep", auth, function(req, res, next){
    var authorizedUser = readAuthHeader(req.headers);

    var post_url = "./register_onestep";
    res.render("registerClient", { 
      templateHeader: templateHeader, 
      page_title: "Register a RETS Web API Client",
      page_description: "Use this form to register and grant access to your RETS Web API Client."
    });
  });

  app.post("/register_onestep", auth, function (req, res) {
    var authorizedUser = readAuthHeader(req.headers);

//
// client code and secret
//
    var client_id = parseInt(crypto.randomBytes(4).toString("hex"), 16).toString(36);
    var client_secret = parseInt(crypto.randomBytes(16).toString("hex"), 16).toString(36);
    var clientMap = { name:req.body.client_name,clientId:client_id,clientSecret:client_secret,redirectURI:req.body.redirect_uri };
    var usage_code = parseInt(crypto.randomBytes(8).toString("hex"), 16).toString(36);
    var authorizationMap = { code:usage_code,redirectURI:req.body.redirect_uri,username:authorizedUser.userid,password:authorizedUser.password };

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
        formatError(res, err, clientMap);
        return log.error(err);
      } else {
        if (detectedDup) {
          client = clientMap;
log.info("Reusing client - %s",client.clientId);
          ClientModel.findOne({ name: req.body.client_name }, function(err, client) {
            if (err) return done(err);
            if (client) {
              AuthorizationCodeModel.findOne({ redirectURI: req.body.redirect_uri }, function(err, authCode) {
                if (err) {
                  formatError(res, err, authorizationMap);
                  return log.error(err);
                }
                if (authCode) {
log.info("Reusing code - %s:%s:%s",authCode.code,authCode.redirectURI,authCode.username);
                  result = { name:client.name,code:authCode.code,client_id:client.clientId,client_secret:client.clientSecret,redirect_uri:authCode.redirectURI };
                  formatFullURLResult(res, result, "RETS Web API Client Enabled");
                } else {
log.info("New code - %s:%s:%s",usage_code,req.body.redirect_uri,authorizedUser.userid);
                  var authorizationCode = new AuthorizationCodeModel(authorizationMap);
                  authorizationCode.save(function(err, authorizationCode) {
                    if(err) { 
                      formatError(res, err, authorizationMap);
                      return log.error(err);
                    } else {
                      result = { name:client.name,code:usage_code,client_id:client.clientId,client_secret:client.clientSecret,redirect_uri:req.body.redirect_uri };
                      formatFullURLResult(res, result, "RETS Web API Client Enabled");
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
              formatError(res, err, authorizationMap);
              return log.error(err);
            } else {
log.info("New code - %s:%s:%s",authorizationCode.code,authorizationCode.redirectURI,authorizationCode.username);
              var result = { name:client.name,code:usage_code,client_id:client_id,client_secret:client_secret,redirect_uri:req.body.redirect_uri };
              formatFullURLResult(res, result, "RETS Web API Client Enabled");
            }
          });      
        }
      }
    });

  });

//
// Register Client
//
  app.get("/register_client", auth, function(req, res, next){
    var authorizedUser = readAuthHeader(req.headers);

    var post_url = "./register_client";
    res.render("registerClient", { 
      templateHeader: templateHeader, 
      page_title: "Register a RETS Web API Client",
      page_description: "Use this form to make your RETS Web API Client available our Subscribers."
    });
  });

  app.post("/register_client", auth, function (req, res) {
    var authorizedUser = readAuthHeader(req.headers);

//
// check for valid URI and fragments
//
    if (!validUrl.isUri(req.body.redirect_uri)) {
      var err = "URI is not Valid";
      var title = "RETS Web API Client Registration Failed";
      res.render("notice", { 
        templateHeader: templateHeader, 
        page_title: title,
        notice: err 
      });
      return log.error(err);
    }
    var parsedURI = url.parse(req.body.redirect_uri);
    if (parsedURI.hash) {
      var err = "URI has a fragment";
      var title = "RETS Web API Client Registration Failed";
      res.render("notice", { 
        templateHeader: templateHeader, 
        page_title: title,
        notice: err 
      });
      return log.error(err);
    }

//
// generate unique values for client_id and client_secret 
//
    var client_id = parseInt(crypto.randomBytes(4).toString("hex"), 16).toString(36);
    var client_secret = parseInt(crypto.randomBytes(16).toString("hex"), 16).toString(36);
    var clientMap = { name:req.body.client_name,clientId:client_id,clientSecret:client_secret,redirectURI:req.body.redirect_uri };

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
        formatError(res, err, clientMap);
        return log.error(err);
      } else {
        if (detectedDup) {
          client = clientMap;
          ClientModel.findOne({ name: req.body.client_name }, function(err, client) {
            if (err) return done(err);
            if (client) {
log.info("Reusing client - %s",client.clientId );
              result = { client_name:req.body.client_name,client_id:client.clientId,client_secret:client.clientSecret,redirect_uri:client.redirectURI };
              formatClientResult(res, result, "RETS Web API Client Already Registered");
            }
          });
        } else {
log.info("New client - %s:%s:%s",client.clientId,client.clientSecret,client.redirectURI);
          result = { client_name:req.body.client_name,client_id:client.clientId,client_secret:client.clientSecret,redirect_uri:client.redirectURI };
          formatClientResult(res, result, "RETS Web API Client Registered" );
        }
      }
    });

  });

//
// Grant Client
//
  app.get("/grant_client", auth, function(req, res, next){
    var authorizedUser = readAuthHeader(req.headers);

//
// generate page with all existing clients identified
//
    ClientModel.find({}, function(err, clients) {
      if (err) return done(err);
      if (clients.length == 0) {
log.info("Trying to register a URL when no API Clients have been defined yet");
        var err = "No RETS Web API Clients are Defined";
        var title = "RETS Web API Client Grant Failed";
        res.render("notice", { 
          templateHeader: templateHeader, 
          page_title: title,
          notice: err 
        });
        return log.error(err);
      } else {
        var selectWidget = "<select name='client_id'>";
        clients.forEach(function(client) {
          selectWidget += "<option value='" + client.clientId + "'>" + client.name + "</option>";
        });
        selectWidget += "</select>";

        var post_url = "./grant_client";
        res.render("grantClient", { 
          templateHeader: templateHeader, 
          page_title: "Grant a RETS Web API Client",
          page_description: "If you would like allow a RETS Web API Client access to your account,<br/>simply select one from the list below.",
          select_widget: selectWidget
        });
      }
    });
  });

  app.post("/grant_client", auth, function (req, res) {
    var authorizedUser = readAuthHeader(req.headers);

    if (req.body.client_id) {
log.info("Using client - %s",req.body.client_id);
      ClientModel.findOne({ clientId:req.body.client_id }, function(err, client) {
        if (err) return done(err);
        if (client) {
          AuthorizationCodeModel.findOne({ redirectURI:client.redirectURI }, function(err, authCode) {
            if (err) {
              formatError(res, err, authorizationMap);
              return log.error(err);
            }
            if (authCode) {
log.info("Reusing code - %s:%s:%s",authCode.code,authCode.redirectURI,authCode.username);
              result = { name:client.name,code:authCode.code,client_id:client.clientId,client_secret:client.clientSecret,redirect_uri:authCode.redirectURI };
              formatPartialURLResult(res, result, "RETS Web API Client Already Enabled");
            } else {
              var usage_code = parseInt(crypto.randomBytes(8).toString("hex"), 16).toString(36);
log.info("New code - %s:%s:%s",usage_code,client.redirectURI,authorizedUser.userid);
              var authorizationMap = { code:usage_code,redirectURI:client.redirectURI,username:authorizedUser.userid,password:authorizedUser.password };
              var authorizationCode = new AuthorizationCodeModel(authorizationMap);
              authorizationCode.save(function(err, authorizationCode) {
                if(err) { 
                  formatError(res, err, authorizationMap);
                  return log.error(err);
                } else {
                  result = { name:client.name,code:usage_code,client_id:client.clientId,client_secret:client.clientSecret,redirect_uri:authorizationCode.redirectURI };
                  formatPartialURLResult(res, result, "RETS Web API Client Enabled");
                }
              });
            } 
          });
        }
      });
    } else {
      formatNotice(res, target, "RETS Web API Client Enablement Failed", "No RETS Web API Clients are Defined");
    }

  });

//
// OAuth2 processing 
//
  require("./libs/auth");

  app.get("/oauth", function (req, res) {
    res.send("RETS Web API OAuth2 Server is running");
  });

  app.get("/oauth/auth_denied", function (req, res) {
    res.status(403);
    res.send("Subscriber has denied access");
  });

  app.post("/oauth/auth", auth, function (req, res) {
// http POST https://localhost:1340/oauth/auth response_type=code client_id=ez_reso redirect_uri=http://crt.realtors.org scope=optional state=optional --verify=no
    var authorizedUser = readAuthHeader(req.headers);

//console.dir(req.body.client_id);
//console.dir(req.body.redirect_uri);

    var post_url = target + "/oauth/auth_confirmed";
    var denied_url = "location.href='" + target + "/oauth/auth_denied" + "'";
    var confirmation_text = "Grant access to your Subscriber Account?";
//    res.render("confirmGrant", { 
    res.render("confirmGrant2", { 
      templateHeader: templateHeader, 
      page_title: applicationName, 
      post_url: post_url,
      denied_url: denied_url,
      confirmation_text: confirmation_text, 
      client_id: req.body.client_id, 
      redirect_uri: req.body.redirect_uri 
    });

  });

  function baseTarget(config) {
    var target;
    if (config.get("encrypted_traffic")) {
      target = "https://";
    } else {
      target = "http://";
    }
    target += config.get("domain") + ":" + config.get("port");
    return target;
  }

/*
  function openTarget(config) {
    return "http://" + config.get("domain") + ":" + config.get("port");
  }
*/

  app.post("/oauth/auth_confirmed", auth, function (req, res) {
// http POST https://localhost:1340/oauth/auth response_type=code client_id=ez_reso redirect_uri=http://crt.realtors.org scope=optional state=optional --verify=no
    var authorizedUser = readAuthHeader(req.headers);

    if (req.body.client_id) {
log.info("Looking for client - %s",req.body.client_id);
      ClientModel.findOne({ clientId:req.body.client_id }, function(err, client) {
        if (err) return done(err);
        if (client) {
          AuthorizationCodeModel.findOne({ redirectURI:client.redirectURI }, function(err, authCode) {
            if (err) {
              formatError(res, err, authorizationMap);
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
              var usage_code = parseInt(crypto.randomBytes(8).toString("hex"), 16).toString(36);
log.info("New code - %s:%s:%s",usage_code,client.redirectURI,authorizedUser.userid);
              var authorizationMap = { code:usage_code,redirectURI:client.redirectURI,username:authorizedUser.userid,password:authorizedUser.password };
              var authorizationCode = new AuthorizationCodeModel(authorizationMap);
              authorizationCode.save(function(err, authorizationCode) {
                if(err) { 
                  formatError(res, err, authorizationMap);
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
  });

  app.post("/oauth/token", oauth2.token);

  app.get("/oauth/userInfo",
    passport.authenticate("bearer", { session: false }),
      function(req, res) {
// http https://localhost:1340/oauth/userInfo Authorization:'Bearer TOKEN' --verify=no
      // req.authInfo is set using the `info` argument supplied by
      // `BearerStrategy`.  It is typically used to indicate scope of the token,
      // and used in access control checks.  For illustrative purposes, this
      // example simply returns the scope in the response.
        if (req.user.username) { 
          res.json({ user_id: req.user.userId, name: req.user.username, scope: req.authInfo.scope });
        } else {
          res.json({ code: req.user.code, redirect_uri: req.user.redirectURI, scope: req.authInfo.scope })
        }
      }
  );

//
// error processing
//
  app.use(function(req, res, next){
    res.status(404);
    log.debug("Not found URL: %s",req.url);
    res.send({ error: "Not found" });
    return;
  });

  app.use(function(err, req, res, next){
    res.status(err.status || 500);
    log.error("Internal error(%d): %s",res.statusCode,err.message);
    res.send({ error: err.message });
    return;
  });

  app.get("/ErrorExample", function(req, res, next){
    next(new Error("Random error!"));
  });

  function formatError(res, errorHolder, objectMap) {
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

    var err = "URI is not Valid";
    var title = "RETS Web API OAuth2 Registration Failed";
    res.render("error", { 
      templateHeader: templateHeader, 
      page_title: title,
      error_message: errorMessage, 
      detail_message: detailMessage 
    });
  }

  function formatClientResult(res, result, title) {

    var note = "You will need the following information, along with a code that one of our <br/>Subscribers will provide for you, inorder to request an OAuth2 token for our service.";

    res.render("formatClientResult", { 
      templateHeader: templateHeader, 
      page_title: title,
      page_decription: note,
      client_name: result.client_name, 
      client_id: result.client_id, 
      client_secret: result.client_secret, 
      redirect_uri: result.redirect_uri 
    });
  }

  function readAuthHeader(headers) {
    var authorization = headers['authorization'];
    var parts = authorization.split(' ')
//  var scheme = parts[0];
    var credentials = new Buffer(parts[1], 'base64').toString().split(':');
    var user = {userid:credentials[0],password:credentials[1]};

    return user;
  }

  function formatFullURLResult(res, result, title) {

    var description = "Use this information to request OAUth2 tokens for your RETS Web API Client.";
    var note = "If you are not sure what to do with this information, contact RESO.";

    res.render("formatFullURLResult", { 
      templateHeader: templateHeader, 
      page_title: title,
      page_description: description,
      client_name: result.name, 
      grant_code: result.code, 
      client_id: result.client_id, 
      client_secret: result.client_secret, 
      redirect_uri: result.redirect_uri, 
      page_note: note
    });
  }

  function formatPartialURLResult(res, result, title) {

    var description = "Use this information to request OAUth2 tokens for your RETS Web API Client.";
    var note = "If you are not sure what to do with this information, or do not know<br/>how to configure your client, contact your RETS Web API Client vendor.";

    res.render("formatPartialURLResult", { 
      templateHeader: templateHeader, 
      page_title: title,
      page_description: description,
      client_name: result.name, 
      grant_code: result.code, 
      page_note: note
    });
  }

//
// start server
//
  if (config.get("encrypted_traffic")) {
    var privateKey = fs.readFileSync(config.get("key"), "utf8");
    var certificate = fs.readFileSync(config.get("certificate"), "utf8");
    var credentials = {key: privateKey, cert: certificate};
    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen(config.get("port"));
log.info("RETS Web API OAuth2 Server listening on port " + config.get("port") + " with HTTPS");
  } else {
    app.listen(config.get("port"), function(){
log.info("RETS Web API OAuth2 Server listening on port " + config.get("port") + " with HTTP");
    });
  }

};
                                                                                 
module.exports = resoOAuth2;                                             
     
