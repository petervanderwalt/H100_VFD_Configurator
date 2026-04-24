$(document).ready(function() {
    // --- VFD Parameter Definitions ---
    const vfdParameters = [
        { code: 'F000', address: '0000', name: 'Parameter locking', desc: '0: Invalid, 1: Valid. Locks parameters from being changed.' },
        { code: 'F001', address: '0001', name: 'Control mode', desc: '0: keyboard, 1: External terminal, 2: Communication port.' },
        { code: 'F002', address: '0002', name: 'Frequency setting selection', desc: '0: keyboard, 1: AI1, 2: Comm port, 3: Potentiometer, 4: AI2, 5: PFI, 6: AI1+AI2, 7: PID' },
        { code: 'F003', address: '0003', name: 'Main frequency', desc: 'The frequency (in Hz x 10) stored in VFD memory (EEPROM).' },
        { code: 'F004', address: '0004', name: 'Reference frequency', desc: 'Motor\'s rated frequency from nameplate (e.g. 50.0Hz).' },
        { code: 'F140', address: '008C', name: 'Motor rated power', desc: 'Motor power in kW (e.g. 15 = 1.5kW).' },
        { code: 'F142', address: '008E', name: 'Motor rated current', desc: 'Motor current from nameplate (e.g. 120 = 12.0A).' },
        { code: 'F154', address: '009A', name: 'Modbus baud rate', desc: '0: 1200, 1: 2400, 2: 4800, 3: 9600, 4: 19200, 5: 38400.' },
    ];

    let currentChart, powerGauge, rpmGauge, ampGauge;
    const maxDataPoints = 100;
    let motorRatedCurrent = 12.0;

    function initGauges() {
        const gaugeOptions = (max, color) => ({
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [0, max],
                    backgroundColor: [color, '#f8f9fa'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270,
                    cutout: '80%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { bottom: 10 } },
                animation: { duration: 150 },
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } } // FORCE HIDE SCALES
            }
        });

        rpmGauge = new Chart(document.getElementById('rpmGauge').getContext('2d'), gaugeOptions(24000, '#0d6efd'));
        ampGauge = new Chart(document.getElementById('ampGauge').getContext('2d'), gaugeOptions(15, '#fd7e14'));
        powerGauge = new Chart(document.getElementById('powerGauge').getContext('2d'), gaugeOptions(2.2, '#198754'));
    }

    function updateGauge(chart, value, max, elementId, unit) {
        const val = Number(Math.min(Math.max(value, 0), max).toFixed(4));
        chart.data.datasets[0].data = [val, max - val];
        chart.update('none');
        $(`#${elementId}`).text(value.toFixed(unit === 'RPM' ? 0 : (unit === 'A' ? 2 : 3)));
    }

    function initGraph() {
        const ctx = document.getElementById('currentGraph').getContext('2d');
        currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(maxDataPoints).fill(''),
                datasets: [
                    {
                        label: 'Load (%)',
                        data: Array(maxDataPoints).fill(0),
                        borderColor: '#0dcaf0',
                        backgroundColor: 'rgba(13, 202, 240, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y',
                    },
                    {
                        label: 'RPM',
                        data: Array(maxDataPoints).fill(0),
                        borderColor: '#ffc107',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y1',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: { display: false },
                    y: { 
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        title: { display: true, text: 'Load %', font: { size: 10 } },
                        ticks: { font: { size: 10 } }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        min: 0,
                        max: 24000,
                        title: { display: true, text: 'RPM', font: { size: 10 } },
                        ticks: { font: { size: 10 } },
                        grid: { drawOnChartArea: false },
                    }
                },
                plugins: {
                    legend: { display: true, position: 'top', labels: { boxWidth: 10, font: { size: 10 } } },
                    tooltip: { enabled: false }
                }
            }
        });
    }
    initGraph();
    initGauges();

    let pollTimeout;
    const POLL_INTERVAL = 20;

    function startPolling() {
        sendVfdCommand('read-holding-registers', { readAddress: '008E' }, (res) => {
            if (res.success && res.data) {
                motorRatedCurrent = res.data[0] / 10.0;
            }
            if (pollTimeout) clearTimeout(pollTimeout);
            pollTimeout = setTimeout(updateLiveStatus, POLL_INTERVAL);
        });
    }

    function stopPolling() { if (pollTimeout) { clearTimeout(pollTimeout); pollTimeout = null; } }

    let isPolling = false;
    function updateLiveStatus() {
        if (isPolling) return;
        isPolling = true;

        const errorCb = () => {
            isPolling = false;
            $('#status-indicator').removeClass('bg-success').addClass('bg-danger').text('Error');
            if (pollTimeout) pollTimeout = setTimeout(updateLiveStatus, 500);
        };

        sendVfdCommand('get-live-status', { part: 1 }, (res1) => {
            if (res1.success && res1.data) {
                // FIXED SCALING: raw 110 -> 1.1A (0.01A units)
                const actualAmps = res1.data[2] / 100.0;
                const loadPercent = (actualAmps / (motorRatedCurrent || 1.0)) * 100;
                const rpm = res1.data[3];

                $('#status-freq').text(`${(res1.data[1] / 10.0).toFixed(1)} Hz`);
                $('#status-current').text(`${actualAmps.toFixed(2)} A`);
                $('#status-speed').text(`${rpm} RPM`);
                
                updateGauge(rpmGauge, rpm, 24000, 'rpm-value', 'RPM');
                updateGauge(ampGauge, actualAmps, 15, 'amp-value', 'A');

                if (currentChart) {
                    currentChart.data.datasets[0].data.push(loadPercent.toFixed(2));
                    currentChart.data.datasets[0].data.shift();
                    currentChart.data.datasets[1].data.push(rpm);
                    currentChart.data.datasets[1].data.shift();
                    currentChart.update('none'); 
                }

                sendVfdCommand('get-live-status', { part: 2 }, (res2) => {
                    if (res2.success && res2.data) {
                        const actualVoltage = res2.data[0] / 10.0;
                        const calculatedKW = (1.732 * actualVoltage * actualAmps) / 1000.0;
                        $('#status-dc').text(`${res2.data[1].toFixed(0)} V`);
                        $('#status-temp').text(`${(res2.data[2] / 10.0).toFixed(1)} °C`);
                        $('#status-kw').text(`${calculatedKW.toFixed(3)} kW`);
                        $('#status-load').text(`${loadPercent.toFixed(1)} %`);
                        updateGauge(powerGauge, calculatedKW, 2.2, 'power-value', 'kW');

                        sendVfdCommand('get-live-status', { part: 3 }, (res3) => {
                            isPolling = false;
                            if (res3.success && res3.data) {
                                $('#status-fault').text(res3.data[1] || '--');
                                $('#status-indicator').removeClass('bg-secondary bg-danger').addClass('bg-success').text('Live');
                            }
                            if (pollTimeout) pollTimeout = setTimeout(updateLiveStatus, POLL_INTERVAL);
                        }, errorCb);
                    } else errorCb();
                }, errorCb);
            } else errorCb();
        }, errorCb);
    }

    function setUiConnected(isConnected) {
        if (isConnected) {
            $('#connection-status').removeClass('bg-secondary bg-danger').addClass('bg-success').text('Connected');
            $('#connect-btn').prop('disabled', true); $('#disconnect-btn').prop('disabled', false);
            $('#port-select, #baud-rate').prop('disabled', true); $('.dashboard-controls').find('button, input').prop('disabled', false);
            startPolling();
        } else {
            $('#connection-status').removeClass('bg-success').addClass('bg-secondary').text('Disconnected');
            $('#connect-btn').prop('disabled', false); $('#disconnect-btn').prop('disabled', true);
            $('#port-select, #baud-rate').prop('disabled', false); $('.dashboard-controls').find('button, input').prop('disabled', true);
            stopPolling();
        }
    }

    const tableBody = $('#params-table-body');
    const savedRpm = localStorage.getItem('vfd_target_rpm');
    if (savedRpm) $('#rpm-input').val(savedRpm);
    vfdParameters.forEach(p => {
        tableBody.append(`<tr><td><strong>${p.code}</strong></td><td>${p.name}</td><td><small>${p.desc}</small></td>
            <td><input type="text" class="form-control form-control-sm" id="val-${p.address}" placeholder="--"></td>
            <td><div class="btn-group btn-group-sm"><button class="btn btn-outline-primary write-reg" data-address="${p.address}">Write</button>
            <button class="btn btn-outline-secondary read-reg" data-address="${p.address}">Read</button></div></td></tr>`);
    });

    function sendVfdCommand(action, payload, callback, errorCallback) {
        $.ajax({
            url: '/api/vfd', type: 'POST', contentType: 'application/json',
            data: JSON.stringify({ slaveId: $('#slave-id').val(), action, payload }),
            success: callback,
            error: errorCallback || ((xhr) => console.error(`VFD Error (${action}):`, xhr.responseJSON?.error))
        });
    }

    $.get('/api/ports', (ports) => {
        $('#port-select').empty(); ports.forEach(p => $('#port-select').append(new Option(p.path, p.path)));
        if (localStorage.getItem('vfd_port')) $('#port-select').val(localStorage.getItem('vfd_port'));
        if (localStorage.getItem('vfd_baud')) $('#baud-rate').val(localStorage.getItem('vfd_baud'));
        if (localStorage.getItem('vfd_slave_id')) $('#slave-id').val(localStorage.getItem('vfd_slave_id'));
        $.get('/api/status', (res) => { if (res.isConnected) setUiConnected(true); });
    });

    $('#connect-btn').click(() => {
        const portPath = $('#port-select').val(), baudRate = $('#baud-rate').val(), slaveId = $('#slave-id').val();
        if (!portPath) return;
        localStorage.setItem('vfd_port', portPath); localStorage.setItem('vfd_baud', baudRate); localStorage.setItem('vfd_slave_id', slaveId);
        $('#connection-status').removeClass('bg-secondary bg-danger').addClass('bg-warning').text('Connecting...');
        $.ajax({ url: '/api/connect', type: 'POST', contentType: 'application/json', data: JSON.stringify({ portPath, baudRate }),
            success: () => setUiConnected(true),
            error: (xhr) => { $('#connection-status').removeClass('bg-warning').addClass('bg-danger').text(xhr.responseJSON?.error || 'Failed'); setUiConnected(false); }
        });
    });

    $('#disconnect-btn').click(() => $.ajax({ url: '/api/disconnect', type: 'POST', success: () => setUiConnected(false) }));
    $('#poll-status-btn').click(updateLiveStatus);

    function applyRpm() {
        const rpm = parseFloat($('#rpm-input').val());
        if (!rpm || rpm < 0) return false;
        localStorage.setItem('vfd_target_rpm', rpm);
        const value = Math.round((rpm / 60) * 10);
        sendVfdCommand('write-register', { address: '0201', value });
        sendVfdCommand('write-register', { address: '0003', value });
        return true;
    }

    $('#start-forward-btn').click(() => { applyRpm(); sendVfdCommand('set-state', { state: 'forward' }); });
    $('#start-reverse-btn').click(() => { applyRpm(); sendVfdCommand('set-state', { state: 'reverse' }); });
    $('#stop-btn').click(() => sendVfdCommand('set-state', { state: 'stop' }));
    $('#set-rpm-btn').click(applyRpm);

    $('#read-all-params').click(async function() {
        const btn = $(this), barContainer = $('#read-progress-container'), bar = $('#read-progress-bar'), wasPolling = !!pollTimeout;
        stopPolling(); btn.prop('disabled', true).text('Reading...'); bar.css('width', '0%').text('0%'); barContainer.show();
        for (let i = 0; i < vfdParameters.length; i++) {
            const p = vfdParameters[i];
            await new Promise(resolve => {
                sendVfdCommand('read-holding-registers', { readAddress: p.address }, (res) => {
                    if (res.success) $(`#val-${p.address}`).val(res.data[0]);
                    const progress = Math.round(((i + 1) / vfdParameters.length) * 100);
                    bar.css('width', progress + '%').text(progress + '%'); resolve();
                }, resolve);
            });
        }
        btn.prop('disabled', false).text('Read All Parameters'); bar.addClass('bg-success');
        setTimeout(() => barContainer.fadeOut(), 2000); if (wasPolling) startPolling();
    });

    tableBody.on('click', '.read-reg', function() {
        const addr = $(this).data('address');
        sendVfdCommand('read-holding-registers', { readAddress: addr }, (res) => { if (res.success) $(`#val-${addr}`).val(res.data[0]); });
    });

    tableBody.on('click', '.write-reg', function() {
        const addr = $(this).data('address'), val = $(`#val-${addr}`).val();
        if (val !== '') sendVfdCommand('write-register', { address: addr, value: val }, (res) => { if (res.success) alert('Written!'); });
    });
});
