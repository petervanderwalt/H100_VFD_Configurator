# H100 VFD Dashboard & Configuration Tool

A high-performance web-based dashboard for monitoring and configuring H100 Series Variable Frequency Drives (VFD) via Modbus RTU. Features real-time graphing, live gauges, and full parameter access.

## Quick Start

### 1. Prerequisites
Ensure you have Node.js installed on your system.
- Download it from: [nodejs.org](https://nodejs.org/)

### 2. Installation
Clone this repository and enter the directory:

```bash
git clone https://github.com/petervanderwalt/H100_VFD_Configurator
cd H100_VFD_Configurator
```

### 3. Install Dependencies
Run the following command to install the required Modbus and Serial libraries:

```bash
npm install
```

### 4. Launch
Start the server:

```bash
node server.js
```
The application will automatically open your default web browser to http://localhost:3000.

---

## How to Use

### Connecting to the VFD
1. **Select Port**: Choose your RS485/USB Serial adapter from the dropdown list.
2. **Baud Rate**: Ensure this matches your VFD setting (Default is usually 19200).
3. **Slave ID**: Match the Modbus Address / ID set in your VFD (Default is often 1 or 2).
4. Click **Connect**. The status indicator will turn green once live communication is established.

### Spindle Control
- **Setting Speed**: Enter your desired RPM in the **Target RPM** field and click **Apply**.
- **Start/Stop**: Use the **Forward**, **Reverse**, and **Stop** buttons to control the motor.
- **Persistence**: The dashboard remembers your last used RPM and connection settings even after a page refresh.

### Real-Time Monitoring
- **Gauges**: Instantly monitor Current (Amps), Power (kW), and Speed (RPM).
- **History Graph**: Track Motor Load % and Actual RPM over time to see how your spindle handles different cutting loads.
- **Live Status**: View detailed diagnostics like DC Bus Voltage, Heatsink Temperature, and Fault Codes.

### Parameter Configuration
- **Read All**: Click **Read All Parameters** to pull the current configuration from the VFD memory.
- **Modify**: Edit values in the table and click **Write** to update specific registers.

---

## Safety Warning
Modbus control allows direct manipulation of motor speeds and directions. Always ensure your emergency stop (E-Stop) is functional and within reach before operating the spindle via software.

---

## License
MIT
