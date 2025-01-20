#include <Arduino.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebSrv.h>
#include <WiFi.h>
#include "ArduinoJson-v6.21.5.h"

#include "WifiSetup.h"
#include "index.h"

#define LED 2
#define ActiveSerial Serial2

// Add logging macros
#define LOG_PREFIX "[ESP32] "
#define LOG(msg)            \
  Serial.print(LOG_PREFIX); \
  Serial.println(msg)
#define LOG_F(msg, ...)                           \
  {                                               \
    char buf[128];                                \
    snprintf(buf, sizeof(buf), msg, __VA_ARGS__); \
    LOG(buf);                                     \
  }

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

void onWsEvent(AsyncWebSocket* server, AsyncWebSocketClient* client,
  AwsEventType type, void* arg, uint8_t* data, size_t len)
{
  if (type == WS_EVT_CONNECT)
  {
    LOG_F("WebSocket client #%u connected from %s", client->id(), client->remoteIP().toString().c_str());
  }
  else if (type == WS_EVT_DISCONNECT)
  {
    LOG_F("WebSocket client #%u disconnected", client->id());
  }
  else if (type == WS_EVT_DATA)
  {
    data[len] = 0; // Null-terminate data (make sure len < buffer size)
    String dataStr = (const char*)data;
    LOG_F("WebSocket received %d bytes from client #%u", len, client->id());
    // Log the raw data received
    LOG_F("Raw data received: %s", data);

    // Create JSON document
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, dataStr);

    if (error) {
      LOG_F("deserializeJson() failed: %s", error.c_str());
      return;
    }

    // Get the commands array
    JsonArray commands = doc["commands"];
    if (!commands.isNull()) {
      // Convert JsonArray to uint8_t array and write all at once
      uint8_t* cmdArray = new uint8_t[commands.size()];
      for (size_t i = 0; i < commands.size(); i++) {
        cmdArray[i] = commands[i].as<uint8_t>();
      }

      ActiveSerial.write(cmdArray, commands.size());
      LOG_F("Writing %d commands", commands.size());
      // Flicker the LED
      // I took this out because I was adding 300m dela to every command - which is not what you need for realtime
      // digitalWrite(LED, HIGH);
      // delay(100);
      // digitalWrite(LED, LOW);
      // delay(100);
      // digitalWrite(LED, HIGH);
      // Delete the command array
      delete[] cmdArray;
    }
  }
}

void setup()
{
  Serial.begin(115200); // Initialize debug serial
  LOG("Starting ESP32 application...");

  EEPROM.begin(700);

  // Initialize configuration if needed
  if (!cfg.load())
  {
    LOG("Initializing configuration with default values");
    cfg.save();
  }

  pinMode(LED, OUTPUT);
  WiFi_Setup();
  ActiveSerial.begin(115200);
  LOG("Serial communication initialized");

  // Setup WebSocket
  ws.onEvent(onWsEvent);
  server.addHandler(&ws);
  LOG("WebSocket handler initialized");
  // Get the roomba Ready
  // Pulse Low to the BRC pin to wake it up (if sleeping). BRC is pin 23
  // digitalWrite(23, LOW);
  // LOG("Pulsing BRC pin to wake up roomba");
  // delay(100);
  // digitalWrite(23, HIGH);
  // delay(100);
  // Reset the roomba
  // LOG("Resetting roomba [7]");
  // ActiveSerial.write(7);
  delay(500);
  // run the start command
  LOG("Running start command [128]");
  ActiveSerial.write(128);
  delay(500);
  // Enter into Full mode
  LOG("Entering into Full mode [132]");
  ActiveSerial.write(132);
  delay(500);
  // Store Songs in the roomba
  LOG("Storing songs in the roomba");
  // Store the HONK HONK Sound
  ActiveSerial.write(140); // Store Song
  ActiveSerial.write(1); // Song 1
  ActiveSerial.write(2); // number of notes
  ActiveSerial.write(60);
  ActiveSerial.write(16);
  ActiveSerial.write(60);
  ActiveSerial.write(16);
  // Store the Police car in Song 2
  ActiveSerial.write(140);
  ActiveSerial.write(2);
  ActiveSerial.write(6);
  ActiveSerial.write(60);
  ActiveSerial.write(100);
  ActiveSerial.write(80);
  ActiveSerial.write(100);
  ActiveSerial.write(60);
  ActiveSerial.write(100);
  ActiveSerial.write(80);
  ActiveSerial.write(100);
  ActiveSerial.write(60);
  ActiveSerial.write(100);
  delay(500);

  // Play the song
  LOG("Playing the song");
  ActiveSerial.write(141);
  ActiveSerial.write(1);
  delay(500);



  // Serve the main page
  server.on("/", HTTP_GET, [](AsyncWebServerRequest* request) {
    AsyncWebServerResponse* response = request->beginResponse_P(
      200, "text/html", toESP32_index_html_gz, sizeof(toESP32_index_html_gz));
    response->addHeader("Access-Control-Allow-Origin", "*");
    response->addHeader("Content-Encoding", "gzip");
    request->send(response);
    });

  // Receive an HTTP GET request
  server.on("/off", HTTP_GET, [](AsyncWebServerRequest* request)
    {
      digitalWrite(LED, LOW);
      request->send(200, "text/plain", "ok"); });
  // Add WiFi setup endpoint
  server.on("/wifisetup", HTTP_POST, [](AsyncWebServerRequest* request) {}, NULL, wifiSetupCallback);

  server.on("/wificonfig", HTTP_GET, wifiGetConfigCallback);

  // Start server
  server.begin();
  LOG_F("Web server started. IP address: %s", WiFi.localIP().toString().c_str());
  digitalWrite(LED, HIGH);
}

void loop()
{
  // Handle WebSocket events
  ws.cleanupClients();

  // Handle serial data
  if (ActiveSerial.available())
  {
    String data = ActiveSerial.readStringUntil('\n');
    LOG_F("Received data from serial: %s", data.c_str());
    ws.binaryAll(data);
    // ws.textAll(data);
  }
}
