var AccessTokenModel		= require("./mongoose").AccessTokenModel;
var AuthorizationCodeModel	= require("./mongoose").AuthorizationCodeModel;
var AuthorizationCodeStrategy 	= require("passport-oauth2-code").Strategy;
var BasicStrategy		= require("passport-http").BasicStrategy;
var BearerStrategy		= require("passport-http-bearer").Strategy;
var ClientModel			= require("./mongoose").ClientModel;
var ClientPasswordStrategy	= require("passport-oauth2-client-password").Strategy;
var config			= require("./config");
var log				= require("./log")(module);
var passport			= require("passport");
var RefreshTokenModel		= require("./mongoose").RefreshTokenModel;
var UserModel			= require("./mongoose").UserModel;

passport.use(new BasicStrategy(
  function(username, password, done) {
    ClientModel.findOne({ clientId: username }, function(err, client) {
       if (err) { return done(err); }
       if (!client) { return done(null, false); }
       if (client.clientSecret != password) { return done(null, false); }
       return done(null, client);
    });
  }
));

passport.use(new ClientPasswordStrategy(
  function(clientId, clientSecret, done) {
    ClientModel.findOne({ clientId: clientId }, function(err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (client.clientSecret != clientSecret) { return done(null, false); }

      return done(null, client);
    });
  }
));

passport.use(new AuthorizationCodeStrategy(
  function(code, clientId, clientSecret, redirectURI, done) {
    ClientModel.findOne({ clientId: clientId }, function(err, client) {
      if (err) { return done(err); }
      if (!client) { 
log.info("client_id: " + clientId + " is not valid for code: " + code);
        return done(null, false); 
      }
      if (client.clientSecret != clientSecret) { 
log.info("client_secret: " + clientSecret + " does not match client_id: " + clientId + " for code: " + code);
        return done(null, false); 
      }
      AuthorizationCodeModel.findOne({ code: code }, function(err, authCode) {
        if (err) { return done(err); }
        if (!authCode) { 
log.info("code: " + code + " is not registered");
          return done(null, false); 
        }
        if (authCode.redirectURI != redirectURI) { 
log.info("redirect_uri: " + redirectURI + " is not valid for code: " + code);
          return done(null, false); 
        }

        return done(null, client);
      });
    });
  }
));

passport.use(new BearerStrategy(
  function(accessToken, done) {
console.dir(accessToken);
    AccessTokenModel.findOne({ token: accessToken }, function(err, token) {
      if (err) { return done(err); }
      if (!token) { return done(null, false); }

      if( Math.round((Date.now()-token.created)/1000) > config.get("security:tokenLife") ) {
        AccessTokenModel.remove({ token: accessToken }, function (err) {
          if (err) return done(err);
        });
        return done(null, false, { message: "Token expired" });
      }

//      if (token.userId.length == 24) {
      if (token.userId.match(/^[a-f0-9]{24}$/i) !== null) {
        UserModel.findById(token.userId, function(err, user) {
          if (err) { return done(err); }
          if (!user) { return done(null, false, { message: "Unknown user" }); }
          var info = { scope: "*" }
          done(null, user, info);
        });
      } else {
        AuthorizationCodeModel.findOne({code: token.userId}, function(err, authCode) {
          if (err) { return done(err); }
          if (!authCode) { return done(null, false, { message: "Unknown code" }); }
  
          var info = { scope: "*" }
          done(null, authCode, info);
        });
      }

    });
  }
));

