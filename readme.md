# Really Simple Sensors

### Simple IOT sensors for home automation



## About

Really Simple Sensors (RS2) is a collection of single purpose IOT sensors for home automation built on the nodeMCU platform.   

Currently the project is in the early alpha stage, and contains security holes (see ToDo) and minimal functionality.

The documentation is also lacking (this is it), so if you want to set it up yourself you'll need to be familiar with flashing nodeMCU board, and running a nodeJS server.



## Project Directory Structure



/server - The central server code   

/sensorFirmware - The code for the sensors   

/3dPrinterFiles - Any 3d printed parts, such as cases



## Supported Sensors

Currently just a door sensor



## Bill of materials



#### Door Sensor:

- NodeMCU microcontroller

- 3D printed case (see /3dPrinterFiles/doorSensorCase)

- Reed switch



## System Setup



Currently, the system relies on a central server written in NodeJS, which all other sensors push to. State queries are then performed against this central server. The final version will use a central server for push actions (such as alarm activation, webhook calling etc) and state queries, but each sensor will also support calling it directly for state queries.



To setup the system, perform the following actions:



- Assemble your sensor and install the server software on a server (something like a raspberry pi would work well).

- Edit the server code to define the sensors you want.

- Edit the sensor firmware to point to the central server.

- Install your sensors



## Server API

The central server is controlled by an API. Below are the various calls you can make to retrieve and set configuration:



### State format

The information for a door sensor is returned in the following format:



{ "sensor_name": {

        "lastHeard": "2019-11-28T18:35:23.943Z",

        "state": "closed",

        "webhooks": []

	}
}



where `lastHeard` is the datestamp of the last update received from the server, `state` is 'open' or 'closed', and `webhooks` is an array of webhooks to call on a state change (see 'webhooks' below for more info on webhooks)



### API endpoints



Below are the currently supported API endpoints on the central server:



**1) Get all the information from every sensor**   

Request Format: GET /sensors/all   

Request Example: `curl -s http://myCentralServer.local/sensors/all`   



Response Format: All the information on every sensor  

Response Example:

`{

    "front_door": {

        "lastHeard": "2019-11-28T18:35:23.943Z",

        "state": "closed",

        "webhooks": []

    },

    "office": {

        "lastHeard": "",

        "state": "unknown",

        "webhooks": []

    }

}`



**2) Get all the information from a specific sensor**   

Request Format: GET /sensors/$sensorName   

Request Example: `curl -s http://myCentralServer.local/sensors/front_door`   



Response Format: All the information on the provided sensor     

Response Example:

`{

    "lastHeard": "2019-11-28T18:35:23.943Z",

    "state": "closed",

    "webhooks": []

 }`



**3) Get the state of a specific sensor**   

Request Format: GET /sensors/$sensorName/state   

Request Example: `curl -s http://myCentralServer.local/sensors/front_door/state`   



Response Format: The state of the provide sensor     

Response Example: `closed`



**4) Get the last heard datestamp from a specific sensor**   

Request Format: GET /sensors/$sensorName/lastHeard   

Request Example: `curl -s http://myCentralServer.local/sensors/front_door/lastHeard`   



Response Format: The state of the provide sensor     

Response Example: `2019-11-28T18:35:23.943Z`



**5) Register a webhook for a sensor**   

Request Format: POST /webhooks   

POST data Format: `{"sensor":"$sensorName","method":"$method","url":"$webhookURL","trigger":"all"}`   

Request Example: `curl -X POST -d '{"sensor":"front_door","method":"GET","url":"https://ifttt.com/my_ifttt_endpoint/"}' http://myCertralServer.local/webhooks/`   



Response Format: 'ok' on success, error message on failure    

Response Example: `ok`



The webhook will then be present in a full info return. E.g. `curl -s http://myCentralServer.local/sensors/front_door` would return: `{

        "lastHeard": "2019-11-28T18:35:23.943Z",

        "state": "closed",

        "webhooks": [

            {

                "id": "2e423bec-c5f8",

                "method": "GET",

                "url": "https://ifttt.com/my_ifttt_endpoint/"

            }

        ]

}`



### Webhooks



You can register webhooks against a door sensor, these will be called every time the sensor sends an update to the central server. See API examples 2 and 5 for examples of how to retrieve and create webhooks against a sensor.


As of the current version of the server, only HTTP GET is supported, and no HTTPS. Webhooks are also not yet persisted upon server restart.   

#### POST Parameters

As per example 5, the following paramters should be passed in the POST request to /webhooks:

- sensor  -  The name of the sensor to which the webhook will be attached
- method  -  The HTTP request method (currently only supports GET)
- url     -  The URL of the webhook endpoint to call (currently must be http only)

Furthermore, there are some optional parameters:

- trigger  -  (all, closed, open) - If set to 'all', the webhook will be called whenever the sensor state changes. Otherwise if set to 'closed' or 'open', the webhook will only be called when the state changes to the value provided. If the parameter is not provided, it will default to 'all'.



#### Attributes

You can include attributes in the webhook url, which are variables which the server resolves before calling the endpoint. Currently the supported attributes are:


- {{state}}  -  The state of the door sensor ('open' or 'closed').

- {{state_bool}}  -  The state of the door sensor as a boolean ( 'true' (open) or 'false' (closed) ).

- {{state_int}}  -  The state of the door sensor as an integer ( '1' (open) or '0' (closed) ).



For example, creating a webhook with the url `192.168.1.10/?dooropen={{state_bool}}` would result in the following URL being called when the door is opened: `192.168.1.10/?dooropen=true`



## To Do

This project is in it's early stage, but the items on the roadmap are:

- [ ] Add server-side logic for an alarm/alert, allowing you to 'arm' sensors

- [ ] Add authentication for sensor/server communication

- [ ] Switch to HTTPS for sensor/server communication

- [ ] Optionally support HTTPS for client/server communcation

- [ ] Add authentication to client/server communication

- [ ] Add support for querying a sensors state direct to the sensor

- [ ] Add support for a server -> sensor health check ping

- [ ] Add support for a sensor -> server startup ping

- [ ] Move to MQTT for server communcation
