$(document).ready(function() {
    //init loading data.
    sensorApp.loadDevice();
});

sensorApp = (function() {
    "use strict";

    function Client() {
        this.Profile = "Sensor";
        this.MapCommand = {
            OnOff: "OnOff",
            MeasureLight: "MeasureLight",
            ReportTime: "ReportTime",
            Realtime: "Realtime"
        };
        this.MapResource = {
            OnOff: "Sensor_OnOff",
            MeasureLight: "Sensor_MeasureLight",
            ReportTime: "Sensor_ReportTime",
            Realtime: "Sensor_Realtime"
        };
        this.currentSelectDevice = "";
    }

    Client.prototype = {
        constructor: Client,

        // Device
        loadDevice: null,
        renderDevice: null,
        tryOpState: null,
        setAdminState: null,

        // Command
        gotoCommand: null,
        cancelCommand: null,

        // Report Time
        command_get_reportTime: null,
        command_set_reportTime: null,

        // Client
        command_get_onoff: null,
        command_set_onoff: null,
        command_get_measure: null
    }

    var client = new Client();

    // Device start  -----------------------------------------
    Client.prototype.loadDevice = function() {
        $.ajax({
            url: '/core-metadata/api/v1/device/profilename/' + client.Profile,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                client.renderDevice(data);
            },
            statusCode: {}
        });
    }

    Client.prototype.renderDevice = function(devices) {
        $('#Sensor_command-main').hide();
        $('#Sensor_device-list').show();

        $("#Sensor_device-list-table table tbody").empty();
        $("#Sensor_device-list-table table tfoot").hide();
        if (!devices || devices.length == 0) {
            $("#Sensor_device-list-table table tfoot").show();
            return;
        }
        $.each(devices, function(i, v) {
            var rowData = "<tr>";
            rowData += '<td></td>';
            rowData += "<td>" + (i + 1) + "</td>";
            rowData += '<td class="device-name">' + v.name + '</td>';
            if (v.adminState == "UNLOCKED") {
                rowData += '<td><select class="Sensor_adminState"><option value="UNLOCKED" selected>UNLOCKED</option><option value="LOCKED">LOCKED</option></select></td>';
            } else {
                rowData += '<td><select class="Sensor_adminState"><option value="UNLOCKED">UNLOCKED</option><option value="LOCKED" selected>LOCKED</option></select></td>';
            }

            var enableCommand = 0;
            var general_protocol = v.protocols['General'];
            if (general_protocol != null) {
                var object_type = general_protocol['Type'];
                var netID = general_protocol["NetworkID"];
                if ((object_type == 'Device' || object_type == 'Group') && (netID == "")) {
                    if (v.operatingState == 'DISABLED') {
                        enableCommand = 1;
                    } else {
                        enableCommand = 2;
                    }
                }

                if ((object_type == 'Device' || object_type == 'Group') && (netID != "")) {
                    if (v.operatingState == 'DISABLED') {
                        enableCommand = 3;
                    }
                }
            }
            switch (enableCommand) {
                case 0:
                    rowData += '<td><button class="btn btn-info fa fa-terminal" onclick="sensorApp.gotoCommand(\'' + v.name + '\')"></button></td>';
                    break;
                case 1:
                    rowData += '<td >' + '<i class="fa fa-ban" style="color: red;" onclick="sensorApp.tryOpState(\'' + v.name + '\')" onmouseover="$(this).find(\'span\').text(\'Click to try provision\');" onmouseout="$(this).find(\'span\').text(\'Unprovisioned\');"><span>Unprovisioned</span></i></td>';
                    break;
                case 2:
                    rowData += '<td >' + '<i class="fa fa-hourglass-half" style="color: tomato;" >Provisioning... Reload after a few seconds</i></td>';
                    break;
                case 3:
                    rowData += '<td >' + '<i class="fa fa-chain-broken" style="color: tomato;" onclick="sensorApp.tryOpState(\'' + v.name + '\')" onmouseover="$(this).find(\'span\').text(\'Click to try connect\');" onmouseout="$(this).find(\'span\').text(\'Disconnected\');"><span>Disconnected</span></i></td>';
                    break
            }

            rowData += "</tr>";
            $("#Sensor_device-list-table table tbody").append(rowData);
        });


        $('#Sensor_device-list-table .Sensor_adminState').change(function() {
            client.setAdminState($(this).closest('td').prev('td').html(), $(this).val());
        })

        $("#Sensor_device-list-table .device-command-icon").on('click', function() {
            var deviceName = $(this).children('input').val();
            client.gotoCommand(deviceName);
        });
    }

    Client.prototype.tryOpState = function(name) {
        var body = {
            operatingState: "ENABLED"
        };
        $.ajax({
            url: '/core-metadata/api/v1/device/name/' + name,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(body),
            dataType: 'text',
            success: function(data) {
                alert("trying... Reload after few seconds");
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
            }
        });
    }

    Client.prototype.setAdminState = function(name, value) {
            var body = {
                adminState: value
            };
            $.ajax({
                url: '/core-metadata/api/v1/device/name/' + name,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(body),
                dataType: 'text',
                success: function(data) {
                    alert("trying... Reload after few seconds");
                },
                error: function(xhr, status, error) {
                    alert(error + '\n' + xhr.responseText);
                }
            });
        }
        // Device start  -----------------------------------------

    // Command start  -----------------------------------------
    Client.prototype.gotoCommand = function(name) {
        client.currentSelectDevice = name;
        $('#Sensor_currentDevice').html(name);

        $('#Sensor_onoff-status').val("");
        $('#Sensor_measure-status').val("");

        $('#Sensor_device-list').hide();
        $('#Sensor_command-main').show("fast");
    }
    Client.prototype.cancelCommand = function() {
        $('#Sensor_command-main').hide("fast");
        $('#Sensor_device-list').show();
    }

    // Client start
    Client.prototype.command_get_onoff = function() {
        $.ajax({
            url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.OnOff,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                $('#Sensor_onoff-status').val(data.readings[0].value);
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $('#Sensor_onoff-status').val("");
                checkCodeStatus(parseError(xhr.responseText));
            }
        });
    }

    Client.prototype.command_set_onoff = function() {
        var value = $('#Sensor_onoff-status').val();
        var resource = client.MapResource.OnOff;
        var body = {
            [resource]: value
        };
        console.log(JSON.stringify(body));
        // ajax ...
        $.ajax({
            url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.OnOff,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(body),
            dataType: 'text',
            success: function(data) {
                alert("success");
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                checkCodeStatus(parseError(xhr.responseText));
            }
        });
    }

    Client.prototype.command_get_reportTime = function() {
        $.ajax({
            url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.ReportTime,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                $('#Sensor_reportTime-status').val(data.readings[0].value);
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $('#Sensor_reportTime-status').val("");
                checkCodeStatus(parseError(xhr.responseText));
            }
        });
    }

    Client.prototype.command_set_reportTime = function() {
        var value = $('#Sensor_reportTime-status').val();
        var resource = client.MapResource.ReportTime;
        var body = {
            [resource]: value
        };
        console.log(JSON.stringify(body));
        $.ajax({
            url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.ReportTime,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(body),
            dataType: 'text',
            success: function(data) {
                alert("success");
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                checkCodeStatus(parseError(xhr.responseText));
            }
        });
    }

    Client.prototype.command_get_measure = function() {
            $.ajax({
                url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.MeasureLight,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    console.log(data);
                    $('#Sensor_measure-status').val(data.readings[0].value);
                },
                error: function(xhr, status, error) {
                    alert(error + '\n' + xhr.responseText);
                    $('#Sensor_measure-status').val("");
                    checkCodeStatus(parseError(xhr.responseText));
                }
            });
        }
        // Client end   
        // Command end  -----------------------------------------

    return client;

})();