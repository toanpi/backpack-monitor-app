
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
var RGB_CAM_SET_OP_MODE_OPCODE            = 'm';
// var RGB_CAM_SET_EXPOSURE_GAIN_OPCODE      = 'n';
var RGB_CAM_REG_WRITE_OPCODE              = 'o';
var RGB_CAM_REG_READ_OPCODE               = 'p';
var RGB_CAM_SET_BRIGHTNESS_OPCODE         = 'q';
var RGB_CAM_SET_EXPOSURE_OPCODE           = 'r';
var RGB_CAM_SET_AUTO_GAIN_OPCODE          = 's';
var RGB_CAM_SET_GAINCEILING_OPCODE        = 't';
var RGB_CAM_SET_FRAMERATE_OPCODE          = 'u';
var RGB_CAM_SET_PIXEL_FORMAT_OPCODE       = 'v';
var RGB_CAM_SET_FRAME_SIZE_OPCODE         = 'w';
var RGB_CAM_SET_VIDEO_OP_MODE_OPCODE      = 'x';

const EventList = {
  // Flir Camera
  "flir-cam-start-video": {opcode: FLIR_CAM_START_VIDEO_OPCODE, param: ["video_interval"]},
  "flir-cam-stop-video": {opcode: FLIR_CAM_STOP_VIDEO_OPCODE, param: [""]},
  "flir-cam-start-capture": {opcode: FLIR_CAM_START_CAPTURE_OPCODE, param: [""]},
  "flir-cam-update-video-interval": {opcode: FLIR_CAM_UPDATE_VIDEO_INTERVAL_OPCODE, param: ["video_interval"]},
  "flir-cam-shut-down": {opcode: FLIR_CAM_SHUT_DOWN_OPCODE, param: [""]},
  "flir-cam-bootup": {opcode: FLIR_CAM_BOOTUP_OPCODE, param: [""]},
  "flir-cam-power-off": {opcode: FLIR_CAM_POWER_OFF_OPCODE, param: [""]},
  "flir-cam-power-on": {opcode: FLIR_CAM_POWER_ON_OPCODE, param: [""]},
  "flir-cam-always-on": {opcode: FLIR_CAM_ALWAYS_ON_MODE_OPCODE, param: [""]},
  "flir-cam-power-optimize": {opcode: FLIR_CAM_POWER_OPTIMIZE_MODE_OPCODE, param: [""]},
  "flir-cam-run-ffc": {opcode: FLIR_CAM_RUN_FFC_OPCODE, param: [""]},
  "flir-cam-get-info": {opcode: FLIR_CAM_GET_INFO_OPCODE, param: [""]},
  // RGB Camera
  "rgb-cam-start-video": {opcode: RGB_CAM_START_VIDEO_OPCODE, param: ["video_interval"]},
  "rgb-cam-stop-video": {opcode: RGB_CAM_STOP_VIDEO_OPCODE, param: [""]},
  "rgb-cam-start-capture": {opcode: RGB_CAM_START_CAPTURE_OPCODE, param: [""]},
  "rgb-cam-update-video-interval": {opcode: RGB_CAM_UPDATE_VIDEO_INTERVAL_OPCODE, param: ["video_interval"]},
  "rgb-cam-shut-down": {opcode: RGB_CAM_SHUT_DOWN_OPCODE, param: [""]},
  "rgb-cam-bootup": {opcode: RGB_CAM_BOOTUP_OPCODE, param: [""]},
  "rgb-cam-power-on": {opcode: RGB_CAM_POWER_ON_OPCODE, param: [""]},
  "rgb-cam-power-off": {opcode: RGB_CAM_POWER_OFF_OPCODE, param: [""]},
  "rgb-cam-always-on": {opcode: RGB_CAM_ALWAYS_ON_MODE_OPCODE, param: [""]},
  "rgb-cam-power-optimize": {opcode: RGB_CAM_POWER_OPTIMIZE_MODE_OPCODE, param: [""]},
  "rgb-cam-get-info": {opcode: RGB_CAM_GET_INFO_OPCODE, param: [""]},
  "rgb-cam-set-op-mode": {opcode: RGB_CAM_SET_OP_MODE_OPCODE, param: [""]},
  // "rgb-cam-set-exposure-gain": {opcode: RGB_CAM_SET_EXPOSURE_GAIN_OPCODE, param: [""]},
  "rgb-cam-set-reg-write": {opcode: RGB_CAM_REG_WRITE_OPCODE, param: ["register", "value"]},
  "rgb-cam-set-reg-read": {opcode: RGB_CAM_REG_READ_OPCODE, param: ["register"]},
  "rgb-cam-set-brightness": {opcode: RGB_CAM_SET_BRIGHTNESS_OPCODE, param: ["level"]},
  "rgb-cam-set-exposure": {opcode: RGB_CAM_SET_EXPOSURE_OPCODE, param: ["enable", "exposure_us"]},
  "rgb-cam-set-auto-gain": {opcode: RGB_CAM_SET_AUTO_GAIN_OPCODE, param: ["enable", "gain_db", "gain_db_ceiling"]},
  "rgb-cam-set-gainceiling": {opcode: RGB_CAM_SET_GAINCEILING_OPCODE, param: ["gainceiling"]},
  "rgb-cam-set-framerate": {opcode: RGB_CAM_SET_FRAMERATE_OPCODE, param: ["frame_rate"]},
  "rgb-cam-set-pixel-format": {opcode: RGB_CAM_SET_PIXEL_FORMAT_OPCODE, param: ["pixel_format"]},
  "rgb-cam-set-frame-size": {opcode: RGB_CAM_SET_FRAME_SIZE_OPCODE, param: ["frame_size"]},
  "rgb-cam-set-video-mode": {opcode: RGB_CAM_SET_VIDEO_OP_MODE_OPCODE, param: ["mode", "frame_cnt"]},
}


ipcMain.on("serial-req", (event, arg) => {
  let isValid = true;
  const END_PACKET_CODE = "\n\r";
  let packet = START_PACKET_CODE;

  if (EventList.hasOwnProperty(arg.event)) {
    packet += EventList[arg.event].opcode;

    for (let param of EventList[arg.event].param) {
      if (param && param.length > 0) {
        if(arg[param]){
          packet += host.fill4Bytes(parseInt(arg[param]));
        } else {
          isValid = false;
          break;
        }
      }
    }

    packet += END_PACKET_CODE;
  } else {
    isValid = false;
  }

  if (isValid) {
    if (arg.portID) {
      console.log(packet);
      event.returnValue = serial.write(arg.portID, packet);
    } else {
      event.returnValue = { status: "error", log: "Request is invalid" };
    }
  } else {
    // dialog.showErrorBox("Request is invalid", "");
    event.returnValue = { status: "error", log: "Request is invalid" };
  }
});
