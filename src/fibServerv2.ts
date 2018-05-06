var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = process.env.PORT || 3220;

app.get('/', function(req: any, res: any){
  res.sendFile(__dirname + '/indexTest.html');
});

const connections: any = [];

io.sockets.on('connection',(socket: any) => {

  connections.push(socket);
  console.log(' %s sockets is connected', connections.length);

  socket.on('disconnect', () => {
    connections.splice(connections.indexOf(socket), 1);
  });

  socket.on('sending message', (message: any) => {
    console.log('Message is received :', message);

    io.sockets.emit('Stop Program', {message: message});

  });

});



// io.on('connection', function(socket: any){
//   console.log('a user connected');
// });

http.listen(port, function(){
  console.log('listening on ' + port);
});