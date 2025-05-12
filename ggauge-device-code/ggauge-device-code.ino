#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_ADS1X15.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <math.h>

#define SCREEN_WIDTH  128
#define SCREEN_HEIGHT  64
#define OLED_SDA        8
#define OLED_SCL        9
#define NIR_LED_PIN     4

#define STABLE_COUNT    5
#define THRESHOLD      10.0  // mg/dL

// WiFi credentials
const char* ssid = "No39-spring";
const char* password = "99999999";

// API settings
const char* apiBaseUrl = "http://192.168.1.116:3000"; // Replace with your actual API URL
String jwtToken = "";
String userId = ""; // Will store the user ID after login

// Display and sensor initialization
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
Adafruit_ADS1115 ads;

// Convert analog reading to glucose value (mg/dL)
double analogToGlucose(double x) {
  return 3e-5*x*x + 0.2903*x - 4.798;
}

// Function to connect to WiFi
void connectToWiFi() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("Connecting to WiFi");
  display.display();
  
  WiFi.begin(ssid, password);
  int attempts = 0;
  
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    display.print(".");
    display.display();
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.print("WiFi Connected!");
    display.setCursor(0, 16);
    display.print(WiFi.localIP().toString());
    display.display();
    delay(2000);
  } else {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.print("WiFi Failed!");
    display.display();
    delay(2000);
  }
}

// Function to log in and get JWT token
bool loginUser(const char* email, const char* password) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("Logging in...");
  display.display();
  
  HTTPClient http;
  http.begin(String(apiBaseUrl) + "/auth/login");
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["email"] = email;
  doc["password"] = password;
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpResponseCode = http.POST(requestBody);
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    
    // Parse response to get token
    StaticJsonDocument<512> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);
    
    if (!error) {
      const char* token = responseDoc["access_token"];
      if (token) {
        jwtToken = token;
        
        // Get user ID from decoded JWT (simplified - in production you might need to decode JWT)
        userId = responseDoc["userId"].as<String>();
        if (!userId) {
          // Alternative: make a separate API call to get user profile
          // This is just a placeholder for getting the userId
          userId = "user-id-placeholder";
        }
        
        display.clearDisplay();
        display.setCursor(0, 0);
        display.print("Login successful!");
        display.display();
        delay(1000);
        return true;
      }
    }
  }
  
  display.clearDisplay();
  display.setCursor(0, 0);
  display.print("Login failed: ");
  display.print(httpResponseCode);
  display.display();
  delay(2000);
  
  http.end();
  return false;
}

// Function to send glucose data to the API
bool sendGlucoseData(double glucoseValue) {
  if (WiFi.status() != WL_CONNECTED || userId.length() == 0) {
    return false;
  }
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("Sending data...");
  display.display();
  
  HTTPClient http;
  http.begin(String(apiBaseUrl) + "/api/glucose");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(jwtToken));
  
  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["userId"] = userId;
  doc["value"] = glucoseValue;
  doc["timestamp"] = millis(); // You might want to use actual timestamp if available
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpResponseCode = http.POST(requestBody);
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.print("Data sent!");
    display.display();
    delay(1000);
    http.end();
    return true;
  } else {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.print("Send failed: ");
    display.print(httpResponseCode);
    display.display();
    delay(2000);
    http.end();
    return false;
  }
}

// Function to get glucose predictions
bool getGlucosePrediction() {
  if (WiFi.status() != WL_CONNECTED || userId.length() == 0) {
    return false;
  }
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("Getting prediction...");
  display.display();
  
  HTTPClient http;
  http.begin(String(apiBaseUrl) + "/predictions/" + userId + "?limit=1");
  http.addHeader("Authorization", "Bearer " + String(jwtToken));
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    String response = http.getString();
    
    // Parse the prediction response
    StaticJsonDocument<1024> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);
    
    if (!error && responseDoc.is<JsonArray>() && responseDoc.size() > 0) {
      JsonArray values = responseDoc[0]["values"].as<JsonArray>();
      
      display.clearDisplay();
      display.setTextSize(1);
      display.setCursor(0, 0);
      display.print("Predicted (mg/dL):");
      display.setCursor(0, 16);
      
      // Display predictions (up to 3)
      int count = 0;
      for (JsonVariant value : values) {
        if (count < 3) { // Show first 3 predictions
          display.print("+");
          display.print(count+1);
          display.print("h: ");
          display.print(value.as<float>(), 1);
          display.print(" ");
          count++;
        }
      }
      
      display.display();
      delay(5000);
      http.end();
      return true;
    }
  }
  
  display.clearDisplay();
  display.setCursor(0, 0);
  display.print("Prediction failed: ");
  display.print(httpResponseCode);
  display.display();
  delay(2000);
  
  http.end();
  return false;
}

void setup() {
  Serial.begin(115200);
  
  // Initialize peripherals
  Wire.begin(OLED_SDA, OLED_SCL);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.display();
  
  ads.begin();
  pinMode(NIR_LED_PIN, OUTPUT);
  
  // Connect to WiFi
  connectToWiFi();
  
  // Log in to get token (replace with actual credentials)
  loginUser("huslen.0922@gmail.com", "Khuslen.0922");
}

void loop() {
  const char spinner[] = "|/-\\";
  double window[STABLE_COUNT];
  int count=0, idx=0, spin=0;
  double mn, mx;

  // Take multiple readings until stable
  while (true) {
    digitalWrite(NIR_LED_PIN, HIGH);
    delay(20);
    int16_t raw = ads.readADC_SingleEnded(0);
    digitalWrite(NIR_LED_PIN, LOW);

    double glu = analogToGlucose(raw);

    display.clearDisplay();
    display.setTextSize(1);
    display.setCursor(0,0);
    display.print("Measuring ");
    display.print(spinner[spin]);
    display.display();

    spin = (spin+1)&3;
    if (count<STABLE_COUNT) count++;
    window[idx] = glu;
    idx = (idx+1)%STABLE_COUNT;

    if (count==STABLE_COUNT) {
      mn = mx = window[0];
      for (int i=1;i<STABLE_COUNT;i++) {
        if (window[i]<mn) mn=window[i];
        if (window[i]>mx) mx=window[i];
      }
      if (mx-mn <= THRESHOLD) break;
    }
    delay(200);
  }

  // Calculate average glucose reading
  double sum=0;
  for (int i=0;i<STABLE_COUNT;i++) sum += window[i];
  double result = sum / STABLE_COUNT;

  // Display the result
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0,0);
  display.print("Current Glu:");
  display.setTextSize(2);
  display.setCursor(0,16);
  display.print(result,1);
  display.print(" mg/dL");
  display.display();

  Serial.print("Glucose: ");
  Serial.print(result,1);
  Serial.println(" mg/dL");

  // Send data to server if connected
  if (WiFi.status() == WL_CONNECTED && userId.length() > 0) {
    sendGlucoseData(result);
    getGlucosePrediction();
  } else {
    delay(3000);
    // Try to reconnect
    connectToWiFi();
    if (WiFi.status() == WL_CONNECTED && userId.length() == 0) {
      loginUser("huslen.0922@gmail.com", "Khuslen.0922");
    }
  }

  delay(5000);
}
