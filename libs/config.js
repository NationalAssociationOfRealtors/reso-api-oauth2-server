var nconf = require('nconf');

nconf.argv()
    .env()
    .file({ file: __dirname + "/../defaults.json" });

//
// Exports
//
module.exports = nconf;

