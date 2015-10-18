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

//Setup rotuing for app
app.use(express.static(path.join(__dirname, 'public')));

// set the port number and host URL here
app.set('port', process.env.PORT || 3000);
app.set('host', config.host);


var client = new Twitter({
  consumer_key: 'LiQmxukiPFoJd3DYjcPECP6q4',
  consumer_secret: '7oPs6nNlQs9BeCb4hNg7lm9MsA5gH41VjICkEqzq1UV37W83Di',
  access_token_key: '868960808-qD1rr0UYV12JoolV0qXo242V2j1J7UlNUCZimzDc',
  access_token_secret: '3cm8cPiJac0GroBAV38lRM0F8tylAh6Ny9BTYbfqOH42s'
})


var server = http.createServer(app);
var io = require('socket.io').listen(server);

server.listen(app.get('port'), function(){
  console.log('Tweets Heatmap Running on port: ' + app.get('port'));
})

AWS.config.update({
  region: "us-west-2",
  // endpoint: "http://localhost:8000",
  AWSAccessKeyId: "AKIAIRC5GWZVMBEDAMAA",
  AWSSecretKey: "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"
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

                console.log(id);
                console.log(create_time);
                console.log(content);

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
                      console.log("Added item:", JSON.stringify(data, null, 2));
                  }
                });

                //If so then build up some nice json and send out to web sockets
                var point = {
                              "latitude": tweet.coordinates.coordinates[0],
                              "longitude": tweet.coordinates.coordinates[1]
                            };

                socket.broadcast.emit("twitter-stream", point);

                //Send out to web sockets channel.
                socket.emit('twitter-stream', point);
              }
              // else if(tweet.place){
              //   if(tweet.place.bounding_box.type === 'Polygon'){
              //     // Calculate the center of the bounding box for the tweet
              //     var coord, _i, _len;
              //     var centerLat = 0;
              //     var centerLng = 0;

              //     for (_i = 0, _len = coords.length; _i < _len; _i++) {
              //       coord = coords[_i];
              //       centerLat += coord[0];
              //       centerLng += coord[1];
              //     }
              //     centerLat = centerLat / coords.length;
              //     centerLng = centerLng / coords.length;

              //     // Build json object and broadcast it
              //     var point = {"latitude": centerLat,"longitude": centerLng};
                  
              //     socket.broadcast.emit("twitter-stream", point);

              //     //Send out to web sockets channel.
              //     socket.emit('twitter-stream', point);

              //   }
              // }
            }
            // stream.on('limit', function(limitMessage) {
            //   return console.log(limitMessage);
            // });

            // stream.on('warning', function(warning) {
            //   return console.log(warning);
            // });

            // stream.on('disconnect', function(disconnectMessage) {
            //   return console.log(disconnectMessage);
            // });
        });
      });
  });

    // Emits signal to the client telling them that the
    // they are connected and can start receiving Tweets
    socket.emit("connected");
});

