/**
 * interactive-comm-book
 * https://github.com/odentools/interactive-comm-book
 * (C) 2016 - OdenTools; Released under MIT License.
 */

'use strict';

var express = require('express'),
	bodyParser = require('body-parser'),
	WebSocketServer = require('ws').Server;

var app = express();

// 静的ディレクトリの設定
app.use(express.static('bower_components'));
app.use(express.static('public'));

// ルート
app.get('/', function (req, res) {
	res.send('Hello');
});

// WebSocket API
var server = require('http').createServer(app);
var wss = new WebSocketServer({server: server});
var wsAPI = require(__dirname + '/scripts/websocket-api');
wss.on('connection', wsAPI.onWsConnection);
wsAPI.startIntervalForPingToAllClients();

// サーバを開始
var s = server.listen(process.env.PORT || 3000, function () {
	var host = s.address().address;
	var port = s.address().port;
	console.log('The app listening on port %s:%s', host, port);
});
