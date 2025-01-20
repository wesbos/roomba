import { useEffect, useState } from 'react';

interface MotorControlsProps {
  onSendCommand: (command: { commands: number[] }) => void;
}

export function MotorControls({ onSendCommand }: MotorControlsProps) {
  const [mainBrushOn, setMainBrushOn] = useState(false);
  const [mainBrushDirection, setMainBrushDirection] = useState(false);
  const [sideBrushOn, setSideBrushOn] = useState(false);
  const [sideBrushDirection, setSideBrushDirection] = useState(false);
  const [vacuumOn, setVacuumOn] = useState(false);
  const [motorByte, setMotorByte] = useState(0);

  useEffect(() => {
    // Build the motor control byte
    let motorByte = 0;

    // Side Brush (bit 0)
    if (sideBrushOn) motorByte |= 1;

    // Vacuum (bit 1)
    if (vacuumOn) motorByte |= 2;

    // Main Brush (bit 2)
    if (mainBrushOn) motorByte |= 4;

    // Side Brush Direction (bit 3)
    if (sideBrushDirection) motorByte |= 8;

    // Main Brush Direction (bit 4)
    if (mainBrushDirection) motorByte |= 16;

    setMotorByte(motorByte);
    onSendCommand({ commands: [138, motorByte] });
  }, [mainBrushOn, mainBrushDirection, sideBrushOn, sideBrushDirection, vacuumOn]);


  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-bold mb-4">Motor Controls (Byte: {motorByte} / 0b{motorByte.toString(2).padStart(8, '0')})</h2>
      <div className="space-y-4">
        {/* Bit 0: Side Brush */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sideBrushOn}
              onChange={(e) => setSideBrushOn(e.target.checked)}
              className="form-checkbox"
            />
            <span>Side Brush <code className="ml-2 text-sm bg-gray-100 px-1 rounded">Bit 0 = {sideBrushOn ? '1' : '0'}</code></span>
          </label>
        </div>

        {/* Bit 1: Vacuum */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={vacuumOn}
              onChange={(e) => setVacuumOn(e.target.checked)}
              className="form-checkbox"
            />
            <span>Vacuum <code className="ml-2 text-sm bg-gray-100 px-1 rounded">Bit 1 = {vacuumOn ? '1' : '0'}</code></span>
          </label>
        </div>

        {/* Bit 2: Main Brush */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={mainBrushOn}
              onChange={(e) => setMainBrushOn(e.target.checked)}
              className="form-checkbox"
            />
            <span>Main Brush <code className="ml-2 text-sm bg-gray-100 px-1 rounded">Bit 2 = {mainBrushOn ? '1' : '0'}</code></span>
          </label>
        </div>

        {/* Bit 3: Side Brush Direction */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sideBrushDirection}
              onChange={(e) => setSideBrushDirection(e.target.checked)}
              className="form-checkbox"
            />
            <span>Side Brush Direction (Counter-clockwise → Clockwise) <code className="ml-2 text-sm bg-gray-100 px-1 rounded">Bit 3 = {sideBrushDirection ? '1' : '0'}</code></span>
          </label>
        </div>

        {/* Bit 4: Main Brush Direction */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={mainBrushDirection}
              onChange={(e) => setMainBrushDirection(e.target.checked)}
              className="form-checkbox"
            />
            <span>Main Brush Direction (Inward → Outward) <code className="ml-2 text-sm bg-gray-100 px-1 rounded">Bit 4 = {mainBrushDirection ? '1' : '0'}</code></span>
          </label>
        </div>
      </div>
    </div>
  );
}
