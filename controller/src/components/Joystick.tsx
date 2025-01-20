import { useState, useRef } from 'react';

interface JoystickProps {
  onMove: (rightPwm: number, leftPwm: number) => void;
  size?: number;
}

export function Joystick({ onMove, size = 200 }: JoystickProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);

  // Calculate color and glow intensity based on position
  const getGlowColor = (x: number, y: number) => {
    // Calculate angle in degrees (0-360)
    const angle = Math.atan2(y, x) * (180 / Math.PI);

    // Map angle to color
    if (angle >= -45 && angle < 45) return 'cyan'; // Right
    if (angle >= 45 && angle < 135) return 'green'; // Down
    if (angle >= 135 || angle < -135) return 'blue'; // Left
    return 'purple'; // Up
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    joystickRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!isDragging || !joystickRef.current) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate position relative to center
    let x = e.clientX - centerX;
    let y = e.clientY - centerY;

    // Limit to circle
    const radius = size / 2;
    const distance = Math.sqrt(x * x + y * y);
    if (distance > radius) {
      x = (x / distance) * radius;
      y = (y / distance) * radius;
    }

    // Convert to -255 to 255 range
    const normalizedX = Math.round((x / radius) * 255);
    const normalizedY = Math.round((-y / radius) * 255); // Invert Y axis

    // Convert to differential drive values
    const leftPwm = normalizedY + normalizedX;  // Forward + rotation
    const rightPwm = normalizedY - normalizedX; // Forward - rotation

    // Clamp values between -255 and 255
    const clampedLeft = Math.max(-255, Math.min(255, leftPwm));
    const clampedRight = Math.max(-255, Math.min(255, rightPwm));

    setPosition({ x, y });
    onMove(clampedRight, clampedLeft);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    onMove(0, 0);
  };

  const glowColor = getGlowColor(position.x, position.y);

  return (
    <div className="relative">

      <div
        ref={joystickRef}
        className="relative rounded-full touch-none select-none"
        style={{
          width: size,
          height: size,
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          msUserSelect: 'none',
          MozUserSelect: 'none',
        }}
        onTouchStart={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Base Ring with Dynamic Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 shadow-lg transition-all duration-150 select-none pointer-events-none"
          style={{ touchAction: 'none', userSelect: 'none' }}>
          <div className="absolute inset-0 rounded-full transition-all duration-150 pointer-events-none"
            style={{ boxShadow: isDragging ? `0 0 30px ${glowColor}` : 'none' }}></div>
        </div>

        {/* Inner Ring Glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 shadow-[inset_0_1px_8px_rgba(0,0,0,0.6)] transition-all duration-150 select-none pointer-events-none"
          style={{ touchAction: 'none', userSelect: 'none' }}>
          <div className="absolute inset-0 rounded-full transition-all duration-150 pointer-events-none"
            style={{ boxShadow: isDragging ? `inset 0 0 20px ${glowColor}` : 'none' }}></div>
        </div>

        {/* Accent Ring with Dynamic Color */}
        <div
          className={`absolute inset-0 rounded-full border transition-all duration-150 select-none pointer-events-none ${
            isDragging
              ? `border-${glowColor}-500`
              : 'border-cyan-500/30'
          }`}
          style={{
            touchAction: 'none',
            userSelect: 'none',
            boxShadow: isDragging ? `0 0 10px ${glowColor}` : 'none'
          }}
        ></div>

        {/* Guide Lines */}
        <div className="absolute inset-0 rounded-full select-none pointer-events-none" style={{ touchAction: 'none', userSelect: 'none' }}>
          {/* Vertical Line */}
          <div className={`absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent transform -translate-x-1/2 transition-all duration-150 pointer-events-none
            ${isDragging ? 'opacity-50' : ''}`}></div>
          {/* Horizontal Line */}
          <div className={`absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent transform -translate-y-1/2 transition-all duration-150 pointer-events-none
            ${isDragging ? 'opacity-50' : ''}`}></div>
        </div>

        {/* Handle */}
        <div
          className="absolute rounded-full  pointer-events-none select-none"
          style={{
            width: size * 0.3,
            height: size * 0.3,
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
            background: isDragging
              ? `radial-gradient(circle at center, ${glowColor} 0%, ${glowColor}50 100%)`
              : 'radial-gradient(circle at center, rgb(14, 165, 233) 0%, rgb(6, 182, 212) 100%)',
            boxShadow: isDragging
              ? `0 0 20px ${glowColor}, inset 0 0 10px ${glowColor}`
              : '0 4px 6px rgba(0, 0, 0, 0.1), inset 0 1px 3px rgba(0, 0, 0, 0.1)',
            touchAction: 'none',
            userSelect: 'none'
          }}
        >
          {/* Center Dot */}
          <div className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-white/50 transition-all duration-150 -translate-x-1/2 -translate-y-1/2 select-none"
            style={{ touchAction: 'none', userSelect: 'none' }}>
            <div className={`absolute inset-0 rounded-full transition-opacity duration-150 ${isDragging ? 'opacity-100 scale-150' : 'opacity-50'}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
