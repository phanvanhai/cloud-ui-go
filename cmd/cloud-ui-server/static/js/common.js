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
/*
 * Date format  yyyy-MM-dd hh:mm:ss
 */
var dateToString = function(num) {
    var date = new Date();
    date.setTime(num);
    var y = date.getFullYear();
    var M = date.getMonth() + 1;
    M = (M < 10) ? ('0' + M) : M;
    var d = date.getDate();
    d = (d < 10) ? ('0' + d) : d;
    var hh = date.getHours();
    hh = (hh < 10) ? ('0' + hh) : hh;
    var mm = date.getMinutes();
    mm = (mm < 10) ? ('0' + mm) : mm;
    var ss = date.getSeconds();
    ss = (ss < 10) ? ('0' + ss) : ss;

    var str = y + '-' + M + '-' + d + ' ' + hh + ':' + mm + ':' + ss
    return str;
};

Date.prototype.Format = function(fmt) {
    var o = {
        "M+": this.getMonth(), // Month
        "d+": this.getDate(), // Day
        "h+": this.getHours(), // Hour
        "m+": this.getMinutes(), // Minute
        "s+": this.getSeconds(), // Second
        "q+": Math.floor((this.getMonth() + 3) / 3), // Quarter
        "S": this.getMilliseconds() // Millisecond
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

//ISO 8601 format (YYYYMMDD'T'HHmmss)
var ISO8601DateStrToLocalDateStr = function(iso8601String) {
    var year = iso8601String.substring(0, 4);
    var month = iso8601String.substring(4, 6);
    var day = iso8601String.substring(6, 8);
    var hour = iso8601String.substring(9, 11);
    var minute = iso8601String.substring(11, 13);
    var second = iso8601String.substring(13);
    return new Date(Date.UTC(year, month, day, hour, minute, second)).Format("yyyy-MM-dd hh:mm:ss");
};

//YYYYMMDD'T'HHmmss
var LocalDateStrToISO8601DateStr = function(localString) {
    //iso8601 YYYY-MM-DDTHH:mm:ss.sssZ
    return new Date(localString).toISOString().replace(/\..+/, '').replace(/[-:]/g, "")
};


function convertTimeToStr(time) {
    var d = new Date();
    var tz = d.getTimezoneOffset() / 60; // tz = -7

    time = time >> 8;
    var h = (time >> 8) - tz;
    h = h % 24;
    var m = time & 0xFF;

    return h.toString() + "h" + m.toString();
}

function convertStrToTime(timeStr) {
    var d = new Date();
    var tz = d.getTimezoneOffset() / 60; // tz = -7

    var arrTime = timeStr.split("h");
    var hi = parseInt(arrTime[0], 10) + tz + 24;
    hi = hi % 24;
    var mi = parseInt(arrTime[1], 10);
    var timeInt = (hi << 16) | (mi << 8) | 1;
    return timeInt;
}

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
            lightApp.cancelCommand();
            lightApp.loadDevice();
            break
    }
}