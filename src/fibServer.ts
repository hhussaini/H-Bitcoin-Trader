

import WebSocket = require('ws');
const express = require('express');
const http = require('http');

var port = process.env.PORT || 3220;

const app = express();



const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


app.get('/', function(req: any, res: any){
    res.sendFile(__dirname + '/htrader/fibTest.html');
});


wss.on('connection', function connection(ws) {

    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });

    //ws.send('something');
});

server.listen(port, function listening() {
    console.log('Listening on %d', server.address().port);
    
});


