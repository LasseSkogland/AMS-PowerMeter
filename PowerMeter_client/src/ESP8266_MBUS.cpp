#include <ArduinoOTA.h>
#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <WiFiUdp.h>

#define WIFI_SSID ""
#define WIFI_PASSWORD ""
#define OTA_PASSWORD ""

#define BUFFER_SIZE 512
#define LED_PIN 2

const char *ssid = WIFI_SSID;
const char *password = WIFI_PASSWORD;
uint8 *bytes = new uint8[BUFFER_SIZE];
IPAddress host;
uint16 port;

void statusBlink(ulong on, ulong off) {
  digitalWrite(LED_PIN, LOW);
  delay(on);
  digitalWrite(LED_PIN, HIGH);
  delay(off);
}

void setup() {
  pinMode(LED_PIN, OUTPUT);
  port = 5432;

  WiFi.mode(WIFI_STA);
  
  host = IPAddress(192, 168, 0, 6);
  IPAddress local_ip = IPAddress(192, 168, 0, 4);
  IPAddress subnet = IPAddress(255, 255, 255, 0);
  IPAddress gateway = IPAddress(192, 168, 0, 1);

  WiFi.config(local_ip, gateway, subnet);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    statusBlink(125, 125);
  }
  digitalWrite(LED_PIN, LOW);
  ArduinoOTA.setHostname("powermeter-esp8266");
  ArduinoOTA.setPassword(OTA_PASSWORD);
  ArduinoOTA.begin();
  Serial.begin(2400);
  Serial.setTimeout(50);
  digitalWrite(LED_PIN, HIGH);
}

void loop() {
  if (Serial.available() > 0) {
    size_t bRead = Serial.readBytes(bytes, BUFFER_SIZE);
    if (bytes[0] != 0x7E) {
      statusBlink(50, 50);
      statusBlink(50, 50);
      return;
    }
    if ((WiFi.status() == WL_CONNECTED)) {
      WiFiClient client;
      if (bRead > 0) {
        if (!client.connect(host, port)) {
          statusBlink(50, 50);
          statusBlink(50, 50);
          statusBlink(50, 50);
        }
        if (client.connected()) {
          client.write(bytes, bRead);
          client.stop();
          statusBlink(50, 50);
        }
      }
    }
  }
  ArduinoOTA.handle();
  delay(10);
}
