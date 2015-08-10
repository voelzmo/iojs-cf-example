"use strict"

let http = require('http')
let cfenv = require('cfenv')
let util = require('util')


let appEnv = cfenv.getAppEnv()

let server = http.createServer(function(request, resource) {
  resource.writeHead(200)
  resource.write("Helloooooooo\n")
  resource.write(`Contents of the 'service' environment: ${util.inspect(appEnv.getServices())}`)
})

let port = appEnv.isLocal? 8080 : appEnv.port

server.listen(port)
