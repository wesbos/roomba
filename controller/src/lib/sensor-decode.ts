export interface SensorData {
  bump: {
    right?: boolean;
    left?: boolean;
  };
  wheeldrop: {
    right?: boolean;
    left?: boolean;
    caster?: boolean;
  };
  wall: boolean;
  cliff: {
    [key: number]: boolean;
  };
  virtual_wall: boolean;
  overcurrent: {
    side_brush?: boolean;
    vacuum?: boolean;
    main_brush?: boolean;
    drive_right?: boolean;
    drive_left?: boolean;
  };
  dirt: {
    left: number;
    right: number;
  };
  remote: number;
  buttons: {
    max?: boolean;
    clean?: boolean;
    spot?: boolean;
    power?: boolean;
  };
  distance: number;
  angle: number;
  battery: {
    charging_state: number;
    voltage: number;
    current: number;
    temp: number;
    level: number;
    capacity: number;
  };
}

export const SENSOR_PKT_LEN = 25;

const masks = {
  bump_wheeldrop: {
    BUMP_RIGHT: 0x01,
    BUMP_LEFT: 0x02,
    WHEELDROP_RIGHT: 0x04,
    WHEELDROP_LEFT: 0x08,
    WHEELDROP_CASTER: 0x10
  },
  motor_overcurrent: {
    SIDEBRUSH: 0x01,
    VACUUM: 0x02,
    MAINBRUSH: 0x04,
    DRIVE_RIGHT: 0x08,
    DRIVE_LEFT: 0x10
  },
  buttons: {
    MAX: 0x01,
    CLEAN: 0x02,
    SPOT: 0x04,
    POWER: 0x08
  }
};

export function decode_sensors(buf: Uint8Array): SensorData {
  if (buf.length !== SENSOR_PKT_LEN) {
    throw new Error(`sensor packet must be ${SENSOR_PKT_LEN} bytes (got ${buf.length})`);
  }

  const msg: SensorData = {
    bump: {},
    wheeldrop: {},
    wall: false,
    cliff: {},
    virtual_wall: false,
    overcurrent: {},
    dirt: { left: 0, right: 0 },
    remote: 0,
    buttons: {},
    distance: 0,
    angle: 0,
    battery: {
      charging_state: 0,
      voltage: 0,
      current: 0,
      temp: 0,
      level: 0,
      capacity: 0
    }
  };

  let pos = 0;
  let byte = 0x00;

  // bumper sensors
  byte = buf[pos++];
  const bumpMask = masks.bump_wheeldrop;

  if (byte & bumpMask.BUMP_RIGHT)
    msg.bump.right = true;

  if (byte & bumpMask.BUMP_LEFT)
    msg.bump.left = true;

  // wheeldrop sensors
  if (byte & bumpMask.WHEELDROP_RIGHT)
    msg.wheeldrop.right = true;

  if (byte & bumpMask.WHEELDROP_LEFT)
    msg.wheeldrop.left = true;

  if (byte & bumpMask.WHEELDROP_CASTER)
    msg.wheeldrop.caster = true;

  // wall sensor
  byte = buf[pos++];
  if (byte === 1)
    msg.wall = true;

  // cliff sensors
  for (let i = 0; i < 4; i++) {
    if (buf[pos++] === 1) {
      msg.cliff[i] = true;
    } else {
      msg.cliff[i] = false;
    }
  }

  // virtual wall sensor
  byte = buf[pos++];
  if (byte === 1)
    msg.virtual_wall = true;

  // motor overcurrent sensors
  byte = buf[pos++];
  const overcurrentMask = masks.motor_overcurrent;

  if (byte & overcurrentMask.SIDEBRUSH)
    msg.overcurrent.side_brush = true;

  if (byte & overcurrentMask.VACUUM)
    msg.overcurrent.vacuum = true;

  if (byte & overcurrentMask.MAINBRUSH)
    msg.overcurrent.main_brush = true;

  if (byte & overcurrentMask.DRIVE_RIGHT)
    msg.overcurrent.drive_right = true;

  if (byte & overcurrentMask.DRIVE_LEFT)
    msg.overcurrent.drive_left = true;

  // dirt detectors
  msg.dirt.left = buf[pos++];
  msg.dirt.right = buf[pos++];

  // remote control command receiver
  msg.remote = buf[pos++];

  // button press detectors
  byte = buf[pos++];
  const buttonMask = masks.buttons;

  if (byte & buttonMask.MAX)
    msg.buttons.max = true;

  if (byte & buttonMask.CLEAN)
    msg.buttons.clean = true;

  if (byte & buttonMask.SPOT)
    msg.buttons.spot = true;

  if (byte & buttonMask.POWER)
    msg.buttons.power = true;

  // distance traveled
  msg.distance = buf[pos]; pos += 2;

  // angle turned
  msg.angle = buf[pos]; pos += 2;

  // charging state
  msg.battery.charging_state = buf[pos++];

  // voltage measurement
  msg.battery.voltage = buf[pos]; pos += 2;

  // current measurement
  msg.battery.current = buf[pos]; pos += 2;

  // temperature sensor
  msg.battery.temp = buf[pos++];

  // charge level
  msg.battery.level = buf[pos]; pos += 2;

  // charge capacity
  msg.battery.capacity = buf[pos]; pos += 2;

  return msg;
}

