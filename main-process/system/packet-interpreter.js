
module.exports = {processRawData}

const START_PACKET = 'S'

// Opcode
const LIST_NODE_CODE = 'L'
const SENSOR_DATA_CODE = 'D'
const TEST_PACKET_LOSS_DATA_OPCODE = 'P'

const HEADER_SIZE = 10
const FOOTER_SIZE = 2
/* 
Opcode:
'L' List nodes
  Data:
  [2B Number of nodes][2B Address block size][2B addr][2B addr]..[2B addr]...
*/

function isDirectNode(nodeAddr, addrBlockSize){
  return nodeAddr % addrBlockSize  === 0
}

function getParent(nodeAddr, addrBlockSize){
  return nodeAddr - nodeAddr % addrBlockSize
}

function processListNodes(buffer) {
  let numNodes = buffer.readUInt16LE(0);
  let addrBlockSize = buffer.readUInt16LE(2);

  let ret = {
    event: "list",
    systemTree: [],
    allNodes: [],
  };

  var allNodeAddresses = [];

  for (let i = 0; i < numNodes; i++) {
    allNodeAddresses.push(buffer.readUInt16LE(4 + i * 2))
  }

  // Ascending sort
  allNodeAddresses.sort((a, b) => a - b);

  Object.assign(ret.allNodes, allNodeAddresses);

  for (let i = 0; i < allNodeAddresses.length; i++) {
    if (isDirectNode(allNodeAddresses[i], addrBlockSize)) {
      let branch = { addr: allNodeAddresses[i], childs: [] };
      ret.systemTree.push(branch);
    } else {
      let lastBranchAddr = ret.systemTree[ret.systemTree.length - 1];
  
      if (
        lastBranchAddr && lastBranchAddr.addr === getParent(allNodeAddresses[i], addrBlockSize)
      ) {
        lastBranchAddr.childs.push(allNodeAddresses[i]);
      } else {
        //Error: orphan nodes
      }
    }
  }

  return ret;
}

function processSensorData(sensorAddr, data, raw) {
  
  let ret = {
    event: "sensor-data",
    addr: sensorAddr,
    raw: raw,
  };

  return ret;
}

var TEST_PACKET_LOSS_PROGRESS_OPCODE = 0
var TEST_PACKET_LOSS_RESULT_OPCODE = 1

function processTestPAcketLoss(buffer, data) {
  let opcode = buffer[0]
  let ret = null;

  switch(opcode)
  {
    // Progress 
    // [1B 0][2B Packet Number][1B status]
    case TEST_PACKET_LOSS_PROGRESS_OPCODE:
      ret = {
        event: "test-packet-loss",
        type: "progress",
        packetIdx: buffer.readUInt16LE(1),
        status:  buffer.readUInt8(3)
      };
    break;

    // Result
    // [1B 1][2B node address][2B numPacketSent][2B numPacketReceived][1B status]
    case TEST_PACKET_LOSS_RESULT_OPCODE:
      ret = {
        event: "test-packet-loss",
        type: "result",
        nodeAddr: buffer.readUInt16LE(1),
        numPacketSent: buffer.readUInt16LE(3),
        numPacketReceived: buffer.readUInt16LE(5),
        status: buffer.readUInt8(7),
      };
    break;
  }

  console.log(ret)

  return ret;
}

/*
  Packet format (ASCII):
    [S][Opcode][Source Addr 0xXXXX][Data length 0xXXXX][Data][\n\r]

    Opcode:
  'L' List nodes
    Data:
    [2B Number of nodes][Address block size][2B addr][2B addr]..[2B addr]...

*/
function packageVerify(data){

  if (data[0] != START_PACKET) {
    return false;
  }

  let header = data.slice(2, 10)
  let buffer = Buffer.alloc(header.length / 2, header, "hex");

  let dataSize = buffer.readUInt16LE(2);

  if (dataSize * 2 != data.slice(HEADER_SIZE).length) {
    return false;
  }

  return true;
}

function headerParser(data){

  let header = data.slice(2, 10)
  let buffer = Buffer.alloc(header.length / 2, header, "hex");

  return {
    dataSize: buffer.readUInt16LE(2),
    sourceAddr:  buffer.readUInt16LE(0),
    opcode: data[1]
  }
}

function processRawData(data) {
  let ret = {}

  if(!packageVerify(data)){
    return {}
  }

  let header = headerParser(data)
  let dataBuffer = Buffer.alloc(
    data.slice(HEADER_SIZE).length / 2,
    data.slice(HEADER_SIZE),
    "hex"
  );

  switch(header.opcode){
    case LIST_NODE_CODE:
      ret = processListNodes(dataBuffer);
    break;
    case SENSOR_DATA_CODE:
      ret = processSensorData(header.sourceAddr, dataBuffer, data.slice(HEADER_SIZE))
    break;
    case TEST_PACKET_LOSS_DATA_OPCODE:
      ret = processTestPAcketLoss(dataBuffer, data.slice(HEADER_SIZE))
    break;

  }

  return ret
}
