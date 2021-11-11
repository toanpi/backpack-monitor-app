
module.exports = {processRawData}

var flirCamHandler = require('./flir-cam-process')
var collector = require('./collector-handler')

const START_PACKET = 'S'

// Opcode
const LIST_NODE_CODE = 'L'
const SENSOR_DATA_CODE = 'D'
const TEST_PACKET_LOSS_DATA_OPCODE = 'P'
const LEPTON_CAM_PGM_IMAGE_OPCODE = 'C'

const HEADER_SIZE = 10
const FOOTER_SIZE = 2

/*******************************************************************************
Function:
  ()
Input Parameters:
  ---
Output Parameters:
  ---
Description:
  ---
Notes:
  ---
Author, Date:
  Toan Huynh, 11/05/2021
*******************************************************************************/
/*
  Packet format (ASCII):
    [S][Opcode][Source Addr 0xXXXX][Data length 0xXXXX][Data][\n\r]

    Opcode:
  'L' List nodes
    Data:
    [2B Number of nodes][Address block size][2B addr][2B addr]..[2B addr]...

*/
function packageVerify(data){

  if (data[0] != START_PACKET || data.length <= 10) {
    return false;
  }

  let header = data.slice(2, 10)

  try {
    let buffer = Buffer.alloc(header.length / 2, header, "hex");
    let dataSize = buffer.readUInt16LE(2) * 2;
    let raw = data.slice(HEADER_SIZE);
    let actualSize = raw.length;
    return dataSize === actualSize;
  } catch (error) {
    return false;    
  }
}

/*******************************************************************************
Function:
  ()
Input Parameters:
  ---
Output Parameters:
  ---
Description:
  ---
Notes:
  ---
Author, Date:
  Toan Huynh, 11/05/2021
*******************************************************************************/
function headerParser(data){

  let header = data.slice(2, 10)
  let buffer = Buffer.alloc(header.length / 2, header, "hex");

  return {
    dataSize: buffer.readUInt16LE(2),
    sourceAddr:  buffer.readUInt16LE(0),
    opcode: data[1]
  }
}

/*******************************************************************************
Function:
  ()
Input Parameters:
  ---
Output Parameters:
  ---
Description:
  ---
Notes:
  ---
Author, Date:
  Toan Huynh, 11/05/2021
*******************************************************************************/
function processRawData(data) {
  let ret = {}

  if (!packageVerify(data)) {
    // console.log(data)
    // console.error("Invalid package!");
    return { log: data.length < 5000 ? data : "" };
  }

  let header = headerParser(data)
  let dataBuffer = Buffer.alloc(
    data.slice(HEADER_SIZE).length / 2,
    data.slice(HEADER_SIZE),
    "hex"
  );

  switch(header.opcode){
    case LIST_NODE_CODE:
      ret = collector.processListNodes(dataBuffer);
    break;
    case SENSOR_DATA_CODE:
      ret = collector.processSensorData(header.sourceAddr, dataBuffer, data.slice(HEADER_SIZE))
    break;
    case TEST_PACKET_LOSS_DATA_OPCODE:
      ret = collector.processTestPAcketLoss(dataBuffer, data.slice(HEADER_SIZE))
    break;
    case LEPTON_CAM_PGM_IMAGE_OPCODE:
      ret = flirCamHandler.processCamRawImage(data.slice(HEADER_SIZE), header.dataSize)
    break;
    default:
      ret = {log: data.length < 5000 ? data : ""}
    break;
  }

  return ret
}
