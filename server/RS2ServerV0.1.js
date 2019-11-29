const express = require("express");
const http = require('http');
const app = express();
const port = 8080;

//Custom middleware to let us get the whole post body
app.use(function(req, res, next) {
  req.rawBody = '';
  req.setEncoding('utf8');

  req.on('data', function(chunk) {
    req.rawBody += chunk;
  });

  req.on('end', function() {
    next();
  });
});

var preload_IDs = ["wills_office","front_door"];
var sensors = {};

for (var i = 0; i < preload_IDs.length; i++) {
  addSensor(preload_IDs[i])
}

function stateToBool(state) {
  return (state == "open");
}
function stateToInt(state) {
  if (state == "open") {
    return 1
  } else {
    return 0
  }
}
function uuidv4() {
  return 'xxxxxxxx-xxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
function addSensor(id) {
  if (sensors[id] != null) {
    return 1
  } else {
    sensors[id] = {};
    sensors[id].state = "unknown";
    sensors[id].lastHeard = "";
    sensors[id].webhooks = [];
  }
}
function makeGetRequest(sensor, url) {
  var requestID = uuidv4();
  url = url.replace("{{state}}", sensors[sensor].state);
  url = url.replace("{{state_bool}}", stateToBool(sensors[sensor].state));
  url = url.replace("{{state_int}}", stateToInt(sensors[sensor].state));

  host = url.replace("http://","").replace("https://").split("/")[0].split("?")[0]

  console.log("Calling webhook (update from " + sensor + "). Request ID: " + requestID);
  console.log("[" + requestID + "] URL: " + url);

  var options = {
    headers: {
     'Content-Type': 'text/plain',
     'Host': host,
     'Accept': '*/*'
   },
  timeout: 500,
  }

  // console.log("[" + requestID + "] Options: " + JSON.stringify(options));

  http.get(url, function(data) { console.log("[" + requestID + "] webhook response: " + data)});
}

app.get('/update/:state', function(req,res) {
  console.log("Parse " + req.params.state)

  var r = {"id":req.params.state.toString().split(":")[0],"state":req.params.state.toString().split(":")[1]}

  console.log("Received update for door ID '" + r.id + "'. State: '" + r.state + "'");

  if (sensors[r.id] != null) {

    sensors[r.id].state = r.state;
    sensors[r.id].lastHeard = new Date().toISOString();

    //Call out to any webhooks
    var wh = sensors[r.id].webhooks
    for (var i = 0; i < wh.length; i++) {

      if (wh[i].method == "GET") {
        makeGetRequest(r.id, wh[i].url);
      }

    }

    res.status(200);
    res.end("ok");

  } else {

    res.status(400);
    res.end("Invalid Door ID");

  }
});

app.get('/sensor/:id', function(req,res) {

  if (req.params.id == "all") {
    res.status(200);
    res.end(JSON.stringify(sensors))
    return
  } else {
    if (sensors[req.params.id] != null) {
      res.status(200);
      res.end(JSON.stringify(sensors[req.params.id]))
      return
    } else {
      res.status(400);
      res.end('{"error":"Unknown sensor ID:' + req.params.id + '"}')
      return
    }
  }

});
app.get('/sensor/:id/:subtarget', function(req,res) {

  if (req.params.id == null) {

    res.status(400);
    res.end('{"error":"Missing sensor ID"}')
    return

  } else {

    if (sensors[req.params.id] != null) {

      try {

        res.status(200);
        res.end(sensors[req.params.id][req.params.subtarget])
        return

      } catch (e) {

        res.status(400);
        res.end('{"error":"Unknown attribute ' + req.params.subtarget + ' for sensor ' + req.params.id + '"}')
        return

      }


    } else {

      res.status(400);
      res.end('{"error":"Unknown sensor ID:' + req.params.id + '"}')
      return

    }

  }

});

app.post("/webhooks/", function(req,res) {
  console.log("New webhook create request");
  var b = req.rawBody;
  try {
    b = JSON.parse(b);
  } catch (e) {
    res.status(400);
    res.end('{"error":"Failed to parse post body"}')
    return
  }

  if (b.sensor == null) {
    res.status(400);
    res.end('{"error":"Missing parameter: sensor"}')
    return
  }
  if (b.method == null) {
    res.status(400);
    res.end('{"error":"Missing parameter: method"}')
    return
  }
  if (b.url == null) {
    res.status(400);
    res.end('{"error":"Missing parameter: url"}')
    return
  }

  if (sensors[b.sensor] == null) {
    res.status(400);
    res.end('{"error":"Unknown sensor: ' + b.sensor + '"}')
    return
  }

  var wh = {};
  wh.method = b.method;
  wh.url = b.url;
  wh.id = uuidv4();

  sensors[b.sensor].webhooks.push(wh);
  res.status(200);
  res.end("ok");


});

app.listen(port,function(){
  console.log("Listening on port " + port);
})
