var _http = require("http");
var _fs = require("fs");

var _server=_http.createServer((req,res)=>{

    var str = _fs.readFileSync('./example.json', 'utf8')
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(str)
});


_server.listen(8000);