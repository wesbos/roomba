import { useState, useEffect, useRef } from "react";
import { drivePwm } from "../lib/drive";
import { Joystick } from "./Joystick";
import { decode_sensors, SENSOR_PKT_LEN, SensorData } from "../lib/sensor-decode";
import { SensorDisplay } from "./SensorDisplay";

interface RoombaCommand {
  commands: number[];
}

function getWebSocketUrl() {
  if (!import.meta.env.VITE_APP_ON_DEVICE) {
    console.log("Using default url");
    return "ws://192.168.1.22/ws"; // We are in development mode, so we use the default url
  }
  // Otherwise we default to the current url:
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  console.log(`Using ${protocol}://${window.location.hostname}/ws`);
  return `${protocol}://${window.location.hostname}/ws`;
}

const WEBSOCKET_URL = getWebSocketUrl();
const RECONNECT_INTERVAL = 1000; // 1 second

export function RoombaController() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [customCommand, setCustomCommand] = useState("");
  const [sensorBuffer, setSensorBuffer] = useState<number[]>([]);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [motorBits, setMotorBits] = useState({
    sideBrush: false,
    vacuum: false,
    mainBrush: false,
    sideBrushDirection: false,
    mainBrushDirection: false
  });
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
      // startSensorPolling();
    }, [isConnected]);

  const connectWebSocket = () => {
    console.log("Connecting to WebSocket");
    // Clear any existing reconnection timeouts
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      console.log("WebSocket Connected");
      setIsConnected(true);
      // Request sensors immediately
      sendCommand({ commands: [142, 0] });
    };


    ws.onmessage = async (event) => {
      console.log("Received message");
      // Handle binary data
      if (event.data instanceof Blob) {
        console.log("Received binary data");
        const buffer = await event.data.arrayBuffer();
        const bytes = Array.from(new Uint8Array(buffer));
        console.log(sensorBuffer);
        // Add new bytes to sensor buffer
        setSensorBuffer(prev => {
          const newBuffer = [...prev, ...bytes];
          console.log(`Received ${bytes.length} new bytes, total of ${newBuffer.length}`);
          // If we have a complete packet
          if (newBuffer.length === SENSOR_PKT_LEN) {
            // Decode the sensor data
            const data = decode_sensors(new Uint8Array(newBuffer));
            setSensorData(data);
            // Clear the buffer
            return [];
          }

          // If buffer is larger than a packet, something went wrong - clear it
          if (newBuffer.length > SENSOR_PKT_LEN) {
            console.warn('Sensor buffer overflow, clearing buffer');
            return [];
          }

          // Keep collecting bytes
          return newBuffer;
        });
      } else {
        // Handle text data
        const text = await event.data.text();
        setMessages((prev) => [...prev, text]);
      }

      // Auto scroll to bottom
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    };

    ws.onclose = () => {
      console.log("WebSocket Disconnected - attempting reconnect in 1 second");
      setIsConnected(false);
      // Set up reconnection attempt
      reconnectTimeoutRef.current = window.setTimeout(() => {
        console.log("Reconnecting...");
        if (!isConnected) {
          connectWebSocket();
        }
      }, RECONNECT_INTERVAL);
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setIsConnected(false);
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      console.log(`Cleaning up WebSocket and intervals`);
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, []);

  const sendCommand = (command: RoombaCommand) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(command));
    }
  };

  const handleConnect = () => {
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      console.log("WebSocket not connected, connecting...");
      connectWebSocket();
    }
  };

  const handleDisconnect = () => {
    console.log(`Closing WebSocket due to disconnect`);
    wsRef.current?.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900/20 to-gray-900 text-cyan-500 relative overflow-hidden p-0 font-mono">
      {/* Background SVG Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Animated Glow Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 animate-pulse"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-pulse delay-700"></div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto bg-gray-800/80 rounded-lg shadow-lg border border-cyan-500 relative overflow-hidden">
        <div className="p-4 space-y-4">
          {/* Connection Status Bar */}
          <div className="flex items-center justify-between gap-3 relative">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected
                  ? 'bg-gradient-to-r from-green-500 to-green-400 shadow-lg shadow-green-500/50 animate-pulse'
                  : 'bg-gradient-to-r from-red-500 to-red-400 shadow-lg shadow-red-500/50'
              }`}></div>
              <span className="text-xs font-medium bg-gradient-to-r from-cyan-400 to-cyan-200 text-transparent bg-clip-text">
                {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConnect}
                disabled={isConnected}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-300 relative group
                  ${isConnected
                    ? 'bg-gray-800 text-gray-500'
                    : 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-gray-900 hover:from-cyan-400 hover:to-cyan-300'}`}
              >
                <span className="relative z-10">CONNECT</span>
              </button>
              <button
                onClick={handleDisconnect}
                disabled={!isConnected}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-300 relative group
                  ${!isConnected
                    ? 'bg-gray-800 text-gray-500'
                    : 'bg-gradient-to-r from-red-500 to-red-400 text-gray-900 hover:from-red-400 hover:to-red-300'}`}
              >
                <span className="relative z-10">DISCONNECT</span>
              </button>
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 transition-all duration-300 flex items-center gap-1 border border-cyan-900/50 relative group"
              >
                <span className="bg-gradient-to-r from-cyan-400 to-cyan-200 text-transparent bg-clip-text">
                  {isDrawerOpen ? 'HIDE' : 'SHOW'} ADVANCED
                </span>
                <svg
                  className={`w-3 h-3 transform transition-transform ${isDrawerOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column - Essential Controls */}
            <div className="space-y-4">
              <div className="bg-gray-900/50 rounded-md p-4">
                <div className="grid grid-cols-3 gap-2 relative">
                  <button
                    onClick={() => sendCommand({ commands: [142, 0] })}
                    className="px-3 py-2 text-xs bg-indigo-500 text-gray-900 rounded-md hover:bg-indigo-400 font-bold"
                  >
                    REQUEST SENSORS
                  </button>
                  <label className="relative inline-flex items-center justify-center px-3 py-2 bg-amber-500 hover:bg-amber-400 rounded-md cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      onChange={(e) => {
                        sendCommand({ commands: [139, 255, 0, e.target.checked ? 255 : 0] });
                      }}
                    />
                    <span className="text-gray-900 font-bold text-xs">LED</span>
                    <div className="absolute right-2 w-3 h-3 bg-white rounded-full"></div>
                  </label>
                  <button
                    onClick={() => sendCommand({ commands: [141, 1] })}
                    className="px-3 py-2 text-xs bg-fuchsia-500 text-gray-900 rounded-md hover:bg-fuchsia-400 font-bold"
                  >
                    HONK
                  </button>
                </div>

                {/* Motor Controls */}
                <div className="mt-4">
                  <div className="flex gap-2 items-center">
                    {/* Side Brush Controls */}
                    <label className="relative flex-1">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={motorBits.sideBrush}
                        onChange={(e) => {
                          const newBits = { ...motorBits, sideBrush: e.target.checked };
                          setMotorBits(newBits);
                          const value = (newBits.sideBrush ? 1 : 0) |
                                      (newBits.vacuum ? 2 : 0) |
                                      (newBits.mainBrush ? 4 : 0) |
                                      (newBits.sideBrushDirection ? 8 : 0) |
                                      (newBits.mainBrushDirection ? 16 : 0);
                          sendCommand({ commands: [138, value] });
                        }}
                      />
                      <div className={`px-3 py-2 text-xs rounded-md font-bold text-center cursor-pointer w-full
                        ${motorBits.sideBrush
                          ? 'bg-green-500 text-gray-900'
                          : 'bg-gray-700 text-gray-300'}`}>
                        SIDE
                      </div>
                    </label>

                    <label className="relative">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={motorBits.sideBrushDirection}
                        onChange={(e) => {
                          const newBits = { ...motorBits, sideBrushDirection: e.target.checked };
                          setMotorBits(newBits);
                          const value = (newBits.sideBrush ? 1 : 0) |
                                      (newBits.vacuum ? 2 : 0) |
                                      (newBits.mainBrush ? 4 : 0) |
                                      (newBits.sideBrushDirection ? 8 : 0) |
                                      (newBits.mainBrushDirection ? 16 : 0);
                          sendCommand({ commands: [138, value] });
                        }}
                      />
                      <div className={`w-8 h-8 flex items-center justify-center rounded-md cursor-pointer
                        ${motorBits.sideBrushDirection
                          ? 'bg-blue-500 text-gray-900'
                          : 'bg-gray-700 text-gray-300'}`}>
                        ↺
                      </div>
                    </label>

                    {/* Vacuum Control */}
                    <label className="relative flex-1">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={motorBits.vacuum}
                        onChange={(e) => {
                          const newBits = { ...motorBits, vacuum: e.target.checked };
                          setMotorBits(newBits);
                          const value = (newBits.sideBrush ? 1 : 0) |
                                      (newBits.vacuum ? 2 : 0) |
                                      (newBits.mainBrush ? 4 : 0) |
                                      (newBits.sideBrushDirection ? 8 : 0) |
                                      (newBits.mainBrushDirection ? 16 : 0);
                          sendCommand({ commands: [138, value] });
                        }}
                      />
                      <div className={`px-3 py-2 text-xs rounded-md font-bold text-center cursor-pointer w-full
                        ${motorBits.vacuum
                          ? 'bg-green-500 text-gray-900'
                          : 'bg-gray-700 text-gray-300'}`}>
                        VAC
                      </div>
                    </label>

                    {/* Main Brush Controls */}
                    <label className="relative flex-1">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={motorBits.mainBrush}
                        onChange={(e) => {
                          const newBits = { ...motorBits, mainBrush: e.target.checked };
                          setMotorBits(newBits);
                          const value = (newBits.sideBrush ? 1 : 0) |
                                      (newBits.vacuum ? 2 : 0) |
                                      (newBits.mainBrush ? 4 : 0) |
                                      (newBits.sideBrushDirection ? 8 : 0) |
                                      (newBits.mainBrushDirection ? 16 : 0);
                          sendCommand({ commands: [138, value] });
                        }}
                      />
                      <div className={`px-3 py-2 text-xs rounded-md font-bold text-center cursor-pointer w-full
                        ${motorBits.mainBrush
                          ? 'bg-green-500 text-gray-900'
                          : 'bg-gray-700 text-gray-300'}`}>
                        MAIN
                      </div>
                    </label>

                    <label className="relative">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={motorBits.mainBrushDirection}
                        onChange={(e) => {
                          const newBits = { ...motorBits, mainBrushDirection: e.target.checked };
                          setMotorBits(newBits);
                          const value = (newBits.sideBrush ? 1 : 0) |
                                      (newBits.vacuum ? 2 : 0) |
                                      (newBits.mainBrush ? 4 : 0) |
                                      (newBits.sideBrushDirection ? 8 : 0) |
                                      (newBits.mainBrushDirection ? 16 : 0);
                          sendCommand({ commands: [138, value] });
                        }}
                      />
                      <div className={`w-8 h-8 flex items-center justify-center rounded-md cursor-pointer
                        ${motorBits.mainBrushDirection
                          ? 'bg-blue-500 text-gray-900'
                          : 'bg-gray-700 text-gray-300'}`}>
                        ↺
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Joystick and Sensors */}
            <div className="space-y-4">
              {/* Joystick */}
              <div className="bg-gray-900/50 rounded-md p-4">
                <div className="flex justify-center relative">
                  <Joystick
                    onMove={(rightPwm, leftPwm) => {
                      sendCommand({ commands: drivePwm(rightPwm, leftPwm) });
                    }}
                    size={300}
                  />
                </div>
              </div>

              {/* Sensor Display */}
              <div className="bg-gray-900/50 rounded-md p-4">
                <div className="relative">
                  <SensorDisplay data={sensorData} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Controls Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-gray-800/95 shadow-lg transform transition-transform duration-300 ease-in-out border-t border-cyan-500 ${
          isDrawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '70vh' }}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        <div className="container mx-auto p-6 overflow-y-auto max-h-[70vh]">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* System Controls */}
            <div className="bg-gray-800/80 rounded-lg p-6 border border-cyan-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-cyan-500/5"></div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-cyan-200 text-transparent bg-clip-text mb-4 tracking-wider relative">SYSTEM CONTROLS</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 relative">
                <button
                  onClick={() => sendCommand({ commands: [128] })}
                  className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-400 text-gray-900 rounded-md hover:from-emerald-400 hover:to-emerald-300 transition-all duration-300 font-bold relative group"
                >
                  <span className="relative z-10">START</span>
                </button>
                <button
                  onClick={() => sendCommand({ commands: [131] })}
                  className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-gray-900 rounded-md hover:from-yellow-400 hover:to-yellow-300 transition-all duration-300 font-bold relative group"
                >
                  <span className="relative z-10">SAFE MODE</span>
                </button>
                <button
                  onClick={() => sendCommand({ commands: [132] })}
                  className="px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-400 text-gray-900 rounded-md hover:from-orange-400 hover:to-orange-300 transition-all duration-300 font-bold relative group"
                >
                  <span className="relative z-10">FULL MODE</span>
                </button>
                <button
                  onClick={() => sendCommand({ commands: [7] })}
                  className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-400 text-gray-900 rounded-md hover:from-red-400 hover:to-red-300 transition-all duration-300 font-bold relative group"
                >
                  <span className="relative z-10">REBOOT</span>
                </button>
                <button
                  onClick={() => sendCommand({ commands: [173] })}
                  className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-gray-900 rounded-md hover:from-red-500 hover:to-red-400 transition-all duration-300 font-bold relative group"
                >
                  <span className="relative z-10">STOP & CLOSE</span>
                </button>
              </div>
            </div>

            {/* Custom Command */}
            <div className="bg-gray-800/80 rounded-lg p-6 border border-cyan-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-cyan-500/5"></div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-cyan-200 text-transparent bg-clip-text mb-4 tracking-wider relative">CUSTOM COMMAND</h2>
              <div className="flex gap-3 relative">
                <textarea
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  placeholder="Enter comma-separated numbers (e.g. 0, 2, 60, 16, 60, 16)"
                  className="flex-1 p-3 bg-gray-800 border border-cyan-900/50 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-cyan-300 placeholder-cyan-800"
                />
                <button
                  onClick={() => {
                    const commands = customCommand
                      .split(",")
                      .map((num) => parseInt(num.trim()))
                      .filter((num) => !isNaN(num));
                    if (commands.length > 0) {
                      sendCommand({ commands });
                      setCustomCommand("");
                    }
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-400 text-gray-900 rounded-md hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 font-bold whitespace-nowrap relative group"
                >
                  <span className="relative z-10">SEND COMMAND</span>
                </button>
              </div>
            </div>

            {/* Console Output */}
            <div className="bg-gray-800/80 rounded-lg p-6 border border-cyan-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-cyan-500/5"></div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-cyan-200 text-transparent bg-clip-text mb-4 tracking-wider relative">CONSOLE OUTPUT</h2>
              <textarea
                ref={outputRef}
                value={messages.join("\n")}
                readOnly
                className="w-full h-48 p-4 bg-gray-800 rounded-md font-mono text-sm border border-cyan-900/50 text-cyan-300 relative"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
