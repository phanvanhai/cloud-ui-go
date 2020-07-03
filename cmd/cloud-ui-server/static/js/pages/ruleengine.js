/*******************************************************************************
 * Copyright © 2017-2018 VMware, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 *
 * @author: Huaqiao Zhang, <huaqiaoz@vmware.com>
 *******************************************************************************/
$(document).ready(function() {
    $("#rule-add-new").hide();
    $("#rule-view").hide();
    $("#condition_device_list table").hide();
    $("#action_device_list table").hide();
    $("#device_command_list table").hide();
    orgEdgexFoundry.supportRuleEngine.loadRuleData();

    //global listener for hiding device-list section.
    document.addEventListener('click', function(event) {
        $("#action_device_list table").hide();
        $("#condition_device_list table").hide();
    });
    document.querySelector("#condition_device_list table").addEventListener('click', function(event) {
        event.stopPropagation();
    });
    document.querySelector("#action_device_list table").addEventListener('click', function(event) {
        event.stopPropagation();
    });

    //bind click event listener for device-ComboGrid-list
    $("#condition_device_list  .select_panle").on('click', function(event) {
        event.stopPropagation();
        $("#condition_device_list table").toggle();
        $("#action_device_list table").hide();
    });

    $("#action_device_list .select_panle").on('click', function(event) {
        event.stopPropagation();
        $("#action_device_list table").toggle();
        $("#condition_device_list table").hide();
    });
    // orgEdgexFoundry.supportRuleEngine.loadDevice();
    orgEdgexFoundry.supportRuleEngine.initRulesEngine();
});

