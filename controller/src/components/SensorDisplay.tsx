import { SensorData } from "../lib/sensor-decode";

interface SensorDisplayProps {
  data: SensorData | null;
}

export function SensorDisplay({ data }: SensorDisplayProps) {
  if (!data) return (
    <div className="text-cyan-500/50 text-center font-mono font-bold tracking-wider">NO SENSOR DATA</div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
      {/* Contact Sensors */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-md p-4">
        <h3 className="text-xs font-bold mb-2 bg-gradient-to-r from-cyan-400 to-cyan-200 text-transparent bg-clip-text">CONTACT SENSORS</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <h4 className="font-semibold text-cyan-300">BUMPERS</h4>
            <div className={`text-sm ${data.bump.left ? 'text-red-400' : 'text-cyan-600'} flex items-center gap-2`}>
              <div className={`w-2 h-2 rounded-full ${data.bump.left ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' : 'bg-cyan-800'}`}></div>
              Left: {data.bump.left ? 'Hit' : 'Clear'}
            </div>
            <div className={`text-sm ${data.bump.right ? 'text-red-400' : 'text-cyan-600'} flex items-center gap-2`}>
              <div className={`w-2 h-2 rounded-full ${data.bump.right ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' : 'bg-cyan-800'}`}></div>
              Right: {data.bump.right ? 'Hit' : 'Clear'}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-cyan-300">WHEEL DROPS</h4>
            <div className={`text-sm ${data.wheeldrop.left ? 'text-red-400' : 'text-cyan-600'} flex items-center gap-2`}>
              <div className={`w-2 h-2 rounded-full ${data.wheeldrop.left ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' : 'bg-cyan-800'}`}></div>
              Left: {data.wheeldrop.left ? 'Lifted' : 'Down'}
            </div>
            <div className={`text-sm ${data.wheeldrop.right ? 'text-red-400' : 'text-cyan-600'} flex items-center gap-2`}>
              <div className={`w-2 h-2 rounded-full ${data.wheeldrop.right ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' : 'bg-cyan-800'}`}></div>
              Right: {data.wheeldrop.right ? 'Lifted' : 'Down'}
            </div>
            <div className={`text-sm ${data.wheeldrop.caster ? 'text-red-400' : 'text-cyan-600'} flex items-center gap-2`}>
              <div className={`w-2 h-2 rounded-full ${data.wheeldrop.caster ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' : 'bg-cyan-800'}`}></div>
              Caster: {data.wheeldrop.caster ? 'Lifted' : 'Down'}
            </div>
          </div>
        </div>
      </div>

      {/* Surface Sensors */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-md p-4">
        <h3 className="text-xs font-bold mb-2 bg-gradient-to-r from-cyan-400 to-cyan-200 text-transparent bg-clip-text">SURFACE SENSORS</h3>
        <div className="space-y-3 relative">
          <div className={`text-sm flex items-center gap-2`}>
            <div className={`w-2 h-2 rounded-full ${data.wall ? 'bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50' : 'bg-cyan-800'}`}></div>
            <span className={`${data.wall ? 'text-blue-400 font-semibold' : 'text-cyan-600'}`}>
              Wall Detected: {data.wall ? 'Yes' : 'No'}
            </span>
          </div>
          <div className={`text-sm flex items-center gap-2`}>
            <div className={`w-2 h-2 rounded-full ${data.virtual_wall ? 'bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50' : 'bg-cyan-800'}`}></div>
            <span className={`${data.virtual_wall ? 'text-blue-400 font-semibold' : 'text-cyan-600'}`}>
              Virtual Wall: {data.virtual_wall ? 'Yes' : 'No'}
            </span>
          </div>
          <h4 className="font-semibold text-cyan-300 mt-2">CLIFF SENSORS</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(data.cliff).map(([position, isCliff]) => (
              <div key={position} className={`text-sm flex items-center gap-2`}>
                <div className={`w-2 h-2 rounded-full ${isCliff ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' : 'bg-cyan-800'}`}></div>
                <span className={`${isCliff ? 'text-red-400' : 'text-cyan-600'}`}>
                  {position}: {isCliff ? 'Cliff!' : 'Safe'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Battery Status */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-md p-4">
        <h3 className="text-xs font-bold mb-2 bg-gradient-to-r from-cyan-400 to-cyan-200 text-transparent bg-clip-text">BATTERY STATUS</h3>
        <div className="space-y-3 relative">
          <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
              style={{ width: `${Math.round((data.battery.level / data.battery.capacity) * 100)}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm text-cyan-600">
              Level: <span className="text-cyan-400">{Math.round((data.battery.level / data.battery.capacity) * 100)}%</span>
            </div>
            <div className="text-sm text-cyan-600">
              Voltage: <span className="text-cyan-400">{(data.battery.voltage / 1000).toFixed(2)}V</span>
            </div>
            <div className="text-sm text-cyan-600">
              Current: <span className="text-cyan-400">{data.battery.current}mA</span>
            </div>
            <div className="text-sm text-cyan-600">
              Temp: <span className="text-cyan-400">{data.battery.temp}°C</span>
            </div>
          </div>
          <div className="text-sm text-cyan-600 mt-2">
            State: <span className={`${getBatteryStateColor(data.battery.charging_state)}`}>
              {getBatteryState(data.battery.charging_state)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getBatteryState(state: number): string {
  switch (state) {
    case 0:
      return "Not Charging";
    case 1:
      return "Reconditioning";
    case 2:
      return "Full Charging";
    case 3:
      return "Trickle Charging";
    case 4:
      return "Waiting";
    case 5:
      return "Charging Fault";
    default:
      return "Unknown";
  }
}

function getBatteryStateColor(state: number): string {
  switch (state) {
    case 0:
      return "text-gray-400";
    case 1:
      return "text-yellow-400";
    case 2:
      return "text-green-400";
    case 3:
      return "text-blue-400";
    case 4:
      return "text-cyan-400";
    case 5:
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}
