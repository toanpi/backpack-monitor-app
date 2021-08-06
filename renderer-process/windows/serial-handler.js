const {ipcRenderer} = require('electron')
const {dialog} = require('electron').remote

let systemTreeTable = document.getElementById("system-tree-table")

var enableShowRawSensorData = true

//******************************************************************************
//   System Configuration
//******************************************************************************

function fillOptions(dataArray) {
  var options = '';

  for (var i = 0; i < dataArray.length; i++) {
    options += '<option value="' + dataArray[i] + '" />';
  }
  return options
}


// Baud rate
var baudRates = [9600, 14400, 19200, 38400, 57600, 115200];
document.getElementById('baurdrates').innerHTML = fillOptions(baudRates);

function enableAllBtn() {
  document.querySelectorAll("#system-monitor-table button").forEach((elem) => {
    elem.disabled = false;
  });
}


function disableAllBtn(){
  document.querySelectorAll('#system-monitor-table button').forEach(elem => {
    elem.disabled = true;
  });
  
  port0Btn.disabled = false
  
}

//******************************************************************************
//   Serial Handler
//******************************************************************************
function connectReq(portIdx, portBtn, type) {
  portBtn.disabled = true;
  let event = 'connect';

  if(portBtn.innerHTML === 'Connect'){
    event = 'connect';
  } else {
    event = 'disconnect';
  }

  const reply = ipcRenderer.sendSync("serial-event", {
    event: event,
    port: parseInt(document.getElementById("port-" + portIdx).value),
    baudRate: parseInt(document.getElementById("baudrate-" + portIdx).value),
    portID: "port-" + portIdx,
    type: type
  });

  console.log(reply);

  if (reply && reply.status === "connected") {
    portBtn.innerHTML = "Disconnect";
    enableAllBtn();
    actionReq(0, "list-nodes");
  } else if (reply && reply.status === "disconnected") {
    portBtn.innerHTML = "Connect";
    disableAllBtn();
  }

  portBtn.disabled = false
}

function checkPort(portIdx, portBtn){

  const reply = ipcRenderer.sendSync("serial-event", {
    event: 'check-port',
    portID: "port-" + portIdx,
  });

  if (reply && reply.status === "connected") {
    portBtn.innerHTML = "Disconnect";
    enableAllBtn();
    actionReq(0, "list-nodes");
  } else if (reply && reply.status === "disconnected") {
    portBtn.innerHTML = "Connect";
    disableAllBtn();
  }
}

function actionReq(portIdx, event) {
  let req = null

  if (event === "test-packet-loss") {
    let packetSize = parseInt(document.getElementById("test-paclet-loss-packet-size").value)
    let numPackets =  parseInt(document.getElementById("test-paclet-loss-packet-num").value)
    let period = parseInt(document.getElementById("test-paclet-loss-period").value)

    if (!isNaN(packetSize) && !isNaN(numPackets) && !isNaN(period)) {
      req = {
        event: event,
        numPackets: numPackets,
        packetSize: packetSize,
        period: period,
        portID: "port-" + portIdx,
      };
    }
   } else if (event === "test-packet-loss-stop") {
      req = {
        event: "test-packet-loss",
        numPackets: 0,
        packetSize: 0,
        period: 0,
        portID: "port-" + portIdx,
      };
  } else if (event === "blink-nodes") {
    req = {
      event: event,
      portID: "port-" + portIdx,
    };
  } else if (event === "list-nodes") {
    req = {
      event: event,
      portID: "port-" + portIdx,
    };
  } else if (event === "indentify-node") {
    let nodeAddr = parseInt(document.getElementById("identify-node-addr").value, 16)
    if(!isNaN(nodeAddr)){
      req = {
        event: event,
        nodeAddr: nodeAddr,
        portID: "port-" + portIdx,
      }
    }
  }

  if(req){
    const reply = ipcRenderer.sendSync("serial-req", req);
    console.log(reply);
  
    if(reply.status != "success") {
      dialog.showErrorBox(reply.log, '')
    } 
  } else {
    dialog.showErrorBox(`Argument is invalid!` , '')
  }
}


ipcRenderer.on('serial-event', (event, arg) => {
  console.log(arg);
  
  if(arg.event === 'list'){
    document.getElementById('ports').innerHTML = fillOptions(arg.data);
  }
})

function showOnScreen(portID, data){
  var textarea = document.getElementById(portID + "-screen");
  textarea.innerHTML += "\n" + data;
  textarea.scrollTop = textarea.scrollHeight;
}

var currentAllNodes = []

