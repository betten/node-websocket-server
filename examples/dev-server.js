var sys = require("sys")
  , fs = require("fs")
  , path = require("path")
  , http = require("http")
  , ws = require('../lib/ws');

/*-----------------------------------------------
  logging:
-----------------------------------------------*/
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

function timestamp() {
  var d = new Date();
  return [
    d.getDate(),
    months[d.getMonth()],
    [ pad(d.getHours())
    , pad(d.getMinutes())
    , pad(d.getSeconds())
    , (d.getTime() + "").substr( - 4, 4)
    ].join(':')
  ].join(' ');
};

function log(msg) {
  sys.puts(timestamp() + ' - ' + msg.toString());
};

function serveFile(req, res){
  if(req.method == "GET"){
    if( req.url.indexOf("favicon") > -1 ){
      log("HTTP: inbound request, served nothing, (favicon)");

      res.writeHead(200, {'Content-Type': 'image/x-icon'});
      res.end("");
    } else {
      log("HTTP: inbound request, served client.html");

      res.writeHead(200, {'Content-Type': 'text/html', 'Connection': 'close'});
      fs.createReadStream( path.normalize(path.join(__dirname, "client.html")), {
        'flags': 'r',
        'encoding': 'binary',
        'mode': 0666,
        'bufferSize': 4 * 1024
      }).addListener("data", function(chunk){
        res.write(chunk, 'binary');
      }).addListener("end",function() {
        res.end();
      });
    }
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end();
  }
};

/*-----------------------------------------------
  Spin up our server:
-----------------------------------------------*/
var httpServer = http.createServer(serveFile);

var server = ws.createServer({
  debug: true,
  useStorage: true
}, httpServer);

server.addListener("listening", function(){
  log("Listening for connections.");
});

// Handle WebSocket Requests
server.addListener("connection", function(conn){
  conn.send("Connection: "+conn.id);
  conn.addListener("message", function(message){
    conn.broadcast("<"+conn.id+"> "+message);
//    conn.storage.incr("messages");
  });
});

server.addListener("close", function(conn){
//  sys.puts(conn.id+" sent "+conn.storage.get("messages"));
  server.broadcast("<"+conn.id+"> disconnected");
});

server.listen(8000);