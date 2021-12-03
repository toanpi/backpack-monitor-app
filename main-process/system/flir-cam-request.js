
var serial = require('./serial-connection')
var host = require('./network-request')

const {ipcMain, dialog} = require('electron')

var START_PACKET_CODE                     = 'S';

var FLIR_CAM_START_VIDEO_OPCODE           = 'A';
var FLIR_CAM_STOP_VIDEO_OPCODE            = 'B';
var FLIR_CAM_START_CAPTURE_OPCODE         = 'C';
var FLIR_CAM_UPDATE_VIDEO_INTERVAL_OPCODE = 'D';
var FLIR_CAM_SHUT_DOWN_OPCODE             = 'E';
var FLIR_CAM_BOOTUP_OPCODE                = 'F';
var FLIR_CAM_POWER_ON_OPCODE              = 'G';
var FLIR_CAM_POWER_OFF_OPCODE             = 'H';
var FLIR_CAM_ALWAYS_ON_MODE_OPCODE        = 'I';
var FLIR_CAM_POWER_OPTIMIZE_MODE_OPCODE   = 'J';
var FLIR_CAM_RUN_FFC_OPCODE               = 'K';
var FLIR_CAM_GET_INFO_OPCODE              = 'L';

var RGB_CAM_START_VIDEO_OPCODE            = 'a';
var RGB_CAM_STOP_VIDEO_OPCODE             = 'b';
var RGB_CAM_START_CAPTURE_OPCODE          = 'c';
var RGB_CAM_UPDATE_VIDEO_INTERVAL_OPCODE  = 'd';
var RGB_CAM_SHUT_DOWN_OPCODE              = 'e';
var RGB_CAM_BOOTUP_OPCODE                 = 'f';
var RGB_CAM_POWER_ON_OPCODE               = 'g';
var RGB_CAM_POWER_OFF_OPCODE              = 'h';
var RGB_CAM_ALWAYS_ON_MODE_OPCODE         = 'i';
var RGB_CAM_POWER_OPTIMIZE_MODE_OPCODE    = 'k';
var RGB_CAM_GET_INFO_OPCODE               = 'l';

const EventList = {
  // Flir Camera
  "flir-cam-start-video": {opcode: FLIR_CAM_START_VIDEO_OPCODE},
  "flir-cam-stop-video": {opcode: FLIR_CAM_STOP_VIDEO_OPCODE},
  "flir-cam-start-capture": {opcode: FLIR_CAM_START_CAPTURE_OPCODE},
  "flir-cam-update-video-interval": {opcode: FLIR_CAM_UPDATE_VIDEO_INTERVAL_OPCODE},
  "flir-cam-shut-down": {opcode: FLIR_CAM_SHUT_DOWN_OPCODE},
  "flir-cam-bootup": {opcode: FLIR_CAM_BOOTUP_OPCODE},
  "flir-cam-power-off": {opcode: FLIR_CAM_POWER_OFF_OPCODE},
  "flir-cam-power-on": {opcode: FLIR_CAM_POWER_ON_OPCODE},
  "flir-cam-always-on": {opcode: FLIR_CAM_ALWAYS_ON_MODE_OPCODE},
  "flir-cam-power-optimize": {opcode: FLIR_CAM_POWER_OPTIMIZE_MODE_OPCODE},
  "flir-cam-run-ffc": {opcode: FLIR_CAM_RUN_FFC_OPCODE},
  "flir-cam-get-info": {opcode: FLIR_CAM_GET_INFO_OPCODE},
  // RGB Camera
  "rgb-cam-start-video": {opcode: RGB_CAM_START_VIDEO_OPCODE},
  "rgb-cam-stop-video": {opcode: RGB_CAM_STOP_VIDEO_OPCODE},
  "rgb-cam-start-capture": {opcode: RGB_CAM_START_CAPTURE_OPCODE},
  "rgb-cam-update-video-interval": {opcode: RGB_CAM_UPDATE_VIDEO_INTERVAL_OPCODE},
  "rgb-cam-shut-down": {opcode: RGB_CAM_SHUT_DOWN_OPCODE},
  "rgb-cam-bootup": {opcode: RGB_CAM_BOOTUP_OPCODE},
  "rgb-cam-power-on": {opcode: RGB_CAM_POWER_ON_OPCODE},
  "rgb-cam-power-off": {opcode: RGB_CAM_POWER_OFF_OPCODE},
  "rgb-cam-always-on": {opcode: RGB_CAM_ALWAYS_ON_MODE_OPCODE},
  "rgb-cam-power-optimize": {opcode: RGB_CAM_POWER_OPTIMIZE_MODE_OPCODE},
  "rgb-cam-get-info": {opcode: RGB_CAM_GET_INFO_OPCODE},
}


ipcMain.on("serial-req", (event, arg) => {
  let isValid = true;
  let packet = START_PACKET_CODE;
  const END_PACKET_CODE = "\n\r";

  if(EventList.hasOwnProperty(arg.event)) {
    packet += EventList[arg.event].opcode;
  } else {
    isValid = false;
  }
  
  if (isValid) {
    packet += host.fill2Bytes(parseInt(arg.video_interval));
    packet += END_PACKET_CODE;

    if (arg.portID) {
      console.log(packet);
      event.returnValue = serial.write(arg.portID, packet);
    } else {
      event.returnValue = { status: "error", log: "Request is invalid" };
    }
  }
});
