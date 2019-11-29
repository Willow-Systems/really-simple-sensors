#include <ESP8266WiFi.h>
#include <WiFiClient.h>
//#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>

const char* ssid = "YOUR_WIFI_SSID_HERE";
const char* password = "YOUR_WIFI_PASSWORD_HERE";
const char* host = "central_server_IP_or_DNS_name_here";
const char* door = "sensor_ID_must_be_defined_in_server_software_too";
//Example:
//const char* ssid = "BT-Home-Hub-123";
//const char* password = "df98F8df20VW8";
//const char* host = "192.168.1.14";
//const char* door = "front_door";

//This is the NodeMCU GPIO pin ID. If you don't use pin 12, update the line below this comment:
int pin = 12;

//Don't change anything below this line ----------------------------------------

volatile int state = false;
volatile int flag = false;
const char* door_state = "closed";

//ESP8266WebServer Server(80);

//unsigned long previousMillis = 0; 
//const long interval = 2000;

String digitalStateToString(int digiState) {
  if (digiState == 0) {
    return String("open");
  } else {
    return String("closed");
  }
}

void ICACHE_RAM_ATTR changeDoorStatus() {
  //push

    //unsigned long currentMillis = millis();
 
    //if(currentMillis - previousMillis >= interval) {
    //    previousMillis = currentMillis;   
    
        flag = true;
        Serial.println("State has changed");     
    //}
    
}

void handleStatus() {
  //Handle pull
  
//  int liveState = digitalRead(pin);
  int liveState = 1;
  
  Serial.println("Door is " + String(digitalStateToString(liveState)));
  
  String msg = '{"id":"' + door  + '","state":"' + digitalStateToString(liveState) + '"}';
  Serial.println("State Request. Returning: " + msg);
  //Server.send(200, "text/html", msg);
  
}

void setup() {
    Serial.begin(115200);
    delay(100);
    Serial.println("Init System...");

    //Setup digital pin
    pinMode(pin, OUTPUT);
    attachInterrupt(digitalPinToInterrupt(pin), changeDoorStatus, CHANGE);

    //Connect to WiFi
    Serial.println();
    Serial.println();
    Serial.print("Connecting to ");
    Serial.println(ssid);
    
    WiFi.begin(ssid, password);
    
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
    }
  
    Serial.println("");
    Serial.println("WiFi connected");  
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());  

    //Setup pull //Server
//    //Server.on("/", handleStatus);
//    //Server.begin();
//    Serial.println("HTTP //Server started");
}

void loop() {

      if(flag){
          Serial.print("sending update to ");
          Serial.println(host);
          
          WiFiClient client;
          const int httpPort = 8080;
          if (!client.connect(host, httpPort)) {
            Serial.println("connection failed");
            return;
          }

          int liveState = digitalRead(pin);
          Serial.println("Door is " + String(digitalStateToString(liveState)));
    
          String url = String("/update/") + door + ":" + digitalStateToString(liveState);
          
          Serial.print("Requesting URL: ");
          Serial.println(host + url);
          client.print(String("GET ") + url + " HTTP/1.1\r\n" +
                       "Host: " + host + "\r\n" + 
                       "Content-Type: application/json\r\n" + 
                       "Content-Length: 13\r\n\r\n" + 
                       "Connection: close\r\n\r\n");
          flag = false;

          // Read all the lines of the reply from server and print them to Serial
//          Serial.println("Respond:");
//          while(client.available()){
//            String line = client.readStringUntil('\r');
//            Serial.print(line);
//         }
//
//         Serial.println();
//         Serial.println("closing connection");
      }  
      //Server.handleClient();
//      delay(3);
}
