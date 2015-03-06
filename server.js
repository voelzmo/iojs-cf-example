"use strict"

let http = require('http')
let cfenv = require('cfenv')


let appEnv = cfenv.getAppEnv()

let server = http.createServer(function(request, resource) {
  resource.writeHead(200)
  resource.end("Helloooooooo")
})

let port = appEnv.isLocal? 8080 : appEnv.port

server.listen(port)
