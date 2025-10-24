const express = require('express');
const { SerialPort } = require('serialport'); // Using your confirmed working import
const { default: open } = require('open');
const path = require('path');
const ModbusRTU = require('modbus-serial');

const app = express();
const port = 3000;

let modbusClient = null;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// This endpoint is from YOUR working code and is correct.
app.get('/api/ports', async (req, res) => {
  try {
    const ports = await SerialPort.list();
    res.json(ports);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.post('/api/connect', async (req, res) => {
  const { portPath, baudRate } = req.body;

  if (modbusClient) {
    modbusClient.close(() => {});
  }

  try {
    modbusClient = new ModbusRTU();

    // CHANGE #1: Added the checkCRC: false option here.
    const connectOptions = {
       baudRate: parseInt(baudRate, 10),
       checkCRC: false
    };
    await modbusClient.connectRTUBuffered(portPath, connectOptions);

    await modbusClient.setTimeout(1000);
    res.json({ success: true, message: `Connected to ${portPath}` });
  } catch (err) {
    modbusClient = null;
    res.status(500).send({ error: `Failed to connect: ${err.message}` });
  }
});

app.post('/api/disconnect', async (req, res) => {
  if (modbusClient && modbusClient.isOpen) {
    modbusClient.close(() => {});
  }
  modbusClient = null;
  res.json({ success: true, message: 'Disconnected' });
});

app.post('/api/vfd', async (req, res) => {
  if (!modbusClient || !modbusClient.isOpen) {
    return res.status(400).send({ error: 'Not connected. Please connect first.' });
  }

  const { slaveId, action, payload } = req.body;

  try {
    modbusClient.setID(parseInt(slaveId, 10));
    let response;

    switch (action) {
      case 'get-live-status':

        // FINAL ARCHITECTURE: The server now only fetches one part at a time, as requested by the client.
        const part = payload.part;
        let startAddress, length;

        console.log("Polling: " + part)

        switch(part) {
            case 1: startAddress = 0; length = 4; break;   // Freq, Current, Speed
            case 2: startAddress = 4; length = 4; break;   // Voltages, Temp
            case 3: startAddress = 8; length = 3; break;   // PID, Fault
            default: throw new Error('Invalid data part requested.');
        }

        response = await modbusClient.readInputRegisters(startAddress, length);

        if (!response || !response.data) {
          throw new Error(`Invalid response for data part ${part}.`);
        }
        // Simply send the raw data back. The client will handle it.
        res.json({ success: true, data: response.data, part: part });
        break;

      // All other cases below are from your working code and remain correct.
      case 'read-holding-registers':
        const { readAddress, readLength = 1 } = payload;
        response = await modbusClient.readHoldingRegisters(parseInt(readAddress, 16), readLength);

        if (!response || !response.data || response.data.length < readLength) {
            throw new Error(`Invalid response for register ${readAddress}.`);
        }
        res.json({ success: true, data: response.data });
        break;

      case 'set-state':
        const { state } = payload;
        let coilAddress;
        if (state === 'forward') coilAddress = 0x0049;
        else if (state === 'reverse') coilAddress = 0x004A;
        else if (state === 'stop')    coilAddress = 0x004B;

        if (coilAddress !== undefined) {
          response = await modbusClient.writeCoil(coilAddress, true);
          res.json({ success: true, response });
        } else {
          throw new Error('Invalid state provided');
        }
        break;

      case 'write-register':
        const { address, value } = payload;
        response = await modbusClient.writeRegister(parseInt(address, 16), parseInt(value, 10));
        res.json({ success: true, response });
        break;

      default:
        res.status(400).send({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  open(`http://localhost:${port}`);
});

console.log("Started hahahaget-live-status")
