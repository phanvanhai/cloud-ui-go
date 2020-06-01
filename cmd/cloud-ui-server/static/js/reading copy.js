$(document).ready(function() {
    // // 
    // // based on prepared DOM, initialize echarts instance
    // var myChart = echarts.init(document.getElementById('main'));

    // // specify chart configuration item and data
    // var option = {
    //     title: { text: 'Line Chart' },
    //     xAxis: {},
    //     yAxis: {},
    //     series: [{
    //         type: 'line',
    //         // smooth: true,
    //         data: [
    //             [0, 5],
    //             [24, 20],
    //             [36, 36],
    //             [48, 10],
    //             [60, 10],
    //             [103, 20]
    //         ]
    //     }]
    // };

    // // use configuration item and data specified to show chart
    // myChart.setOption(option);

    // // Asynchronous data loading 
    // // $.get('data.json').done(function (data) {
    // //     // fill in data
    // //     myChart.setOption({
    // //         xAxis: {
    // //             data: data.categories
    // //         },
    // //         series: [{
    // //             // find series by name
    // //             name: 'Sales',
    // //             data: data.data
    // //         }]
    // //     });
    // // });
    // // 
    $("#log_start_time").flatpickr({
        dateFormat: "Y-m-d H:i:S",
        enableTime: true,
        enableSeconds: true,
        time_24hr: true,
        allowInput: false
    });
    $("#log_end_time").flatpickr({
        dateFormat: "Y-m-d H:i:S",
        enableTime: true,
        enableSeconds: true,
        time_24hr: true,
        allowInput: false
    });
    $('[data-toggle="log-tooltip"]').tooltip();
    //init select panel
    orgEdgexFoundry.supportLogging.loadAllName();
});

