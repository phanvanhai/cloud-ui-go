$(document).ready(function() {
    //init loading data.
    scenarioApp.loadDevice();
    scenarioApp.loadDeviceCommandCache();
});

scenarioApp = (function() {
    "use strict";

    function Client() {
        this.Profile = "Scenario";
        this.DeviceService = "device_zigbee";
        this.DeviceCommandCache = [];
        this.MapCommand = {
            Trigger: "Trigger",
            ManagerElement: "Content",
        };
        this.MapResource = {
            Trigger: "Scenario_Trigger",
            Content: "Scenario_Content",
        };
        this.currentSelectDevice = "";
        this.currentProtocols = null;
    }

    Client.prototype = {
        constructor: Client,

        // init
        loadDeviceCommandCache: null,

        // Device
        loadDevice: null,
        renderDevice: null,
        editDevice: null,
        addDevice: null,
        cancelAddOrUpdateDevice: null,
        uploadDevice: null,
        deleteDevice: null,

        // Command
        gotoCommand: null,
        cancelCommand: null,

        // Trigger
        command_set_trigger: null,

        // Element
        load_element: null,
        addRow_element: null,
        submit_element: null,
    }

    var client = new Client();

    Client.prototype.loadDeviceCommandCache = function() {
        $.ajax({
            url: '/core-command/api/v1/device',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                client.DeviceCommandCache = data;
            }
        });
    }

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
        $('#scenario-command-main').hide();
        $("#scenario-device-update-or-add").hide();
        $('#scenario-device-list').show();

        $("#scenario-device-list-table table tbody").empty();
        $("#scenario-device-list-table table tfoot").hide();
        if (!devices || devices.length == 0) {
            $("#scenario-device-list-table table tfoot").show();
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
            rowData += '<td><button class="btn btn-info fa fa-terminal fa-lg" onclick="scenarioApp.gotoCommand(\'' + v.name + '\')"></button></td>';
            rowData += "</tr>";
            $("#scenario-device-list-table table tbody").append(rowData);
        });

        $("#scenario-device-list-table .device-delete-icon").on('click', function() {
            var device = JSON.parse($(this).children('input').val());
            client.deleteDevice(device);
        });

        $("#scenario-device-list-table .device-edit-icon").on('click', function() {
            var device = JSON.parse($(this).children('input').val());
            client.editDevice(device);
        });
    }

    Client.prototype.editDevice = function(device) {
        client.currentProtocols = device.protocols;
        $('#scenario-deviceID').val(device.id);
        $('#scenario-deviceName').val(device.name);
        $('#scenario-deviceDescription').val(device.description);
        $('#scenario-deviceLabels').val(device.labels ? device.labels.join(',') : '');

        $('#scenario-command-main').hide();
        $('#scenario-device-list').hide();
        $("#scenario-device-update-or-add .add-device").hide();
        $("#scenario-device-update-or-add .update-device").show();
        $("#scenario-device-update-or-add").show();
    };

    Client.prototype.addDevice = function() {
        $('#scenario-command-main').hide();
        $('#scenario-device-list').hide();
        $("#scenario-device-update-or-add").show();
        $("#scenario-device-update-or-add .update-device").hide();
        $("#scenario-device-update-or-add .add-device").show();
        $(".edgexfoundry-device-form")[0].reset();
    };

    Client.prototype.cancelAddOrUpdateDevice = function() {
        $("#scenario-device-update-or-add").hide();
        $('#scenario-command-main').hide();
        $('#scenario-device-list').show();

    };

    Client.prototype.uploadDevice = function(type) {
        var method;
        if (type == "new") {
            method = "POST";
            client.currentProtocols = {
                "General": {
                    "Type": "Scenario"
                },
            }
        } else {
            method = "PUT";
        }

        var device = {
            id: $('#scenario-deviceID').val(),
            name: $('#scenario-deviceName').val().trim(),
            description: $('#scenario-deviceDescription').val(),
            labels: $('#scenario-deviceLabels').val().split(','),
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
                                client.loadDevice(device.service.name);
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
        $('#scenario-currentDevice').html(name);

        $('#scenario-elementTable tbody').empty();
        $('#scenarioTable tbody').empty();

        $('#scenario-device-list').hide();
        $('#scenario-command-main').show("fast");
    }
    Client.prototype.cancelCommand = function() {
        $('#scenario-command-main').hide("fast");
        $('#scenario-device-list').show();
    }

    // Trigger start 
    Client.prototype.command_set_trigger = function() {
            var value = 'true';
            var resource = client.MapResource.Trigger;
            var body = {
                [resource]: value
            };
            console.log(JSON.stringify(body));
            // ajax ...
            $.ajax({
                url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.Trigger,
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
        // Trigger end

    // Element start ------------------------
    Client.prototype.load_element = function() {
        $("#scenario-elementTable table tfoot").hide();
        $("#scenario-elementTable table tbody").empty();

        // ajax ...
        $.ajax({
            url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.ManagerElement,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                var elements = JSON.parse(data.readings[0].value);
                if (!elements || elements.length == 0) {
                    $("#scenario-elementTable table tfoot").show();
                    return;
                }

                $.each(elements, function(i, v) {
                    var rowData = '<tr>';
                    var content = JSON.parse(v.Content);

                    var command;
                    $.each(client.DeviceCommandCache, function(i, dev) {
                        if (dev.name == v.Element) {
                            $.each(dev.commands, function(i, cm) {
                                if (cm.name == content.Command) {
                                    command = cm;
                                    return;
                                }
                            });
                        }
                    });

                    var rowData = '<tr>';
                    rowData += '<td><input type="button" class="btn-danger" onclick="$(this).closest(\'tr\').remove();" value="x"></input></td>';
                    rowData += '<td><select class="form-control" name="scenario-elementNameSelect"><option value="' + v.Element + '">' + v.Element + '</option></select></td>';
                    rowData += '<td><select class="form-control" name="scenario-elementCommandSelect"><option value=\'' + JSON.stringify(command) + '\'>' + command.name + '</option></select></td>';

                    var body = JSON.parse(content.Body);
                    var bodyHtml = '<div>';
                    for (var [key, value] of Object.entries(body)) {
                        bodyHtml += key + '&nbsp;<input class="form-control" type="text" name="' + key + '" value="' + value + '"></input>';
                    }
                    bodyHtml += '</div>';
                    rowData += '<td>' + bodyHtml + '</td>';

                    rowData += '</tr>';
                    $("#scenario-elementTable table tbody").append(rowData);
                });
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $("#scenario-elementTable table tfoot").show();
            }
        });
    }

    Client.prototype.addRow_element = function() {
        $("#scenario-elementTable table tfoot").hide();
        var rowData = '<tr>';
        rowData += '<td><input type="button" class="btn-danger" onclick="$(this).closest(\'tr\').remove();" value="x"></input></td>';
        rowData += '<td><select class="form-control" name="scenario-elementNameSelect"><option value="">--select Element--</option>'
        $.each(client.DeviceCommandCache, function(i, dev) {
            rowData += '<option value="' + dev.name + '">' + dev.name + '</option>';
        });
        rowData += '</select></td>';
        // ------------------------------------------------------ render content -----------------------------------------------------            
        rowData += '<td><select class="form-control" name="scenario-elementCommandSelect"></td>';
        rowData += '<td><div></div></td>';
        rowData += '</tr>';

        $("#scenario-elementTable table tbody").append(rowData);
        $('#scenario-elementTable select[name="scenario-elementNameSelect"]').on('change', function() {
            var name = $(this).val();
            var nextTd = $(this).closest('td').next('td').find('select');
            nextTd.empty();
            nextTd.append($('<option>', {
                value: "",
                text: "--select Command--",
            }));
            $.each(client.DeviceCommandCache, function(i, dev) {
                if (dev.name == name) {
                    $.each(dev.commands, function(i, cm) {
                        if (cm.put && cm.put.parameterNames) {
                            nextTd.append($('<option>', {
                                value: JSON.stringify(cm),
                                text: cm.name,
                            }));
                        }
                    });
                    return;
                }
            });
        });
        $('#scenario-elementTable select[name="scenario-elementCommandSelect"]').on('change', function() {
            var cmStr = $(this).val();
            var cm = JSON.parse(cmStr);
            var nextTd = $(this).closest('td').next('td').find('div');
            nextTd.empty();
            $.each(cm.put.parameterNames, function(i, param) {
                nextTd.append(param + '&nbsp;<input class="form-control" type="text" name="' + param + '"></input>');
            });
        })
    }

    Client.prototype.submit_element = function() {
            var arrValues = [];
            var rows = $('#scenario-elementTable table tr');

            // loop through each row of the table.            
            for (var row = 1; row < rows.length - 1; row++) { // -1 vi khong tin th
                var cells = rows[row].cells;
                var element = cells[1].childNodes[0].value;

                var commandObject = cells[2].childNodes[0].value;
                var command = JSON.parse(commandObject);
                // var params = command.put.parameterNames;
                var params = [];
                var bodys = [];
                var inputs = cells[3].querySelectorAll('div > input');

                inputs.forEach(function(input) {
                    bodys.push(input.value);
                    params.push(input.name);
                });

                var bodyMap = new Map();
                for (var i = 0; i < params.length; i++) {
                    bodyMap[params[i]] = bodys[i];
                }

                var content = {
                    Command: command.name,
                    Body: JSON.stringify(bodyMap)
                }

                var object = {
                    Parent: client.currentSelectDevice,
                    Element: element,
                    Content: JSON.stringify(content)
                };
                arrValues.push(object);
            }
            var value = JSON.stringify(arrValues);
            var resource = client.MapResource.Content;

            var body = {
                [resource]: value
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
                },
                error: function(xhr, status, error) {
                    alert(error + '\n' + xhr.responseText);
                }
            });
        }
        // Element end ------------------------

    // Command end  -----------------------------------------

    return client;

})();