#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_ADS1X15.h>
#include <math.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define STABLE_COUNT 5
#define STABLE_THRESH 10.0   // mg/dL
#define SCREEN_WIDTH   128
#define SCREEN_HEIGHT   64
#define OLED_SDA         8
#define OLED_SCL         9
#define NIR_LED_PIN      4
#define NUM_SAMPLES     50
#define SAMPLE_DELAY    50    // ms between samples
#define LOOP_DELAY     2000   // ms between measurements

const char* ssid = "No39-spring";
const char* password = "99999999";
const char* serverUrl = "http://192.168.1.102:3000/glucose";  // Removed trailing spaces
const char* userId = "682310318a5b6242241304fa"; // Replace with actual user ID

WiFiClient client;
HTTPClient http;
bool sent = false;  

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
Adafruit_ADS1115   ads;

double analogToGlucose(double x) {
  return 3e-5 * x * x + 0.2903 * x - 4.798;
}

int16_t measureRaw(){
  static int16_t buf[NUM_SAMPLES];
  digitalWrite(NIR_LED_PIN, HIGH);
  for(int i=0;i<NUM_SAMPLES;i++){
    buf[i]=ads.readADC_SingleEnded(0);
    delay(SAMPLE_DELAY);
  }
  digitalWrite(NIR_LED_PIN, LOW);
  for(int i=0;i<NUM_SAMPLES-1;i++){
    for(int j=i+1;j<NUM_SAMPLES;j++){
      if(buf[j]<buf[i]){
        int16_t t=buf[i]; buf[i]=buf[j]; buf[j]=t;
      }
    }
  }
  int start=NUM_SAMPLES*0.1, end=NUM_SAMPLES*0.9;
  long sum=0;
  for(int i=start;i<end;i++) sum+=buf[i];
  return sum/(end-start);
}

void setup(){
  Serial.begin(115200);
  Wire.begin(OLED_SDA, OLED_SCL);
  display.begin(SSD1306_SWITCHCAPVCC,0x3C);
  display.setTextColor(SSD1306_WHITE);
  ads.begin();
  pinMode(NIR_LED_PIN, OUTPUT);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Connecting to WiFi...");
  display.display();

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    display.print(".");
    display.display();
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    display.println("\nWiFi Connected!");
    display.println(WiFi.localIP());
  } else {
    display.println("\nWiFi Failed!");
    // Optional: Enter deep sleep or halt if WiFi fails
  }
  display.display();
  delay(1000);
}

bool sendGlucoseData(double glucoseValue) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return false;
  }

  http.end(); // Close previous connection
  
  // Begin HTTP connection once
  if (http.begin(client, serverUrl)) {  
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RlckB0ZXN0ZXJtYWlsLmNvbSIsInN1YiI6IjY4MjMxMDMxOGE1YjYyNDIyNDEzMDRmYSIsImlhdCI6MTc0NzU2MjYzNiwiZXhwIjoxNzQ3NTY2MjM2fQ.dMj1P9KiWhF42fpQA2EcwypfpPmKDaqlBn1jngRkxV8"); // Replace with valid token

    StaticJsonDocument<128> jsonDoc;
    jsonDoc["userId"] = userId; // Include userId
    jsonDoc["value"] = glucoseValue;

    String requestBody;
    serializeJson(jsonDoc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    bool success = false;

    if (httpResponseCode > 0) {
      Serial.printf("HTTP Response Code: %d\n", httpResponseCode);
      String response = http.getString();
      Serial.println("Response: " + response);
      success = true;
    } else {
      Serial.printf("HTTP Request failed: %s\n", http.errorToString(httpResponseCode).c_str());
    }

    http.end();
    return success;
  } else {
    Serial.println("HTTP connection failed");
    return false;
  }
}

void loop(){
  float window[STABLE_COUNT];
  int count=0, idx=0;
  while(true){
    display.clearDisplay();
    display.setTextSize(1);
    display.setCursor(0,0);
    display.println("Measuring");
    display.println("Please wait");
    display.display();
    int16_t raw=measureRaw();
    double glu=analogToGlucose(raw);
    window[idx]=glu;
    if(count<STABLE_COUNT) count++;
    idx=(idx+1)%STABLE_COUNT;
    if(count==STABLE_COUNT){
      double mn=window[0], mx=window[0];
      for(int i=1;i<STABLE_COUNT;i++){
        if(window[i]<mn) mn=window[i];
        if(window[i]>mx) mx=window[i];
      }
      if(mx-mn<=STABLE_THRESH) break;
    }
  }
  double sum=0;
  for(int i=0;i<STABLE_COUNT;i++) sum+=window[i];
  double result=sum/STABLE_COUNT;

  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0,0);
  display.print("Current Glu:");
  display.setTextSize(2);
  display.setCursor(0,16);
  display.print(result,1);
  display.print(" mg/dL");
  display.display();
  Serial.print("Glucose = ");
  Serial.print(result,1);
  Serial.println(" mg/dL");

  // Send data once
  if (!sent && WiFi.status() == WL_CONNECTED) {
    bool success = sendGlucoseData(result);
    display.setTextSize(1);
    display.setCursor(0,40);
    if (success) {
      display.println("Sent to server!");
    } else {
      display.println("Failed to send!");
    }
    display.display();
    sent = true;
  }

  delay(LOOP_DELAY);
}