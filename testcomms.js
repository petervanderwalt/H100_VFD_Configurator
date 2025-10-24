const ModbusRTU = require('modbus-serial');

// --- START: CONFIGURE THESE VALUES ---
const SERIAL_PORT = 'COM10'; // Your actual COM port
const BAUD_RATE = 19200;    // Must match your VFD's setting (F164)
const SLAVE_ID = 2;         // Must match your VFD's setting (F163)
const POLL_INTERVAL_MS = 1000; // How often to request data (1000ms = 1 second)
// --- END: CONFIGURE THESE VALUES ---

const client = new ModbusRTU();

async function pollVfdData() {
    try {
        // CORRECTION: Using readInputRegisters (FC 04) at address 0, as confirmed by the grblHAL plugin.
        // We will read 8 registers to get all the primary dynamic values.
        const response = await client.readInputRegisters(0, 8);

        if (!response || !response.data || response.data.length < 8) {
            throw new Error('Invalid or incomplete response from VFD.');
        }

        const data = response.data;

        const status = {
            outputFrequency: (data[0] / 10.0).toFixed(1),
            setFrequency: (data[1] / 10.0).toFixed(1),
            outputCurrent: (data[2] / 10.0).toFixed(1),
            outputSpeed: data[3],
            dcVoltage: (data[4] / 10.0).toFixed(1),
            acVoltage: (data[5] / 10.0).toFixed(1),
            temperature: data[6],
            counter: data[7],
        };

        console.clear();
        console.log(`--- VFD Live Data Poll @ ${new Date().toLocaleTimeString()} ---`);
        console.log(`COM Port: ${SERIAL_PORT} | Slave ID: ${SLAVE_ID}`);
        console.log('--------------------------------------------------');
        console.log(`Output Frequency:    ${status.outputFrequency} Hz`);
        console.log(`Set Frequency:       ${status.setFrequency} Hz`);
        console.log(`Output Current:      ${status.outputCurrent} A`);
        console.log(`Output Speed:        ${status.outputSpeed} RPM`);
        console.log(`DC Bus Voltage:      ${status.dcVoltage} V`);
        console.log(`AC Input Voltage:    ${status.acVoltage} V`);
        console.log(`VFD Temperature:     ${status.temperature} °C`);
        console.log(`Counter Value:       ${status.counter}`);
        console.log('--------------------------------------------------');
        console.log('Press Ctrl+C to stop polling.');

    } catch (e) {
        console.error(`\nPOLL FAILED: ${e.message}\nRetrying in ${POLL_INTERVAL_MS / 1000}s...`);
    }
}

// Main function to start the script (remains the same)
async function startPolling() {
    try {
        console.log(`Attempting to connect to ${SERIAL_PORT}...`);
        await client.connectRTUBuffered(SERIAL_PORT, { baudRate: BAUD_RATE });
        client.setID(SLAVE_ID);
        await client.setTimeout(1000);
        console.log('✅ Connection successful! Starting poll...');
        setInterval(pollVfdData, POLL_INTERVAL_MS);
    } catch (e) {
        console.error('❌ FAILED TO CONNECT:', e.message);
    }
}

process.on('SIGINT', () => {
    console.log('\nStopping poll and closing port...');
    if (client.isOpen) client.close();
    process.exit();
});

startPolling();
