# JavaScript Roomba

A web-based controller for Roomba robot vacuums using an ESP32 microcontroller. This project combines hardware and software to create a custom interface for controlling your Roomba.

## Project Structure

- `/src` - ESP32 firmware source code
- `/controller` - React-based web interface

## Features

- Web-based control interface for Roomba
- ESP32 as the bridge between web interface and Roomba
- Real-time control and monitoring
- Custom movement patterns and commands

## Hardware Requirements

- ESP32 development board
- Roomba with serial interface
- Appropriate cables to connect ESP32 to Roomba

## Software Requirements

- PlatformIO for ESP32 firmware development
- Node.js for web interface development - we use Vite to dev on the ESP32 locally

## Setup

1. Clone this repository
2. Install PlatformIO (for ESP32 firmware)
3. Install Node.js dependencies for the web interface
4. Upload firmware to ESP32
5. Connect ESP32 to your Roomba
6. Access the web interface through your browser

## Development

### ESP32 Firmware

```bash
# Build firmware
pio run

# Upload to ESP32
pio run --target upload
```

### Web Interface

```bash
# Install dependencies
cd controller
npm install

# Start development server
npm run dev
```

When you are ready to deploy the app, you can compile it into a single file, and then convert to byte code with `./compile_page_bytes.sh`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

Initial code for the ESP32 wireless serial bridge comes from <https://github.com/TAR-ALEX/ESP32-Wireless-Serial-Web-Interface>
