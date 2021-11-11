
var serial = require('./serial-connection')
var host = require('./network-request')

const {ipcMain, dialog} = require('electron')

var START_PACKET_CODE                     = 'S';
var FLIR_CAM_START_VIDEO_OPCODE           = 'A';
var FLIR_CAM_STOP_VIDEO_OPCODE            = 'B';
var FLIR_CAM_START_CAPTURE_OPCODE         = 'C';
var FLIR_CAM_UPDATE_VIDEO_INTERVAL_OPCODE = 'D';


ipcMain.on("serial-req", (event, arg) => {
  let isValid = true;
  let packet = START_PACKET_CODE;
  const END_PACKET_CODE = "\n\r";

  switch (true) {
    case arg.event == "start-video":
      packet += FLIR_CAM_START_VIDEO_OPCODE;
      break;
    case arg.event == "stop-video":
      packet += FLIR_CAM_STOP_VIDEO_OPCODE;
      break;
    case arg.event == "start-capture":
      packet += FLIR_CAM_START_CAPTURE_OPCODE;
      break;
    case arg.event == "update-video-interval":
      packet += FLIR_CAM_UPDATE_VIDEO_INTERVAL_OPCODE;
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
