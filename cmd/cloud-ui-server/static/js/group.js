$(document).ready(function() {
    //init loading data.
    groupApp.loadDevice();
});

groupApp = (function() {
    "use strict";

    function Client() {
        this.Profile = "LightGroup";
        this.DeviceService = "device_zigbee";
        this.ProfileElement = "Light";
        this.MapCommand = {
            OnOff: "OnOff",
            Dimming: "Dimming",
            OnOffSchedule: "OnOffSchedule",
            DimmingSchedule: "DimmingSchedule",
            ManagerElement: "ManagerDeivce",
            ListElement: "ListDevice",
            Scenario: "Scenario"
        };
        this.MapResource = {
            OnOff: "LightGroup_OnOff",
            Dimming: "LightGroup_Dimming",
            OnOffSchedule: "LightGroup_OnOffSchedule",
            DimmingSchedule: "LightGroup_DimmingSchedule",
            Method: "LightGroup_Method",
            Element: "LightGroup_Device",
            ListElement: "LightGroup_ListDevice",
            Scenario: "LightGroup_Scenario"
        };
        this.currentSelectDevice = "";
        this.currentProtocols = null;
    }

    Client.prototype = {
        constructor: Client,

        // Device
        loadDevice: null,
        renderDevice: null,
        tryOpState: null,
        editDevice: null,
        addDevice: null,
        cancelAddOrUpdateDevice: null,
        uploadDevice: null,
        deleteDevice: null,

        // Command
        gotoCommand: null,
        cancelCommand: null,

        // LightGroup
        command_get_onoff: null,
        command_set_onoff: null,
        command_get_dimming: null,
        command_set_dimming: null,

        // onoff schedule
        load_onoff_schedule: null,
        addRow_onoff_schedule: null,
        submit_onoff_schedule: null,

        // dimming schedule    
        load_dimming_schedule: null,
        addRow_dimming_schedule: null,
        submit_dimming_schedule: null,

        // Element
        load_element: null,
        addElement: null,
        deleteElement: null,
        cancelElement: null,
        submitElement: null,

        // scenario
        load_scenario: null,
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
        $('#command-main').hide();
        $('#group-device-list').show();

        $("#group-device-list-table table tbody").empty();
        $("#group-device-list-table table tfoot").hide();
        if (!devices || devices.length == 0) {
            $("#group-device-list-table table tfoot").show();
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
            }
            switch (enableCommand) {
                case 0:
                    rowData += '<td><button class="btn btn-info fa fa-terminal fa-lg" onclick="groupApp.gotoCommand(\'' + v.name + '\')"></button></td>';
                    break;
                case 1:
                    rowData += '<td >' + '<i class="fa fa-ban fa-lg" style="color: red;" onclick="groupApp.tryOpState(\'' + v.name + '\')" onmouseover="$(this).find(\'span\').text(\'Click to try provision\');" onmouseout="$(this).find(\'span\').text(\'Unprovisioned\');"><span>Unprovisioned</span></i></td>';
                    break;
                case 2:
                    rowData += '<td >' + '<i class="fa fa-hourglass-half fa-lg" style="color: tomato;">Provisioning... Reload after a few seconds</i></td>';
                    break;
            }

            rowData += "</tr>";
            $("#group-device-list-table table tbody").append(rowData);
        });

        $("#group-device-list-table .device-delete-icon").on('click', function() {
            var device = JSON.parse($(this).children('input').val());
            client.deleteDevice(device);
        });

        $("#group-device-list-table .device-edit-icon").on('click', function() {
            var device = JSON.parse($(this).children('input').val());
            client.editDevice(device);
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

    Client.prototype.editDevice = function(device) {
        client.currentProtocols = device.protocols;
        $('#group-deviceID').val(device.id);
        $('#group-deviceName').val(device.name);
        $('#group-deviceDescription').val(device.description);
        $('#group-deviceLabels').val(device.labels ? device.labels.join(',') : '');

        $('#group-command-main').hide();
        $('#group-device-list').hide();
        $("#group-device-update-or-add .add-device").hide();
        $("#group-device-update-or-add .update-device").show();
        $("#group-device-update-or-add").show();
    };

    Client.prototype.addDevice = function() {
        $('#group-command-main').hide();
        $('#group-device-list').hide();
        $("#group-device-update-or-add").show();
        $("#group-device-update-or-add .update-device").hide();
        $("#group-device-update-or-add .add-device").show();
        $(".edgexfoundry-device-form")[0].reset();
    };

    Client.prototype.cancelAddOrUpdateDevice = function() {
        $("#group-device-update-or-add").hide();
        $('#group-command-main').hide();
        $('#group-device-list').show();

    };

    Client.prototype.uploadDevice = function(type) {
        var method;
        if (type == "new") {
            method = "POST";
            client.currentProtocols = {
                "General": {
                    "Type": "Group"
                },
            }
        } else {
            method = "PUT";
        }

        var device = {
            id: $('#group-deviceID').val(),
            name: $('#group-deviceName').val().trim(),
            description: $('#group-deviceDescription').val(),
            labels: $('#group-deviceLabels').val().split(','),
            adminState: "UNLOCKED",
            operatingState: "ENABLED",
            protocols: client.currentProtocols,
            service: {
                name: client.DeviceService,
            },
            profile: {
                name: client.Profile,
            }
        };

        $.ajax({
            url: '/core-metadata/api/v1/device',
            type: method,
            contentType: 'application/json',
            data: JSON.stringify(device),
            success: function() {
                client.cancelAddOrUpdateDevice();
                client.loadDevice();
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

    Client.prototype.deleteDevice = function(device) {
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
                                client.loadDevice();
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
    Client.prototype.gotoCommand = function(name) {
        client.currentSelectDevice = name;
        $('#group-currentDevice').html(name);

        $('#group-onoff-status').val("");
        $('#group-dimming-status').val("");
        $('#group-onoffScheduleTable tbody').empty();
        $('#group-dimmingScheduleTable tbody').empty();
        $('#group-elementTable tbody').empty();
        $('#group-parentTable tbody').empty();

        $('#group-device-list').hide();
        $('#command-main').show("fast");
    }
    Client.prototype.cancelCommand = function() {
        $('#command-main').hide("fast");
        $('#group-device-list').show();
    }

    // LightGroup start
    Client.prototype.command_get_onoff = function() {
        $.ajax({
            url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.OnOff,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                $('#group-onoff-status').val(data.readings[0].value);
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $('#group-onoff-status').val("");
            }
        });
    }

    Client.prototype.command_set_onoff = function() {
        var value = $('#group-onoff-status').val();
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
            }
        });
    }

    Client.prototype.command_get_dimming = function() {
        $.ajax({
            url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.Dimming,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                $('#group-dimming-status').val(data.readings[0].value);
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $('#group-dimming-status').val("");
            }
        });
    }

    Client.prototype.command_set_dimming = function() {
            var value = $('#group-dimming-status').val();
            var resource = client.MapResource.Dimming;
            var body = {
                [resource]: value
            };
            console.log(JSON.stringify(body));
            $.ajax({
                url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.Dimming,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(body),
                dataType: 'text',
                success: function(data) {
                    alert("success");
                },
                error: function(xhr, status, error) {
                    alert(error + '\n' + xhr.responseText);

                }
            });
        }
        // LightGroup end

    // OnOff Schedule start ------------------------
    Client.prototype.load_onoff_schedule = function() {
        $("#group-onoffScheduleTable table tfoot").hide();
        $("#group-onoffScheduleTable table tbody").empty();

        // ajax ...
        $.ajax({
            url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.OnOffSchedule,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                var schedules = JSON.parse(data.readings[0].value);
                if (!schedules || schedules.length == 0) {
                    $("#group-onoffScheduleTable table tfoot").show();
                    return;
                }

                $.each(schedules, function(i, v) {
                    var rowData = '<tr>';
                    if (v.owner != client.currentSelectDevice) {
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
                    $("#group-onoffScheduleTable table tbody").append(rowData);
                });
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $("#group-onoffScheduleTable table tfoot").show();
            }
        });
    }

    Client.prototype.addRow_onoff_schedule = function() {
        $("#group-onoffScheduleTable table tfoot").show();
        var rowData = '<tr>';
        rowData += '<td><input type="button" class="btn-danger" onclick="$(this).closest(\'tr\').remove();" value="x"></input>';
        rowData += '<td><input class="form-control" type="text" value="' + client.currentSelectDevice + '" disabled </input>';
        rowData += '<td><input class="form-control" type="text" value="00h00" </input>';
        rowData += '<td><input class="form-control" type="text" value="false" </input>';
        rowData += '</tr>';
        $("#group-onoffScheduleTable table tbody").append(rowData);
    }

    Client.prototype.submit_onoff_schedule = function() {
            var arrValues = [];
            var rows = $('#group-onoffScheduleTable table tr');

            // loop through each row of the table.            
            for (var row = 1; row < rows.length - 1; row++) { // -1 vi co tr cua tfoot
                var cells = rows[row].cells;
                var owner = cells[1].childNodes[0].value;

                if (owner != client.currentSelectDevice) {
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
            var resource = client.MapResource.OnOffSchedule;
            var body = {
                [resource]: value
            };
            console.log(JSON.stringify(body));
            // ajax ...
            $.ajax({
                url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.OnOffSchedule,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(body),
                dataType: 'text',
                success: function(data) {
                    alert("success");
                },
                error: function(xhr, status, error) {
                    alert(error + '\n' + xhr.responseText);
                }
            });
        }
        // OnOff Schedule end ------------------------

    // Dimming Schedule start ------------------------
    Client.prototype.load_dimming_schedule = function() {
        $("#group-dimmingScheduleTable table tfoot").hide();
        $("#group-dimmingScheduleTable table tbody").empty();

        // ajax ...
        $.ajax({
            url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.DimmingSchedule,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                var schedules = JSON.parse(data.readings[0].value);
                if (!schedules || schedules.length == 0) {
                    $("#group-dimmingScheduleTable table tfoot").show();
                    return;
                }

                $.each(schedules, function(i, v) {
                    var rowData = '<tr>';
                    if (v.owner != client.currentSelectDevice) {
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
                    $("#group-dimmingScheduleTable table tbody").append(rowData);
                });
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $("#group-dimmingScheduleTable table tfoot").show();
            }
        });
    }

    Client.prototype.addRow_dimming_schedule = function() {
        $("#group-dimmingScheduleTable table tfoot").hide();
        var rowData = '<tr>';
        rowData += '<td><input type="button" class="btn-danger" onclick="$(this).closest(\'tr\').remove();" value="x"></input>';
        rowData += '<td><input class="form-control" type="text" value="' + client.currentSelectDevice + '" disabled </input>';
        rowData += '<td><input class="form-control" type="text" value="00h00" </input>';
        rowData += '<td><input class="form-control" type="text" value="0" </input>';
        rowData += '</tr>';
        $("#group-dimmingScheduleTable table tbody").append(rowData);
    }

    Client.prototype.submit_dimming_schedule = function() {
            var arrValues = [];
            var rows = $('#group-dimmingScheduleTable table tr');

            // loop through each row of the table.            
            for (var row = 1; row < rows.length - 1; row++) { // -1 vi co tr cua tfoot
                var cells = rows[row].cells;
                var owner = cells[1].childNodes[0].value;

                if (owner != client.currentSelectDevice) {
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
            var resource = client.MapResource.DimmingSchedule;
            var body = {
                [resource]: value
            };
            console.log(JSON.stringify(body));
            // ajax ...
            $.ajax({
                url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.DimmingSchedule,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(body),
                dataType: 'text',
                success: function(data) {
                    alert("success");
                },
                error: function(xhr, status, error) {
                    alert(error + '\n' + xhr.responseText);
                }
            });
        }
        // Dimming Schedule end ------------------------

    // Element start ------------------------
    Client.prototype.load_element = function() {
        $("#group-elementTable table tfoot").hide();
        $("#group-elementTable table tbody").empty();

        // ajax ...
        $.ajax({
            url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.ListElement,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                var elements = JSON.parse(data.readings[0].value);
                if (!elements || elements.length == 0) {
                    $("#group-elementTable table tfoot").show();
                    return;
                }

                $.each(elements, function(i, v) {
                    var rowData = '<tr>';
                    rowData += '<td><button class="btn btn-danger fa fa-trash-o fa-lg" onclick="groupApp.deleteElement(\'' + v + '\')"></button></td>';
                    rowData += '<td>' + (i + 1) + '</td>';
                    rowData += '<td>' + v + '</td>';
                    rowData += '</tr>';
                    $("#group-elementTable table tbody").append(rowData);
                });
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $("#group-elementTable table tfoot").show();
            }
        });
    }

    Client.prototype.addElement = function() {
        $('#command-main').hide();
        $('#group-element-manager').show("fast");
        $('#group-name-element-select').empty();

        $.ajax({
            url: '/core-metadata/api/v1/device/profilename/' + client.ProfileElement,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                if (!data || data.length == 0) {
                    alert("Khong co element phu hop de them!");
                    return;
                }
                $.each(data, function(i, item) {
                    $('#group-name-element-select').append($('<option>', {
                        value: item.name,
                        text: item.name
                    }));
                });
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
            }
        });
    }

    Client.prototype.deleteElement = function(name) {
        console.log(name);
        var resource0 = client.MapResource.Method;
        var value0 = 'delete';
        var resource1 = client.MapResource.Element;
        var value1 = name;

        var body = {
            [resource0]: value0,
            [resource1]: value1
        };
        console.log(JSON.stringify(body));
        // ajax ...
        $.ajax({
            url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.ManagerElement,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(body),
            dataType: 'text',
            success: function(data) {
                alert("success");
                client.load_element();
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
            }
        });
    }

    Client.prototype.cancelElement = function() {
        $('#command-main').show("fast");
        $('#group-element-manager').hide();
    }

    Client.prototype.submitElement = function() {
            var resource0 = client.MapResource.Method;
            var value0 = 'put';
            var resource1 = client.MapResource.Element;
            var value1 = $('#group-name-element-select').val();

            var body = {
                [resource0]: value0,
                [resource1]: value1
            };
            console.log(JSON.stringify(body));
            // ajax ...
            $.ajax({
                url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.ManagerElement,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(body),
                dataType: 'text',
                success: function(data) {
                    alert("success");
                    client.cancelElement();
                    client.load_element();
                },
                error: function(xhr, status, error) {
                    alert(error + '\n' + xhr.responseText);
                }
            });
        }
        // Element end ------------------------

    // Scenario start ------------------------
    Client.prototype.load_scenario = function() {
            $("#group-parentTable table tfoot").hide();
            $("#group-parentTable table tbody").empty();

            // ajax ...
            $.ajax({
                url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.Scenario,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    console.log(data);
                    var scenarios = JSON.parse(data.readings[0].value);
                    if (!scenarios || scenarios.length == 0) {
                        $("#group-parentTable table tfoot").show();
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
                        $("#group-parentTable table tbody").append(rowData);
                    });
                },
                error: function(xhr, status, error) {
                    alert(error + '\n' + xhr.responseText);
                    $("#group-elementTable table tfoot").show();
                }
            });
        }
        // Scenario end ------------------------
        // Command end  -----------------------------------------

    return client;

})();