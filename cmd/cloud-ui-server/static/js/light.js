$(document).ready(function() {
    //init loading data.
    lightApp.loadDevice();
});

lightApp = (function() {
    "use strict";

    function Light() {
        this.Profile = "Light";
        this.MapCommand = {
            OnOff: "OnOff",
            Dimming: "Dimming",
            OnOffSchedule: "OnOffSchedule",
            DimmingSchedule: "DimmingSchedule",
            Realtime: "Realtime",
            LightMeasure: "LightMeasure",
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
            LightMeasure: "Light_LightMeasure",
            Group: "Light_Group",
            Scenario: "Light_Scenario"
        };
        this.currentSelectDevice = "";
    }

    Light.prototype = {
        constructor: Light,

        // Device
        loadDevice: null,
        renderDevice: null,
        tryOpState: null,
        setAdminState: null,

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
    var testRenderOnOff = [{
        "owner": "group",
        "time": 197900,
        "value": true
    }];
    var testRenderDimming = [{
        "owner": "group",
        "time": 197888,
        "value": 50
    }];
    var testRenderGroup = ["group1", "group2"];
    var testRenderScenario = [{
        "Parent": "S1",
        "Element": "DemoDevice",
        "Content": "{\"Command\": \"OnOff\", \"Body\": \"{\\\"Light_OnOff\\\":\\\"true\\\"}\"}"
    }, {
        "Parent": "S2",
        "Element": "DemoDevice",
        "Content": "{\"Command\": \"OnOff\", \"Body\": \"{\\\"Light_Dimming\\\":\\\"80\\\"}\"}"
    }];

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
        $('#Light_command-main').hide();
        $('#Light_device-list').show();

        $("#Light_device-list-table table tbody").empty();
        $("#Light_device-list-table table tfoot").hide();
        if (!devices || devices.length == 0) {
            $("#Light_device-list-table table tfoot").show();
            return;
        }
        $.each(devices, function(i, v) {
            var rowData = "<tr>";
            rowData += '<td></td>';
            rowData += "<td>" + (i + 1) + "</td>";
            rowData += '<td class="device-name">' + v.name + '</td>';
            if (v.adminState == "UNLOCKED") {
                rowData += '<td><select class="Light_adminState"><option value="UNLOCKED" selected>UNLOCKED</option><option value="LOCKED">LOCKED</option></select></td>';
            } else {
                rowData += '<td><select class="Light_adminState"><option value="UNLOCKED">UNLOCKED</option><option value="LOCKED" selected>LOCKED</option></select></td>';
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
            $("#Light_device-list-table table tbody").append(rowData);
        });


        $('#Light_device-list-table .Light_adminState').change(function() {
            light.setAdminState($(this).closest('td').prev('td').html(), $(this).val());
        })

        $("#Light_device-list-table .device-command-icon").on('click', function() {
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
        // Device start  -----------------------------------------

    // Command start  -----------------------------------------
    Light.prototype.gotoCommand = function(name) {
        light.currentSelectDevice = name;
        $('#Light_currentDevice').html(name);

        $('#Light_onoff-status').val("");
        $('#Light_dimming-status').val("");
        $('#Light_onoffScheduleTable tbody').empty();
        $('#Light_dimmingScheduleTable tbody').empty();
        $('#Light_groupTable tbody').empty();
        $('#Light_scenarioTable tbody').empty();

        $('#Light_device-list').hide();
        $('#Light_command-main').show("fast");
    }
    Light.prototype.cancelCommand = function() {
        $('#Light_command-main').hide("fast");
        $('#Light_device-list').show();
    }

    // Light start
    Light.prototype.command_get_onoff = function() {
        $.ajax({
            url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.OnOff,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                $('#Light_onoff-status').val(data.readings[0].value);
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $('#Light_onoff-status').val("");
                checkCodeStatus(parseError(xhr.responseText));
            }
        });
    }

    Light.prototype.command_set_onoff = function() {
        var value = $('#Light_onoff-status').val();
        var resource = light.MapResource.OnOff;
        var body = {
            [resource]: value
        };
        console.log(JSON.stringify(body));
        // ajax ...
        $.ajax({
            url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.OnOff,
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

    Light.prototype.command_get_dimming = function() {
        $.ajax({
            url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.Dimming,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                $('#Light_dimming-status').val(data.readings[0].value);
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $('#Light_dimming-status').val("");
                checkCodeStatus(parseError(xhr.responseText));
            }
        });
    }

    Light.prototype.command_set_dimming = function() {
        var value = $('#Light_dimming-status').val();
        var resource = light.MapResource.Dimming;
        var body = {
            [resource]: value
        };
        console.log(JSON.stringify(body));
        $.ajax({
            url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.Dimming,
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

    Light.prototype.command_get_reportTime = function() {
        $.ajax({
            url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.ReportTime,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                $('#Light_reportTime-status').val(data.readings[0].value);
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $('#Light_reportTime-status').val("");
                checkCodeStatus(parseError(xhr.responseText));
            }
        });
    }

    Light.prototype.command_set_reportTime = function() {
        var value = $('#Light_reportTime-status').val();
        var resource = light.MapResource.ReportTime;
        var body = {
            [resource]: value
        };
        console.log(JSON.stringify(body));
        $.ajax({
            url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.ReportTime,
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

    Light.prototype.command_get_measure = function() {
            $.ajax({
                url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.LightMeasure,
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
        $("#Light_onoffScheduleTable table tfoot").hide();
        $("#Light_onoffScheduleTable table tbody").empty();

        // ajax ...
        $.ajax({
            url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.OnOffSchedule,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                var schedules = JSON.parse(data.readings[0].value);
                if (!schedules || schedules.length == 0) {
                    $("#Light_onoffScheduleTable table tfoot").show();
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
                    $("#Light_onoffScheduleTable table tbody").append(rowData);
                });
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $("#Light_onoffScheduleTable table tfoot").show();
            }
        });
    }

    Light.prototype.addRow_onoff_schedule = function() {
        $("#Light_onoffScheduleTable table tfoot").hide();
        var rowData = '<tr>';
        rowData += '<td><input type="button" class="btn-danger" onclick="$(this).closest(\'tr\').remove();" value="x"></input>';
        rowData += '<td><input class="form-control" type="text" value="' + light.currentSelectDevice + '" disabled </input>';
        rowData += '<td><input class="form-control" type="text" value="00h00" </input>';
        rowData += '<td><input class="form-control" type="text" value="false" </input>';
        rowData += '</tr>';
        $("#Light_onoffScheduleTable table tbody").append(rowData);
    }

    Light.prototype.submit_onoff_schedule = function() {
            var arrValues = [];
            var rows = $('#Light_onoffScheduleTable table tr');

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
            console.log(JSON.stringify(body));
            // ajax ...
            $.ajax({
                url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.OnOffSchedule,
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
        // OnOff Schedule end ------------------------

    // Dimming Schedule start ------------------------
    Light.prototype.load_dimming_schedule = function() {
        $("#Light_dimmingScheduleTable table tfoot").hide();
        $("#Light_dimmingScheduleTable table tbody").empty();

        // ajax ...
        $.ajax({
            url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.DimmingSchedule,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                var schedules = JSON.parse(data.readings[0].value);
                if (!schedules || schedules.length == 0) {
                    $("#Light_dimmingScheduleTable table tfoot").show();
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
                    $("#Light_dimmingScheduleTable table tbody").append(rowData);
                });
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $("#Light_dimmingScheduleTable table tfoot").show();
            }
        });
    }

    Light.prototype.addRow_dimming_schedule = function() {
        $("#Light_dimmingScheduleTable table tfoot").hide();
        var rowData = '<tr>';
        rowData += '<td><input type="button" class="btn-danger" onclick="$(this).closest(\'tr\').remove();" value="x"></input>';
        rowData += '<td><input class="form-control" type="text" value="' + light.currentSelectDevice + '" disabled </input>';
        rowData += '<td><input class="form-control" type="text" value="00h00" </input>';
        rowData += '<td><input class="form-control" type="text" value="0" </input>';
        rowData += '</tr>';
        $("#Light_dimmingScheduleTable table tbody").append(rowData);
    }

    Light.prototype.submit_dimming_schedule = function() {
            var arrValues = [];
            var rows = $('#Light_dimmingScheduleTable table tr');

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
            console.log(JSON.stringify(body));
            // ajax ...
            $.ajax({
                url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.DimmingSchedule,
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
        // Dimming Schedule end ------------------------

    // Group start ------------------------
    Light.prototype.load_group = function() {
            $("#Light_groupTable table tfoot").hide();
            $("#Light_groupTable table tbody").empty();

            // ajax ...
            $.ajax({
                url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.Group,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    console.log(data);
                    var groups = JSON.parse(data.readings[0].value);
                    if (!groups || groups.length == 0) {
                        $("#Light_groupTable table tfoot").show();
                        return;
                    }

                    $.each(groups, function(i, v) {
                        var rowData = '<tr>';
                        rowData += '<td></td>';
                        rowData += '<td>' + (i + 1) + '</td>';
                        rowData += '<td><input class="form-control" type="text" disabled value="' + v + '"></td>';
                        rowData += '</tr>';
                        $("#Light_groupTable table tbody").append(rowData);
                    });
                },
                error: function(xhr, status, error) {
                    alert(error + '\n' + xhr.responseText);
                    $("#Light_groupTable table tfoot").show();
                }
            });
        }
        // Group end ------------------------

    // Scenario start ------------------------
    Light.prototype.load_scenario = function() {
            $("#Light_scenarioTable table tfoot").hide();
            $("#Light_scenarioTable table tbody").empty();

            // ajax ...
            $.ajax({
                url: '/core-command/api/v1/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.Scenario,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    console.log(data);
                    var scenarios = JSON.parse(data.readings[0].value);
                    if (!scenarios || scenarios.length == 0) {
                        $("#Light_scenarioTable table tfoot").show();
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
                        $("#Light_scenarioTable table tbody").append(rowData);
                    });
                },
                error: function(xhr, status, error) {
                    alert(error + '\n' + xhr.responseText);
                    $("#Light_groupTable table tfoot").show();
                }
            });
        }
        // Scenario end ------------------------
        // Command end  -----------------------------------------

    return light;

})();