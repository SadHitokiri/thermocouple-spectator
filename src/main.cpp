#include <Arduino.h>
#include <GyverMAX6675.h>

#define CLK_PIN 13  // Пин SCK
#define DATA_PIN 10 // Пин SO
#define CS_PIN 9   // Пин CS

GyverMAX6675<CLK_PIN, DATA_PIN, CS_PIN> sens;

void setup()
{
  Serial.begin(9600);
}

void loop()
{
  if (sens.readTemp())
  {                            
    Serial.println(sens.getTemp()); 
  }
  else
    Serial.println("Error"); 

  delay(1000);
}