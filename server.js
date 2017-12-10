var http = require("http");
var ecstatic = require("ecstatic");

var server = http.createServer(ecstatic({ root: `${__dirname}/public` }));

server.listen(5000);
console.log("yeah sever is up");