orgEdgexFoundry.supportLogging = (function() {
    "use strict";

    function SupportLogging() {
        this.monitorTimer = null;
        this.monitorStartTime = null;
        this.monitorStopTime = null;
        this.url = null;
        this.allMicrosevices = [];
    }

    SupportLogging.prototype = {
        constructor: SupportLogging,
        loadLoggingInRealtime: null,
        renderLoggingInRealtime: null,
        startLoggingMonitor: null,
        stopLoggingMonitor: null,
        outputLoggingInRealtime: null,

        loadLoggingBySearch: null,
        renderLoggingBySearch: null,
        searchBtn: null,
        eraseScreenBtn: null,

        loadAllName: null,
        initLogMiscroseviceSelectPanel: null,
    }

    var logging = new SupportLogging();

    SupportLogging.prototype.initLogMiscroseviceSelectPanel = function(allMicrosevices) {
        var $el = $("#selectName");
        $el.empty(); // remove old options
        $.each(allMicrosevices, function(i, s) {
            $el.append($("<option></option>")
                .attr("value", s).text(s));
        });
    }

    SupportLogging.prototype.loadAllName = function() {
        var type_name = $("select[name='log_by_name']").val();
        var _url = "";
        if (type_name == "Object") {
            _url = "/object/api/v1/object";
        } else if (type_name == "Reading") {
            _url = "/core-data/api/v1/valuedescriptor";
        }
        logging.url = _url
        $.ajax({
            url: _url,
            type: 'GET',
            success: function(data) {
                logging.allMicrosevices.length = 0;
                $.each(data, function(i, s) {
                    logging.allMicrosevices.push(s.name);
                    logging.initLogMiscroseviceSelectPanel(logging.allMicrosevices);
                });
            }
        });
    }

    SupportLogging.prototype.eraseScreenBtn = function() {
        $("#log-content div.log_content").empty();
    }

    SupportLogging.prototype.searchBtn = function() {
        var type_name = $("select[name='log_by_name']").val();
        var _url = "";
        if (type_name == "Object") {
            _url = "/monitor/api/v1/monitor/reading/devicename/";
        } else if (type_name == "Reading") {
            _url = "/monitor/api/v1/monitor/reading/readingname/";
        }

        var nameSelected = $("select[name='log_service']").val();

        var start_str = document.getElementById("log_start_time").value;
        var end_str = document.getElementById("log_end_time").value;
        var limit = $("select[name='log_limit']").val();
        start_str = start_str.replace(/-/g, '/');
        end_str = end_str.replace(/-/g, '/');
        var start = new Date(start_str);
        var end = new Date(end_str);

        var start_timestamp = start.getTime();
        var end_timestamp = end.getTime();
        logging.loadLoggingBySearch(_url + nameSelected, start_timestamp, end_timestamp, limit);
    }

    SupportLogging.prototype.loadLoggingBySearch = function(_url, start_timestamp, end_timestamp, limit) {
        // alert(_url +'/'+start_timestamp+'/'+end_timestamp+'/' + limit);
        $.ajax({
            url: _url + '/' + start_timestamp + '/' + end_timestamp + '/' + limit,
            type: 'GET',
            success: function(data) {
                $("#log-content div.log_content").empty();
                if (data.length == 0) {
                    $("#log-content div.log_content").append('<span style="color:white;">No data.</span>');
                    return;
                }
                logging.renderLoggingBySearch(data);
            }
        });
    }

    SupportLogging.prototype.renderLoggingBySearch = function(data) {
        $.each(data, function(i, v) {
            var show_log = '<p>';
            show_log += '<span style="color:green;">' + dateToString(v.created) + '</span>&nbsp;&nbsp;&nbsp;';
            show_log += '<span style="color:green;">' + v.name + '</span>&nbsp;&nbsp;&nbsp;';
            show_log += '<span style="color:white;">' + v.value + '</span>';
            show_log += '</p>'
            $("#log-content div.log_content").append(show_log);
        });
    }

    SupportLogging.prototype.outputLoggingInRealtime = function() {
        if (!logging.monitorStartTime) {
            var now1 = new Date();
            now1.setMinutes(now1.getMinutes() - 1);
            logging.monitorStartTime = now1.getTime();

            var now2 = new Date();
            now2.setMinutes(now2.getMinutes() + 1);
            logging.monitorStopTime = now2.getTime()
        }
        orgEdgexFoundry.supportLogging.loadLoggingInRealtime(logging.monitorStartTime, logging.monitorStopTime);
    }

    SupportLogging.prototype.startLoggingMonitor = function() {
        //debugger
        $("#support-logging-search").hide();
        $("#support-logging-start-monitor").hide();
        $("#support-logging-stop-monitor").show();
        logging.monitorTimer = window.setInterval("orgEdgexFoundry.supportLogging.outputLoggingInRealtime()", 2000);
    }

    SupportLogging.prototype.stopLoggingMonitor = function() {
        window.clearInterval(orgEdgexFoundry.supportLogging.monitorTimer);
        $("#support-logging-search").show();
        $("#support-logging-start-monitor").show();
        $("#support-logging-stop-monitor").hide();
    }

    SupportLogging.prototype.loadLoggingInRealtime = function(start, end) {
        var service = $("select[name='log_service']").val();
        console.log("selected service===:" + service);
        var type_name = $("select[name='log_by_name']").val();
        var _url = "";
        if (type_name == "Object") {
            _url = "/object/api/v1/object";
        } else if (type_name == "Reading") {
            _url = "/core-data/api/v1/valuedescriptor";
        }
        logging.url = _url

        $.ajax({
            url: _url + '/' + start_timestamp + '/' + end_timestamp + '/100',
            type: 'GET',
            success: function(data) {
                //debugger
                if (data.length == 0) {
                    return;
                }
                logging.renderLoggingInRealtime(data);
            }
        });
    }

    SupportLogging.prototype.renderLoggingInRealtime = function(data) {

        $.each(data, function(i, v) {
            console.log(data.length);
            if (i == data.length - 1) {
                logging.monitorStartTime = v.created
                var end = new Date(logging.monitorStartTime)

                end.setMinutes(end.getMinutes() + 1)
                logging.monitorStopTime = end.getTime();
            }
            var show_log = '<p>';
            if (v.logLevel == "ERROR") {
                show_log += '<span style="color:red;">' + v.logLevel + '</span>&nbsp;&nbsp;&nbsp;';
                show_log += '<span style="color:red;">' + dateToString(v.created) + '</span>&nbsp;&nbsp;&nbsp;';
            } else {
                show_log += '<span style="color:green;">' + v.logLevel + '</span>&nbsp;&nbsp;&nbsp;';
                show_log += '<span style="color:green;">' + dateToString(v.created) + '</span>&nbsp;&nbsp;&nbsp;';
            }
            if (i % 2 == 0) {
                show_log += '<span class="text-warning">' + v.message + '</span>';
            } else {
                show_log += '<span style="color:white;">' + v.message + '</span>';
            }

            show_log += '</p>'
            var log_content = $("#log-content div.log_content")[0];
            $("#log-content div.log_content").append(show_log);
            log_content.scrollTop = log_content.scrollHeight;
        });
    }
    return logging;
})();