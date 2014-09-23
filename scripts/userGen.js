var AccessTokenModel		= require("./node_modules/reso-api-oauth2-server/libs/mongoose").AccessTokenModel;
var AuthorizationCodeModel	= require("./node_modules/reso-api-oauth2-server/libs/mongoose").AuthorizationCodeModel;
var ClientModel			= require("./node_modules/reso-api-oauth2-server/libs/mongoose").ClientModel;
var faker			= require("Faker");
var log				= require("./node_modules/reso-api-oauth2-server/libs/log")(module);
var mongoose			= require("./node_modules/reso-api-oauth2-server/libs/mongoose").mongoose;
var randomstring		= require('just.randomstring');
var RefreshTokenModel		= require("./node_modules/reso-api-oauth2-server/libs/mongoose").RefreshTokenModel;
var UserModel			= require("./node_modules/reso-api-oauth2-server/libs/mongoose").UserModel;

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

setTimeout(function() {
  mongoose.disconnect();
}, 3000);