function processCollectorData(arg){
  console.log(arg.data)

  if(arg.data){

    if(arg.data.event === 'list'){
      console.log(currentAllNodes)
      // If tree is changed
      if (currentAllNodes != "" + arg.data.allNodes) {

        var rowCount = systemTreeTable.rows.length;

        for (var x = rowCount - 1; x >= 0; x--) {
          systemTreeTable.deleteRow(x);
        }

        generateTable(systemTreeTable, arg.data.systemTree);

        currentAllNodes = arg.data.allNodes;
        fillNodesList(arg.data.systemTree);
      }
    } else if (arg.data.event === "sensor-data"){
      let raw =  arg.data.raw.toString('hex')
      let data =  "0x" + arg.data.addr.toString(16) + "(" + (raw.length / 2)  + "): " + raw

      if (enableShowRawSensorData) {
        showOnScreen(arg.portID, data);
      }

    } else if(arg.data.event === "test-packet-loss"){
      if (arg.data.type === "progress") {
        let status = arg.data.status ? "success" : "failed"
        let data = "Test Packet Loss Send Packet#" + arg.data.packetIdx + " - Status: " + status
        showOnScreen(arg.portID, data)
      } else if (arg.data.type === "result") {
        let successRate = 0;

        if(arg.data.numPacketSent){
          successRate = 100 * arg.data.numPacketReceived /  arg.data.numPacketSent
        }

        let data = "Test Packet Error!"

        if(arg.data.status){
          data = "Node 0x" + arg.data.nodeAddr.toString(16) + 
                 ": Received=" + arg.data.numPacketReceived + 
                 " - Send=" + arg.data.numPacketSent + 
                 " - rate=" + successRate + "%"
        }

        showOnScreen(arg.portID, data)

        packetLossBtn.innerHTML = "Start";
      }
    }
  }
}

ipcRenderer.on('serial-data', (event, arg) => {
  if (arg.portID === "port-0") { // From collector
    processCollectorData(arg)
  } else {
    var textarea = document.getElementById(arg.portID + "-screen");
    textarea.innerHTML += "\n" + arg.data;
    textarea.scrollTop = textarea.scrollHeight;
  }
})


//******************************************************************************
//   Button Handler
//******************************************************************************
port0Btn = document.getElementById("port-0-btn")
port0Btn.addEventListener("click", () => {
  connectReq(0, port0Btn, 'raw');
});

port1Btn = document.getElementById("port-1-btn")
port1Btn.addEventListener("click", () => {
  connectReq(1, port1Btn, 'string');
});

port2Btn = document.getElementById("port-2-btn")
port2Btn.addEventListener("click", () => {
  connectReq(2, port2Btn, 'string');
});

port3Btn = document.getElementById("port-3-btn")
port3Btn.addEventListener("click", () => {
  connectReq(3, port3Btn, 'string');
});

port4Btn = document.getElementById("port-4-btn")
port4Btn.addEventListener("click", () => {
  connectReq(4, port4Btn, 'string');
});

var blinkButton = document.getElementById("blink-nodes-btn")
var blinkTimer = null;

blinkButton.addEventListener("click", () => {

  let interval = parseInt(document.getElementById("blink-nodes-period").value);

  if (blinkButton.innerHTML === "Start") {
    clearInterval(blinkTimer);

    if (!isNaN(interval)) {
      blinkButton.innerHTML = "Stop";

      actionReq(0, "blink-nodes");

      blinkTimer = setInterval(function () {
        actionReq(0, "blink-nodes");
      }, interval);

    } else {
      dialog.showErrorBox(`Period is invalid!` , '')
    }
  } else {
    // Stop blink 
    blinkButton.innerHTML = "Start";
    clearInterval(blinkTimer);
  }
  
});

document.getElementById("indentify-node-btn").addEventListener("click", () => {
  actionReq(0, "indentify-node")
});

var packetLossBtn = document.getElementById("start-packet-loss-btn");

packetLossBtn.addEventListener("click", () => {
  
  if (packetLossBtn.innerHTML === "Start") {
    packetLossBtn.innerHTML = "Stop";
    actionReq(0, "test-packet-loss");
  } else {
    // Stop test
    packetLossBtn.innerHTML = "Start";
    actionReq(0, "test-packet-loss-stop");
  }
  
});

document.getElementById('show-raw-data').addEventListener( 'change', function() {
  enableShowRawSensorData = this.checked ? true : false
});

//******************************************************************************
//   
//******************************************************************************

function fillNodesList(tree){
  let nodes = []

  for (let branch of tree) {

    if(branch.addr){
      nodes.push(branch.addr)
      if(branch.childs){
        nodes = nodes.concat(branch.childs)
      }
    }
  }

  for (var i = 0; i < nodes.length; i++) {
    nodes[i] = "0x" + nodes[i].toString(16);
  }

  document.getElementById('nodeAddrs').innerHTML = fillOptions(nodes);
}

function calMaxNumCols(data) {
  let maxNumCols = 0

  for (let branch of data) {
    let size = branch.childs ? branch.childs.length + 1: 1;
    maxNumCols = size > maxNumCols ? size : maxNumCols;
  }

  return maxNumCols
}

function generateTable(table, data) {
  let maxNumCols = calMaxNumCols(data);

  for (let branch of data) {

    let size = branch.childs ? branch.childs.length + 1: 1;

    if (branch.addr) {
      // Header of branch
      let row = table.insertRow();
      let cell = row.insertCell();
      let func = ""
      // let func = branch.childs ? " R" : ""
      let text = document.createTextNode("0x" + branch.addr.toString(16) + func);
      cell.appendChild(text);

      // Leaves of branch
      if (branch.childs) {
        if (branch.childs.length) {
          for (let child of branch.childs) {
            let _cell = row.insertCell();
            let _text = document.createTextNode("0x" + child.toString(16));
            _cell.appendChild(_text);
          }
        } else {
          // The router have no child
        }
      } else {
        // This is end device
      }

      // Fill null remain cell
      for (var i = 0; i < maxNumCols - size; i++) {
        row.insertCell();
      }

    }
  }
}

//******************************************************************************
//   Start-up
//******************************************************************************
checkPort(0, port0Btn);

