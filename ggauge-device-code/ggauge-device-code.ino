#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_ADS1X15.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>
#include <math.h>

#define SCREEN_WIDTH   128
#define SCREEN_HEIGHT   64
#define OLED_SDA         8
#define OLED_SCL         9
#define NIR_LED_PIN      4

#define NUM_READINGS     5
#define STABILITY_THRESH 10.0   // mg/dL
#define SEND_INTERVAL  10000    // 10 seconds

// Wi-Fi & Backend
const char* ssid       = "YOUR_WIFI_SSID";
const char* password   = "YOUR_WIFI_PASSWORD";
const char* apiBaseUrl = "https://undergraduate-project-ry8h.onrender.com";
const char* userEmail  = "your_user_email@example.com";
const char* userPass   = "your_user_password";
String jwtToken;

// I²C, Display, ADC, HTTP
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
Adafruit_ADS1115   ads;
WiFiClientSecure   wifiClient;
HTTPClient         http;

// Calibration curve
double analogToGlucose(double x) {
  return 3e-5 * x * x + 0.2903 * x - 4.798;
}

// --- forward declarations ---
bool sendGlucoseReading(double value);
void connectWiFi();
bool login();
int16_t readDiff();
double measureGlucose();

// --- implementation ---

void connectWiFi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(250);
}

bool login() {
  http.begin(wifiClient, String(apiBaseUrl) + "/auth/login");
  http.addHeader("Content-Type", "application/json");
  StaticJsonDocument<200> req;
  req["email"] = userEmail;
  req["password"] = userPass;
  String b; serializeJson(req, b);
  int code = http.POST(b);
  if (code == 200 || code == 201) {
    StaticJsonDocument<512> res;
    deserializeJson(res, http.getString());
    jwtToken = res["access_token"].as<String>();
    http.end();
    return true;
  }
  http.end();
  return false;
}

bool sendGlucoseReading(double value) {
  http.begin(wifiClient, String(apiBaseUrl) + "/glucose");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + jwtToken);
  StaticJsonDocument<128> doc;
  doc["value"] = value;
  String body; serializeJson(doc, body);
  int code = http.POST(body);
  http.end();
  if (code == 401 && login()) {
    return sendGlucoseReading(value);
  }
  return (code == 200 || code == 201);
}

int16_t readDiff() {
  digitalWrite(NIR_LED_PIN, HIGH);
  delay(50);
  int16_t on  = ads.readADC_SingleEnded(0);
  digitalWrite(NIR_LED_PIN, LOW);
  delay(50);
  int16_t off = ads.readADC_SingleEnded(0);
  int16_t d = on - off;
  return (d > 0 ? d : 0);
}

double measureGlucose() {
  double readings[NUM_READINGS];
  int count = 0, idx = 0;
  char spinner[] = "|/-\\";
  int spin = 0;
  while (true) {
    int16_t raw = readDiff();
    readings[idx] = analogToGlucose(raw);
    if (count < NUM_READINGS) count++;
    idx = (idx + 1) % NUM_READINGS;

    display.clearDisplay();
    display.setTextSize(1);
    display.setCursor(0,0);
    display.print("Measuring ");
    display.print(spinner[spin]);
    display.display();
    spin = (spin + 1) & 3;

    if (count == NUM_READINGS) {
      double mn = readings[0], mx = readings[0];
      for (int i = 1; i < NUM_READINGS; i++) {
        mn = min(mn, readings[i]);
        mx = max(mx, readings[i]);
      }
      if (mx - mn <= STABILITY_THRESH) break;
    }
    delay(300);
  }
  double sum = 0;
  for (int i = 0; i < NUM_READINGS; i++) sum += readings[i];
  return sum / NUM_READINGS;
}

void setup(){
  Serial.begin(115200);
  Wire.begin(OLED_SDA, OLED_SCL);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.setTextColor(SSD1306_WHITE);
  ads.begin();
  pinMode(NIR_LED_PIN, OUTPUT);

  connectWiFi();
  login();
}

void loop() {
  double glucose = measureGlucose();

  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0,0);
  display.print("Current Glu:");
  display.setTextSize(2);
  display.setCursor(0,16);
  display.print(glucose,1);
  display.print(" mg/dL");
  bool ok = sendGlucoseReading(glucose);
  display.setTextSize(1);
  display.setCursor(0,56);
  display.print(ok ? "Sent ✔" : "Send ✗");
  display.display();

  Serial.printf("Glucose=%.1f mg/dL  Sent=%s\n",
                glucose, ok ? "OK" : "FAIL");
  delay(10000);  // 10 seconds
}
