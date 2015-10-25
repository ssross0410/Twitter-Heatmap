function initialize() {
  //Setup Google Map
  var NYC = new google.maps.LatLng(40.77, -73.98);

  var light_grey_style = [{"featureType":"landscape","stylers":[{"saturation":-100},{"lightness":65},{"visibility":"on"}]},{"featureType":"poi","stylers":[{"saturation":-100},{"lightness":51},{"visibility":"simplified"}]},{"featureType":"road.highway","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"road.arterial","stylers":[{"saturation":-100},{"lightness":30},{"visibility":"on"}]},{"featureType":"road.local","stylers":[{"saturation":-100},{"lightness":40},{"visibility":"on"}]},{"featureType":"transit","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"administrative.province","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"labels","stylers":[{"visibility":"on"},{"lightness":-25},{"saturation":-100}]},{"featureType":"water","elementType":"geometry","stylers":[{"hue":"#ffff00"},{"lightness":-25},{"saturation":-97}]}];
 
  var map = new google.maps.Map(document.getElementById("heatmap"), {
    center: NYC,
    zoom: 2,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.DROP_DOWN,
      position: google.maps.ControlPosition.RIGHT_BOTTOM
    },
    styles: light_grey_style
  });
  
  var heatmapData = new google.maps.MVCArray();

 
  function resetHeatmap() {
    var heatmap = new google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      radius: 25
    });
    return heatmap;
  }

  // var heatmap = new google.maps.visualization.HeatmapLayer({
  //     data: heatmapData,
  //     radius: 25
  //   });
  var heatmap = resetHeatmap();
  heatmap.setMap(map);

  // var homeFlag = 0;
  // $("#home").click(function(){
  //     homeFlag = 1;
  // });

  if(io !== undefined) {
    // Storage for WebSocket connections
    var socket = io.connect("http://localhost:3000");

    // This listens on the "twitter-steam" channel and data is 
    // received everytime a new tweet is receieved.
    socket.on('twitter-stream', function (data) {
      // JSON.parse(data.response)

      //Add tweet to the heat map array.
      var tweetLocation = new google.maps.LatLng(data.longitude,data.latitude);
      var content = data.contents;

      console.log(data.longitude);
      console.log(data.latitude);
      console.log(content);
      

      // if(homeFlag === 1) {
      //   heatmap = resetHeatmap();
      //   homeFlag = 2;
      // }  

      // if(homeFlag === 2) {
      //     if(content.toLowerCase().indexOf("home") !== -1) {
      //       console.log("home Flag is 2 and contains home");
      //       heatmapData.push(tweetLocation);
      //     }  
      //     else {
      //       console.log("home Flag is 2 not contains home");
      //     }  
      // }
      // else {
      //    heatmapData.push(tweetLocation);
      //    console.log("home Flag is not 2!!");
      // }
      
      heatmapData.push(tweetLocation);

      //Flash a dot onto the map quickly
      var image = "css/small-dot-icon.png";
      var marker = new google.maps.Marker({
        position: tweetLocation,
        map: map,
        icon: image
      });
      setTimeout(function(){
        marker.setMap(null);
      },1000);

    });

    socket.on("connected", function(r) {

      //Now that we are connected to the server let's tell 
      //the server we are ready to start receiving tweets.
      socket.emit("start tweets");
    });
  }
}