$(document).ready(function() {
    debugger
})
orgEdgexFoundry.userMqtt = (function() {
    "use strict";

    function UserMqtt() {
        this.Mqtt = 'mqtt-proxy'
    }

    UserMqtt.prototype = {
        constructor: UserMqtt,
        restartMqtt: null,
        connectMqtt: null,
        getConfig: null,
        renderConfig: null
    }

    var userMqttService = new UserMqtt()

    UserMqtt.prototype.connectMqtt = function() {
        var username = document.getElementById("client-name").value
        var password = document.getElementById("client-pass").value
        var clientId = document.getElementById("client-id").value
        var qos = document.getElementById("connect-qos").value
        var autoReconnect = document.getElementById("connect-arc").value
        var retained = document.getElementById("connect-retained").value
        var keepAlive = document.getElementById("connect-kal").value
        var connectTimeout = document.getElementById("connect-ct").value
        var skipCert = document.getElementById("sercure-scv").value
        var key = document.getElementById("sercure-key").value
        var cert = document.getElementById("sercure-cert").value
        var pubHost = document.getElementById("publish-host").value
        var pubPort = document.getElementById("publish-port").value
        var pubPro = document.getElementById("publish-protocol").value
        var subHost = document.getElementById("subscribe-host").value
        var subPort = document.getElementById("subscribe-port").value
        var subPro = document.getElementById("subscribe-protocol").value
        var request = document.getElementById("topic-request").value
        var response = document.getElementById("topic-response").value

        var dataMqtt = {
            "Type": "mqtt",
            "Binding": {
                "Type": "messagebus",
                "SubscribeTopic": request,
                "PublishTopic": response
            },
            "MessageBus": {
                "SubscribeHost": {
                    "Host": pubHost,
                    "Port": parseInt(pubPort, 10),
                    "Protocol": pubPro
                },
                "PublishHost": {
                    "Host": subHost,
                    "Port": parseInt(subPort, 10),
                    "Protocol": subPro
                },
                "Optional": {
                    "Username": username,
                    "Password": password,
                    "ClientId": clientId,
                    "Qos": qos,
                    "KeepAlive": keepAlive,
                    "Retained": retained,
                    "AutoReconnect": autoReconnect,
                    "ConnectTimeout": connectTimeout,
                    "SkipCertVerify": skipCert,
                    "KeyPEMBlock": key,
                    "CertPEMBlock": cert
                }
            }
        }
        var sendData = JSON.stringify(dataMqtt);
        $.ajax({
            url: '/setconfig',
            type: 'POST',
            contentType: 'application/json',
            data: sendData,
            success: function(data) {
                alert(data)
            },
            error: function() {
                alert("faile to update service config, please try again")
            }
        })
    }

    UserMqtt.prototype.getConfig = function() {
        $.ajax({
            url: '/getconfig',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                userMqttService.renderConfig(data)
                    // alert(JSON.stringify(data))
            }
        })
    }

    UserMqtt.prototype.renderConfig = function(dt) {
        document.getElementById("client-name").value = dt.MessageBus.Optional.Username
        document.getElementById("client-pass").value = dt.MessageBus.Optional.Password
        document.getElementById("client-id").value = dt.MessageBus.Optional.Username
        document.getElementById("connect-qos").value = dt.MessageBus.Optional.Qos
        document.getElementById("connect-arc").value = dt.MessageBus.Optional.AutoReconnect
        document.getElementById("connect-retained").value = dt.MessageBus.Optional.Retained
        document.getElementById("connect-kal").value = dt.MessageBus.Optional.KeepAlive
        document.getElementById("connect-ct").value = dt.MessageBus.Optional.ConnectTimeout
        document.getElementById("sercure-scv").value = dt.MessageBus.Optional.SkipCertVerify
        document.getElementById("sercure-key").value = dt.MessageBus.Optional.KeyPEMBlock
        document.getElementById("sercure-cert").value = dt.MessageBus.Optional.CertPEMBlock
        document.getElementById("publish-host").value = dt.MessageBus.PublishHost.Host
        document.getElementById("publish-port").value = dt.MessageBus.PublishHost.Port
        document.getElementById("publish-protocol").value = dt.MessageBus.PublishHost.Protocol
        document.getElementById("subscribe-host").value = dt.MessageBus.PublishHost.Host
        document.getElementById("subscribe-port").value = dt.MessageBus.PublishHost.Port
        document.getElementById("subscribe-protocol").value = dt.MessageBus.PublishHost.Protocol
        document.getElementById("topic-request").value = dt.Binding.SubscribeTopic
        document.getElementById("topic-response").value = dt.Binding.PublishTopic
    }

    return userMqttService
})()