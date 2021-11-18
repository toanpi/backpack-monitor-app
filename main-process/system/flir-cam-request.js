
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



ipcMain.on("serial-req", (event, arg) => {
  let isValid = true;
  let packet = START_PACKET_CODE;
  const END_PACKET_CODE = "\n\r";

  switch (true) {
    case arg.event == "flir-cam-start-video":
      packet += FLIR_CAM_START_VIDEO_OPCODE;
      break;
    case arg.event == "flir-cam-stop-video":
      packet += FLIR_CAM_STOP_VIDEO_OPCODE;
      break;
    case arg.event == "flir-cam-start-capture":
      packet += FLIR_CAM_START_CAPTURE_OPCODE;
      break;
    case arg.event == "flir-cam-update-video-interval":
      packet += FLIR_CAM_UPDATE_VIDEO_INTERVAL_OPCODE;
      break;
    case arg.event == "flir-cam-shut-down":
      packet += FLIR_CAM_SHUT_DOWN_OPCODE;
      break;
    case arg.event == "flir-cam-bootup":
      packet += FLIR_CAM_BOOTUP_OPCODE;
      break;
    case arg.event == "flir-cam-power-off":
      packet += FLIR_CAM_POWER_OFF_OPCODE;
      break;
    case arg.event == "flir-cam-power-on":
      packet += FLIR_CAM_POWER_ON_OPCODE;
      break;
    case arg.event == "flir-cam-always-on":
      packet += FLIR_CAM_ALWAYS_ON_MODE_OPCODE;
      break;
    case arg.event == "flir-cam-power-optimize":
      packet += FLIR_CAM_POWER_OPTIMIZE_MODE_OPCODE;
      break;
    case arg.event == "flir-cam-run-ffc":
      packet += FLIR_CAM_RUN_FFC_OPCODE;
      break;
    case arg.event == "flir-cam-get-info":
      packet += FLIR_CAM_GET_INFO_OPCODE;
      break;
    default:
      isValid = false;
      break;
  }

  if (isValid) {
    packet += host.fill2Bytes(arg.video_interval);
    packet += END_PACKET_CODE;

    if (arg.portID) {
      console.log(packet);
      event.returnValue = serial.write(arg.portID, packet);
    } else {
      event.returnValue = { status: "error", log: "Request is invalid" };
    }
  }
});
