$(document).ready(function() {
    //init loading data.
    gatewayApp.loadDevice();
});

function parseError(err) {
    var newerr = err.substring(err.indexOf(":") + 1);
    var code = newerr.substring(0, newerr.indexOf("-")).trim();
    var content = newerr.substring(newerr.indexOf("-") + 1);

    var result = [code, content];
    return result;
}

function checkCodeStatus(repErr) {
    switch (repErr[0]) {
        case "500":
            gatewayApp.cancelCommand();
            gatewayApp.loadDevice();
            break
    }
}

gatewayApp = (function() {
    "use strict";

    function Client() {
        this.MapCommand = {
            OnOffRelay: "OnOffRelay1",
            UpdateDeviceFirmware: "UpdateDeviceFirmware"
        };
        this.MapResource = {
            OnOffRelay: "Gateway-OnOffRelay1",
            UpdateDeviceFirmware: "Gateway-UpdateDeviceFirmware"
        };
        this.currentSelectDevice = "Gateway";
    }

    Client.prototype = {
        constructor: Client,

        // Device
        loadDevice: null,

        // Command
        gotoCommand: null,

        // Client
        command_get_relay: null,
        command_set_relay: null,
        command_updatefirmware: null
    }

    var client = new Client();

    // Device start  -----------------------------------------
    Client.prototype.loadDevice = function() {
            $('#gatewayExist').html("Checking...");
            $.ajax({
                url: '/core-metadata/api/v1/device/name/' + client.currentSelectDevice,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    client.gotoCommand(client.currentSelectDevice);
                },
                error: function(xhr, status, error) {
                    alert(error + '\n' + xhr.responseText);
                    $('#gatewayExist').html("Gateway not exist!");
                }
            });
        }
        // Device start  -----------------------------------------

    // Command start  -----------------------------------------
    Client.prototype.gotoCommand = function(name) {
        $('#gatewayObject-relay-status').val("");
        $('#gatewayObject-updatefirmware').val("");

        $('#gatewayObject-device-list').hide();
        $('#gatewayObject-command-main').show("fast");
    }

    Client.prototype.command_get_relay = function() {
        $.ajax({
            url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.OnOffRelay,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                $('#gatewayObject-relay-status').val(data.readings[0].value);
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
                $('#gatewayObject-relay-status').val("");
                checkCodeStatus(parseError(xhr.responseText));
            }
        });
    }

    Client.prototype.command_set_relay = function() {
        var value = $('#gatewayObject-relay-status').val();
        var resource = client.MapResource.OnOffRelay;
        var body = {
            [resource]: value
        };
        console.log(JSON.stringify(body));
        // ajax ...
        $.ajax({
            url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.OnOffRelay,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(body),
            success: function(data) {
                alert("success");
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
            }
        });
    }

    Client.prototype.command_updatefirmware = function() {
            var value = $('#gatewayObject-updatefirmware').val();
            var resource = client.MapResource.UpdateDeviceFirmware;
            var body = {
                [resource]: value
            };
            console.log(JSON.stringify(body));
            $.ajax({
                url: '/core-command/api/v1/device/name/' + client.currentSelectDevice + '/command/' + client.MapCommand.UpdateDeviceFirmware,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(body),
                success: function(data) {
                    alert("success");
                },
                error: function(xhr, status, error) {
                    alert(error + '\n' + xhr.responseText);
                }
            });
        }
        // Command end  -----------------------------------------

    return client;

})();