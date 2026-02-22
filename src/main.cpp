#include <Arduino.h>
#include <GyverMAX6675.h>

#define CLK_PIN 13  // SCK
#define DATA_PIN 10 // SO
#define CS_PIN 9   // CS

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

  delay(5000);
}