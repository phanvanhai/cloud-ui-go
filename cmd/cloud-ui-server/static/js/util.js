$(document).ready(function() {
    createTable_onoff();
    createTable_dimming();
})

$("#realtime_btn").click(function(e) {
    e.preventDefault();
    // var y = $("#realtime_year").val();
    // var mh = $("#realtime_month").val();
    var d = $("#realtime_day").val();
    var h = $("#realtime_hour").val();
    var m = $("#realtime_min").val();
    var s = $("#realtime_sec").val();

    var yi = parseInt(y, 10);
    var mhi = parseInt(mh, 10);
    var di = parseInt(d, 10);
    var hi = parseInt(h, 10);
    var mi = parseInt(m, 10);
    var si = parseInt(s, 10);
    var time = (yi << 40) | (mhi << 32) | (di << 24) | (hi << 16) | (mi << 8) | si;
    $("#realtime_output").val(time);
});

var arrHead = new Array(); // array for header.
arrHead = ['', 'Owner', 'Time', 'Value'];
var owner_default_onoff;

// first create TABLE structure with the headers. 
function createTable_onoff() {
    var empTable = document.createElement('table');
    empTable.setAttribute('id', 'emoTableOnOff'); // table id.

    var tr = empTable.insertRow(-1);
    for (var h = 0; h < arrHead.length; h++) {
        var th = document.createElement('th'); // create table headers
        th.innerHTML = arrHead[h];
        tr.appendChild(th);
    }

    var div = document.getElementById('table_onoff');
    div.appendChild(empTable); // add the TABLE to the container.
}

// now, add a new to the TABLE.
function addRow_onoff() {
    owner_default_onoff = $("#owner_default_onoff").val();
    var empTab = document.getElementById('emoTableOnOff');

    var rowCnt = empTab.rows.length; // table row count.
    var tr = empTab.insertRow(rowCnt); // the table row.        

    for (var c = 0; c < arrHead.length; c++) {
        var td = document.createElement('td'); // table definition.
        td = tr.insertCell(c);

        if (c == 0) { // the first column.
            // add a button in every new row in the first column.
            var button = document.createElement('input');

            // set input attributes.
            button.setAttribute('type', 'button');
            button.setAttribute('value', 'x');
            button.setAttribute('class', 'btn-danger');

            // add button's 'onclick' event.
            button.setAttribute('onclick', 'removeRow_onoff(this)');

            td.appendChild(button);
        } else {
            // 2nd, 3rd and 4th column, will have textbox.
            var ele = document.createElement('input');
            ele.setAttribute('type', 'text');
            if (c == 1) {
                ele.setAttribute('value', owner_default_onoff);
            } else {
                ele.setAttribute('value', '');
            }

            td.appendChild(ele);
        }
    }
}

// delete TABLE row function.
function removeRow_onoff(oButton) {
    var empTab = document.getElementById('emoTableOnOff');
    empTab.deleteRow(oButton.parentNode.parentNode.rowIndex); // button -> td -> tr.
}

// function to extract and submit table data.
function submit_onoff() {
    var myTab = document.getElementById('emoTableOnOff');
    var arrValues = new Array();

    // loop through each row of the table.
    for (row = 1; row < myTab.rows.length; row++) {
        // loop through each cell in a row.           
        var arr = new Array();
        for (c = 0; c < myTab.rows[row].cells.length; c++) {
            var element = myTab.rows.item(row).cells[c];
            if (element.childNodes[0].getAttribute('type') == 'text') {
                var value = element.childNodes[0].value;
                arr.push(value);
            }
        }

        var isTrueSet = (arr[2] == 'true');
        var timeStr = arr[1];
        var arrTime = timeStr.split(" ");
        var hi = parseInt(arrTime[0], 10);
        var mi = parseInt(arrTime[1], 10);
        var si = parseInt(arrTime[2], 10);
        var timeInt = (hi << 16) | (mi << 8) | si;

        var object = {
            owner: arr[0],
            time: timeInt,
            value: new Boolean(isTrueSet)
        };
        arrValues.push(object);
    }
    document.getElementById('output_onoff').value = JSON.stringify(arrValues);
}
var owner_default_dimming;

// first create TABLE structure with the headers. 
function createTable_dimming() {
    var empTable = document.createElement('table');
    empTable.setAttribute('id', 'emoTableDimming'); // table id.

    var tr = empTable.insertRow(-1);
    for (var h = 0; h < arrHead.length; h++) {
        var th = document.createElement('th'); // create table headers
        th.innerHTML = arrHead[h];
        tr.appendChild(th);
    }

    var div = document.getElementById('table_dimming');
    div.appendChild(empTable); // add the TABLE to the container.
}

// now, add a new to the TABLE.
function addRow_dimming() {
    owner_default_dimming = $("#owner_default_dimming").val();
    var empTab = document.getElementById('emoTableDimming');

    var rowCnt = empTab.rows.length; // table row count.
    var tr = empTab.insertRow(rowCnt); // the table row.        

    for (var c = 0; c < arrHead.length; c++) {
        var td = document.createElement('td'); // table definition.
        td = tr.insertCell(c);

        if (c == 0) { // the first column.
            // add a button in every new row in the first column.
            var button = document.createElement('input');

            // set input attributes.
            button.setAttribute('type', 'button');
            button.setAttribute('value', 'x');
            button.setAttribute('class', 'btn-danger');

            // add button's 'onclick' event.
            button.setAttribute('onclick', 'removeRow_dimming(this)');

            td.appendChild(button);
        } else {
            // 2nd, 3rd and 4th column, will have textbox.
            var ele = document.createElement('input');
            ele.setAttribute('type', 'text');
            if (c == 1) {
                ele.setAttribute('value', owner_default_dimming);
            } else {
                ele.setAttribute('value', '');
            }

            td.appendChild(ele);
        }
    }
}

// delete TABLE row function.
function removeRow_dimming(oButton) {
    var empTab = document.getElementById('emoTableDimming');
    empTab.deleteRow(oButton.parentNode.parentNode.rowIndex); // button -> td -> tr.
}

// function to extract and submit table data.
function submit_dimming() {
    var myTab = document.getElementById('emoTableDimming');
    var arrValues = new Array();

    // loop through each row of the table.
    for (row = 1; row < myTab.rows.length; row++) {
        // loop through each cell in a row.           
        var arr = new Array();
        for (c = 0; c < myTab.rows[row].cells.length; c++) {
            var element = myTab.rows.item(row).cells[c];
            if (element.childNodes[0].getAttribute('type') == 'text') {
                var value = element.childNodes[0].value;
                arr.push(value);
            }
        }

        var valueInt = parseInt(arr[2], 10);
        var timeStr = arr[1];
        var arrTime = timeStr.split(" ");
        var hi = parseInt(arrTime[0], 10);
        var mi = parseInt(arrTime[1], 10);
        var si = parseInt(arrTime[2], 10);
        var timeInt = (hi << 16) | (mi << 8) | si;

        var object = {
            owner: arr[0],
            time: timeInt,
            value: valueInt
        };
        arrValues.push(object);
    }

    document.getElementById('output_dimming').value = JSON.stringify(arrValues);
}