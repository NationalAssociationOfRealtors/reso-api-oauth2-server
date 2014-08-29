var nconf = require('nconf');

nconf.argv()
    .env()
    .file({ file: "./oauth2.json" });

//
// Exports
//
module.exports = nconf;

