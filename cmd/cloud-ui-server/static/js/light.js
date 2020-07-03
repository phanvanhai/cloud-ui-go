$(document).ready(function() {
    //init loading data.
    lightApp.loadDevice();
});

lightApp = (function() {
    "use strict";

    function Light() {
        this.Profile = "Light";
        this.DeviceService = "device_zigbee";
        this.MapCommand = {
            OnOff: "OnOff",
            Dimming: "Dimming",
            OnOffSchedule: "OnOffSchedule",
            DimmingSchedule: "DimmingSchedule",
            Realtime: "Realtime",
            LightSensor: "LightSensor",
            ReportTime: "ReportTime",
            Group: "Group",
            Scenario: "Scenario"
        };
        this.MapResource = {
            OnOff: "Light_OnOff",
            Dimming: "Light_Dimming",
            OnOffSchedule: "Light_OnOffSchedule",
            DimmingSchedule: "Light_DimmingSchedule",
            ReportTime: "Light_ReportTime",
            Realtime: "Light_Realtime",
            LightSensor: "Light_LightSensor",
            Group: "Light_Group",
            Scenario: "Light_Scenario"
        };
        this.currentSelectDevice = "";
        this.currentProtocols = null;
    }

    Light.prototype = {
        constructor: Light,

        // Device
        loadDevice: null,
        renderDevice: null,
        tryOpState: null,
        setAdminState: null,
        editDevice: null,
        addDevice: null,
        cancelAddOrUpdateDevice: null,
        uploadDevice: null,
        deleteDevice: null,

        // Command
        gotoCommand: null,
        cancelCommand: null,

        // Light
        command_get_onoff: null,
        command_set_onoff: null,
        command_get_dimming: null,
        command_set_dimming: null,

        // Report Time
        command_get_reportTime: null,
        command_set_reportTime: null,

        // sensor
        command_get_measure: null,

        // onoff schedule
        load_onoff_schedule: null,
        addRow_onoff_schedule: null,
        submit_onoff_schedule: null,

        // dimming schedule    
        load_dimming_schedule: null,
        addRow_dimming_schedule: null,
        submit_dimming_schedule: null,

        // group
        load_group: null,

        // scenario
        load_scenario: null,
    }

    var light = new Light();
    // Device start  -----------------------------------------
    Light.prototype.loadDevice = function() {
        $.ajax({
            url: '/core-metadata/api/v1/device/profilename/' + light.Profile,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                light.renderDevice(data);
            },
            statusCode: {}
        });
    }

    Light.prototype.renderDevice = function(devices) {
        $('#light-command-main').hide();
        $('#light-device-list').show();

        $("#light-device-list-table table tbody").empty();
        $("#light-device-list-table table tfoot").hide();
        if (!devices || devices.length == 0) {
            $("#light-device-list-table table tfoot").show();
            return;
        }
        $.each(devices, function(i, v) {
            var rowData = "<tr>";
            rowData += '<td class="device-delete-icon"><input type="hidden" value=\'' + JSON.stringify(v) + '\'><div class="btn btn-danger fa fa-trash"></div></td>';
            rowData += '<td class="device-edit-icon"><input type="hidden" value=\'' + JSON.stringify(v) + '\'><div class="btn btn-warning fa fa-edit"></div></td>';
            rowData += "<td>" + (i + 1) + "</td>";
            rowData += "<td>" + v.name + "</td>";
            rowData += "<td>" + v.description + "</td>";
            rowData += "<td>" + v.labels + "</td>";
            rowData += "<td>" + dateToString(v.created) + "</td>";
            rowData += "<td>" + dateToString(v.modified) + "</td>";

            if (v.adminState == "UNLOCKED") {
                rowData += '<td><select class="light-adminState"><option value="UNLOCKED" selected>UNLOCKED</option><option value="LOCKED">LOCKED</option></select></td>';
            } else {
                rowData += '<td><select class="light-adminState"><option value="UNLOCKED">UNLOCKED</option><option value="LOCKED" selected>LOCKED</option></select></td>';
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
                    rowData += '<td><button class="btn btn-info fa fa-terminal" onclick="lightApp.gotoCommand(\'' + v.name + '\')"></button></td>';
                    break;
                case 1:
                    rowData += '<td >' + '<i class="fa fa-ban" style="color: red;" onclick="lightApp.tryOpState(\'' + v.name + '\')" onmouseover="$(this).find(\'span\').text(\'Click to try provision\');" onmouseout="$(this).find(\'span\').text(\'Unprovisioned\');"><span>Unprovisioned</span></i></td>';
                    break;
                case 2:
                    rowData += '<td >' + '<i class="fa fa-hourglass-half" style="color: tomato;" >Provisioning... Reload after a few seconds</i></td>';
                    break;
                case 3:
                    rowData += '<td >' + '<i class="fa fa-chain-broken" style="color: tomato;" onclick="lightApp.tryOpState(\'' + v.name + '\')" onmouseover="$(this).find(\'span\').text(\'Click to try connect\');" onmouseout="$(this).find(\'span\').text(\'Disconnected\');"><span>Disconnected</span></i></td>';
                    break
            }

            rowData += "</tr>";
            $("#light-device-list-table table tbody").append(rowData);
        });

        $("#light-device-list-table .device-delete-icon").on('click', function() {
            var device = JSON.parse($(this).children('input').val());
            light.deleteDevice(device);
        });

        $("#light-device-list-table .device-edit-icon").on('click', function() {
            var device = JSON.parse($(this).children('input').val());
            light.editDevice(device);
        });

        $('#light-device-list-table .light-adminState').change(function() {
            light.setAdminState($(this).closest('td').prev('td').html(), $(this).val());
        })

        $("#light-device-list-table .device-command-icon").on('click', function() {
            var deviceName = $(this).children('input').val();
            light.gotoCommand(deviceName);
        });
    }

    Light.prototype.tryOpState = function(name) {
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

    Light.prototype.setAdminState = function(name, value) {
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

    Light.prototype.editDevice = function(device) {
        light.currentProtocols = device.protocols;
        $('#light-deviceID').val(device.id);
        $('#light-deviceName').val(device.name);
        $('#light-deviceDescription').val(device.description);
        $('#light-deviceLabels').val(device.labels ? device.labels.join(',') : '');
        $('#light-adminState').val(device.adminState);
        $('#light-operatingState').val(device.operatingState);

        $('#light-type').val(device.protocols["General"]["Type"]);
        $('#light-versionConfig').val(device.protocols["General"]["VersionConfig"]);
        $('#light-networkID').val(device.protocols["General"]["NetworkID"]);
        $('#light-linkKey').val(device.protocols["General"]["NetworkLinkKey"]);
        $('#light-mac').val(device.protocols["General"]["NetworkMAC"]);

        $('#light-command-main').hide();
        $('#light-device-list').hide();
        $("#light-device-update-or-add .add-device").hide();
        $("#light-device-update-or-add .update-device").show();
        $("#light-device-update-or-add").show();
    };

    Light.prototype.addDevice = function() {
        $('#light-command-main').hide();
        $('#light-device-list').hide();
        $("#light-device-update-or-add").show();
        $("#light-device-update-or-add .update-device").hide();
        $("#light-device-update-or-add .add-device").show();
        $(".edgexfoundry-device-form")[0].reset();
        $('#light-deviceID').val("");
        $('#light-deviceName').val("");
        $('#light-deviceDescription').val("");
        $('#light-deviceLabels').val("");
        $('#light-adminState').val("UNLOCKED");
        $('#light-operatingState').val("ENABLED");

        $('#light-type').val("");
        $('#light-versionConfig').val("");
        $('#light-networkID').val("");
        $('#light-linkKey').val("");
        $('#light-mac').val("");
        $('#light-type').val("Device");
        $('#light-versionConfig').val("");
    };

    Light.prototype.cancelAddOrUpdateDevice = function() {
        $("#light-device-update-or-add").hide();
        $('#light-command-main').hide();
        $('#light-device-list').show();

    };

    Light.prototype.uploadDevice = function(type) {
        var method;
        if (type == "new") {
            method = "POST";
            light.currentProtocols = {};
        } else {
            method = "PUT";
        }

        var property = {
            "Type": $('#light-type').val(),
            "VersionConfig": $('#light-versionConfig').val(),
            "NetworkID": $('#light-networkID').val(),
            "NetworkLinkKey": $('#light-linkKey').val(),
            "NetworkMAC": $('#light-mac').val()
        }
        light.currentProtocols["General"] = property;

        var device = {
            id: $('#light-deviceID').val(),
            name: $('#light-deviceName').val().trim(),
            description: $('#light-deviceDescription').val(),
            labels: $('#light-deviceLabels').val().split(','),
            adminState: $('#light-adminState').val(),
            operatingState: $('#light-operatingState').val(),
            protocols: light.currentProtocols,
            service: {
                name: light.DeviceService,
            },
            profile: {
                name: light.Profile,
            }
        };

        console.log(device);

        $.ajax({
            url: '/core-metadata/api/v1/device',
            type: method,
            contentType: 'application/json',
            data: JSON.stringify(device),
            success: function() {
                light.cancelAddOrUpdateDevice();
                light.loadDevice();
                bootbox.alert({
                    message: "commit success!",
                    className: 'red-green-buttons'
                });
            },
            statusCode: {
                400: function() {
                    bootbox.alert({
                        title: "Error",
                        message: "the request is malformed or unparsable or if an associated object (Addressable, Profile, Service) cannot be found with the id or name provided !",
                        className: 'red-green-buttons'
                    });
                },
                409: function() {
                    bootbox.alert({
                        title: "Error",
                        message: "the name is determined to not be unique with regard to others !",
                        className: 'red-green-buttons'
                    });
                },
                500: function() {
                    bootbox.alert({
                        title: "Error",
                        message: "unknown or unanticipated issues !",
                        className: 'red-green-buttons'
                    });
                }
            }
        });
    }

    Light.prototype.deleteDevice = function(device) {
            bootbox.confirm({
                title: "confirm",
                message: "Are you sure to remove device? ",
                className: 'green-red-buttons',
                callback: function(result) {
                    if (result) {
                        $.ajax({
                            url: '/core-metadata/api/v1/device/id/' + device.id,
                            type: 'DELETE',
                            success: function() {
                                bootbox.alert({
                                    message: "remove device success !",
                                    className: 'red-green-buttons'
                                });
                                light.loadDevice();
                            },
                            statusCode: {
                                400: function() {
                                    bootbox.alert({
                                        title: "Error",
                                        message: " incorrect or unparsable requests !",
                                        className: 'red-green-buttons'
                                    });
                                },
                                404: function() {
                                    bootbox.alert({
                                        title: "Error",
                                        message: " the device cannot be found by the id provided !",
                                        className: 'red-green-buttons'
                                    });
                                },
                            }
                        });
                    }
                }
            });
        }
        // Device start  -----------------------------------------

    // Command start  -----------------------------------------
    Light.prototype.gotoCommand = function(name) {
        light.currentSelectDevice = name;
        $('#light-currentDevice').html(name);

        $('#light-onoff-status').val("");
        $('#light-dimming-status').val("");
        $('#light-onoffScheduleTable tbody').empty();
        $('#light-dimmingScheduleTable tbody').empty();
        $('#light-groupTable tbody').empty();
        $('#light-scenarioTable tbody').empty();

        $('#light-device-list').hide();
        $('#light-command-main').show("fast");
    }
    Light.prototype.cancelCommand = function() {
        $('#light-command-main').hide("fast");
        $('#light-device-list').show();
    }

    // Light start
    Light.prototype.command_get_onoff = function() {
        console.log('GET request: url:' + '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.OnOff);
        $.ajax({
            url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.OnOff,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                $('#light-onoff-status').val(data.readings[0].value);
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $('#light-onoff-status').val("");
                checkCodeStatus(parseError(xhr.responseText));
            }
        });
    }

    Light.prototype.command_set_onoff = function() {
        var value = $('#light-onoff-status').val();
        var resource = light.MapResource.OnOff;
        var body = {
            [resource]: value
        };
        console.log('PUT request: url:' + '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.OnOff);
        console.log(JSON.stringify(body));
        // ajax ...
        $.ajax({
            url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.OnOff,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(body),
            dataType: 'text',
            success: function(data) {
                console.log(data);
                if (data == "") {
                    alert("success");
                } else {
                    alert(data);
                }
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                checkCodeStatus(parseError(xhr.responseText));
            }
        });
    }

    Light.prototype.command_get_dimming = function() {
        console.log('GET request: url:' + '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.Dimming);
        $.ajax({
            url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.Dimming,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                $('#light-dimming-status').val(data.readings[0].value);
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $('#light-dimming-status').val("");
                checkCodeStatus(parseError(xhr.responseText));
            }
        });
    }

    Light.prototype.command_set_dimming = function() {
        var value = $('#light-dimming-status').val();
        var resource = light.MapResource.Dimming;
        var body = {
            [resource]: value
        };
        console.log('PUT request: url:' + '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.Dimming);
        console.log(JSON.stringify(body));
        $.ajax({
            url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.Dimming,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(body),
            dataType: 'text',
            success: function(data) {
                console.log(data);
                if (data == "") {
                    alert("success");
                } else {
                    alert(data);
                }
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                checkCodeStatus(parseError(xhr.responseText));
            }
        });
    }

    Light.prototype.command_get_reportTime = function() {
        console.log('GET request: url:' + '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.ReportTime);
        $.ajax({
            url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.ReportTime,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                $('#light-reportTime-status').val(data.readings[0].value);
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $('#light-reportTime-status').val("");
                checkCodeStatus(parseError(xhr.responseText));
            }
        });
    }

    Light.prototype.command_set_reportTime = function() {
        var value = $('#light-reportTime-status').val();
        var resource = light.MapResource.ReportTime;
        var body = {
            [resource]: value
        };
        console.log('PUT request: url:' + '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.ReportTime);
        console.log(JSON.stringify(body));
        $.ajax({
            url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.ReportTime,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(body),
            dataType: 'text',
            success: function(data) {
                console.log(data);
                if (data == "") {
                    alert("success");
                } else {
                    alert(data);
                }
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                checkCodeStatus(parseError(xhr.responseText));
            }
        });
    }

    Light.prototype.command_get_measure = function() {
            console.log('GET request: url:' + '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.LightSensor);
            $.ajax({
                url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.LightSensor,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    console.log(data);
                    $('#sensor-measure-status').val(data.readings[0].value);
                },
                error: function(xhr, status, error) {
                    alert(error + '\n' + xhr.responseText);
                    $('#sensor-measure-status').val("");
                    checkCodeStatus(parseError(xhr.responseText));
                }
            });
        }
        // Light end

    // OnOff Schedule start ------------------------
    Light.prototype.load_onoff_schedule = function() {
        $("#light-onoffScheduleTable table tfoot").hide();
        $("#light-onoffScheduleTable table tbody").empty();

        console.log('GET request: url:' + '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.OnOffSchedule);
        // ajax ...
        $.ajax({
            url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.OnOffSchedule,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                var schedules = JSON.parse(data.readings[0].value);
                if (!schedules || schedules.length == 0) {
                    $("#light-onoffScheduleTable table tfoot").show();
                    return;
                }

                $.each(schedules, function(i, v) {
                    var rowData = '<tr>';
                    if (v.owner != light.currentSelectDevice) {
                        // Neu lap lich cua Group --> khong cho phep xoa, sua:
                        rowData += '<td><input type="button" class="btn-info" value=" " onclick="alert(\'Khong the xoa lap lich cua Group!Hay vao Group de xoa!\');"</input>';
                        rowData += '<td><input class="form-control" type="text" value="' + v.owner + '" disabled </input>';
                        rowData += '<td><input class="form-control" type="text" value="' + convertTimeToStr(v.time) + '" disabled </input>';
                        rowData += '<td><input class="form-control" type="text" value="' + JSON.stringify(v.value) + '" disabled </input>';
                    } else {
                        rowData += '<td><input type="button" class="btn-danger" onclick="$(this).closest(\'tr\').remove();" value="x"></input>';
                        rowData += '<td><input class="form-control" type="text" value="' + v.owner + '" disabled </input>';
                        rowData += '<td><input class="form-control" type="text" value="' + convertTimeToStr(v.time) + '"  </input>';
                        rowData += '<td><input class="form-control" type="text" value="' + JSON.stringify(v.value) + '"  </input>';
                    }
                    rowData += '</tr>';
                    $("#light-onoffScheduleTable table tbody").append(rowData);
                });
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $("#light-onoffScheduleTable table tfoot").show();
            }
        });
    }

    Light.prototype.addRow_onoff_schedule = function() {
        $("#light-onoffScheduleTable table tfoot").hide();
        var rowData = '<tr>';
        rowData += '<td><input type="button" class="btn-danger" onclick="$(this).closest(\'tr\').remove();" value="x"></input>';
        rowData += '<td><input class="form-control" type="text" value="' + light.currentSelectDevice + '" disabled </input>';
        rowData += '<td><input class="form-control" type="text" value="00h00" </input>';
        rowData += '<td><input class="form-control" type="text" value="false" </input>';
        rowData += '</tr>';
        $("#light-onoffScheduleTable table tbody").append(rowData);
    }

    Light.prototype.submit_onoff_schedule = function() {
            var arrValues = [];
            var rows = $('#light-onoffScheduleTable table tr');

            // loop through each row of the table.            
            for (var row = 1; row < rows.length - 1; row++) { // -1 vi co tr cua tfoot
                var cells = rows[row].cells;
                var owner = cells[1].childNodes[0].value;

                if (owner != light.currentSelectDevice) {
                    // khong xu ly group
                    continue;
                }

                var timeStr = cells[2].childNodes[0].value;
                var value = cells[3].childNodes[0].value;
                var timeInt = convertStrToTime(timeStr);
                var isTrueSet = (value == 'true');

                var object = {
                    owner: owner,
                    time: timeInt,
                    value: isTrueSet
                };
                arrValues.push(object);
            }
            var value = JSON.stringify(arrValues);
            var resource = light.MapResource.OnOffSchedule;
            var body = {
                [resource]: value
            };
            console.log('PUT request: url:' + '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.OnOffSchedule);
            console.log(JSON.stringify(body));
            // ajax ...
            $.ajax({
                url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.OnOffSchedule,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(body),
                dataType: 'text',
                success: function(data) {
                    console.log(data);
                    if (data == "") {
                        alert("success");
                    } else {
                        alert(data);
                    }
                },
                error: function(xhr, status, error) {
                    alert(error + '\n' + xhr.responseText);
                    checkCodeStatus(parseError(xhr.responseText));
                }
            });
        }
        // OnOff Schedule end ------------------------

    // Dimming Schedule start ------------------------
    Light.prototype.load_dimming_schedule = function() {
        $("#light-dimmingScheduleTable table tfoot").hide();
        $("#light-dimmingScheduleTable table tbody").empty();

        console.log('GET request: url:' + '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.DimmingSchedule);
        // ajax ...
        $.ajax({
            url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.DimmingSchedule,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                var schedules = JSON.parse(data.readings[0].value);
                if (!schedules || schedules.length == 0) {
                    $("#light-dimmingScheduleTable table tfoot").show();
                    return;
                }

                $.each(schedules, function(i, v) {
                    var rowData = '<tr>';
                    if (v.owner != light.currentSelectDevice) {
                        // Neu lap lich cua Group --> khong cho phep xoa, sua:
                        rowData += '<td><input type="button" class="btn-info" value=" " onclick="alert(\'Khong the xoa lap lich cua Group!Hay vao Group de xoa!\');"</input>';
                        rowData += '<td><input class="form-control" type="text" value="' + v.owner + '" disabled </input>';
                        rowData += '<td><input class="form-control" type="text" value="' + convertTimeToStr(v.time) + '" disabled </input>';
                        rowData += '<td><input class="form-control" type="text" value="' + JSON.stringify(v.value) + '" disabled </input>';
                    } else {
                        rowData += '<td><input type="button" class="btn-danger" onclick="$(this).closest(\'tr\').remove();" value="x"></input>';
                        rowData += '<td><input class="form-control" type="text" value="' + v.owner + '" disabled </input>';
                        rowData += '<td><input class="form-control" type="text" value="' + convertTimeToStr(v.time) + '" </input>';
                        rowData += '<td><input class="form-control" type="text" value="' + JSON.stringify(v.value) + '" </input>';
                    }
                    rowData += '</tr>';
                    $("#light-dimmingScheduleTable table tbody").append(rowData);
                });
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $("#light-dimmingScheduleTable table tfoot").show();
            }
        });
    }

    Light.prototype.addRow_dimming_schedule = function() {
        $("#light-dimmingScheduleTable table tfoot").hide();
        var rowData = '<tr>';
        rowData += '<td><input type="button" class="btn-danger" onclick="$(this).closest(\'tr\').remove();" value="x"></input>';
        rowData += '<td><input class="form-control" type="text" value="' + light.currentSelectDevice + '" disabled </input>';
        rowData += '<td><input class="form-control" type="text" value="00h00" </input>';
        rowData += '<td><input class="form-control" type="text" value="0" </input>';
        rowData += '</tr>';
        $("#light-dimmingScheduleTable table tbody").append(rowData);
    }

    Light.prototype.submit_dimming_schedule = function() {
            var arrValues = [];
            var rows = $('#light-dimmingScheduleTable table tr');

            // loop through each row of the table.            
            for (var row = 1; row < rows.length - 1; row++) { // -1 vi co tr cua tfoot
                var cells = rows[row].cells;
                var owner = cells[1].childNodes[0].value;

                if (owner != light.currentSelectDevice) {
                    // khong xu ly group
                    continue;
                }

                var timeStr = cells[2].childNodes[0].value;
                var value = cells[3].childNodes[0].value;
                var timeInt = convertStrToTime(timeStr);
                var valueInt = parseInt(value, 10);

                var object = {
                    owner: owner,
                    time: timeInt,
                    value: valueInt
                };
                arrValues.push(object);
            }
            var value = JSON.stringify(arrValues);
            var resource = light.MapResource.DimmingSchedule;
            var body = {
                [resource]: value
            };
            console.log('PUT request: url:' + '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.DimmingSchedule);
            console.log(JSON.stringify(body));
            // ajax ...
            $.ajax({
                url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.DimmingSchedule,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(body),
                dataType: 'text',
                success: function(data) {
                    console.log(data);
                    if (data == "") {
                        alert("success");
                    } else {
                        alert(data);
                    }
                },
                error: function(xhr, status, error) {
                    alert(error + '\n' + xhr.responseText);
                    checkCodeStatus(parseError(xhr.responseText));
                }
            });
        }
        // Dimming Schedule end ------------------------

    // Group start ------------------------
    Light.prototype.load_group = function() {
            $("#light-groupTable table tfoot").hide();
            $("#light-groupTable table tbody").empty();

            console.log('GET request: url:' + '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.Group);
            // ajax ...
            $.ajax({
                url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.Group,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    console.log(data);
                    var groups = JSON.parse(data.readings[0].value);
                    if (!groups || groups.length == 0) {
                        $("#light-groupTable table tfoot").show();
                        return;
                    }

                    $.each(groups, function(i, v) {
                        var rowData = '<tr>';
                        rowData += '<td></td>';
                        rowData += '<td>' + (i + 1) + '</td>';
                        rowData += '<td><input class="form-control" type="text" disabled value="' + v + '"></td>';
                        rowData += '</tr>';
                        $("#light-groupTable table tbody").append(rowData);
                    });
                },
                error: function(xhr, status, error) {
                    alert(error + '\n' + xhr.responseText);
                    $("#light-groupTable table tfoot").show();
                }
            });
        }
        // Group end ------------------------

    // Scenario start ------------------------
    Light.prototype.load_scenario = function() {
            $("#light-scenarioTable table tfoot").hide();
            $("#light-scenarioTable table tbody").empty();

            console.log('GET request: url:' + '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.Scenario);
            // ajax ...
            $.ajax({
                url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.Scenario,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    console.log(data);
                    var scenarios = JSON.parse(data.readings[0].value);
                    if (!scenarios || scenarios.length == 0) {
                        $("#light-scenarioTable table tfoot").show();
                        return;
                    }

                    $.each(scenarios, function(i, v) {
                        var rowData = '<tr>';
                        var content = JSON.parse(v.Content);

                        rowData += '<td></td>';
                        rowData += '<td>' + (i + 1) + '</td>';
                        rowData += '<td><input class="form-control" type="text" disabled value="' + v.Parent + '"></td>';
                        rowData += '<td><input class="form-control" type="text" disabled value="' + content.Command + '"></td>';

                        var body = JSON.parse(content.Body);
                        var bodyHtml = '<div>';
                        for (var [key, value] of Object.entries(body)) {
                            bodyHtml += key + '&nbsp;<input class="form-control" type="text" disabled value="' + value + '"></input><br>';
                        }
                        bodyHtml += '</div>';
                        rowData += '<td>' + bodyHtml + '</td>';

                        rowData += '</tr>';
                        $("#light-scenarioTable table tbody").append(rowData);
                    });
                },
                error: function(xhr, status, error) {
                    alert(error + '\n' + xhr.responseText);
                    $("#light-groupTable table tfoot").show();
                }
            });
        }
        // Scenario end ------------------------
        // Command end  -----------------------------------------

    return light;

})();