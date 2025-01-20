#pragma once

#include <EEPROM.h>

#include <cstring>

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

template <size_t size>
struct StaticString
{
  char data[size];

  // Constructor to initialize the array with the given string
  StaticString(const char* str)
  {
    std::strncpy(data, str, size - 1); // Ensure no overflow
    data[size - 1] = '\0';             // Null-terminate
  }
};

#include "secrets.h" // Include secrets file with sensitive data

#define CONFIG_FIELDS(FIELD)                                \
  FIELD(StaticString<100>, ssid_Router, "Bos");             \
  FIELD(StaticString<100>, password_Router, WIFI_PASSWORD); \
  FIELD(StaticString<100>, ssid_AP, "RoombaAP");            \
  FIELD(StaticString<100>, password_AP, "sick");            \
  FIELD(StaticString<100>, IP_AP, "192.168.0.1");           \
  FIELD(StaticString<100>, hostname, "roomba-esp32")

inline void writeByteIntoEEPROM(int address, uint8_t number)
{
  if (EEPROM.read(address) != number)
  {
    EEPROM.write(address, number);
    LOG_F("EEPROM write at address %d: %u", address, number);
  }
}

inline uint8_t readByteFromEEPROM(int address)
{
  uint8_t value = EEPROM.read(address);
  // LOG_F("EEPROM read at address %d: %u", address, value);
  return value;
}

// Macro to declare each field in the struct and to print the field
#define DECLARE_STRUCT_FIELD(type, name, val) type name = val;
#define PRINT_STRUCT_FIELD(type, name, val)                        \
  s.print(#name);                                                  \
  s.print(" = ");                                                  \
  if (strcmp(#type, "double") == 0 || strcmp(#type, "float") == 0) \
    s.println(this->name, 5);                                      \
  else                                                             \
    s.println(this->name);

struct Config
{
  static const uint8_t requiredPreamble = 0xFC;
  uint8_t preamble;
  CONFIG_FIELDS(DECLARE_STRUCT_FIELD)

    template <class SerialType>
  void dumpToSerial(SerialType& s)
  {
    LOG("Dumping configuration:");
    CONFIG_FIELDS(PRINT_STRUCT_FIELD)
  }

  void save()
  {
    LOG("Saving configuration to EEPROM...");
    preamble = requiredPreamble;
    const int classSize = sizeof(Config);
    uint8_t* data = (uint8_t*)this;

    for (int i = 0; i < classSize; i++)
      writeByteIntoEEPROM(i, data[i]);

    if (EEPROM.commit())
    {
      LOG_F("Configuration saved and committed (%d bytes)", classSize);
    }
    else
    {
      LOG("Failed to commit configuration to EEPROM");
    }
  }

  bool load()
  {
    LOG("Loading configuration from EEPROM...");
    const int classSize = sizeof(Config);
    uint8_t* data = (uint8_t*)this;

    for (int i = 0; i < classSize; i++)
      data[i] = readByteFromEEPROM(i);

    if (preamble != requiredPreamble)
    {
      LOG("Configuration load failed: invalid preamble");
      Config defaultSettings;
      *this = defaultSettings;
      LOG("Restored default settings");
      return false;
    }

    LOG_F("Configuration loaded successfully (%d bytes)", classSize);
    return true;
  }
};

extern Config cfg;

#undef DECLARE_STRUCT_FIELD
#undef PRINT_STRUCT_FIELD
