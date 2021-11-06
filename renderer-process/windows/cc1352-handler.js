const {ipcRenderer} = require('electron')
var serial = require("./serial-handler");

const COLLECTOR_PORT_IDX = 0; // Collector port ID always 0
const COLLECTOR_PORTS_LOG_IDX = [1, 2, 3, 4]
var enableShowRawSensorData = true
let systemTreeTable = document.getElementById("system-tree-table")
var currentAllNodes = []
var blinkButton = document.getElementById("blink-nodes-btn")
var blinkTimer = null;
var packetLossBtn = document.getElementById("start-packet-loss-btn");

//******************************************************************************
//   CODE
//******************************************************************************
var portManager = {
  0: { button: undefined, portID: 'port-0' },
  1: { button: undefined, portID: 'port-1' },
  2: { button: undefined, portID: 'port-2' },
  3: { button: undefined, portID: 'port-3' },
  4: { button: undefined, portID: 'port-4' },
};


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
  Toan Huynh, 11/06/2021
*******************************************************************************/
function getPortBtn(portID) {
  for (var port in portManager) {
    if (portID == "port-" + port) {
      return document.getElementById("port-" + port + "-btn")
    }
  }
  return null;
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
function enableAllBtn() {
  document.querySelectorAll("#system-monitor-table button").forEach((elem) => {
    elem.disabled = false;
  });
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
function disableAllBtn() {
  document.querySelectorAll("#system-monitor-table button").forEach((elem) => {
    elem.disabled = true;
  });

  let port = getPortBtn(COLLECTOR_PORT_IDX);

  if (port) {
    port.disabled = false;
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
function connectReq(portIdx, portBtn, type) {
  if (serial.connectReq(portIdx, portBtn, type)) {
    if (portIdx == COLLECTOR_PORT_IDX) {
      enableAllBtn();
      actionReq(portIdx, "list-nodes");
    }
  } else {
    if (portIdx == COLLECTOR_PORT_IDX) {
      disableAllBtn();
    }
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

  return serial.actionReq(portIdx, req);

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

  document.getElementById('nodeAddrs').innerHTML = serial.fillOptions(nodes);
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
function calMaxNumCols(data) {
  let maxNumCols = 0

  for (let branch of data) {
    let size = branch.childs ? branch.childs.length + 1: 1;
    maxNumCols = size > maxNumCols ? size : maxNumCols;
  }

  return maxNumCols
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
        serial.showOnScreen(arg.portID, data);
      }

    } else if(arg.data.event === "test-packet-loss"){
      if (arg.data.type === "progress") {
        let status = arg.data.status ? "success" : "failed"
        let data = "Test Packet Loss Send Packet#" + arg.data.packetIdx + " - Status: " + status
        serial.showOnScreen(arg.portID, data)
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

        serial.showOnScreen(arg.portID, data)

        packetLossBtn.innerHTML = "Start";
      }
    }
  }
}


//******************************************************************************
//   Button Handler
//******************************************************************************
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
document.getElementById('show-raw-data').addEventListener( 'change', function() {
  enableShowRawSensorData = this.checked ? true : false
});

//******************************************************************************
//   PORT HANDLER
//******************************************************************************

//******************************************************************************
//   Start-up
//******************************************************************************
function addEventListener(portIdx, type){
  let btn = document.getElementById("port-" + portIdx + "-btn");

  btn.addEventListener("click", () => {
    connectReq(portIdx, btn, type);
  });
}

for (var port in portManager) {
  if(port == COLLECTOR_PORT_IDX){
    let colBtn = document.getElementById("port-" + port + "-btn");

    if (serial.checkPortConnected(port, colBtn)) {
      enableAllBtn();
      serial.updatePortStatus("connected", colBtn);
      actionReq(port, "list-nodes");
    } else {
      serial.updatePortStatus("disconnected", colBtn);
      disableAllBtn();
    }

    addEventListener(port, "raw")
  } else {
    addEventListener(port, "string")
  }
}

//******************************************************************************
//   SERIAL HANDLER
//******************************************************************************
let portIDList = COLLECTOR_PORTS_LOG_IDX.map((port) => "port-" + port);

ipcRenderer.on("serial-data", (event, arg) => {
  switch (true) {
    case arg.portID === "port-" + COLLECTOR_PORT_IDX:
      processCollectorData(arg);
      break;
    case portIDList.includes(arg.portID):
      serial.showOnScreen(arg.portID, arg.data);
      break;
  }
});

ipcRenderer.on("serial-event", (event, arg) => {
  console.log(arg);
  switch (true) {
    case arg.event == "error":
    case arg.event == "close":
      //{event: "error", portID: portID}
      let button = getPortBtn(arg.portID);
      if (button) {
        serial.updatePortStatus("disconnected", button);
      }
    break;
  }
});

