const { Console } = require('console');
var https = require('http');

module.exports = function (context) {
    var req = https.request("http://localhost:7071/api/getUsers", {
        method: 'GET',
        headers: {'User-Agent': 'serverless'}
    }, res => {
        var body = "";

        res.on('data', data => {
            body += data;
        });
        res.on("end", () => {
            var jbody = JSON.parse(body);
            console.warn('###########');
            context.bindings.signalRMessages = [{
                "target": "usersList",
                "arguments": [ jbody ]
            }]
            context.done();
        });
    }).on("error", (error) => {
        context.log(error);
        context.res = {
          status: 500,
          body: error
        };
        context.done();
    });
    req.end();
}