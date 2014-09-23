var mongoose    = require("mongoose");
var log         = require("./log")(module);
var config      = require("./config");
var crypto      = require("crypto");

mongoose.connect(config.get("mongoose:uri"));
var db = mongoose.connection;

db.on("error", function (err) {
  log.error("connection error:", err.message);
});
db.once("open", function callback () {
  log.info("Connected to DB!");
});

//
// Schema
//
var Schema = mongoose.Schema;

//
// Authorization Code 
//
var AuthorizationCode = new Schema({
  code: {
    type: String,
    unique: true,
    required: true
  },
  redirectURI: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: false 
  },
  hashedPassword: {
    type: String,
    required: false 
  },
  salt: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  }
});

AuthorizationCode.methods.encryptPassword = function(password) {
  return crypto.createHmac("sha1", this.salt).update(password).digest("hex");
  //more secure - return crypto.pbkdf2Sync(password, this.salt, 10000, 512);
};

AuthorizationCode.virtual("userId")
  .get(function () { return this.id; });

AuthorizationCode.virtual("password")
  .set(function(password) {
    this._plainPassword = password;
    this.salt = crypto.randomBytes(32).toString("base64");
    //more secure - this.salt = crypto.randomBytes(128).toString("base64");
     this.hashedPassword = this.encryptPassword(password);
  })
  .get(function() { return this._plainPassword; });

AuthorizationCode.methods.checkPassword = function(password) {
  return this.encryptPassword(password) === this.hashedPassword;
};

var AuthorizationCodeModel = mongoose.model("AuthorizationCode", AuthorizationCode);

//
// User
//
var User = new Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
//  hashedPassword: {
//    type: String,
//    required: true
//  },
//  salt: {
//    type: String,
//    required: true
//  },
  created: {
    type: Date,
    default: Date.now
  }
});

User.virtual("userId")
  .get(function () { return this.id; });

/*
User.methods.encryptPassword = function(password) {
  return crypto.createHmac("sha1", this.salt).update(password).digest("hex");
  //more secure - return crypto.pbkdf2Sync(password, this.salt, 10000, 512);
};

User.virtual("password")
  .set(function(password) {
    this._plainPassword = password;
    this.salt = crypto.randomBytes(32).toString("base64");
    //more secure - this.salt = crypto.randomBytes(128).toString("base64");
     this.hashedPassword = this.encryptPassword(password);
  })
  .get(function() { return this._plainPassword; });

User.methods.checkPassword = function(password) {
  return this.encryptPassword(password) === this.hashedPassword;
};
*/

var UserModel = mongoose.model("User", User);

//
// Client
//
var Client = new Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  clientId: {
    type: String,
    unique: true,
    required: true
  },
  clientSecret: {
    type: String,
    required: true
  },
  redirectURI: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  }
});

var ClientModel = mongoose.model("Client", Client);

//
// AccessToken
//
var AccessToken = new Schema({
  userId: {
    type: String,
    required: true
  },
  clientId: {
    type: String,
    required: true
  },
  token: {
    type: String,
    unique: true,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  }
});

var AccessTokenModel = mongoose.model("AccessToken", AccessToken);

//
// RefreshToken
//
var RefreshToken = new Schema({
  userId: {
    type: String,
    required: true
  },
  clientId: {
    type: String,
    required: true
  },
  token: {
    type: String,
    unique: true,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  }
});

var RefreshTokenModel = mongoose.model("RefreshToken", RefreshToken);

//
// Exports
//
module.exports.mongoose = mongoose;
module.exports.AuthorizationCodeModel = AuthorizationCodeModel;
module.exports.UserModel = UserModel;
module.exports.ClientModel = ClientModel;
module.exports.AccessTokenModel = AccessTokenModel;
module.exports.RefreshTokenModel = RefreshTokenModel;

