"use strict"

let http = require('http')
let util = require('util')
let cfenv = require('cfenv')
let pg = require('pg')
let graphite = require('graphite')
let influx = require('influx')

let appEnv = cfenv.getAppEnv()

function connectToPG(conString){
	let client = new pg.Client(conString)
	client.connect(function(err) {
	  if(err) {
	    return console.error('could not connect to postgres', err)
	  }
	  client.query('SELECT NOW() AS "theTime"', function(err, result) {
	    if(err) {
	      return console.error('error running query', err)
	    }
	    console.log(`==> The time: ${result.rows[0].theTime}`)
	    //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
	    client.end()
	  })
	})
}

function connectoToInfluxDB(influxDBServiceCredentials) {
	let host = influxDBServiceCredentials.hostname
	let graphitePort = influxDBServiceCredentials.ports["2003/tcp"]
  console.log(`Connecting to the graphite port at 'plaintext://${host}:${graphitePort}''`)

	let client = graphite.createClient(`plaintext://${host}:${graphitePort}`)
	let metricsExample = { }
	metricsExample["foo.bar"] = 42

	console.log(`writing example data: ${util.inspect(metricsExample)}`)
	client.write(metricsExample, function(err){
		console.log(`Some horrible error occurred while writing to graphite: ${util.inspect(err)}`)
	})
}

function writeInfluxDBContentToStdout(influxDBServiceCredentials) {
	let host = influxDBServiceCredentials.hostname
	let port = influxDBServiceCredentials.ports["8086/tcp"]
	let password = influxDBServiceCredentials.password
	let username = influxDBServiceCredentials.username
	let database = influxDBServiceCredentials.dbname
	console.log(`Creating influxdb client with params host: ${host}, port: ${port}, password: ${password}, username: ${username}, database: ${database}`)
	let client = influx({
		host,
		port,
		username,
		password,
		database
	})
  let measurements = client.getMeasurements()
	console.log(`measurements from influxdb: ${measurements}`)

	let values = client.getSeries("foo.bar", function(err, arraySeriesNames){
		if (err) {
			console.console.log(`Error during gettings series: ${util.inspect(err)}`)
		} else {
			console.log(`Results of series query: ${util.inspect(arraySeriesNames, {depth: null})}`)
		}
	})


	let point = { value : 23 }
	client.writePoint("foo.bar", point, null, function(err, response){
		if (err){
				console.log(`Error during writing series: ${util.inspect(err)}`)
		}
		if (response){
			console.log(`Response during writing series: ${util.inspect(response, {depth: null})}`)
		}
	})

	values = client.getSeries("foo.bar", function(err, arraySeriesNames){
		if (err) {
			console.console.log(`Error during gettings series: ${util.inspect(err)}`)
		} else {
			console.log(`Results of series query: ${util.inspect(arraySeriesNames, {depth: null})}`)
		}
	})
}

let server = http.createServer(function(request, resource) {
  resource.writeHead(200)
  resource.write("Helloooooooo World now new\n")
  resource.write(`Contents of the 'service' environment: ${util.inspect(appEnv.getServices(), {depth: null})}`)
	resource.end()

  let postgresCredentials = appEnv.getServiceCreds("pg-svc")
  if (postgresCredentials) {
		let postgresConnectionString = postgresCredentials.uri
    console.log("Connecting to postgres database...")
  	connectToPG(postgresConnectionString)
  } else {
    console.log("No postgres service configured with the name 'pg-svc'")
  }

	let influxDBServiceCredentials = appEnv.getServiceCreds('marco-influxdb-with-graphite')
	if (influxDBServiceCredentials) {
		console.log("Connecting to influxdb database...")
		connectoToInfluxDB(influxDBServiceCredentials)
    writeInfluxDBContentToStdout(influxDBServiceCredentials)
  }	else {
		console.log("No influxb service configured with the name 'marco-influxdb'")
	}
})

let port = appEnv.isLocal? 8080 : appEnv.port

server.listen(port)
