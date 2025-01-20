export function drivePwm(rightPwm: number, leftPwm: number) {
  const rightPwmHighByte = (rightPwm >> 8) & 0xFF;
  const rightPwmLowByte = rightPwm & 0xFF;
  const leftPwmHighByte = (leftPwm >> 8) & 0xFF;
  const leftPwmLowByte = leftPwm & 0xFF;

  return [146, rightPwmHighByte, rightPwmLowByte, leftPwmHighByte, leftPwmLowByte];
}
/**
 * This command controls Roomba’s drive wheels. It takes four data bytes, interpreted as two 16-bit signed
values using two’s complement. (http://en.wikipedia.org/wiki/Two%27s_complement) The first two bytes
specify the average velocity of the drive wheels in millimeters per second (mm/s), with the high byte
being sent first. The next two bytes specify the radius in millimeters at which Roomba will turn. The
longer radii make Roomba drive straighter, while the shorter radii make Roomba turn more. The radius is
measured from the center of the turning circle to the center of Roomba. A Drive command with a
positive velocity and a positive radius makes Roomba drive forward while turning toward the left. A
negative radius makes Roomba turn toward the right. Special cases for the radius make Roomba turn in
place or drive straight, as specified below. A negative velocity makes Roomba drive backward.
 */
export function drive(velocity: number, radius: number) {
  const velocityHighByte = (velocity >> 8) & 0xFF;
  const velocityLowByte = velocity & 0xFF;
  const radiusHighByte = (radius >> 8) & 0xFF;
  const radiusLowByte = radius & 0xFF;

  return [137, velocityHighByte, velocityLowByte, radiusHighByte, radiusLowByte];
}