orgEdgexFoundry.supportRuleEngine = (function() {
    "use strict";

    function SupportRuleEngine() {
        this.selectRule = null;
        this.ruleEngineDataCache = [];
        this.deviceDataCache = [];
        this.commandDataCache = [];
    }

    SupportRuleEngine.prototype = {
        initRulesEngine: null,
        loadDevice: null,

        loadRuleData: null,
        renderRuleList: null,
        renderRuleView: null,

        addRule: null,
        viewRule: null,
        cancelAdd: null,
        commitRule: null,
        deleteRule: null,
        actionRule: null,
    }

    var ruleEngine = new SupportRuleEngine();

    SupportRuleEngine.prototype.initRulesEngine = function() {
        // initialize stream
        $.ajax({
            url: '/rules-engine/streams/event',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log("stream was created!");
                alert("Khoi tao thong tin thanh cong!");
            },
            error: function(xhr, status, error) {
                console.log(error + '\n' + xhr.responseText);
                var stream = {};
                stream['sql'] = 'create stream event() WITH (FORMAT="JSON", TYPE="edgex")';
                // console.log(JSON.stringify(stream));
                $.ajax({
                    url: '/rules-engine/streams',
                    type: 'POST',
                    data: JSON.stringify(stream),
                    contentType: 'application/json',
                    success: function(data) {
                        console.log("create stream success!");
                        alert("Khoi tao thong tin thanh cong!");
                    },
                    error: function(xhr, status, error) {
                        if (xhr.responseText.includes("201") == true) {
                            console.log("create stream success!");
                            alert("Khoi tao thong tin thanh cong!");
                        } else {
                            console.log(error + '\n' + xhr.responseText);
                            alert(error + '\n' + xhr.responseText);
                        }
                    }
                });
            }
        });
    }

    SupportRuleEngine.prototype.loadDevice = function() {
        //initialize loading device-ComboGrid data.
        $.ajax({
            url: '/core-metadata/api/v1/device',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                //initialize loading commands-ComboGrid data.
                $.ajax({
                    url: '/core-command/api/v1/device',
                    type: 'GET',
                    dataType: 'json',
                    success: function(cm_data) {
                        orgEdgexFoundry.supportRuleEngine.commandDataCache = cm_data;

                        orgEdgexFoundry.supportRuleEngine.deviceDataCache = data;
                        $("#action_device_list table tbody").empty();
                        $("#condition_device_list table tbody").empty();
                        $.each(data, function(i, d) {
                            var rowData = "<tr>";
                            rowData += "<td><input type='radio' name='condition' value= '" + d.id + "'></td>";
                            rowData += "<td>" + (i + 1) + "</td>";
                            rowData += "<td>" + d.name + "</td>";
                            rowData += "</tr>";
                            $("#action_device_list table  tbody").append(rowData);
                            $("#condition_device_list table  tbody").append(rowData);
                        });
                        $("#condition_device_list table  tbody input:radio").on('click', function() {
                            if ($(this).prop('checked')) {
                                var radio = this;
                                $.each(orgEdgexFoundry.supportRuleEngine.deviceDataCache, function(i, d) {
                                    if (d.id == $(radio).val()) {
                                        $("#condition_device_list div.select_panle input[name='condition_device_name']").val(d.name);
                                        $("select[name='parameter']").empty();
                                        $.each(d.profile.deviceResources, function(j, resource) {
                                            var opts = "<option>" + resource.name + "</option>";
                                            $(".condition_device_list select[name='parameter']").append(opts);
                                        });
                                    }
                                });
                            }
                        });

                        $("#action_device_list table  tbody input:radio").on('click', function() {
                            if ($(this).prop('checked')) {
                                var radio = this;
                                $.each(orgEdgexFoundry.supportRuleEngine.commandDataCache, function(i, d) {
                                    if (d.id == $(radio).val()) {
                                        $("#action_device_list div.select_panle input[name='action_device_name']").val(d.name);
                                        $("select[name='commandName']").empty();
                                        $.each(d.commands, function(j, cmd) {
                                            var opts = "<option value='" + cmd.id + "'>" + cmd.name + "</option>";
                                            $(".action_device_list select[name='commandName']").append(opts);
                                        });
                                        //trigger command select change event manually to render command's parameters.
                                        $(".action_device_list select[name='commandName']").change();
                                    }
                                });
                            }
                        });

                        $(".action_device_list select[name='commandName']").on('change', function() {
                            $("#action_device_param").empty();
                            var cmdId = $(this).val();
                            $.each(orgEdgexFoundry.supportRuleEngine.commandDataCache, function(i, d) {
                                $.each(d.commands, function(k, cmd) {
                                    if (cmd.id == cmdId) {
                                        if (cmd.put == null) {
                                            return;
                                        }
                                        var parmArr = cmd.put.parameterNames;
                                        $.each(parmArr, function(n, p) {
                                            var ele = p + "&nbsp;&nbsp;" + "<input class='form-control' style='width:150px;' name='" + p + "'>";
                                            $("#action_device_param").append(ele);
                                        });
                                        return;
                                    }
                                });
                            });
                        });
                    }
                });
            }
        });
    }

    SupportRuleEngine.prototype.loadRuleData = function() {
        ruleEngine.loadDevice();
        $.ajax({
            url: '/rules-engine/rules',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data != null && data.length != 0) {
                    $("#rule-engine-list table tfoot").hide();
                }
                ruleEngine.renderRuleList(data);
                alert("refresh success");
            },
            error: function(xhr, status, error) {
                alert(error + '\n' + xhr.responseText);
            }
        });
    }

    SupportRuleEngine.prototype.renderRuleList = function(data) {
        $("#rule-engine-list table tbody").empty();
        $.each(data, function(i, rule) {
            var action = "/start";
            var view_action = "start";
            if (rule.status.includes("Running")) {
                action = "/stop";
                view_action = "stop";
            }
            var rowData = "<tr>";
            rowData += "<td>" + (i + 1) + "</td>";
            rowData += "<td class='device-delete-icon'><input type='hidden' value='" + rule.id + "'><div class='edgexIconBtn'><i class='fa fa-trash-o fa-lg' aria-hidden='true'></i></div></td>";
            rowData += "<td class='device-view-icon'><input type='hidden' value='" + rule.id + "'><div class='edgexIconBtn'><i class='fa fa-book fa-lg' aria-hidden='true'></i> </div></td>";
            rowData += "<td class='device-edit-icon'><input type='hidden' value='" + rule.id + action + "'><div class='edgexIconBtn'><i class='fa fa-caret-square-o-right fa-lg' aria-hidden='true'>" + view_action + "</i> </div></td>";
            rowData += "<td>" + rule.id + "</td>";
            rowData += "<td>" + rule.status + "</td>";
            $("#rule-engine-list table tbody").append(rowData);
        });

        $("#rule-engine-list .device-delete-icon").on('click', function() {
            var id = $(this).children("input[type='hidden']").val();
            ruleEngine.deleteRule(id);
        });

        $("#rule-engine-list .device-view-icon").on('click', function() {
            var id = $(this).children("input[type='hidden']").val();
            ruleEngine.viewRule(id);
        });

        $("#rule-engine-list .device-edit-icon").on('click', function() {
            var action = $(this).children("input[type='hidden']").val();
            ruleEngine.actionRule(action);
        });
    }

    SupportRuleEngine.prototype.addRule = function() {
        $("#rule-engine-list").hide();
        $("#rule-view").hide();
        $("#rule-add-new").show();
    }

    SupportRuleEngine.prototype.viewRule = function(id) {
        $.ajax({
            url: '/rules-engine/rules/' + id,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data != null) {
                    $("#rule-engine-list").hide();
                    $("#rule-add-new").hide();
                    $("#rule-view").show();
                    ruleEngine.renderRuleView(data);
                }
            },
            statusCode: {
                404: function() {
                    bootbox.alert({
                        title: 'Error',
                        message: "unknown or unanticipated issues !",
                        className: 'red-green-buttons'
                    });
                },
                503: function() {
                    bootbox.alert({
                        title: 'Error',
                        message: "unknown or unanticipated issues !",
                        className: 'red-green-buttons'
                    });
                }
            }
        });
    }

    SupportRuleEngine.prototype.renderRuleView = function(rule) {
        $("#rule-view input[name='name']").val(rule.id);
        var sql = rule.sql;
        var n1 = sql.indexOf("\"") + 1;
        var n2 = sql.lastIndexOf("\"");
        var condition_device_name = sql.substring(n1, n2);

        $("#rule-view input[name='condition_device_name']").val(condition_device_name);

        var param = sql.substring(sql.search("AND") + 3);
        var slice_param = param.split(" ");

        var parameter, operation, operand2;
        var i = 0;
        for (; i < slice_param.length; i++) {
            if (slice_param[i] != "") {
                parameter = slice_param[i];
                break;
            }
        };
        for (i++; i < slice_param.length; i++) {
            if (slice_param[i] != "") {
                operation = slice_param[i];
                break;
            }
        };
        for (i++; i < slice_param.length; i++) {
            if (slice_param[i] != "") {
                operand2 = slice_param[i];
                break;
            }
        };

        $("#rule-view input[name='parameter']").val(parameter);

        $("#rule-view input[name='operation']").val(operation);
        $("#rule-view input[name='operand2']").val(operand2);


        var map_action = rule.actions[0];
        var rest = map_action["rest"];
        var url = rest.url;

        var path = url.substring(url.search("device/") + 7);
        var slice_path = path.split("/");

        var action_device_name, commandName;

        $.each(orgEdgexFoundry.supportRuleEngine.commandDataCache, function(i, d) {
            if (JSON.stringify(d.id) == JSON.stringify(slice_path[0])) {
                action_device_name = d.name;

                $.each(d.commands, function(k, cmd) {
                    if (JSON.stringify(cmd.id) == JSON.stringify(slice_path[2])) {
                        commandName = cmd.name;
                        return false;
                    }
                });
                return false;
            }
        });

        $("#rule-view input[name='action_device_name']").val(action_device_name);
        $("#rule-view  input[name='commandName']").val(commandName);
        $("#rule-view  input[name='action_device_param']").val(rest.dataTemplate);
    }

    SupportRuleEngine.prototype.cancelAdd = function() {
        $("#rule-engine-list").show();
        $("#rule-add-new").hide();
        $("#rule-view").hide();
    }

    SupportRuleEngine.prototype.commitRule = function() {
        var name = $("#rule-add-new input[name='name']").val();
        var condition_device_name = $("#rule-add-new input[name='condition_device_name']").val();
        var parameter = $("#rule-add-new select[name='parameter']").val();
        //var operand1 =
        var operation = $("#rule-add-new select[name='operation']").val();
        var operand2 = $("#rule-add-new input[name='operand2']").val();

        var action_device_name = $("#rule-add-new input[name='action_device_name']").val();
        var command = $("#rule-add-new  select[name='commandName']").val();
        var body = '{\"';
        var param_inputs = $("#rule-add-new table.action_device_list td").last().find('input');
        $.each(param_inputs, function(i, input) {
            body += $(input).prop('name') + '\":\"' + $(input).val() + '\"';
            if (i == (param_inputs.length - 1)) {
                body += '}';
                return false;
            }
            body += ',\"';
        });

        var url = "";
        $.each(orgEdgexFoundry.supportRuleEngine.commandDataCache, function(i, d) {
            if (d.name == action_device_name) {
                $.each(d.commands, function(k, cmd) {
                    if (JSON.stringify(cmd.id) == JSON.stringify(command)) {
                        url = cmd["put"].url;
                        return false;
                    }
                });
                return false;
            }
        });

        var rest = {},
            rest_body = {},
            log = {},
            log_body = {};

        rest_body['sendSingle'] = true;
        rest_body['dataTemplate'] = body;
        rest_body['method'] = "put";
        rest_body['url'] = url;

        rest['rest'] = rest_body;
        log['log'] = log_body;

        var actions = [rest, log];

        var newRule = {};
        newRule['id'] = name;
        newRule['sql'] = "SELECT * FROM event WHERE meta(device) = \"" + condition_device_name + "\" AND " + parameter + " " + operation + " " + operand2;
        newRule['actions'] = actions;

        console.log(JSON.stringify(newRule));
        $.ajax({
            url: '/rules-engine/rules',
            type: 'POST',
            data: JSON.stringify(newRule),
            contentType: 'application/json',
            complete: function(xhr, textStatus) {
                var response = JSON.stringify(xhr.responseText);
                response = response.substring(response.search("Error") + 5);
                alert(response);
                $("#rule-add-new").hide();
                $("#rule-view").hide();
                $("#rule-engine-list").show();
                ruleEngine.loadRuleData();
            }
        });
    }

    SupportRuleEngine.prototype.deleteRule = function(rule) {
        bootbox.confirm({
            title: "confirm",
            message: "Are you sure to delete ? ",
            className: 'green-red-buttons',
            callback: function(result) {
                if (result) {
                    $.ajax({
                        url: '/rules-engine/rules/' + rule,
                        type: 'DELETE',
                        success: function() {
                            bootbox.alert({
                                message: "Delete Success!",
                                className: 'red-green-buttons'
                            });
                            ruleEngine.loadRuleData();
                        },
                        statusCode: {
                            404: function() {
                                bootbox.alert({
                                    title: 'Error',
                                    message: "unknown or unanticipated issues !",
                                    className: 'red-green-buttons'
                                });
                            },
                            503: function() {
                                bootbox.alert({
                                    title: 'Error',
                                    message: "unknown or unanticipated issues !",
                                    className: 'red-green-buttons'
                                });
                            }
                        }
                    });
                }
            }
        });
    }

    SupportRuleEngine.prototype.actionRule = function(action) {
        bootbox.confirm({
            title: "confirm",
            message: "Are you sure to change action ? ",
            className: 'green-red-buttons',
            callback: function(result) {
                if (result) {
                    $.ajax({
                        url: '/rules-engine/rules/' + action,
                        type: 'POST',
                        success: function() {
                            bootbox.alert({
                                message: "Action Success!",
                                className: 'red-green-buttons'
                            });
                            ruleEngine.loadRuleData();
                        },
                        statusCode: {
                            404: function() {
                                bootbox.alert({
                                    title: 'Error',
                                    message: "unknown or unanticipated issues !",
                                    className: 'red-green-buttons'
                                });
                            },
                            503: function() {
                                bootbox.alert({
                                    title: 'Error',
                                    message: "unknown or unanticipated issues !",
                                    className: 'red-green-buttons'
                                });
                            }
                        }
                    });
                }
            }
        });
    }

    return ruleEngine;
})();

var testRuleData = {
    "id": "rule5",
    "sql": "SELECT * FROM event WHERE meta(device) = \"Random-UnsignedInteger-Device\" AND uint8 > 20",
    "actions": [{
            "rest": {
                "url": "http://edgex-core-command:48082/api/v1/device/45c3740f-8b47-4cf8-82db-4a0d1dec6fc8/command/30d42932-5e23-4c1a-94fa-8dc896f2fb4d",
                "method": "put",
                "dataTemplate": "{\"Bool\":\"true\", \"EnableRandomization_Bool\": \"true\"}",
                "sendSingle": true
            }
        },
        {
            "log": {}
        }
    ]
}