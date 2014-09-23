var AccessTokenModel		= require("./node_modules/reso-api-oauth2-server/libs/mongoose").AccessTokenModel;
var AuthorizationCodeModel	= require("./node_modules/reso-api-oauth2-server/libs/mongoose").AuthorizationCodeModel;
var ClientModel			= require("./node_modules/reso-api-oauth2-server/libs/mongoose").ClientModel;
var faker			= require("Faker");
var log				= require("./node_modules/reso-api-oauth2-server/libs/log")(module);
var mongoose			= require("./node_modules/reso-api-oauth2-server/libs/mongoose").mongoose;
var randomstring		= require('just.randomstring');
var RefreshTokenModel		= require("./node_modules/reso-api-oauth2-server/libs/mongoose").RefreshTokenModel;
var UserModel			= require("./node_modules/reso-api-oauth2-server/libs/mongoose").UserModel;

AuthorizationCodeModel.remove({}, function(err) {
//  var client_code = (+new Date()).toString(36);
//  var client_code = randomstring(8);
  var client_code = "a123b456";
  var authorizationCode = new AuthorizationCodeModel({ code: client_code, redirectURI: "localhost/reso", username: "andrey", password: "simplepassword" });
  authorizationCode.save(function(err, authorizationCode) {
    if(err) return log.error(err);
    else log.info("New code - %s:%s",authorizationCode.code,authorizationCode.redirectURI,authorizationCode.username,authorizationCode.password);
  });

  for(i=0; i<4; i++) {
//    var client_code = (+new Date()).toString(36);
    var client_code = randomstring(8);
    var authorizationCode = new AuthorizationCodeModel({ code: client_code, redirectURI: faker.Internet.domainName(), username: faker.random.first_name().toLowerCase(), password: faker.Lorem.words(1)[0] });
    authorizationCode.save(function(err, authorizationCode) {
      if(err) return log.error(err);
      else log.info("New code - %s:%s:%s:%s",authorizationCode.code,authorizationCode.redirectURI,authorizationCode.username,authorizationCode.password);
    });
  }

});

UserModel.remove({}, function(err) {
  var user = new UserModel({ username: "andrey", password: "mooseman" });
  user.save(function(err, user) {
    if(err) return log.error(err);
    else log.info("New user - %s:%s",user.username,user.password);
  });

  for(i=0; i<4; i++) {
    var user = new UserModel({ username: faker.random.first_name().toLowerCase(), password: faker.Lorem.words(1)[0] });
    user.save(function(err, user) {
      if(err) return log.error(err);
      else log.info("New user - %s:%s",user.username,user.password);
    });
  }
});

ClientModel.remove({}, function(err) {
  var client = new ClientModel({ name: "OurService iOS client v1", clientId: "mobileV1", clientSecret:"abc123456" });
  client.save(function(err, client) {
    if(err) return log.error(err);
    else log.info("New client - %s:%s",client.clientId,client.clientSecret);
  });
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

