$(document).ready(function() {
    $('[data-toggle="log-tooltip"]').tooltip();
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
                    'Light-OnOff',
                    'Light-Dimming',
                    'Light-MeasurePower'
                ]
            },
            {
                'profile': 'Sensor',
                'reading': [
                    'Sensor-MeasureLight'
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
        var limit = $('#monitor-limit').val();
        var url = '/core-data/api/v1/reading/name/' + name + '/device/' + device + '/' + limit;

        console.log('send request: \nGET \n' + url);
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                $("#log-content div.log_content").empty();
                if (!data || data.length == 0) {
                    $("#log-content div.log_content").append('<span style="color:white;">No data.</span>');
                    return;
                }
                client.renderReading(data);
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
            }
        });
    }

    Monitor.prototype.renderReading = function(data) {
        // $.each(data, function(i, v) {
        //     var show_log = '<p>';
        //     show_log += '<span style="color:green;">' + dateToString(v.created) + '</span>&nbsp;&nbsp;&nbsp;';
        //     show_log += '<span style="color:green;">' + v.name + '</span>&nbsp;&nbsp;&nbsp;';
        //     show_log += '<span style="color:white;">' + v.value + '</span>';
        //     show_log += '</p>'
        //     $("#log-content div.log_content").append(show_log);
        // });
        client.updateChart(data);
    }

    Monitor.prototype.startMonitor = function() {
        //debugger
        $("#monitor-search").hide();
        $("#monitor-start-monitor").hide();
        $("#monitor-stop-monitor").show();
        client.monitorTimer = window.setInterval("monitor.searchBtn()", 2000);
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
                name: 'Count',
                data: []
            },
            yAxis: { name: 'Reading Value' },
            series: [{
                type: 'line',
                // smooth: true,
                data: []
            }]
        };

        // use configuration item and data specified to show chart
        client.chart.setOption(option);
    }

    Monitor.prototype.updateChart = function(readings) {
        var device = $('#monitor-selectDevice').val();
        var name = $('#monitor-selectReading').val();

        var dim2 = [];
        for (var i = 0; i < readings.length; i++) {
            if (readings[i].valueType == 'Bool') {
                var value = (readings[i].value == 'true');
                dim2.push([i, value]);
            } else {
                var value = parseInt(readings[i].value);
                dim2.push([i, value]);
            }
        }

        var option = {
            title: { text: 'Chart of Device: ' + device },
            tooltip: {},
            xAxis: {
                name: 'Count',
            },
            yAxis: {
                name: name,
            },
            series: [{
                type: 'line',
                name: 'index , value',
                smooth: true,
                data: dim2
            }]
        };
        client.chart.setOption(option);
    }

    return client;
})();