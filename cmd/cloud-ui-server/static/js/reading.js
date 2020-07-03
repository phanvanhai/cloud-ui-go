$(document).ready(function() {
    $('[data-toggle="log-tooltip"]').tooltip();
    $("#monitor-start_time").flatpickr({
        dateFormat: "Y-m-d H:i:S",
        enableTime: true,
        enableSeconds: true,
        time_24hr: true,
        allowInput: false
    });
    $("#monitor-end_time").flatpickr({
        dateFormat: "Y-m-d H:i:S",
        enableTime: true,
        enableSeconds: true,
        time_24hr: true,
        allowInput: false
    });
    //init select panel
    monitor.loadDevice();
    monitor.initChart();
});

monitor = (function() {
    "use strict";

    function Monitor() {
        this.chart = null;
        this.monitorTimer = null;
        this.ReadingList = [{
                'profile': 'Light',
                'reading': [
                    'Light_OnOff',
                    'Light_Dimming',
                    'Light_LightSensor'
                ]
            },
            {
                'profile': 'Sensor',
                'reading': [
                    'Sensor_MeasureLight'
                ]
            }
        ];
        this.DeviceCache = [];
    }

    Monitor.prototype = {
        constructor: Monitor,
        loadDevice: null,
        eraseScreenBtn: null,
        renderReading: null,

        searchBtn: null,
        startMonitor: null,
        stopMonitor: null,

        // chart
        initChart: null,
        updateChart: null,
    }

    var client = new Monitor();

    Monitor.prototype.loadDevice = function() {
        $.ajax({
            url: '/core-metadata/api/v1/device',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                client.DeviceCache = [];
                $.each(data, function(i, d) {
                    $.each(client.ReadingList, function(i, r) {
                        if (r.profile == d.profile.name) {
                            var info = {
                                name: d.name,
                                profile: d.profile.name
                            }
                            client.DeviceCache.push(info);
                            return;
                        }
                    });
                });

                // render Device List:
                $("#monitor-selectReading").empty();
                $("#monitor-selectReading").append($("<option></option>").attr("value", "").text(""));
                var $el = $("#monitor-selectDevice");
                $el.empty(); // remove old options
                $el.append($("<option></option>").attr("value", "").text("-- select device--"));
                $.each(client.DeviceCache, function(i, s) {
                    $el.append($("<option></option>").attr("value", s.name).text(s.name));
                });

                // add event change option:
                $('#monitor-tab-main select[name="monitor-selectDevice"]').on('change', function() {
                    var name = $(this).val();
                    $.each(client.DeviceCache, function(i, dev) {
                        if (dev.name == name) {
                            $.each(client.ReadingList, function(i, r) {
                                if (r.profile == dev.profile) {
                                    var $el = $("#monitor-selectReading");
                                    $el.empty(); // remove old options
                                    $.each(r.reading, function(i, rd) {
                                        $el.append($("<option></option>").attr("value", rd).text(rd));
                                    });
                                }
                            });
                            return;
                        }
                    });
                });
            }
        });
    }

    Monitor.prototype.eraseScreenBtn = function() {
        // $("#log-content div.log_content").empty();
        client.updateChart([]);
    }

    Monitor.prototype.searchBtn = function() {
        var device = $('#monitor-selectDevice').val();
        var name = $('#monitor-selectReading').val();
        var start = $("#monitor-start_time").val();
        var end = $("#monitor-end_time").val();
        start = new Date(start).valueOf();
        end = new Date(end).valueOf();
        var limit = $('#monitor-limit').val();

        // var url = '/core-data/api/v1/reading/name/' + name + '/device/' + device + '/' + limit;
        var url = '/core-data/api/v1/reading/' + start + '/' + end + '/' + limit;

        console.log('GET request: url:' + url);
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                $("#log-content div.log_content").empty();
                client.renderReading(data, start, end, device, name);
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
            }
        });
    }

    Monitor.prototype.renderReading = function(data, start, end, device, name) {
        if (!data || data.length == 0) {
            $("#log-content div.log_content").append('<span style="color:white;">No data.</span>');
            return;
        }
        var readings = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i].created >= start && data[i].created <= end && data[i].device == device && data[i].name == name) {
                readings.push(data[i]);
            }
        }
        if (!readings || readings.length == 0) {
            $("#log-content div.log_content").append('<span style="color:white;">No data.</span>');
            return;
        }
        client.updateChart(readings);
    }

    Monitor.prototype.startMonitor = function() {
        //debugger
        $("#monitor-search").hide();
        $("#monitor-start-monitor").hide();
        $("#monitor-stop-monitor").show();
        client.monitorTimer = window.setInterval("monitor.searchBtn()", 5000);
    }

    Monitor.prototype.stopMonitor = function() {
        window.clearInterval(client.monitorTimer);
        $("#monitor-search").show();
        $("#monitor-start-monitor").show();
        $("#monitor-stop-monitor").hide();
    }

    Monitor.prototype.initChart = function() {
        client.chart = echarts.init(document.getElementById('chart-reading'));

        // specify chart configuration item and data
        var option = {
            title: { text: 'Line Chart' },
            xAxis: {
                name: 'Count'
            },
            yAxis: { name: 'Reading Value' },
            series: [{
                areaStyle: {
                    color: 'pink'
                },
                type: 'line',
                data: []
            }]
        };

        // use configuration item and data specified to show chart
        client.chart.setOption(option);
    }

    Monitor.prototype.updateChart = function(readings) {
        var device = $('#monitor-selectDevice').val();
        var name = $('#monitor-selectReading').val();

        if (!readings || readings.length == 0) {
            var option = {
                title: { text: 'Chart of Device: ' + device },
                tooltip: {},
                xAxis: {
                    name: 'Time',
                    type: 'time'
                },
                yAxis: {
                    name: name,
                    type: 'value'
                },
                series: [{
                    type: 'line',
                    // smooth: true,
                    data: []
                }]
            };
            client.chart.setOption(option);
            return;
        }

        var Sn, Tn, ti_1, vi_1, Vtb;
        Sn = 0;
        Vtb = 0;
        vi_1 = 0;
        ti_1 = readings[0].created;
        Tn = readings[readings.length - 1].created - readings[0].created;

        var dim2 = [];
        for (var i = 0; i < readings.length; i++) {
            if (readings[i].valueType == 'Bool') {
                var vi = (readings[i].value == 'true');
                var ti = new Date(readings[i].created);
                // Sn = (t1-t0)*v0 + (t2-t1)*v1 + ... + (tn-1 - tn-2)*vn-1
                Sn = Sn + (ti - ti_1) * vi_1;
                vi_1 = vi;
                ti_1 = ti;
                dim2.push([ti, vi]);
            } else {
                var vi = parseInt(readings[i].value);
                var ti = new Date(readings[i].created);
                // Sn = (t1-t0)*v0 + (t2-t1)*v1 + ... + (tn-1 - tn-2)*vn-1                
                Sn = Sn + (ti - ti_1) * vi_1;
                vi_1 = vi;
                ti_1 = ti;
                dim2.push([ti, vi]);
            }
        }

        if (Tn == 0) {
            Tn = 1;
            Sn = vi_1;
        }
        Vtb = (Sn / Tn).toFixed(2);

        var option = {
            title: {
                text: 'Device: ' + device + '    Number of values: ' + readings.length + '    Mean: ' + Vtb,
                left: 'center'
            },
            tooltip: {},
            xAxis: {
                boundaryGap: false,
                name: 'Time',
                type: 'time'
            },
            yAxis: {
                name: name,
                type: 'value'
            },
            series: [{
                // label: {
                //     normal: {
                //         show: true,
                //         position: 'top'
                //     }
                // },                
                areaStyle: {
                    color: 'pink'
                },
                type: 'line',
                step: 'end',
                data: dim2
            }]
        };
        client.chart.setOption(option);
    }

    return client;
})();