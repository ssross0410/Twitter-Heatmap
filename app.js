//Setup web server and socket
var express = require('express'),
    Twitter = require('twitter'),
    AWS = require('aws-sdk'),
    config = require('./config/config.js'),
    http = require('http'),
    path = require('path');
    

var app = express();  

// set .html files as the extension of view engine
app.set('view engine', 'html');

// the public folder is the where the static files locate at
app.use(express.static(path.join(__dirname, 'public')));

// set the port number and host URL here
app.set('port', process.env.PORT || 80);
app.set('host', config.host);


var client = new Twitter({
  consumer_key: config.consumer_key,
  consumer_secret: config.consumer_secret,
  access_token_key: config.access_token_key,
  access_token_secret: config.access_token_secret
})

// start the server and socket io connection
var server = http.createServer(app);
var io = require('socket.io').listen(server);

server.listen(app.get('port'), function(){
  console.log('Tweets Heatmap Running on port: ' + app.get('port'));
})

AWS.config.update({
  region: "us-west-2",
});

var dynamodbDoc = new AWS.DynamoDB.DocumentClient();

var table = "TweetsInfo";

//Create web sockets connection.
io.sockets.on('connection', function (socket) {

  socket.on("start tweets", function() {
    //if(stream === null) {
      //Connect to twitter stream passing in filter for entire world.
      var stream = client.stream('statuses/filter', {'locations':'-180, -90, 180, 90'}, function(stream) {
          stream.on('data', function(tweet) {
            // Does the JSON result have coordinates
            if (tweet.coordinates){
              if (tweet.coordinates !== null){
                var id = tweet.id;
                var create_time = tweet.created_at;
                var content = tweet.text;

                var params = {
                    TableName: table,
                    Item:{
                        "ID": id,
                        "create_time": create_time,
                        "content": content
                    }
                };

                dynamodbDoc.put(params, function(err, data) {
                  if (err) {
                      console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                  } else {
                      // console.log("Added item:", JSON.stringify(data, null, 2));
                  }
                });

                //If so then build up some nice json and send out to web sockets
                var info = {
                              "latitude": tweet.coordinates.coordinates[0],
                              "longitude": tweet.coordinates.coordinates[1],
                              "create_time": create_time,
                              "contents": content
                            };

                socket.broadcast.emit("twitter-stream", info);

                //Send out to web sockets channel.
                socket.emit('twitter-stream', info);
              }
             
            }
            stream.on('limit', function(limitMessage) {
              return console.log(limitMessage);
            });

            stream.on('warning', function(warning) {
              return console.log(warning);
            });

            stream.on('disconnect', function(disconnectMessage) {
              return console.log(disconnectMessage);
            });
        });
      });
  });

    socket.emit("connected");
});

