$(document).ready(function() {
    // The master list of all VFD parameters, based on the H100 manual.
    const vfdParameters = [
        // 5.1 Basic Function Parameters (F000-F022)
        { code: 'F000', address: '0000', name: 'Parameter locking', desc: '0: Invalid, 1: Valid. Locks parameters from being changed.' },
        { code: 'F001', address: '0001', name: 'Control mode', desc: '0: keyboard, 1: External terminal, 2: Communication port.' },
        { code: 'F002', address: '0002', name: 'Frequency setting selection', desc: '0: keyboard, 1: AI1, 2: Comm port, 3: Potentiometer, 4: AI2, 5: PFI, 6: AI1+AI2, 7: PID' },
        { code: 'F003', address: '0003', name: 'Main frequency', desc: 'The frequency (in Hz x 10) stored in VFD memory (EEPROM).' },
        { code: 'F004', address: '0004', name: 'Reference frequency', desc: 'Motor\'s rated frequency from nameplate (e.g., 50.0Hz).' },
        { code: 'F005', address: '0005', name: 'Maximum operating frequency', desc: 'Sets the upper speed limit for the motor.' },
        { code: 'F006', address: '0006', name: 'Intermediate frequency', desc: 'Intermediate frequency point for V/F curve.' },
        { code: 'F007', address: '0007', name: 'Minimum frequency', desc: 'The lowest frequency the VFD will run at.' },
        { code: 'F008', address: '0008', name: 'Maximum voltage', desc: 'Motor\'s rated voltage from its nameplate.' },
        { code: 'F009', address: '0009', name: 'Intermediate voltage 1', desc: 'Intermediate voltage point for V/F curve.' },
        { code: 'F010', address: '000A', name: 'Low-frequency torque boost voltage', desc: 'Increases voltage at low speeds to improve starting torque.' },
        { code: 'F011', address: '000B', name: 'Lower frequency limit', desc: 'The absolute minimum frequency the VFD can be set to.' },
        { code: 'F012', address: '000C', name: 'Drive control mode', desc: '0:VF, 1:Vector control, 2:V2F, 3:VF separation' },
        { code: 'F013', address: '000D', name: 'Parameter resetting', desc: 'Set to 08 to restore ex-factory values.' },
        { code: 'F014', address: '000E', name: 'Acceleration time I', desc: 'Time in seconds to accelerate from 0Hz to Max Frequency.' },
        { code: 'F015', address: '000F', name: 'Deceleration time I', desc: 'Time in seconds to decelerate from Max Frequency to 0Hz.' },
        { code: 'F016', address: '0010', name: 'Acceleration time II', desc: 'Second acceleration time setting.' },
        { code: 'F017', address: '0011', name: 'Deceleration time II', desc: 'Second deceleration time setting.' },
        { code: 'F018', address: '0012', name: 'Acceleration time III', desc: 'Third acceleration time setting.' },
        { code: 'F019', address: '0013', name: 'Deceleration time III', desc: 'Third deceleration time setting.' },
        { code: 'F020', address: '0014', name: 'Acceleration time IV (jogging)', desc: 'Acceleration for jogging mode.' },
        { code: 'F021', address: '0015', name: 'Deceleration time IV (jogging)', desc: 'Deceleration for jogging mode.' },
        { code: 'F022', address: '0016', name: 'Emergency stop deceleration time', desc: 'Deceleration time for emergency stop.' },
        { code: 'F023', address: '0017', name: 'Reverse prohibit', desc: '0: Reverse prohibit, 1: Reverse allow.' },
        { code: 'F024', address: '0018', name: 'Stop key is valid or not', desc: '0: STOP invalid, 1: STOP valid.' },
        { code: 'F025', address: '0019', name: 'Start mode', desc: '0: Start from starting frequency, 1: Frequency tracking start.' },
        { code: 'F026', address: '001A', name: 'Stop mode', desc: '0: Ramp to stop, 1: Coast to stop.' },
        { code: 'F027', address: '001B', name: 'Dead time of positive/negative rotation', desc: 'Dead time for direction change.' },
        { code: 'F028', address: '001C', name: 'Stop frequency', desc: 'Frequency at which output is cut off during deceleration.' },
        { code: 'F029', address: '001D', name: 'Start braking time', desc: 'DC braking time at start.' },
        { code: 'F030', address: '001E', name: 'Stop braking time', desc: 'DC braking time at stop.' },
        { code: 'F031', address: '001F', name: 'DC braking level', desc: 'DC braking voltage level.' },
        { code: 'F032', address: '0020', name: 'Frequency tracking time', desc: 'Time for frequency tracking.' },
        { code: 'F033', address: '0021', name: 'Current tracking frequency level', desc: 'Current level for frequency tracking.' },
        { code: 'F034', address: '0022', name: 'Voltage rise time during frequency tracking', desc: 'Voltage rise time for frequency tracking.' },
        { code: 'F035', address: '0023', name: 'Percentage of start voltage during freq tracking', desc: 'Start voltage percentage for frequency tracking.' },
        { code: 'F036', address: '0024', name: 'Voltage increment during freq tracking', desc: 'Voltage increment for frequency tracking.' },
        { code: 'F039', address: '0027', name: 'Starting frequency of DC BRAKING', desc: 'Frequency at which DC braking starts.' },
        { code: 'F040', address: '0028', name: 'F/R key function selection', desc: 'Defines function of the F/R key on keypad.' },
        { code: 'F041', address: '0029', name: 'Carrier frequency', desc: 'Adjusts PWM frequency. Higher = quieter motor, hotter VFD.' },
        { code: 'F042', address: '002A', name: 'Jogging frequency', desc: 'Frequency for jogging operations.' },
        { code: 'F043', address: '002B', name: 'S curve time', desc: 'Smoothing time for acceleration/deceleration.' },
        { code: 'F044', address: '002C', name: 'FOR(X1)function', desc: 'Function of X1 digital input terminal.' },
        { code: 'F045', address: '002D', name: 'REV(X2)function', desc: 'Function of X2 digital input terminal.' },
        { code: 'F046', address: '002E', name: 'RST(X3)function', desc: 'Function of X3 digital input terminal.' },
        { code: 'F047', address: '002F', name: 'SPH(X4)function', desc: 'Function of X4 digital input terminal.' },
        { code: 'F048', address: '0030', name: 'SPM(X5)function', desc: 'Function of X5 digital input terminal.' },
        { code: 'F049', address: '0031', name: 'SPL(X6)function', desc: 'Function of X6 digital input terminal.' },
        { code: 'F050', address: '0032', name: 'Y1 output function', desc: 'Function of Y1 digital output.' },
        { code: 'F051', address: '0033', name: 'Y2 output function', desc: 'Function of Y2 digital output.' },
        { code: 'F052', address: '0034', name: 'Output function (KA & KC)', desc: 'Function of KA/KC terminals.' },
        { code: 'F053', address: '0035', name: 'Output function (FA, FB & FC terminals)', desc: 'Function of relay output.' },
        { code: 'F054', address: '0036', name: 'AO output function', desc: 'Selects what AO analog output represents.' },
        { code: 'F055', address: '0037', name: 'AO analog output gain', desc: 'Scaling for the AO analog output.' },
        { code: 'F063', address: '003F', name: 'Timer I', desc: 'Duration for Timer I.' },
        { code: 'F064', address: '0040', name: 'Monostable pulse width setting', desc: 'Pulse width for monostable output.' },
        { code: 'F065', address: '0041', name: 'Counter reference value', desc: 'Target value for the counter.' },
        { code: 'F066', address: '0042', name: 'Counter mode setting', desc: 'Configuration for counter behavior.' },
        { code: 'F067', address: '0043', name: 'Digital input terminal Positive & negative logic', desc: '0: NPN, 1: PNP.' },
        { code: 'F068', address: '0044', name: 'Digital input terminal dithering elimination time', desc: 'Debounce time for digital inputs.' },
        { code: 'F069', address: '0045', name: 'PFI/PFO maximum frequency', desc: 'Max frequency for pulse input/output.' },
        { code: 'F070', address: '0046', name: 'Input channel selection for analog quantity', desc: 'Configure AI1 and AI2 input types (voltage/current).' },
        { code: 'F071', address: '0047', name: 'Filtering time of analog quantity', desc: 'Smoothing filter for analog inputs.' },
        { code: 'F072', address: '0048', name: 'AI1 channel gain', desc: 'Scaling gain for AI1.' },
        { code: 'F073', address: '0049', name: 'AI2 channel gain', desc: 'Scaling gain for AI2.' },
        { code: 'F074', address: '004A', name: 'AI1 channel offset', desc: 'Offset for AI1.' },
        { code: 'F075', address: '004B', name: 'AI2 channel offset', desc: 'Offset for AI2.' },
        { code: 'F076', address: '004C', name: 'Selectable negative bias reverse of analog quantity', desc: '0: Irreversible, 1: Reversible.' },
        { code: 'F077', address: '004D', name: 'UP.DOWN memory function selection', desc: '0: Not memorized, 1: Memorized.' },
        { code: 'F078', address: '004E', name: 'UP.DOWN increment selection', desc: 'Step size for UP/DOWN keys.' },
        { code: 'F079', address: '004F', name: 'UP.DOWN increment multiple', desc: 'Multiplier for UP/DOWN step size.' },
        { code: 'F080', address: '0050', name: 'Selection of multi-segment speed mode', desc: 'Configures multi-speed operation.' },
        { code: 'F081', address: '0051', name: 'Internally controlled multi-segment speed selection', desc: 'Operation mode for internal multi-speed sequence.' },
        { code: 'F082', address: '0052', name: 'Speed operation directions of first 8 segments', desc: 'Directions for first 8 multi-speed segments.' },
        { code: 'F083', address: '0053', name: 'Speed operation directions of last 8 segments', desc: 'Directions for last 8 multi-speed segments.' },
        { code: 'F084', address: '0054', name: 'Acceleration/deceleration time of first 8 segments', desc: 'Accel/decel times for first 8 segments.' },
        { code: 'F085', address: '0055', name: 'Acceleration/deceleration time of last 8 segments', desc: 'Accel/decel times for last 8 segments.' },
        { code: 'F086', address: '0056', name: 'Frequency II setting', desc: 'Frequency for speed segment II.' },
        { code: 'F087', address: '0057', name: 'Frequency III setting', desc: 'Frequency for speed segment III.' },
        { code: 'F088', address: '0058', name: 'Frequency IV setting', desc: 'Frequency for speed segment IV.' },
        { code: 'F089', address: '0059', name: 'Frequency V setting', desc: 'Frequency for speed segment V.' },
        { code: 'F090', address: '005A', name: 'Frequency VI setting', desc: 'Frequency for speed segment VI.' },
        { code: 'F091', address: '005B', name: 'Frequency VII setting', desc: 'Frequency for speed segment VII.' },
        { code: 'F092', address: '005C', name: 'Frequency VIII setting', desc: 'Frequency for speed segment VIII.' },
        { code: 'F093', address: '005D', name: 'Frequency IX setting', desc: 'Frequency for speed segment IX.' },
        { code: 'F094', address: '005E', name: 'Frequency X setting', desc: 'Frequency for speed segment X.' },
        { code: 'F095', address: '005F', name: 'Frequency XI setting', desc: 'Frequency for speed segment XI.' },
        { code: 'F096', address: '0060', name: 'Frequency XII setting', desc: 'Frequency for speed segment XII.' },
        { code: 'F097', address: '0061', name: 'Frequency XIII setting', desc: 'Frequency for speed segment XIII.' },
        { code: 'F098', address: '0062', name: 'Frequency XIV setting', desc: 'Frequency for speed segment XIV.' },
        { code: 'F099', address: '0063', name: 'Frequency XV setting', desc: 'Frequency for speed segment XV.' },
        { code: 'F100', address: '0064', name: 'Frequency XVI setting', desc: 'Frequency for speed segment XVI.' },
        { code: 'F117', address: '0075', name: 'Internally controlled multi-segment speed memory', desc: '0: Not memorized, 1: Memorized.' },
        { code: 'F118', address: '0076', name: 'Selection of over-voltage stall', desc: '0: Invalid, 1: Valid.' },
        { code: 'F119', address: '0077', name: 'Stalling level during accelerating', desc: 'Current limit for accel stall prevention.' },
        { code: 'F120', address: '0078', name: 'Stalling level during constant speed', desc: 'Current limit for run stall prevention.' },
        { code: 'F121', address: '0079', name: 'Stalling deceleration time during constant speed', desc: 'Deceleration time for stall prevention.' },
        { code: 'F122', address: '007A', name: 'Prevent of over-voltage stalling level', desc: 'Voltage level for over-voltage prevention.' },
        { code: 'F123', address: '007B', name: 'Selection of over-torque detection mode', desc: 'Configures over-torque detection behavior.' },
        { code: 'F124', address: '007C', name: 'Selection of over-torque detection mode', desc: 'Over-torque detection level.' },
        { code: 'F125', address: '007D', name: 'Over-torque detection level', desc: 'Over-torque detection time.' },
        { code: 'F126', address: '007E', name: 'Over-torque detection time', desc: 'Over-torque detection time.' },
        { code: 'F127', address: '007F', name: 'Pulse counter memory', desc: '0: Not memorized, 1: Memorized.' },
        { code: 'F128', address: '0080', name: 'Cooling fan control', desc: '0: Always on, 1: On with run command.' },
        { code: 'F129', address: '0081', name: 'Dynamic braking voltage', desc: 'Voltage for dynamic braking.' },
        { code: 'F140', address: '008C', name: 'Rated power of motor', desc: 'Motor power in kW from nameplate.' },
        { code: 'F141', address: '008D', name: 'Rated voltage of motor', desc: 'Motor voltage from nameplate.' },
        { code: 'F142', address: '008E', name: 'Rated current of motor', desc: 'Motor current in Amps from nameplate.' },
        { code: 'F143', address: '008F', name: 'Number of motor poles', desc: 'Number of poles in the motor (e.g., 2, 4, 6).' },
        { code: 'F144', address: '0090', name: 'Rated rotating speed of motor', desc: 'Motor RPM at rated frequency from nameplate.' },
        { code: 'F145', address: '0091', name: 'Automatic torque compensation', desc: 'Automatically boosts torque based on load.' },
        { code: 'F146', address: '0092', name: 'Motor no-load current', desc: 'Motor no-load current.' },
        { code: 'F147', address: '0093', name: 'Motor slip compensation', desc: 'Compensation for motor slip.' },
        { code: 'F148', address: '0094', name: 'Motor slip compensation maximum frequency', desc: 'Max frequency for slip compensation.' },
        { code: 'F149', address: '0095', name: 'Motorslip compensation filtering time', desc: 'Filter time for slip compensation.' },
        { code: 'F150', address: '0096', name: 'AVR function', desc: '0: Invalid, 1: Valid. Automatic Voltage Regulation.' },
        { code: 'F151', address: '0097', name: 'Automatic energy-saving function', desc: 'Reduces voltage under light load to save power.' },
        { code: 'F152', address: '0098', name: 'Fault restart time', desc: 'Time before auto-restarting after a fault.' },
        { code: 'F153', address: '0099', name: 'Selection of transient stop restart', desc: '0: Invalid, 1: Frequency tracking.' },
        { code: 'F154', address: '009A', name: 'Allowed power fault time', desc: 'Allowed duration of a power outage.' },
        { code: 'F155', address: '009B', name: 'Times of fault restart', desc: 'Number of times to attempt an auto-restart.' },
        { code: 'F156', address: '009C', name: 'Proportional constant P', desc: 'Proportional gain for PID controller.' },
        { code: 'F157', address: '009D', name: 'Integration time I', desc: 'Integral time for PID controller.' },
        { code: 'F158', address: '009E', name: 'Derivation time D', desc: 'Derivative time for PID controller.' },
        { code: 'F159', address: '009F', name: 'target value', desc: 'Target value for PID controller.' },
        { code: 'F160', address: '00A0', name: 'PID channel setting', desc: 'Configuration for PID input channels and sleep mode.' },
        { code: 'F161', address: '00A1', name: 'PID up limit', desc: 'Upper limit for PID output.' },
        { code: 'F162', address: '00A2', name: 'PID lower limit', desc: 'Lower limit for PID output.' },
        { code: 'F163', address: '00A3', name: 'Communication address', desc: 'Slave ID for Modbus communication. Must match GUI.' },
        { code: 'F164', address: '00A4', name: 'Comm. transmission speed', desc: 'Baud rate. 0:4800, 1:9600, 2:19200, 3:38400.' },
        { code: 'F165', address: '00A5', name: 'Comm. data mode', desc: 'Serial format. Must be 3 for 8N1 RTU mode.' },
        { code: 'F169', address: '00A9', name: 'Given decimal point of communication frequency', desc: 'Sets decimal point position for frequency commands.' },
        { code: 'F181', address: '00B5', name: 'Software version No.', desc: 'Read-only software version.' },
        { code: 'F184', address: '00B8', name: 'RPM display factor', desc: 'Multiplier for speed display.' },
        { code: 'F185', address: '00B9', name: 'Start up preset display selection', desc: 'Selects what is shown on the VFD display at startup.' },
        { code: 'F190', address: '00BE', name: 'Magnetic flux braking enable', desc: '0: Prohibit, 1: Allow.' },
        { code: 'F191', address: '00BF', name: 'Magnetic flux braking strength', desc: 'Strength of flux braking.' },
        { code: 'F192', address: '00C0', name: 'Motor oscillation compensation factor', desc: 'Reduces motor vibration/oscillation.' },
        { code: 'F193', address: '00C1', name: 'Output open-phase protection', desc: '0: Allows, 1: Prohibits. Set to 0 for single-phase motors.' },
        { code: 'F194', address: '00C2', name: '0Hz output enable', desc: '0: Allows, 1: Prohibits output at 0Hz.' },
        { code: 'F195', address: '00C3', name: 'VF separation voltage given channel', desc: 'Channel for V/F separation control.' },
        { code: 'F196', address: '00C4', name: 'Acceleration and deceleration time of VF separation', desc: 'Accel/decel time for V/F separation.' },
        { code: 'F197', address: '00C5', name: 'Motor reverse operation enable when PID output negative', desc: '0: Prohibit, 1: Allow.' },
        { code: 'F198', address: '00C6', name: 'Lsd compensation enable', desc: '0: Invalid, 1: Valid.' },
        { code: 'F199', address: '00C7', name: 'Keyboard UP.DOWN memory function selection', desc: '0: Not memorized, 1: Memorized.' },
    ];

    // --- UI State Management ---
    function setUiConnected(isConnected) {
        if (isConnected) {
            $('#connection-status').removeClass('bg-secondary bg-danger').addClass('bg-success').text('Connected');
            $('#connect-btn').prop('disabled', true);
            $('#disconnect-btn').prop('disabled', false);
            $('#port-select, #baud-rate').prop('disabled', true);
            $('.dashboard-controls').find('button, input').prop('disabled', false);
        } else {
            $('#connection-status').removeClass('bg-success').addClass('bg-secondary').text('Disconnected');
            $('#connect-btn').prop('disabled', false);
            $('#disconnect-btn').prop('disabled', true);
            $('#port-select, #baud-rate').prop('disabled', false);
            $('.dashboard-controls').find('button, input').prop('disabled', true);
        }
    }

    // --- Core Application Logic ---

    // 1. Populate the table on page load
    const tableBody = $('#params-table-body');
    vfdParameters.forEach(p => {
        const row = `
            <tr>
                <td><strong>${p.code}</strong></td>
                <td>${p.name}</td>
                <td><small>${p.desc}</small></td>
                <td><input type="text" class="form-control form-control-sm" id="val-${p.address}" placeholder="--"></td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary write-reg" data-address="${p.address}" title="Write value">Write</button>
                        <button class="btn btn-outline-secondary read-reg" data-address="${p.address}" title="Read value">Read</button>
                    </div>
                </td>
            </tr>`;
        tableBody.append(row);
    });

    // 2. Main API Communication Function
    function sendVfdCommand(action, payload, callback, errorCallback) {
        $.ajax({
            url: '/api/vfd', type: 'POST', contentType: 'application/json',
            data: JSON.stringify({
                slaveId: $('#slave-id').val(),
                action, payload
            }),
            success: callback,
            // BUG FIX: A generic error should not assume disconnection.
            // Only log it. Let the caller decide how to handle the UI.
            error: errorCallback || function(xhr) {
                const errorMsg = xhr.responseJSON ? xhr.responseJSON.error : 'An unknown error occurred.';
                console.error(`VFD Command Error (${action}):`, errorMsg);
            }
        });
    }

    // 3. Event Handlers
    $.get('/api/ports', function(ports) { $('#port-select').empty(); ports.forEach(p => $('#port-select').append(new Option(p.path, p.path))); });

    // --- Connection Handlers ---
    $('#connect-btn').click(function() {
        const portPath = $('#port-select').val();
        const baudRate = $('#baud-rate').val();
        if (!portPath) { alert('Please select a serial port.'); return; }

        $('#connection-status').removeClass('bg-secondary bg-danger').addClass('bg-warning').text('Connecting...');

        $.ajax({
            url: '/api/connect', type: 'POST', contentType: 'application/json',
            data: JSON.stringify({ portPath, baudRate }),
            success: function() {
                setUiConnected(true);
            },
            error: function(xhr) {
                const errorMsg = xhr.responseJSON ? xhr.responseJSON.error : 'Connection failed.';
                $('#connection-status').removeClass('bg-warning').addClass('bg-danger').text(errorMsg);
                setUiConnected(false);
            }
        });
    });

    $('#disconnect-btn').click(function() {
        $.ajax({
            url: '/api/disconnect', type: 'POST',
            success: function() {
                setUiConnected(false);
            }
        });
    });

    $('#poll-status-btn').click(updateLiveStatus); // NEW: Trigger poll on button click

    // --- Spindle Control Handlers ---
    $('#start-forward-btn').click(() => sendVfdCommand('set-state', { state: 'forward' }));
    $('#start-reverse-btn').click(() => sendVfdCommand('set-state', { state: 'reverse' }));
    $('#stop-btn').click(() => sendVfdCommand('set-state', { state: 'stop' }));

    $('#set-rpm-btn').click(function() {
        const rpm = parseFloat($('#rpm-input').val());
        if (!rpm || rpm < 0) { alert('Please enter a valid RPM.'); return; }
        const value = Math.round((rpm / 60) * 10);
        sendVfdCommand('write-register', { address: '0201', value: value });
    });

    $('#save-rpm-btn').click(function() {
        const rpm = parseFloat($('#rpm-input').val());
        if (!rpm || rpm < 0) { alert('Please enter a valid RPM.'); return; }
        const value = Math.round((rpm / 60) * 10);
        sendVfdCommand('write-register', { address: '0003', value: value }, () => alert('RPM saved to VFD memory.'));
    });

    // --- Configuration Table Handlers ---
    $('#read-all-params').click(async function() {
        const btn = $(this), barContainer = $('#read-progress-container'), bar = $('#read-progress-bar');
        btn.prop('disabled', true).text('Reading...');
        bar.css('width', '0%').attr('aria-valuenow', 0).text('0%').removeClass('bg-success');
        barContainer.show();

        for (let i = 0; i < vfdParameters.length; i++) {
            await new Promise(resolve => {
                sendVfdCommand('read-holding-registers', { readAddress: vfdParameters[i].address, readLength: 1 }, (res) => {
                    if (res.success && res.data) $(`#val-${vfdParameters[i].address}`).val(res.data[0]);
                });
                setTimeout(resolve, 50);
            });
            const percent = Math.round(((i + 1) / vfdParameters.length) * 100);
            bar.css('width', percent + '%').attr('aria-valuenow', percent).text(percent + '%');
        }

        btn.prop('disabled', false).text('Read All Parameters');
        bar.addClass('bg-success');
        setTimeout(() => barContainer.fadeOut(), 2000);
    });

    tableBody.on('click', '.read-reg', function() {
        const address = $(this).data('address');
        sendVfdCommand('read-holding-registers', { readAddress: address }, res => {
            if (res.success && res.data) $(`#val-${address}`).val(res.data[0]);
        });
    });

    tableBody.on('click', '.write-reg', function() {
        const address = $(this).data('address'), value = $(`#val-${address}`).val();
        if (value === '' || isNaN(value)) { alert('Please enter a valid numeric value.'); return; }
        sendVfdCommand('write-register', { address, value }, () => {
            const input = $(`#val-${address}`);
            input.css('background-color', '#d1e7dd');
            setTimeout(() => input.css('background-color', ''), 1000);
        });
    });

    // --- Live Status Polling ---
    function updateLiveStatus() {
    if ($('#connection-status').text() !== 'Connected') {
        return;
    }

    const statusIndicator = $('#status-indicator');
    statusIndicator.removeClass('bg-danger bg-success').addClass('bg-warning').text('Polling...');

    const errorCb = (part) => {
        statusIndicator.removeClass('bg-warning bg-success').addClass('bg-danger').text(`Error (Part ${part})`);
    };

    // --- THE WATERFALL ---

    // 1. Request Part 1
    sendVfdCommand('get-live-status', { part: 1 }, (res1) => {
        if (res1.success && res1.data) {
            // Update UI for Part 1
            $('#status-freq').text(`${(res1.data[0] / 10.0).toFixed(1)} Hz`);
            $('#status-current').text(`${(res1.data[2] / 10.0).toFixed(1)} A`);
            $('#status-speed').text(`${res1.data[3]} RPM`);

            // 2. Success! Now request Part 2
            sendVfdCommand('get-live-status', { part: 2 }, (res2) => {
                if (res2.success && res2.data) {
                    // Update UI for Part 2
                    $('#status-dc').text(`${(res2.data[0] / 10.0).toFixed(1)} V`);
                    $('#status-temp').text(`${res2.data[2]} °C`);

                    // 3. Success! Now request Part 3
                    sendVfdCommand('get-live-status', { part: 3 }, (res3) => {
                        if (res3.success && res3.data) {
                            // Update UI for Part 3
                            const faultCode = res3.data[2];
                            if (faultCode > 0) {
                                $('#status-fault').text(`Code ${faultCode}`).parent().show();
                            } else {
                                $('#status-fault').parent().hide();
                            }
                            // All parts successful!
                            statusIndicator.removeClass('bg-warning').addClass('bg-success').text('Live');
                        } else { errorCb(3); }
                    }, () => errorCb(3));
                } else { errorCb(2); }
            }, () => errorCb(2));
        } else { errorCb(1); }
    }, () => errorCb(1));
}

    // Initial UI State
    setUiConnected(false);
});
