const {ipcMain, dialog} = require('electron')
var serial = require('./serial-connection')

const PACKET_SIZE = 180

function fillRemainPacket(data){
  return Buffer.alloc(PACKET_SIZE - data.length - 1, '0').toString() + "X";
}

function fill2Bytes(number) {
  return ("0000" + number.toString(16)).toUpperCase().slice(-4);
}

function fill4Bytes(number) {
  return ("00000000" + number.toString(16)).toUpperCase().slice(-8);
}

ipcMain.on('serial-req', (event, arg) => {
  let isValid = true;
  let packet = "T" // For testing

  if (arg.event === "test-packet-loss") {
    // Run packtet lost test
    // Format: ['P'][2B Packet Size][2B Number of packet][2B Period]['00..0']['X']
    packet += "P";
    packet += fill2Bytes(arg.packetSize);
    packet += fill2Bytes(arg.numPackets);
    packet += fill2Bytes(arg.period);
  } else if (arg.event === "blink-nodes") {
    // Format: ['B']
    packet += "B";
  } else if (arg.event === "list-nodes") {
    // Format: ['L']
    packet += "L";
  } else if (arg.event === "indentify-node") {
    // FormatL ['I'][2B Node Addr]
    packet += "I";
    packet += fill2Bytes(arg.nodeAddr);
  } else {
    isValid = false;
  }

  if (isValid) {
    packet += fillRemainPacket(packet);
    console.log(packet);
    console.log(packet.length);
  }

  if (isValid) {
    if (arg.portID) {
      let ret = serial.write(arg.portID, packet);
      if (ret.status === "success") {
        event.returnValue = { status: "success" };
      } else {
        event.returnValue = { status: "error", log: ret.log };
      }
    } else {
      event.returnValue = { status: "error", log: "Port is not available!" };
    }
  }

})

//******************************************************************************
//   EXPORT
//******************************************************************************
module.exports = {
  fill2Bytes,
  fill4Bytes
};
