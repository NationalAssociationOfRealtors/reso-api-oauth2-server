var AccessTokenModel		= require("./libs/mongoose").AccessTokenModel;
var AuthorizationCodeModel	= require("./libs/mongoose").AuthorizationCodeModel;
var ClientModel			= require("./libs/mongoose").ClientModel;
var log				= require("./libs/log")(module);
var mongoose			= require("./libs/mongoose").mongoose;
var randomstring		= require('just.randomstring');
var RefreshTokenModel		= require("./libs/mongoose").RefreshTokenModel;
var UserModel			= require("./libs/mongoose").UserModel;

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

