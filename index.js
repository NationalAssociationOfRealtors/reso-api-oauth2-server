
var basicAuth = require('basic-auth')
  , bodyParser = require("body-parser")
  , config = require("./libs/config")
  , express = require("express")
  , fs = require("fs")
  , https = require('https')
  , log	= require("./libs/log")(module)
  , morgan = require("morgan")
  , oauth2 = require("./libs/oauth2")
  , path = require("path")
  , passport = require("passport")
  , favicon = require('serve-favicon');

function resoOAuth2(){   

var app = express();

//app.use(favicon(__dirname + '/public/images/reso.ico', { maxAge: 2592000000 }));
app.use(favicon("./public/images/reso.ico", { maxAge: 2592000000 }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan("dev")); // log all requests
app.use(passport.initialize());

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
// static and dynamic content
//
app.get("/grant_client.html", auth, function(req, res, next){
  ui.grantClient (req, res, config);
});

//app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(".", "public")));

//
// forms processing
//
var ui = require("./libs/formProcessor");

app.post("/register_client", auth, function (req, res) {
  ui.registerClient (req, res, config);
});

app.post("/enable_client", auth, function (req, res) {
  ui.enableClient (req, res, config);
});

//
// ALL IN ONE
//
app.post("/register_api", auth, function (req, res) {
  ui.registerAndEnableClient (req, res, config);
});

//
// OAuth2 processing 
//
require("./libs/auth");

app.get("/oauth", function (req, res) {
  res.send("RETS Web API OAuth2 Server is running");
});

app.post("/oauth/auth", auth, function (req, res) {
// http POST https://localhost:1340/oauth/auth response_type=code client_id=ez_reso redirect_uri=http://crt.realtors.org scope=optional state=optional --verify=no
  ui.registerGrant (req, res, config);
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
     
