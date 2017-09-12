// NodeJS script for starting server and listening to calls to run model
var app = require('express')();
var server = require('http').Server(app);
var path = require('path');
var csv = require('csvtojson');
var bodyParser = require('body-parser');

//support parsing of application/json type post data
app.use(bodyParser.json({limit: '5Mb'}));

// Routing
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, '/', 'index.html'));
});

app.post('/getCsvData', function(req, res) {
	console.log("getCsvData!");
	/** csv file
	a,b,c
	1,2,3
	4,5,6
	*/
	const dataFn = req.body.dataFn;
	var result = [];
	const csvFilePath = `./data/${dataFn}`;
	csv()
	.fromFile(csvFilePath)
	.on('json',(jsonObj)=>{
		// combine csv header row and csv line to a json object
		// jsonObj.a ==> 1 or 4
		// res.set('Content-Type','application/json');
		// res.send(jsonObj);
		result.push(jsonObj);
	})
	.on('done',(error)=>{
		console.log('end')
		res.send(result);
	})
});

// if hash, send to requested resource
app.get(/^(.+)$/, function(req, res) {
	res.sendFile(path.join(__dirname, '/', req.params[0]));
});	

// Start the HTTP Server
server.listen(process.env.PORT || 3000, function() {
	console.log('Server set up!');
	console.log(server.address());
});