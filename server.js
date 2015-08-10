"use strict"

let http = require('http')
let util = require('util')
let cfenv = require('cfenv')
let pg = require('pg')


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
	    console.log(`==> The time: #{result.rows[0].theTime}`)
	    //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
	    client.end()
	  })
	})
}

let server = http.createServer(function(request, resource) {
  resource.writeHead(200)
  resource.write("Helloooooooo\n")
  resource.write(`Contents of the 'service' environment: ${util.inspect(appEnv.getServices())}`)

  let conString = appEnv.getServiceCreds("pg-svc").uri
  if (conString) {
    console.log("Connecting to postgres database...");
  	connectToPG(conString)
  } else {
    console.log("No postgres service configured with the name 'pg-svc'");
  }

})

let port = appEnv.isLocal? 8080 : appEnv.port

server.listen(port)
