var AccessTokenModel		= require("./mongoose").AccessTokenModel;
var AuthorizationCodeModel	= require("./mongoose").AuthorizationCodeModel;
var ClientModel			= require("./mongoose").ClientModel;
var config			= require("./config");
var crypto			= require("crypto");
var log				= require("./log")(module);
var oauth2orize			= require("oauth2orize");
var passport			= require("passport");
var RefreshTokenModel		= require("./mongoose").RefreshTokenModel;
var UserModel			= require("./mongoose").UserModel;

//
// create OAuth 2.0 server
//
var server = oauth2orize.createServer();

//
// Exchange code for access token.
//
//server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, scope, done) {
server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
  AuthorizationCodeModel.findOne({code: code}, function(err, authCode) {
    if (err) { return done(err); }
    if (!authCode) { 
log.info("code: " + code + " is not registered");
      return done(null, false); 
    }

    var tokenValue = crypto.randomBytes(32).toString("base64");
    var refreshTokenValue = crypto.randomBytes(32).toString("base64");
    var token = new AccessTokenModel({ token: tokenValue, clientId: client.clientId, userId: authCode.code });
    var refreshToken = new RefreshTokenModel({ token: refreshTokenValue, clientId: client.clientId, userId: authCode.code });
    refreshToken.save(function (err) {
      if (err) { return done(err); }
    });
//    var info = { scope: "*" }
    token.save(function(err, token) {
      if (err) { return done(err); }
      done(null, tokenValue, refreshTokenValue, { "expires_in": config.get('security:tokenLife') });
    });
  });
}));

/*
//
// Exchange username & password for access token.
//
server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {
  UserModel.findOne({ username: username }, function(err, user) {
    if (err) { return done(err); }
    if (!user) { return done(null, false); }
    if (!user.checkPassword(password)) { return done(null, false); }

    RefreshTokenModel.remove({ userId: user.userId, clientId: client.clientId }, function (err) {
      if (err) return done(err);
    });
    AccessTokenModel.remove({ userId: user.userId, clientId: client.clientId }, function (err) {
      if (err) return done(err);
    });

    var tokenValue = crypto.randomBytes(32).toString("base64");
    var refreshTokenValue = crypto.randomBytes(32).toString("base64");
    var token = new AccessTokenModel({ token: tokenValue, clientId: client.clientId, userId: user.userId });
    var refreshToken = new RefreshTokenModel({ token: refreshTokenValue, clientId: client.clientId, userId: user.userId });
    refreshToken.save(function (err) {
      if (err) { return done(err); }
    });
    var info = { scope: "*" }
    token.save(function (err, token) {
      if (err) { return done(err); }
console.dir("here");
      done(null, tokenValue, refreshTokenValue, { "expires_in": config.get('security:tokenLife') });
    });
  });
}));
*/

//
// Exchange refreshToken for access token.
//
//server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {
server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, done) {
  RefreshTokenModel.findOne({ token: refreshToken }, function(err, token) {
    if (err) { return done(err); }
    if (!token) { return done(null, false); }
    if (!token) { return done(null, false); }

    UserModel.findById(token.userId, function(err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }

      RefreshTokenModel.remove({ userId: user.userId, clientId: client.clientId }, function (err) {
        if (err) return done(err);
      });
      AccessTokenModel.remove({ userId: user.userId, clientId: client.clientId }, function (err) {
        if (err) return done(err);
      });

      var tokenValue = crypto.randomBytes(32).toString('base64');
      var refreshTokenValue = crypto.randomBytes(32).toString('base64');
      var token = new AccessTokenModel({ token: tokenValue, clientId: client.clientId, userId: user.userId });
      var refreshToken = new RefreshTokenModel({ token: refreshTokenValue, clientId: client.clientId, userId: user.userId });
        refreshToken.save(function (err) {
          if (err) { return done(err); }
      });
//      var info = { scope: '*' }
      token.save(function (err, token) {
        if (err) { return done(err); }
         done(null, tokenValue, refreshTokenValue, { 'expires_in': config.get('security:tokenLife') });
      });
    });
  });
}));

//
// token endpoint
//
exports.token = [
//    passport.authenticate(["basic", "oauth2-client-password", "oauth2-code"], { session: false }),
    passport.authenticate("oauth2-code", { session: false }),
//    passport.authenticate(["basic", "oauth2-code"], { session: false }),
//    passport.authenticate(["basic", "oauth2-client-password"], { session: false }),
    server.token(),
    server.errorHandler()
]

//
// authenticate endpoint
//
//exports.authenticate = [
//    passport.authenticate("oauth2-code", { session: false }),
//    server.token(),
//    server.errorHandler()
//]

