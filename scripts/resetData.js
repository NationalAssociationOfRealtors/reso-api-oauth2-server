var AccessTokenModel		= require("./node_modules/reso-api-oauth2-server/libs/mongoose").AccessTokenModel;
var AuthorizationCodeModel	= require("./node_modules/reso-api-oauth2-server/libs/mongoose").AuthorizationCodeModel;
var ClientModel			= require("./node_modules/reso-api-oauth2-server/libs/mongoose").ClientModel;
var log				= require("./node_modules/reso-api-oauth2-server/libs/log")(module);
var mongoose			= require("./node_modules/reso-api-oauth2-server/libs/mongoose").mongoose;
var RefreshTokenModel		= require("./node_modules/reso-api-oauth2-server/libs/mongoose").RefreshTokenModel;
var UserModel			= require("./node_modules/reso-api-oauth2-server/libs/mongoose").UserModel;

AuthorizationCodeModel.remove({}, function(err) {
  if (err) return log.error(err);
});

UserModel.remove({}, function(err) {
  if (err) return log.error(err);
});

ClientModel.remove({}, function(err) {
  if (err) return log.error(err);
});

AccessTokenModel.remove({}, function (err) {
  if (err) return log.error(err);
});

RefreshTokenModel.remove({}, function (err) {
  if (err) return log.error(err);
});

setTimeout(function() {
  mongoose.disconnect();
}, 3000);

