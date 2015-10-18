var AWS = require('aws-sdk');

AWS.config.update({
  region: "us-west-2",
  endpoint: "http://localhost:3000"
});

var db = new AWS.DynamoDB();


a = db.listTables(function(err, data, response) {

if (err) {
console.log("Error listing tables: ", err);
} else {
console.log("Successfully listed tables: ");
console.log(data.TableNames);
}
})

a.on('httpHeaders', function(statusCode, headers, response){
console.log(statusCode);
console.log(headers);

});