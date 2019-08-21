
//
//APIWrapper
//
var apiHandle = null;
var externalHandle = window.external;

if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };
}

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair.shift()).trim() == variable) {
            return decodeURIComponent(pair.join('='));
        }
    }
    return "";
}

var tincan = null;
var tcagent = null;
var tcendpoint = getQueryVariable("endpoint");
if (tcendpoint != "") {
    var tcauth = getQueryVariable("auth");
    if (tcauth != "") {
        var tcactor = getQueryVariable("actor");
        if (tcactor != "") {
            var tcactivity_id = getQueryVariable("activity_id");
            if (tcactivity_id != "") {


                apiHandle = {
                    LMSInitialize: function (a1) {
                        if (!this.initialized) {

                            if (tincan == null) {
                                tincan = new TinCan(
                                    {
                                        recordStores: [
                                            {
                                                endpoint: tcendpoint,
                                                auth: tcauth,
                                                allowFail: false
                                            }
                                        ]
                                    }
                                );
                                tcagent = new TinCan.Agent(JSON.parse(tcactor));
                            }

                            var message = {
                           
                                actor: JSON.parse(tcactor),
                                verb: {
                                    id: "http://adlnet.gov/expapi/verbs/attempted"
                                },
                                object: {
                                    id: tcactivity_id,
                                    objectType: "Activity"
                                }
                            };

                            var result = tincan.sendStatement(message);
                            if (result.results[0].err != null) {
                                xAPIError();
                            }
                            this.initialized = true;
                        }
                    },
                    LMSFinish: function (a1) {
                        if (this.initialized) {
                            this.initialized = false;
                        }
                    },
                    LMSGetValue: function (a1) {
                        var result = '';



                        if (this.data[a1] != null) result = this.data[a1];
                        else {
                            if (a1 == 'cmi.suspend_data') {
                                var r = tincan.getState("suspend_data", {"agent": tcagent,"activity":{id: tcactivity_id}});
                                if (r.state == null) {

                                }
                                else {
                                    result = r.state.contents;
                                    this.data[a1] = result;
                                }
                            }
                            else if (a1 == 'cmi.core.lesson_location') {
                                var r = tincan.getState("lesson_location", { "agent": tcagent, "activity": { id: tcactivity_id } });
                                if (r.state == null) {

                                }
                                else {
                                    result = r.state.contents;
                                    this.data[a1] = result;
                                }
                            }
                            else if (a1 == 'cmi.core.lesson_status') {
                                var r = tincan.getState("lesson_status", { "agent": tcagent, "activity": { id: tcactivity_id } });
                                if (r.state == null) {

                                }
                                else {
                                    result = r.state.contents;
                                    this.data[a1] = result;
                                }
                            }
                            else if (a1 == 'cmi.core.entry') {
                                var r = tincan.getState("exit", { "agent": tcagent, "activity": { id: tcactivity_id } });
                                if (r.state == null) {
                                    result = "resume";
                                    this.data[a1] = result;
                                }
                                else {
                                    var res1 = r.state.contents;
                                    if (res1 == "suspend") result = "resume"
                                    this.data[a1] = result;
                                }
                            }
                        }
                      
                        return result;
                    },
                    LMSSetValue: function (a1, a2, xapidefinition, xapiid, xapiresponse) {
                      
                        if (a1 == 'cmi.suspend_data') {
                            var result = tincan.setState("suspend_data", a2,{"agent": tcagent,"activity":{id: tcactivity_id}});  
                        }
                        else if (a1 == 'cmi.core.lesson_location') {
                            var result = tincan.setState("lesson_location", a2, { "agent": tcagent, "activity": { id: tcactivity_id } });
                        }
                        else if (a1 == 'cmi.core.exit') {
                            var result = tincan.setState("exit", a2, { "agent": tcagent, "activity": { id: tcactivity_id } });
                        }
                        else if (xapiid != null && /^(cmi.interactions.([0-9]+).result)$/.test(a1)) {
                            var match = /^(cmi.interactions.([0-9]+).result)$/.exec(a1);
                            var n = match[2];
                            var result = a2;

                            var resp = this.data["cmi.interactions." + n + ".student_response"];
                            var message = {

                                actor: JSON.parse(tcactor),
                                verb: {
                                    id: "http://adlnet.gov/expapi/verbs/answered"
                                },
                                object: {
                                    id: tcactivity_id + ":question:" + xapiid,
                                    objectType: "Activity",
                                    definition: xapidefinition
                                },
                                result: {
                                  
                                    response: xapiresponse,
                                    success: (result == "correct" || result == "100" || result == "neutral")

                                },
                                context: {
                                    contextActivities: {
                                        parent: [
                                            {
                                                id: tcactivity_id,
                                                objectType:"Activity"
                                            }
                                        ]
                                    }
                                }

                            };


                            var result = tincan.sendStatement(message);
                            if (result.results[0].err != null) {
                                xAPIError();
                            }

                        }
                        else if (/^(cmi.objectives.([0-9]+).status)$/.test(a1)) {
                            if (a2 == "completed" || a2 == "passed" || a2 == "failed") {

                            }
                        }
                        else if (a1 == 'cmi.core.lesson_status') {
                            if (a2 == "completed" || a2 == "passed" || a2 == "failed") {
                                var message = {

                                    actor: JSON.parse(tcactor),
                                    verb: {
                                        id: "http://adlnet.gov/expapi/verbs/completed"
                                    },
                                    object: {
                                        id: tcactivity_id,
                                        objectType: "Activity"
                                    },
                                    result: {
                                        completion: true
 
                                    }
                                };
                                if (this.data["cmi.core.score.raw"] != null) {
                                    var m = parseFloat(this.data["cmi.core.score.max"].toString());
                                    message.result.score =  {
                                        scaled: (m==0)?1:(parseFloat(this.data["cmi.core.score.raw"].toString())/m),
                                        raw: parseFloat(this.data["cmi.core.score.raw"].toString()),
                                        min: parseFloat(this.data["cmi.core.score.min"].toString()),
                                        max: parseFloat(this.data["cmi.core.score.max"].toString())
                                    }
                                }


                                if (/*this.LMSGetValue('cmi.core.entry') != "resume" ||*/ this.LMSGetValue('cmi.core.lesson_status') != a2) {
                                    var result = tincan.sendStatement(message);
                                    if (result.results[0].err != null) {
                                        xAPIError();
                                    }

                                    var result = tincan.setState("lesson_status", a2, { "agent": tcagent, "activity": { id: tcactivity_id } });
                                }
                            }
                        }

                        this.data[a1] = a2;
                    },
                    LMSCommit: function (a1) {

                    },
                    LMSGetLastError: function () {

                    },
                    LMSGetErrorString: function (a1) {

                    },
                    LMSGetDiagnostics: function (a1) {

                    },

                    data: {},
                    initialized: false
                }
            }
        }
    }
}

var showxAPIError = 0;
function xAPIError() {
    showxAPIError = 1;
    if (xAPIWarning != null && xAPIWarning != "") {
        alert(xAPIWarning);
        xAPIWarning = "";
        showxAPIError = 1;
    }
}


if (apiHandle == null) {
    apiHandle = initialGetAPI();
}

var scormdata = null;


function CMITimespan(st) {
    var ms = Math.floor((st % 1000) / 10);
    var se = Math.floor((st % 60000) / 1000);
    var m = Math.floor((st % 3600000) / 60000);
    var h = Math.floor(st / 3600000);
    return (Math.abs(h - 10) != h - 10 ? '0' : '') + h + ':' + (Math.abs(m - 10) != m - 10 ? '0' : '') + m + ':' + (Math.abs(se - 10) != se - 10 ? '0' : '') + se + '.' + (Math.abs(ms - 10) != ms - 10 ? '0' : '') + ms;
}
var initialized = false;
function InitScormData() {
    scormdata = {
        min: 0,
        max: 100,
        raw: 0,
        lesson_status: 'not attempted',
        exit: 'suspend',
        suspenddata: null,
        getSuspendData: function () {

            var result = {};
            if (CalculateSuspendDataDelegate != null) CalculateSuspendDataDelegate(result);
            var r = JSON.stringify(result);
            return r;
        },
        setSuspendData: function (data) {
            if (data != null && data != "") {
                try {
                    this.suspenddata = JSON.parse(data);
                }
                catch (e) {

                }
            }
        },
        lesson_location: [null, null],
        startTime: new Date().getTime(),
        session_time: function () {
            var endTime = new Date().getTime();
            return CMITimespan(endTime - this.startTime);
        },
        apicache: {},
        objectives: [],
        interactions: [],
        objectiveById: function (id) {
            var n = -1;
            for (var o in this.objectives) {
                if (this.objectives[o].id == id) return this.objectives[o];
                if (this.objectives[o].index > n) n = this.objectives[o].index;
            }
            n++;

            this.objectives[n] = {
                min: 0,
                max: 100,
                raw: 0,
                status: 'not attempted',
                id: id,
                index: n
            }
            return this.objectives[n];
        },
        interactionById: function (id) {
            var n = -1;
            for (var i in this.interactions) {
                if (this.interactions[i].id == id) return this.interactions[i];
                if (this.interactions[i].index > n) n = this.interactions[i].index;
            }
            n++;
            this.interactions[n] = {
                latency: null,
                time: null,
                id: id,
                index: n
            }
            return this.interactions[n];
        }

    }

}
function LMSInitialize() {



    var api = GetAPI();

    if (api == null) {
        if (externalHandle != null && ("start" in externalHandle)) {
            externalHandle.start();
            InitScormData();
        }
        return false;
    }
    initialized = true;
    InitScormData();

    var initResult = api.LMSInitialize("");

    if (initResult == null || initResult.toString() != "true") {
        var err = ErrorHandler();
    }
    if (initResult == null) initResult = "";


    scormdata.credit = LMSGetValue('cmi.core.credit');
    scormdata.entry = LMSGetValue('cmi.core.entry');

    if (scormdata.entry == 'resume' || scormdata.entry == '') {
        if (scormdata.entry == 'resume') {
            var ll = LMSGetValue('cmi.core.lesson_location').split(',');
            if (ll.length > 0) {
                if (ll[0] != null && ll[0] != '') {
                    scormdata.lesson_location[0] = parseInt(ll[0]);
                }
            }
            if (ll.length > 1) {
                if (ll[1] != null && ll[1] != '') {
                    scormdata.lesson_location[1] = parseInt(ll[1]);
                }
            }
        }
        var sd = LMSGetValue('cmi.suspend_data');
        if (sd.length == 0 || sd[0] != '*') {
            scormdata.setSuspendData(sd);
        }
        else {
            scormdata.setSuspendData(LZString.decompressFromUTF16(sd.substr(1)));
        }
    }


    scormdata.old_lesson_location = [];
    for (var i in scormdata.lesson_location) {
        scormdata.old_lesson_location[i] = scormdata.lesson_location[i];
    }
    
    return initResult.toString()
}

var CalculateScoreDelegate = null;
var CalculateSuspendDataDelegate = null;





function CheckConditions(Conditions) {
    if (Conditions != null) {
        var positiveConditions = false;
        var onepositive = false;

        var negativeConditions = false;
        var allnegative = true;
        for (var ci = 0; ci < Conditions.length; ci++) {
            var c = Conditions[ci];
            var vv = system.GetDataValue(c, "Variable", 7);
            if (vv > -1 && c.P == 3236) {
                var f = system.GetDataValue(c, "Function", 0);
                var v = system.GetDataValue(c, "Variable", 7);

                var sv = '';
                switch (v) {
                    case 0:
                        sv = 'ecampus.student.firstname';
                        break;
                    case 1:
                        sv = 'ecampus.student.lastname';
                        break;
                    case 2:
                        sv = 'ecampus.student.gender';
                        break;
                    case 3:
                        sv = 'ecampus.student.shortdesc';
                        break;
                    case 4:
                        sv = 'ecampus.student.orgname';
                        break;
                    case 5:
                        sv = 'ecampus.student.orgshortdesc';
                        break;
                    case 6:
                        sv = 'ecampus.student.funcname';
                        break;
                    case 7:
                        sv = 'ecampus.student.funcshortdesc';
                        break;
                    case 8:
                        sv = 'ecampus.student.midname';
                        break;
                    case 10:
                        sv = 'ecampus.student.language';
                        break;
                    case 101:
                        sv = 'ecampus.student.user1';
                        break;
                    case 102:
                        sv = 'ecampus.student.user2';
                        break;
                    case 103:
                        sv = 'ecampus.student.user3';
                        break;
                    case 104:
                        sv = 'ecampus.student.user4';
                        break;
                    case 105:
                        sv = 'ecampus.student.user5';
                        break;
                    case 106:
                        sv = 'ecampus.student.user6';
                        break;
                    case 107:
                        sv = 'ecampus.student.user7';
                        break;
                    case 108:
                        sv = 'ecampus.student.user8';
                        break;
                    case 109:
                        sv = 'ecampus.student.user9';
                        break;
                    case 110:
                        sv = 'ecampus.student.user10';
                        break;
                }
                if (sv != '') {
                    sv = LMSGetValue(sv);
                }
                var val = system.GetDataText(c, "Value", 0, false);
                if (f == 0) {
                    positiveConditions = true;
                    if (sv == val) onepositive = true;
                }
                else if (f == 1) {
                    negativeConditions = true;
                    if (sv == val) allnegative = false;
                }
            }

        }
        if (((positiveConditions && onepositive) || !positiveConditions) && allnegative) {
            return true;
        }
        return false;
    }
    else {
        return true;
    }
}

var SCORMScore = true;
var SCORMSuspend = false;
var AlwaysLog = false;

var FieldAPI = '';
var FieldAPIData = null;
var FieldAPIStudent = '';
var FieldAPIStore = null;
var FieldAPINodeID;
var FieldAPICourseName;
var FieldAPIWarning;
var FieldAPITimeout = null;
var FieldAPIScore = 0;
var xAPIWarning = "";

function GetFieldAPIFieldByVar(v) {
    if (FieldAPIStore == null) return null;
    for (var i in FieldAPIStore.Module.Fields) {
        if (FieldAPIStore.Module.Fields[i].FieldVariable == v) return FieldAPIStore.Module.Fields[i].FieldData;
    }
    if (FieldAPIData == null) return null;
    for (var i in FieldAPIData.Fields) {
        if (FieldAPIData.Fields[i].FieldVariable == v) return FieldAPIData.Fields[i].FieldData;
    }
    return null;
}

function StoreFieldAPIField(FieldID, FieldVariable, FieldName, FieldData, Save) {
    if (FieldAPIData == null) return;

    var found = false;
    var save = false;
    for (var i in FieldAPIStore.Module.Fields) {
        var field = FieldAPIStore.Module.Fields[i];
        if (field.FieldVariable == FieldVariable) {
            found = true;
            field.FieldName = FieldName;
            field.FieldVariable = FieldVariable;
            if (field.FieldData != FieldData) {
                save = Save;
                if (FieldData == null) field.FieldData = '';
                else field.FieldData = FieldData;
            }
        }
    }
    if (!found) {
        FieldAPIStore.Module.Fields[FieldAPIStore.Module.Fields.length] = { "FieldID": FieldID, "FieldVariable": FieldVariable, "FieldName": FieldName, "FieldData": (FieldData==null)?'':FieldData }
        save = Save;
    }

    for (var i in FieldAPIData.Fields) {
        if (FieldAPIData.Fields[i].FieldVariable == FieldVariable) {
            if (FieldAPIData.Fields[i].FieldData != FieldData) {
                FieldAPIData.Fields[i].FieldData = FieldData;
            }
        }
    }


    
    if (save) {
        if (FieldAPITimeout == null) FieldAPITimeout = setTimeout('SaveFieldAPI()', 20000);
    }
}

function GetFieldAPIUrl(url) {
    var b = FieldAPI + '#';
    b = b.replace('##', '#');
    b = b.replace('#', url + "&Portal=");
    return b;
}

function SaveFieldAPI() {
    if (FieldAPIData == null || FieldAPIStore == null) return;
    if (FieldAPITimeout != null) {
        clearTimeout(FieldAPITimeout);
        FieldAPITimeout = null;
    }
    FieldAPIStore.Score = Math.round(FieldAPIScore);

    var result = false;
    try {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", GetFieldAPIUrl("/Field.aspx?Method=SaveData"), false);
        var param = JSON.stringify(FieldAPIStore)
        xmlhttp.send(param);
        result = JSON.parse(xmlhttp.responseText).OK;
        
    }
    catch (e) {
    }
    if (!result && FieldAPIWarning != '') alert(FieldAPIWarning);
}

function StartSCO(Block) {

    var ResumeMethod = Block.ResumeMethod;
    var ResumeQuestion = Block.ResumeWarning;

    xAPIWarning = system.GetDataText(Block.Data, "xAPIWarning", "", true);
    if (showxAPIError == 1) xAPIError();

    FieldAPI = system.GetDataText(Block.Data, "FieldAPI", "", true);
    FieldAPIData = null;
    FieldAPINodeID = Block.SLM.DataNode;
    if (FieldAPINodeID == null || FieldAPINodeID == 0) FieldAPINodeID = datanodeid;
    FieldAPICourseName = system.GetDataText(Block.Data, "Title", "", true);

    if (FieldAPI != '') {
        FieldAPI = window.location.protocol + "//" + FieldAPI;
        FieldAPIWarning = system.GetDataText(Block.Data, "FieldAPIWarning", "", true);
        
        try {
            FieldAPIStudent = (scormdata != null) ? LMSGetValue("cmi.core.student_id") : ((session == null) ? '' : session.UserID);
            
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open("POST", GetFieldAPIUrl( "/Field.aspx?Method=CreateToken"), false);
            var param = JSON.stringify({ "SlimNodeID": FieldAPINodeID, "StudentID": FieldAPIStudent, "FieldAPIProxyMessage": ((typeof FieldAPIProxyMessage != 'undefined') ? FieldAPIProxyMessage : ''), "FieldAPIProxySignature": ((typeof FieldAPIProxySignature != 'undefined') ? FieldAPIProxySignature : '') })
            xmlhttp.send(param);
            FieldAPIData = JSON.parse(xmlhttp.responseText);
            
            if (FieldAPIData == null || FieldAPIData.Token == null || FieldAPIData.Token == '') {
                FieldAPIData = null;
                if (FieldAPIWarning != '') alert(FieldAPIWarning);
            }
            else {
                FieldAPIStore = { "StudentID": FieldAPIStudent, "Token": FieldAPIData.Token, "Module": { "SlimNodeID": FieldAPINodeID, "CourseName": FieldAPICourseName, Fields: [] } }
            }
        }
        catch (e){
            if (FieldAPIWarning != '') alert(FieldAPIWarning);
        }
    }


    if (scormdata == null && FieldAPIData != null) {
        Block.ConsumeSuspendData({});
    }
    else if (scormdata != null) {
        scormdata.resume = false;
        scormdata.block = Block;

        var consumed = false;
        if (ResumeMethod > 0) {
            if (scormdata.suspenddata != null) {
                Block.ConsumeSuspendData(scormdata.suspenddata);
                consumed = true;
            }
            if (scormdata.entry == 'resume') scormdata.exit = 'suspend';
        }
        if (!consumed && FieldAPIData != null) {
            Block.ConsumeSuspendData({});
        }

        if (scormdata.entry == 'resume' && ResumeMethod == 3 && ResumeQuestion != '') {
            if (confirm(ResumeQuestion)) {
                scormdata.resume = true;

                var resumePlayer = null;
                for (var pi in scormdata.block.Players) {

                    if (scormdata.old_lesson_location.length > 0 && scormdata.block.Players[pi].Data.L == scormdata.old_lesson_location[0]) {
                        resumePlayer = scormdata.block.Players[pi];
                    }
                }
                if (resumePlayer != null) {
                    var jp = null;
                    if (scormdata.old_lesson_location.length > 1) {
                        for (var p in resumePlayer.Pages) {
                            if (resumePlayer.Pages[p].Data.L == scormdata.old_lesson_location[1]) {
                                jp = resumePlayer.Pages[p];
                            }
                        }
                    }
                    Block.ActivatePlayer(resumePlayer);
                    if (jp != null) {
                        resumePlayer.ActivatePage(jp);
                    }

                }

                if (scormdata.suspenddata != null) {
                    var sd = scormdata.suspenddata[Block.Data.L.toString()];
                    if (sd != null && sd != "") {
                        var nmu = (sd == 1);
                        if (Block.menuUp != nmu) {
                            Block.menuUp = nmu;

                        }
                    }
                }

            }
        }
        scormdata.startTime = new Date().getTime();



        LMSCommit();
        Block.updateMenu();
    }
    else {
    }

}

function SetScore(final) {
    if (CalculateScoreDelegate != null) {
        CalculateScoreDelegate(final);
        if (scormdata != null) {
            if (externalHandle != null && ('setScore' in externalHandle)) externalHandle.setScore(scormdata.raw +"|"+scormdata.max+"|"+ scormdata.lesson_status);
            if (SCORMScore) {
                LMSSetValue('cmi.core.score.min', scormdata.min);
                LMSSetValue('cmi.core.score.raw', scormdata.raw);
                LMSSetValue('cmi.core.score.max', scormdata.max);
            }
            LMSSetValue('cmi.core.lesson_status', scormdata.lesson_status);
        }
    }
}

function SetObjective(id, raw, status) {
    if (scormdata != null) {
        var o = scormdata.objectiveById(id);
        o.min = 0;
        o.raw = raw;
        o.max = 100;
        o.status = status;
        if (externalHandle != null && ('setObjectiveScore' in externalHandle)) externalHandle.setObjectiveScore(o.id + "|" + o.raw + "|" + o.max + "|" + o.status);
        LMSSetValue('cmi.objectives.' + o.index + '.score.min', o.min);
        LMSSetValue('cmi.objectives.' + o.index + '.score.raw', o.raw);
        LMSSetValue('cmi.objectives.' + o.index + '.score.max', o.max);
        LMSSetValue('cmi.objectives.' + o.index + '.id', o.id);
        LMSSetValue('cmi.objectives.' + o.index + '.status', o.status);
    }
}

function PrepareInteraction(id, type, weighting) {
    if (scormdata != null) {
        var i = scormdata.interactionById(id);
        if (i.time == null) {
            i.time = new Date().getTime();
        }
        i.type = type;
        i.weighting = weighting;

        LMSSetValue('cmi.interactions.' + i.index + '.id', i.id);
        LMSSetValue('cmi.interactions.' + i.index + '.time', CMITimespan(i.time % 86400000));
        LMSSetValue('cmi.interactions.' + i.index + '.type', i.type);
        LMSSetValue('cmi.interactions.' + i.index + '.weighting', i.weighting);
    }

}

function SetInteraction(id, student_response, result, xapidefinition, xapiid, xapiresponse) {
    if (externalHandle != null && ('setInteraction' in externalHandle)) externalHandle.setInteraction(id + "|" + result.toString() + "|" + JSON.stringify(xapidefinition) + "|" + xapiid + "|" + xapiresponse);
    if (scormdata != null) {
        var i = scormdata.interactionById(id);
        if (i.latency == null && i.time != null) {
            var endTime = new Date().getTime();
            i.latency = endTime - i.time;
        }
        i.student_response = student_response;
        i.result = result;
        var sr = i.student_response;
        if (sr == null) sr = "";
        if (sr.length > 255) sr = sr.substr(0, 255);
        LMSSetValue('cmi.interactions.' + i.index + '.student_response', sr);
        if (i.latency != null) LMSSetValue('cmi.interactions.' + i.index + '.latency', CMITimespan(i.latency));
        LMSSetValue('cmi.interactions.' + i.index + '.result', i.result, xapidefinition, xapiid, xapiresponse);
    }
}

function LMSFinish() {
    SetScore(true);
    SaveState();
    if (externalHandle != null && ("finish" in externalHandle)) externalHandle.finish();
    if (!initialized) return;
 
    initialized = false;
    
   
    if (scormdata != null) {
        var api = GetAPI();
        if (api == null) {
            return;
        }
        api.LMSCommit("");
        api.LMSFinish("");
    }
    
}

function LMSCloseWindow() {
    if (scormdata != null) {
        var api = GetAPI();
        if (api == null) {
            return;
        }
        if (api.Close) {
            try{
                api.Close();
            }
            catch (e) {

            }
        }
    }

}

function LMSCommit() {

        SetScore(false);
        SaveState();

        if (!initialized) return;
        if (scormdata != null) {
            var api = GetAPI();
            if (api == null) {
                return;
            }
            api.LMSCommit("");
        }



}

function SaveState() {
    if (scormdata != null) {
        var ex = scormdata.exit;
        if (scormdata.lesson_status != 'incomplete' && SCORMSuspend) ex = '';
        LMSSetValue('cmi.core.exit', ex);
        LMSSetValue('cmi.core.session_time', scormdata.session_time());
        if (scormdata.exit == 'suspend') {
            var sd = scormdata.getSuspendData();
            if (sd.length > 4096) {
                LMSSetValue('cmi.suspend_data', "*" + LZString.compressToUTF16(sd));
            }
            else {
                LMSSetValue('cmi.suspend_data', sd);
            }
            
            var ll = '';
            if (scormdata.lesson_location.length > 0 && scormdata.lesson_location[0] != null) {
                ll += scormdata.lesson_location[0].toString();

                if (scormdata.lesson_location.length > 1 && scormdata.lesson_location[1] != null) {
                    ll += ',' + scormdata.lesson_location[1].toString();
                }
            }
            LMSSetValue('cmi.core.lesson_location', ll);
        }
    }
    SaveFieldAPI();
}

function LMSGetValue(name) {
    if (name == "ecampus.student.language" && langcodes != null) {
        var lc = langcodes[lang.toString()];
        if (lc != null) return lc;
    }

    if (typeof (testSettings) != "undefined") {
        if (testSettings != null && testSettings[name.replace(/\./g, "_")]) return testSettings[name.replace(/\./g, "_")];
    }

    var api = GetAPI();
    if (api != null) {
        if (scormdata.apicache[name] != null) return scormdata.apicache[name];

        var value = api.LMSGetValue(name);
        var err = ErrorHandler();

        if (err != 0) {
            return "";
        }
        else {
            if (value != null)
                return value.toString();
            else
                return "";
        }
    }
    else if (session != null && session.UserData != null) {
        return system.GetDataText(session.UserData.TestSettings, name.replace(/\./g, "_"), "");
    }


    return null;
}

function LMSSetValue(name, value, xapidefinition, xapiid, xapiresponse) {
    if (!initialized) return;
    var api = GetAPI();
    if (api == null) {
        return;
    }

    if (scormdata.apicache[name] != value) {
        scormdata.apicache[name] = value;

        api.LMSSetValue(name, value.toString(), xapidefinition, xapiid, xapiresponse);
        var err = ErrorHandler();
    }
}

function LMSGetLastError() 
{
     var api = GetAPI();
     if (api == null) 
     {
         return;
     }

     var gle = api.LMSGetLastError();
     if (gle == null) return "";
     else return gle.toString();
}

function LMSGetErrorString(errorCode) {
    var api = GetAPI();
    if (api == null) {
        return;
    }

    var gle = api.LMSGetErrorString(errorCode);
    if (gle == null) return "";
    else return gle.toString();
}

function LMSGetDiagnostic(errorCode) {
    var api = GetAPI();
    if (api == null) {
        return;
    }

    var gle = api.LMSDiagnostic(errorCode);
    if (gle == null) return "";
    else return gle.toString();
}

function ErrorHandler() {
    var api = GetAPI();
    if (api == null) {
        return;
    }

    var ec = api.LMSGetLastError();
    if (ec == null) return "";
    else {
        var errCode = ec.toString();

        if (errCode != 0) {
            var errDescription = api.LMSGetErrorString(errCode);

        }

        return errCode;
    }
}

function GetAPI() 
{
	return apiHandle;
}

function findAPI(win) {
    var findAPITries = 0;
    while ((win.API == null) &&
           (win.parent != null) &&
           (win.parent != win)) {
        findAPITries++;

        if (findAPITries > 7) {
            return null;
        }

        win = win.parent;
    }
    return win.API;
}


function initialGetAPI() {
    var w = window;
    var theAPI = null;

    try {
        theAPI = findAPI(w);

        while ((theAPI == null) &&
             (w.top.opener != null) &&
             (typeof (w.top.opener) != "undefined")) {
            w = w.top.opener;
            theAPI = findAPI(w);
        }
    }
    catch (err) {

    }

    return theAPI;
}



//
//authorize
//
function Authorize(Owner, DataNode, Done, Auth) {
    var _this = this;
    this.Done = Done;
    this.loading = 0;
    this.Owner = Owner;
    this.DataNode = DataNode;
    this.Auth = Auth;
    if (this.Auth != null) this.Auth = this.Auth.data;

    this.CloseQuery = function (Done) {
        if (Done != null) Done();
    }

    this.contentLayer = Owner;
    this.contentLayer.innerHTML = '';
    this.title = html.createElement(this.contentLayer, "H1");

    this.loadAuthorizations = function () {
        system.doRequest({ "RequestType": 5, "SessionGuid": session.SessionGuid, "SubjectID": _this.DataNode }, function (response, completed) {
            _this.UserAuthorizations = response.Data.Authorizations;
            _this.show();
        });
    }

    this.show = function () {

        _this.authorizationLayer = html.createElement(_this.contentLayer, "DIV");
        _this.authorizationLayer.style.backgroundColor = '#eef0f2';
        html.addGradient(_this.authorizationLayer, 'top', 'white', '#eef0f2');
        _this.authorizationLayer.style.boxShadow = '1px 1px 4px #888';
        _this.authorizationLayer.style.padding = '5px';
        _this.ShowAuthorizations();

        if (system.GetDataValue(_this.Auth, "EditAuthorizations", 0) == 1) {
            html.createElement(_this.contentLayer, "H2").innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Auth_Add") ;
            var tree = new NodeTree(_this.contentLayer);
            new UserControls(_this, tree);
        }
    }

    this.ShowAuthorizations = function () {
        this.authorizationLayer.innerHTML = '';
        for (var a in _this.UserAuthorizations) {
            new Authorization(_this, _this.UserAuthorizations[a], system.GetDataValue(this.Auth, "EditAuthorizations", 0));
        }
    }

    system.RequireNodeID(this.DataNode, this, function (sender, node) {
        _this.loadAuthorizations();
        _this.title.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Auth_Title").replace('{0}', node.name);
    },1,false,0);
}

function UserControls(Owner, NodeTree) {
    this.Owner = Owner;
    this.NodeTree = NodeTree;
    var _this = this;
    this.selected = null;
    this.NodeTree.OnSelect = function (selected) {
        _this.selected = selected;
        _this.UpdateView();
    }

    this.UpdateView = function () {
        _this.roleSelect.style.display = (_this.selected != null) ? '' : 'none';
        _this.authorizeButton.style.display = (_this.selected != null) ? '' : 'none';
        if (_this.selected != null) {
            var baseAuth = system.GetKnownNode(_this.selected.Authorization.Role);

            while (_this.roleSelect.childNodes.length > 0) _this.roleSelect.removeChild(_this.roleSelect.firstChild);
            var roles = system.KnownNodesByType(235);
            for (var ci in roles) {
                var configItem = roles[ci];
                var fits = true;
                for (var pr in configItem.data) {
                    if (system.GetDataValue(configItem.data, pr, 0) == 1) {
                        if (system.GetDataValue(baseAuth.data, pr, 0) == 1) {

                        }
                        else {
                            fits = false;
                        }
                    }
                }
                if (fits) {
                    var option = html.createElement(_this.roleSelect, "OPTION");
                    option.value = configItem.id;
                    option.text = system.GetDataText(configItem.data, "FullName", "", true);
                }
            }
        }
        _this.authorizeButton.disabled = _this.roleSelect.selectedIndex == -1;
    }

    this.controls = html.createElement(Owner.contentLayer, "DIV");

    this.roleSelect = html.createElement(this.controls, "SELECT");
    this.roleSelect.onchange = function () {
        _this.authorizeButton.disabled = _this.roleSelect.selectedIndex == -1;
    };
    this.authorizeButton = html.createElement(this.controls, "INPUT");
    this.authorizeButton.type = "BUTTON";
    this.authorizeButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Edit_Add");
    this.authorizeButton.onclick = function () {
        system.doRequest({ "RequestType": 25, "SessionGuid": session.SessionGuid, "SubjectID": _this.Owner.DataNode, "TargetNodeID": _this.selected.NodeID, "RoleNodeID" : parseInt(_this.roleSelect.value) }, function (response, completed) {
            _this.Owner.UserAuthorizations = response.Data.Authorizations;
            _this.Owner.ShowAuthorizations();
        });
    }

    this.UpdateView();
}

function Authorization(Owner, Authorization, Edit) {
    this.Owner = Owner;
    this.Authorization = Authorization;
    this.panel = html.createElement(Owner.authorizationLayer, "DIV");

    var _this = this;

    this.deleteButton = html.createElement(this.panel, "INPUT");
    this.deleteButton.type = 'button';
    this.deleteButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Edit_Delete");
    this.deleteButton.onclick = function () {
        system.doRequest({ "RequestType": 35, "SessionGuid": session.SessionGuid, "SubjectID": _this.Authorization.AuthorizationID }, function (response, completed) {
            _this.Owner.UserAuthorizations = response.Data.Authorizations;
            _this.Owner.ShowAuthorizations();
        });
    }

    this.deleteButton.disabled = !(Edit && this.Owner.DataNode == Authorization.UserNodeID);

    this.iconType = html.createElement(this.panel, 'IMAGE');
    this.iconType.src = system.GetDataFile(system.GetKnownNodeData(this.Authorization.NodeType), 'IconSource','', false);
    this.iconType.style.width = '20px';
    this.iconType.style.height = '20px';
    this.name = html.createElement(this.panel, 'SPAN');
    this.name.innerHTML = system.GetKnownNodeName(Authorization.UserNodeID)+" -> "+this.Authorization.NodeName + ' (' +system.GetDataText(system.GetKnownNodeData(Authorization.Role),"FullName","", false) + ')';
}

//
//com
//
function System() {
    this.Reset();
    this.CustomerID = 0;

    var _this = this;

}

//require 1 = Name/Type, 2 = Data, 4 = Links
System.prototype.RequireNodeID = function (id, sender, notify, require, update, levels) {
    if (this.KnownIDS[id.toString()] == null) {
        this.KnownIDS[id.toString()] = new KnownNode(this, id.toString(), sender, notify, require, update, levels);
    }
    else {
        var knid = this.KnownIDS[id.toString()];
        knid.Require(sender, notify, require, update, levels);
    }
}

System.prototype.NewData = function (ID, Data) {
    if (session != null && ID == session.UserID) {
        if (Data.NodeData != null) {
            session.UserData = Data.NodeData;
        }
    }
    if (this.KnownIDS[ID] == null) {
        this.KnownIDS[ID] = new KnownNode(this, ID, null, null, 0, false, 0);
    }   
    this.KnownIDS[ID].NewData(Data);
}

System.prototype.GetKnownNode = function (id) {
    if (this.KnownIDS == null) return null;
    return this.KnownIDS[id];
}

System.prototype.GetKnownNodeData = function (id) {
    var ci = this.GetKnownNode(id);
    if (ci == null) return null;
    return ci.data;
}

System.prototype.GetKnownNodeName = function (id) {
    var ci = this.GetKnownNode(id);
    if (ci == null) '{' + id + '}';
    return ci.name;
}

function KnownNode(system, id, sender, notify, require, update, levels) {
    this.system = system;
    this.id = id;
    this.loaded = 0;
    this.required = 0;
    this.notauthorized = 0;
    this.data = null;
    this.name = null;
    this.type = null;
    this.links = null;
    this.notifiers = [];

    if (require != 0) this.Require(sender, notify, require, update, levels);
}

function Notifier(sender, notify, require, update) {
    this.sender = sender;
    this.notify = notify;
    this.require = require;
    this.update = update;
}

KnownNode.prototype.Require = function (sender, notify, require, update, levels) {
    if (window.console && window.console.log) console.log("require");
    var notloaded = ~this.loaded & require & ~this.notauthorized;
    if (notloaded != 0 || update) {
        if (notify != null) {
            this.notifiers[this.notifiers.length] = new Notifier(sender, notify, require, update);
        }
    }
    if (window.console && window.console.log) console.log("not loaded "+notloaded);
    if (notloaded == 0) {
        if (notify != null) notify(sender, this);
    }
    else {
        if (window.console && window.console.log) console.log("not required " + notloaded);
        var notrequired = ~this.required & require;
        if (notrequired != 0) {
            this.required |= require;

            this.Load((levels == 0) ? notrequired : require, levels);
        }
    }
}
KnownNode.prototype.Refresh = function (sender, notify, require) {
    if (window.console && window.console.log) console.log("refresh");
    this.loaded = this.loaded & ~require;
    this.required = this.required & ~require;
    this.notauthorized = this.notauthorized & ~require;
    this.Require(sender, notify, require, false, 0);

}
KnownNode.prototype.RefreshKnown = function (sender, notify) {
    if (window.console && window.console.log) console.log("refreshknown");
    var require = this.required;
    this.Refresh(sender, notify, require);

}
KnownNode.prototype.Load = function (require, levels) {
    var _this = this;
    if (window.console && window.console.log) console.log("load");
    system.doRequest({ "RequestType": 3, "SessionGuid": session.SessionGuid, "SubjectID": ExtractNumber(this.id), "Require": require, "Levels": levels }, function (response, completed) {
        if (window.console && window.console.log) console.log("after load");
        system.HandleResponse(response.Data, _this);

    });
}

System.prototype.InvalidateCache = function (NodeID, Available) {
    var kn = this.KnownIDS[NodeID];
    if (kn != null) {
        kn.Refresh(null, null, kn.required & Available);
    }
}

System.prototype.HandleResponse = function (Data, last) {
    if (Data.NodeResources) AddResources(Data.NodeResources);
    if (Data.NodeTexts) AddTexts(Data.NodeTexts);
    if (Data.Nodes) {
        var handlelast = null;
        for (var i in Data.Nodes) {
            if (last != null && i == last.id) {
                handlelast = Data.Nodes[i];
            }
            else {
                this.NewData(i, Data.Nodes[i]);
            }
        }
        if (handlelast != null) last.NewData(handlelast);
    }
}



KnownNode.prototype.NewData = function (Data) {
    var a = Data.Available;
    if ((a & 1) == 1) {
        this.name = Data.NodeName;
        this.type = Data.NodeType;
        if (system.KnownTypes[this.type.toString()] == null) system.KnownTypes[this.type.toString()] = {};
        system.KnownTypes[this.type.toString()][this.id] = this;
    }
    if ((a & 2) == 2) {
        this.data = Data.NodeData;

        //ensure correct propertytypes
        if (this.type == 160) system.pts = {};
    }
    if ((a & 4) == 4) {
        this.links = Data.Links;
    }
    this.loaded |= a;
    this.required |= a;

    var n = Data.NotAuthorized;
    this.notauthorized |= n;
    if ((n & 1) == 1) {
        this.name = system.GetCustomerConfigText("UI/TXT_System_NotAuthorized");
    }

    var i = 0;
    while (i < this.notifiers.length) {
        var not = this.notifiers[i];
        if ((not.require & this.loaded) == not.require) {
            not.notify(not.sender, this);
            if (!not.update) {
                this.notifiers.splice(i, 1);
                i--;
            }
        }
        i++;
    }
}

System.prototype.KnownNodesByType = function (t) {
    if (this.KnownTypes[t.toString()] == null) this.KnownTypes[t.toString()] = {};
    return this.KnownTypes[t.toString()];
}


System.prototype.Reset = function () {
    this.status = null;
    this.requests = 0;
    this.lastNewLocalID = -1;
    this.waitingIDs = {};
    this.KnownIDS = {};
    this.pts = {};
    this.LastKnownPosition = null;
    this.KnownTypes = {};
}

System.prototype.LoadCustomer = function (CustomerName, Done) {
    var _this = this;
    system.doRequest({ "RequestType": 9, "CustomerName": CustomerName }, function (response, completed) {
        _this.CustomerData = response.Data.CustomerData;
        _this.CustomerName = response.Data.CustomerName;
        _this.CustomerID = response.Data.CustomerID;
        _this.UniverseID = response.Data.UniverseID;

        AddResources(response.Data.CustomerResources);
        AddTexts(response.Data.CustomerTexts);
        for (var i in response.Data.ConfigItems) {
            var ci = response.Data.ConfigItems[i];
            ci.Available = 3;
            _this.NewData(ci.NodeID, ci);
        }
        _this.CustomerConfigData = [];
        var c = _this.CustomerData.CustomerConfig;
        while (c != null) {
            var cc = system.GetDataNode(c, null, null);
            c = null
            if (cc != null) {
                cco = _this.GetKnownNodeData(cc);
                if (cco != null) {
                    _this.CustomerConfigData[_this.CustomerConfigData.length] = cco;
                    c = cco.BaseCustomerConfig;
                }
            }
        }

        Done();
    });
}

System.prototype.GetDataNode = function (data, key, def) {
    var d = (key==null)?data : this.GetDataKey(data, key.split('/'));
    if (d == null || d.N == null) return def;
    return d.N;
}

System.prototype.GetDataReference = function (data, key, def) {
    var d = (key == null) ? data : this.GetDataKey(data, key.split('/'));
    if (d == null || d.R == null) return def;
    return d.R;
}


System.prototype.GetDataValue = function (data, key, def) {
    var d = (key == null) ? data : this.GetDataKey(data, key.split('/'));
    if (d == null || d.V == null) return def;
    return d.V;
}

var lang = null;
var citrix = false;
var forceclose = false;
var CLPInfo = null;


System.prototype.GetDataLanguageTag = function (data, key) {
    result = {};
    var d = (key == null) ? data : this.GetDataKey(data, key.split('/'));
    if (d == null || d.T == null) return result;

    if (isNaN(d.T)) {

        for (var i in d.T) {
            if (i == "0"){
                result[(lang == null) ? "en" : langcodes[lang.toString()]] = TextByTextResourceID(d.T[i]);
            }
            else{
                result[langcodes[i]] = TextByTextResourceID(d.T[i]);
            }
        }

    }
    else {
        result[(lang == null) ? "en" : langcodes[lang.toString()]] = TextByTextResourceID(d.T);
    }

    return result;
}

System.prototype.GetDataTextID = function (data, key, def, content) {
    var d = (key == null) ? data : this.GetDataKey(data, key.split('/'));
    if (d == null || d.T == null) return def;

    if (isNaN(d.T)) {
        var result = null;
        //if (LangType != null) result = d.T[LangType.toString()];
        if (content && lang != null) {
            var ul = lang;
            if (ul != null) result = d.T[ul.toString()];
        }
        if (result == null && session != null) {
            var ul = system.GetDataNode(session.UserData, "Language", null);
            if (ul != null) result = d.T[ul.toString()];
        }
        if (result == null) {
            var cl = system.GetDataNode(this.CustomerData, "DefaultLanguage", null);
            if (cl != null) result = d.T[cl.toString()];
        }
        if (result == null) result = d.T["0"];
        if (result == null) {
            for (var i in d.T) {
                result = d.T[i];
                break;
            }
        }

        if (result == null) return def; else return result;
    }
    else {
        return d.T;
    }
}


System.prototype.GetDataText = function (data, key, def, content) {
    var t = this.GetDataTextID(data, key, null, content);
    if (t == null) return def;
    return TextByTextResourceID(t);
}

System.prototype.GetDataFileID = function (data, key, def, content) {
    var d = (key == null) ? data : this.GetDataKey(data, key.split('/'));
    if (d == null || d.F == null) return def;

    if (isNaN(d.F)) {
        var result = null;
        //if (LangType != null) result = d.F[LangType.toString()];
        if (content && lang != null) {
            var ul = lang;
            if (ul != null) result = d.F[ul.toString()];
        }
        if (result == null && session != null) {
            var ul = system.GetDataNode(session.UserData, "Language", null);
            if (ul != null) result = d.F[ul.toString()];
        }
        if (result == null) {
            var cl = system.GetDataNode(this.CustomerData, "DefaultLanguage", null);
            if (cl != null) result = d.F[cl.toString()];
        }
        if (result == null) result = d.F["0"];
        if (result == null) {
            for (var i in d.F) {
                result = d.F[i];
                break;
            }
        }

        if (result == null) return def; else return result;
    }
    else {
        return d.F;
    }
}

System.prototype.GetDataFile = function (data, key, def, content) {
    var fid = this.GetDataFileID(data, key, null, content);
    if (fid == null) return def;
    return FileByFileResourceID(fid);
}

System.prototype.GetDataFileObject = function (data, key, def,content) {
    var fid = this.GetDataFileID(data, key, null, content);
    if (fid == null) return def;
    return FileObjectByFileResourceID(fid);
}

System.prototype.GetDataKey = function (data, keys) {
    var d = data;
    for (var k in keys) {
        if (d != null && keys[k] != '') d = d[keys[k]];
    }
    return d;
}

System.prototype.SetComponentDataStringValue = function (data, key, def, component, Var) {
    var p = system.GetPropertyType(data.P)[key].P;

    if (p == 164) {
        component[Var] = system.GetDataText(data, key, def, true);
    }
    else if (p == 387) {
        component[Var] = '***';
    }
    else if (p == 168) {
        component[Var] = system.GetDataValue(data, key, def);
    }
    else if (p == 165) {
        var fo = system.GetDataFileObject(data, key, null, true);
        if (fo != null) component.innerHTML = fo.Name;
        else component[Var] = def
    }
    else if (p == 167) {
        var n = system.GetDataNode(data, key, def);
        if (n > 0) {
            system.RequireNodeID(n, component, function (sender, node) {
                sender.innerHTML = node.name;
            }, 1, false, 0);
        }
        else component[Var] = def;
    }
    else {
        component[Var] = def;
    }
}



System.prototype.GetCustomerConfigText = function (key) {
    var data = this.GetCustomerConfigData(key.split('/'));
    return this.GetDataText(data, null, "", false);

}

System.prototype.GetCustomerConfigResource = function (key) {
    var data = this.GetCustomerConfigData(key.split('/'));
    return this.GetDataFile(data, null, null, false);
 
}

System.prototype.GetCustomerConfigValue = function (key) {
    var data = this.GetCustomerConfigData(key.split('/'));
    return this.GetDataValue(data, null, 0);
}
System.prototype.GetCustomerConfigValueNull = function (key) {
    var data = this.GetCustomerConfigData(key.split('/'));
    return this.GetDataValue(data, null, null);
}

System.prototype.GetCustomerConfigData = function (keys) {
    for (var i in this.CustomerConfigData) {
        var d = this.GetDataKey(this.CustomerConfigData[i], keys);
        if (d != null) return d;
    }
    return null;
}

System.prototype.GetPropertyType = function (id) {
    if (this.pts[id] == null) {
        var pt = {};
        this.pts[id] = pt;

        var ci = this.GetKnownNode(id);
        var ext = this.GetDataNode(ci.data, "Extends", 0);

        if (ext != 0) {
            var ci2 = this.GetKnownNode(ext);
            var pt2 = this.GetPropertyType(ci2.id);
            Extend(pt, pt2);
        }
        this.addProperties(pt, ci);
    }

    return this.pts[id];
}

System.prototype.addProperties = function (pt, configitem) {
    for (var i in configitem.data.Properties) {
        var name = this.GetDataText(configitem.data.Properties[i], "Name", '', false);
        if (name != '') {
            pt[name] = configitem.data.Properties[i];
        }
    }
}

System.prototype.doRequest = function (obj, callback, completed, progress, data, authfailed) {
    //count number of requests
    system.requests++;
    var rc = system.requests;
    if (window.console && window.console.log) console.log("request: "+rc);
    if (system.status != null) {
        system.status.innerHTML = '<SMALL>' + system.GetCustomerConfigText("UI/TXT_System_ServiceRequestCount").replace('{0}', system.requests) + '<SMALL>';
    }

    var _this = this;

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (window.console && window.console.log) console.log("reponse: " + rc + " " + xmlhttp.readyState + " " + ((xmlhttp.readyState==4)?xmlhttp.status:"0"));
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            //response arrived
            

            var response = JSON.parse(xmlhttp.responseText);

            if (response.Status != 0 && response.Status != 100) {
                //error
                if (system.failure != null) system.failure(response.Status, response.Message);
            }
            else if (response.Status == 100 && authfailed != null) {
                //authorization failure
                authfailed(response, completed);
            }
            else {
                if (response.Status == 100) alert(system.GetCustomerConfigText("UI/TXT_System_AuthorizationError"));
                if (callback != null) {

                    if (response.Data && response.Data.Cache) {
                        for (var i in response.Data.Cache) {
                            _this.InvalidateCache(i, response.Data.Cache[i]);
                        }
                    }
                    //valid respone
                    callback(response, completed);
                }
            }
        }
    };

    //upload progress
    if (progress != null && xmlhttp.upload) {
        xmlhttp.upload.onprogress = function (ev) {
            if (ev.lengthComputable) progress(ev.loaded * 100 / ev.total);
        }
    }

    //convert request object to json
    param = JSON.stringify(obj);

    //send request object
    xmlhttp.open("POST", "Service.aspx", true);
    if (data == null) data = '';
    xmlhttp.send(param.length.toString() + param + data);
    if (window.console && window.console.log) console.log("submit: " + rc + " " + param);

}

System.prototype.cloneData = function (Data) {
    var ND = JSON.parse(JSON.stringify(Data));
    this.cleanData(ND);
    return ND;
}



System.prototype.cleanData = function (Data) {
    if (Data == null) return;

    if (!isArray(Data)) {
        this.assignLocalID(Data);
    }

    for (var i in Data) {
        if (i != 'T' && i != 'F' && i != 'L' && i != 'V' && i != 'R' && i != 'P' && i != 'N') this.cleanData(Data[i]);
    }
}
System.prototype.assignLocalID = function (Data) {
    Data.L = this.lastNewLocalID--;
    this.waitingIDs[Data.L.toString()] = Data;
}

System.prototype.updateReferences = function(Data, NewIDS){
    if (Data == null) return;
    if (Data.R != null && Data.R<0){
        var t = NewIDS[Data.R.toString()];
        if (t != null){
            Data.R = t;
        }
        else Data.R = 0;
    }
    for (var i in Data) {
        if (i != 'T' && i != 'F' && i != 'L' && i != 'V' && i != 'R' && i != 'P' && i != 'N') this.updateReferences(Data[i], NewIDS);
    }
}


System.prototype.saveData = function (ID, Data, Done) {
    var _this = this;

    system.doRequest({ "RequestType": 13, "SessionGuid": session.SessionGuid, "SubjectID": ID, "NodeData": Data }, function (response, completed) {
        if (response.Status == 0) {
      
            system.HandleResponse(response.Data);
            if (response.Data != null && response.Data.UpdateReferences > 0) {
                _this.updateReferences(Data, response.Data.NewIDS);
            }
            if (response.Data != null && response.Data.NewIDS != null) {
                for (var i in response.Data.NewIDS) {
                    var d = _this.waitingIDs[i];
                    if (d != null) {
                        d.L = response.Data.NewIDS[i];
                    }
                    delete _this.waitingIDs[i];

                }
            }
            Done();
 
        }
    }
    );
}

System.prototype.saveValueData = function (Data, Var, V, Done) {
    if (V == null) {
        delete Data[Var];
    }
    else if (Data[Var] == null) {
        Data[Var] = { "V": V };
        this.assignLocalID(Data[Var]);
    }
    else Data[Var].V = V;
    if (Done != null) Done(true);
}

System.prototype.saveReferenceData = function (Data, Var, Reference, Done) {
    if (Reference == null) {
        delete Data[Var];
    }
    else if (Data[Var] == null) {
        Data[Var] = { "R": Reference };
        this.assignLocalID(Data[Var]);
    }
    else Data[Var].R = Reference;
    if (Done != null) Done(true);
}

System.prototype.saveNodeData = function (Data, Var, Node, Done) {
    if (Node == null) {
        delete Data[Var];
    }
    else if (Data[Var] == null) {
        Data[Var] = { "N": Node };
        this.assignLocalID(Data[Var]);
    }
    else Data[Var].N = Node;
    if (Done != null) Done(true);
}

System.prototype.saveTextData = function (Data, Var, V, Done, Lang) {
    var _this = this;

    if (V == null) {
        if (Lang != null && Lang != -1 && Data[Var] != null && Data[Var].T != null) {
            delete Data[Var].T[Lang.toString()]
        }
        else {
            delete Data[Var];
        }
    }
    else if (Data[Var] == null) {
        if (Lang != null && Lang != -1) {
            Data[Var] = { "T": {} };
            Data[Var].T[Lang.toString()] = V;
        }
        else {
            Data[Var] = { "T": V };
        }
        this.assignLocalID(Data[Var]);
        
    }
    else {
        if (Lang != null && Lang != -1) {
            if (!isNaN(Data[Var].T)) {
                Data[Var].T = { "0": Data[Var].T };
            }
            Data[Var].T[Lang.toString()] = V;
        }
        else {
            Data[Var].T = V;
        }
        
    }
    if (Done != null) Done(true);
}

System.prototype.saveResourceData = function (Data, Var, V, Done, Lang) {
    var _this = this;
    if (V == null) {
        if (Lang != null && Lang != -1 && Data[Var] != null && Data[Var].T != null) {
            delete Data[Var].T[Lang.toString()]
        }
        else {
            delete Data[Var];
        }
    }
    else if (Data[Var] == null) {
        if (Lang != null && Lang != -1) {
            Data[Var] = { "F": {} };
            Data[Var].F[Lang.toString()] = V;
        }
        else {
            Data[Var] = { "F": V };
        }
        this.assignLocalID(Data[Var]);
        
    }
    else {
        if (Lang != null && Lang != -1) {
            if (!isNaN(Data[Var].F)) {
                Data[Var].F = { "0": Data[Var].F };
            }
            Data[Var].F[Lang.toString()] = V;
        }
        else {
            Data[Var].F = V
        }
    }
    if (Done != null) Done(true);
}

System.prototype.cropResource = function (ResourceID, Params, Done, FileType) {
    system.doRequest({ "RequestType": 401, "SessionGuid": session.SessionGuid, "ResourceID": ResourceID, "Width": Params[0], "Height": Params[1], "OffsetLeft": Params[2], "OffsetTop": Params[3], "Scale": Params[4], "Angle": Params[5], "FileType" : FileType }, function (response, completed) {
        AddResources(response.Data.Files);
        if (Done != null) Done(response.Data.NewResourceID);
    });
}

System.prototype.createText = function (Text, Done, Object) {
    system.doRequest({ "RequestType": 22, "SessionGuid": session.SessionGuid, "Text": Text }, function (response, completed) {
        AddTexts(response.Data.Texts);
        if (Done != null) Done(response.Data.NewID, Object);
    });
}
System.prototype.createResource = function (BinData, FileName, FileSize, Done, Progress) {
    system.doRequest({ "RequestType": 21, "SessionGuid": session.SessionGuid, "ResourceName": FileName, "ResourceSize": FileSize }, function (response, completed) {
        AddResources(response.Data.Files);
        if (Done != null) Done(response.Data.NewID);
    }, null, Progress, BinData);
}


var system = new System()
var texts = new Object();
var resources = new Object();

function AddTexts(t) {
    for (var i in t) {
        texts[i] = t[i];
    }
}

var apivarpattern = /\{([a-zA-Z0-9]+)(\.[a-zA-Z0-9]+)*\}/gm;
var skinvarpattern = /\$([a-zA-Z0-9]+)\$/gm;
var search = [
    '{ecampus.student.firstname}',
    '{ecampus.student.midname}',
    '{ecampus.student.lastname}',
    '{ecampus.student.gender}',
    '{ecampus.student.shortdesc}',
    '{ecampus.student.orgname}',
    '{ecampus.student.orgshortdesc}',
    '{ecampus.student.funcname}',
    '{ecampus.student.funcshortdesc}',
    '{ecampus.student.user1}',
    '{ecampus.student.user2}',
    '{ecampus.student.user3}',
    '{ecampus.student.user4}',
    '{ecampus.student.user5}',
    '{ecampus.student.user6}',
    '{ecampus.student.user7}',
    '{ecampus.student.user8}',
    '{ecampus.student.user9}',
    '{ecampus.student.user10}',
    '{ecampus.student.language}'
];

var textreplace = {};

var textLocked = false;
var skinvarmode = null;
function TextByTextResourceID(TextResourceID) {

    var t = texts[TextResourceID.toString()];
    if (!textLocked) {
        if (apivarpattern.test(t)) {
            for (var i in search) {
                while (t.indexOf(search[i]) != -1) {
                    var r = LMSGetValue(search[i].substr(1, search[i].length - 2));
                    if (r != null) t = t.replace(search[i], r);
                    else break;
                }
            }
            for (var i in textreplace) {
                var rep = "{" + i + "}";
                while (t.indexOf(rep) != -1) {
                    var r = textreplace[i];
                    if (r != null) t = t.replace(rep, r);
                    else break;
                }
            }
        }
    }
    if (skinvarmode != null) {
        if (skinvarpattern.test(t)) {
            for (var i in skinvarmode) {
                while (t.indexOf(skinvarmode[i].Name) != -1) {
                    var r = skinvarmode[i].Value;
                    if (!skinvarpattern.test(r)) t = t.replace(skinvarmode[i].Name, r);
                    else break;
                }
            }
        }
    }
    return t;
}

function AddResources(r) {
    for (var i in r) {
        resources[i] = r[i];
    }
}

var forceonline = false;
function FileByFileResourceID(FileResourceID) {
    if (FileResourceID == null) return;
    if (window.data && !forceonline) {
        return "resources/" + resources[FileResourceID.toString()].GUID + resources[FileResourceID.toString()].Ext;
    }
    else {
        return "Resource.aspx?guid=" + resources[FileResourceID.toString()].GUID;
    }
}
function FileObjectByFileResourceID(FileResourceID) {
    if (FileResourceID == null) return null;
    return resources[FileResourceID.toString()];
}


//
//contentlink
//
function ContentLink(Owner, DataNode, Done, Auth, Authorization) {
    var _this = this;
    this.Done = Done;
    this.loading = 0;
    this.Owner = Owner;
    this.DataNode = DataNode;
    this.Auth = Auth;
    if (this.Auth != null) this.Auth = this.Auth.data;
    this.Authorization = Authorization;

    this.CloseQuery = function (Done) {
        if (Done != null) Done();
    }

    this.contentLayer = Owner;
    this.contentLayer.innerHTML = '';

    this.title = html.createElement(this.contentLayer, "H1");

    this.loadContentLinks = function () {
        system.doRequest({ "RequestType": 10, "SessionGuid": session.SessionGuid, "SubjectID": _this.DataNode }, function (response, completed) {
            _this.ContentLinks = response.Data.ContentLinks;
            _this.show();
        });
    }

    this.show = function () {
        html.createElement(_this.contentLayer, "H2").innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_CL_ExternalCustomers");

        _this.contentLinkCustomerLayer = html.createElement(_this.contentLayer, "DIV");
        _this.contentLinkCustomerLayer.style.backgroundColor = '#eef0f2';
        html.addGradient(_this.contentLinkCustomerLayer, 'top', 'white', '#eef0f2');
        _this.contentLinkCustomerLayer.style.boxShadow = '1px 1px 4px #888';
        _this.contentLinkCustomerLayer.style.padding = '5px';
        _this.contentLinkCustomerLayer.style.margin = '5px';
        if (system.GetDataValue(_this.Auth, "EditAuthorizations", 0) == 1) {
            _this.addContentLinkCustomerButton = html.createElement(_this.contentLayer, "INPUT");
            _this.addContentLinkCustomerButton.type = "BUTTON";
            _this.addContentLinkCustomerButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Edit_Add");
            _this.addContentLinkCustomerButton.onclick = function () {

                var p1 = session.Portal.ShowPopup(this, 500, 500, true, 9);

                var _self = p1;
                _self.selectedTarget = null;
                _self.selected = null;


                _self.controls = html.createElement(_self.contents, "DIV");
            
                var l = html.createElement(_self.controls, "DIV");
                l.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_General_Name");
                _self.txtName = html.createElement(_self.controls, "INPUT");

                html.createElement(_self.controls, "BR");

                var l = html.createElement(_self.controls, "DIV");
                l.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_General_Domain");
                _self.txtDomain = html.createElement(_self.controls, "TEXTAREA");
                _self.txtDomain.style.width = '100%';
                _self.txtDomain.style.height = '200px';

                var l = html.createElement(_self.controls, "DIV");
                l.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_General_Info");
                _self.txtInfo = html.createElement(_self.controls, "TEXTAREA");
                _self.txtInfo.style.width = '100%';
                _self.txtInfo.style.height = '200px';

                var l = html.createElement(_self.controls, "DIV");
                l.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_General_ErrorMessage")
                _self.txtErrorMessage = html.createElement(_self.controls, "TEXTAREA");
                _self.txtErrorMessage.style.width = '100%';
                _self.txtErrorMessage.style.height = '200px';
               

                _self.Ok = function () {
                    system.doRequest({
                        "RequestType": 501,
                        "SessionGuid": session.SessionGuid,
                        "SubjectID": _this.DataNode,
                        "Active": 1,
                        "CLPCustomerID": -1,
                        "Name": _self.txtName.value,
                        "Domain": _self.txtDomain.value,
                        "Info": _self.txtInfo.value,
                        "ErrorMessage": _self.txtErrorMessage.value
                    }, function (response, completed) {

                        _this.ContentLinks = response.Data.ContentLinks;
                        _this.ShowContentLinks();
                    });
                }

            }
        }

        html.createElement(_this.contentLayer, "H2").innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_CL_ExternalAccess");

        _this.contentLinkLayer = html.createElement(_this.contentLayer, "DIV");
        _this.contentLinkLayer.style.backgroundColor = '#eef0f2';
        html.addGradient(_this.contentLinkLayer, 'top', 'white', '#eef0f2');
        _this.contentLinkLayer.style.boxShadow = '1px 1px 4px #888';
        _this.contentLinkLayer.style.padding = '5px';
        _this.contentLinkLayer.style.margin = '5px';
        if (system.GetDataValue(_this.Auth, "EditAuthorizations", 0) == 1) {
            _this.addContentLinkEntryButton = html.createElement(_this.contentLayer, "INPUT");
            _this.addContentLinkEntryButton.type = "BUTTON";
            _this.addContentLinkEntryButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Edit_Add");
            _this.addContentLinkEntryButton.onclick = function () {

                var p1 = session.Portal.ShowPopup(this, 550, 200, true, 9);
                
                var _self = p1;
                _self.selectedTarget = null;
                _self.selected = null;


                _self.controls = html.createElement(_self.contents, "DIV");

                var l = html.createElement(_self.controls, "DIV");
                l.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_General_NodeID");
                _self.txtNodeID = html.createElement(_self.controls, "INPUT");
                _self.txtNodeID.readOnly = true;
                _self.txtNodeID.style.width = '350px';

                _self.SelectReferenceNode = html.createElement(_self.controls, "INPUT");
                _self.SelectReferenceNode.type = "BUTTON";
                _self.SelectReferenceNode.value = system.GetCustomerConfigText("UI/Portal/TXT_Data_SelectNode");
                _self.SelectReferenceNode.onclick = function () {
                    var popup = session.Portal.ShowPopup(_self, 300, 400, true, 9);
                    popup.tree = new NodeTree(popup.contents, true);
                    popup.ok.disabled = true;

                    // popup.nodetype = _this.SelectedDataField.NodeType;
                    popup.tree.Jump(_this.DataNode);

                    popup.tree.OnSelect = function (selected) {
                        popup.selected = selected;
                        if (selected.Node != null) {
                            popup.ok.disabled = selected.Node.type != 149 && selected.Node.type != 153 && selected.Node.type != 157;
                        }
                        else popup.ok.disabled = true;
                    }
                    popup.Ok = function () {
                        if (popup.selected != null) {
                            _self.selectedTarget = popup.selected;
                            _self.txtNodeID.value = _self.selectedTarget.Node.name + " (" + _self.selectedTarget.NodeID + ")";
                        }
                    }
                }
                html.createElement(_self.controls, "BR");

                _self.selectType = html.createElement(_self.controls, "SELECT");

                var option = html.createElement(_self.selectType, "OPTION");
                option.text = "CLP";
                option.value = 0;
                var option = html.createElement(_self.selectType, "OPTION");
                option.text = "TinCan";
                option.value = 1;

                _self.Ok = function () {
                    if (_self.selectedTarget == null) {
                        return;
                    }
                    system.doRequest({
                        "RequestType": 500,
                        "SessionGuid": session.SessionGuid,
                        "SubjectID": _this.DataNode,
                        "CLPID": -1,
                        "Active": 1,
                        "CLPCustomerID": _this.SelectedCustomer.ContentLink.CLPCustomerID,
                        "NodeID": _self.selectedTarget.NodeID,
                        "Type": _self.selectType.value
                    }, function (response, completed) {
                        _self.txtNodeID.value = '';
                        _this.ContentLinks = response.Data.ContentLinks;
                        _this.ShowContentLinks();
                    });
                }


            }
        }

        html.createElement(_this.contentLayer, "H2").innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_General_Use");

        _this.contentLinkUseLayer = html.createElement(_this.contentLayer, "DIV");
        _this.contentLinkUseLayer.style.backgroundColor = '#eef0f2';
        html.addGradient(_this.contentLinkUseLayer, 'top', 'white', '#eef0f2');
        _this.contentLinkUseLayer.style.boxShadow = '1px 1px 4px #888';
        _this.contentLinkUseLayer.style.padding = '5px';
        _this.contentLinkUseLayer.style.margin = '5px';


        _this.ShowContentLinks();


    }

    this.ShowContentLinks = function () {
        this.contentLinkCustomerLayer.innerHTML = '';
        this.contentLinkLayer.innerHTML = '';
        this.contentLinkUseLayer.innerHTML = '';
        var cid = -1;
        if (this.SelectedCustomer != null) {
            cid = this.SelectedCustomer.ContentLink.CLPCustomerID;
            this.SelectedCustomer = null;
        }
        new ContentLinkCustomerEntry(_this, null, system.GetDataValue(_this.Auth, "EditAuthorizations", 0) == 1);
        for (var a in _this.ContentLinks) {
            var i = new ContentLinkCustomerEntry(_this, _this.ContentLinks[a], system.GetDataValue(_this.Auth, "EditAuthorizations", 0) == 1);
            if (this.SelectedCustomer == null) this.ShowCustomer(i);
            if (i.ContentLink.CLPCustomerID == cid) this.ShowCustomer(i);

        }
    }

    this.ShowCustomer = function (Item) {
        var Data = Item.ContentLink;
        this.contentLinkLayer.innerHTML = '';
        this.contentLinkUseLayer.innerHTML = '';
        var cid = -1;
        if (this.SelectedEntry != null) {
            cid = this.SelectedEntry.ContentLink.CLPID;
            this.SelectedEntry = null;

        }
        new ContentLinkEntry(_this, null,  system.GetDataValue(_this.Auth, "EditAuthorizations", 0) == 1);
        for (var a in Data.Links) {
            var i = new ContentLinkEntry(_this, Data.Links[a],system.GetDataValue(_this.Auth, "EditAuthorizations", 0) == 1);
            if (this.SelectedEntry == null) this.ShowUse(i);
            if (i.ContentLink.CLPID == cid) this.ShowUse(i);
        }
        if (this.SelectedCustomer != null) {
            this.SelectedCustomer.panel.style.backgroundColor = '';
            this.SelectedCustomer.panel.style.color = '';
        }
        this.SelectedCustomer = Item;
        if (this.SelectedCustomer != null) {
            this.SelectedCustomer.panel.style.backgroundColor = '#383838';
            this.SelectedCustomer.panel.style.color = 'white';
        }
    }

    this.ShowUse = function (Item) {
        var Data = Item.ContentLink;
        this.contentLinkUseLayer.innerHTML = '';
        new ContentLinkUseEntry(_this, null, system.GetDataValue(_this.Auth, "EditAuthorizations", 0) == 1);
        for (var a in Data.Use) {
            new ContentLinkUseEntry(_this, Data.Use[a], system.GetDataValue(_this.Auth, "EditAuthorizations", 0) == 1);
        }
        if (this.SelectedEntry != null) {
            this.SelectedEntry.panel.style.backgroundColor = '';
            this.SelectedEntry.panel.style.color = '';
        }
        this.SelectedEntry = Item;
        if (this.SelectedEntry != null) {
            this.SelectedEntry.panel.style.backgroundColor = '#383838';
            this.SelectedEntry.panel.style.color = 'white';
        }
    }

    system.RequireNodeID(this.DataNode, this, function (sender, node) {
        _this.loadContentLinks();
        _this.title.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_CL_Title").replace('{0}', node.name);
    },1,false,0);
}



function ContentLinkCustomerEntry(Owner, ContentLink, Edit) {
    this.Owner = Owner;
    this.ContentLink = ContentLink;
    this.panel = html.createElement(Owner.contentLinkCustomerLayer, "DIV");
    this.panel.style.display = 'table-row';
    if (ContentLink == null) {
        this.panel.style.backgroundColor = "#D6D6D6";
        this.panel.style.fontWeight = "bold";
    }
    this.open = false;

    var _this = this;



    this.name = html.createElement(this.panel, 'SPAN');
    this.name.innerHTML = (this.ContentLink == null) ? system.GetCustomerConfigText("UI/Portal/TXT_General_Name") : this.ContentLink.Name;
    this.name.style.display = 'table-cell';
    this.name.style.padding = '5px';



    this.domain = html.createElement(this.panel, 'SPAN');
    this.domain.innerHTML = (this.ContentLink == null) ? system.GetCustomerConfigText("UI/Portal/TXT_General_Domain") : this.ContentLink.CLPDomain.replace(/,/g, "<br/>");
    this.domain.style.display = 'table-cell';
    this.domain.style.padding = '5px';


    this.info = html.createElement(this.panel, 'SPAN');
    this.info.innerHTML = (this.ContentLink == null) ? system.GetCustomerConfigText("UI/Portal/TXT_General_Info") : this.ContentLink.Info;
    this.info.style.display = 'table-cell';
    this.info.style.padding = '5px';


    this.controls = html.createElement(this.panel, 'SPAN');
    this.controls.style.display = 'table-cell';
    this.controls.style.padding = '5px';
    if (ContentLink != null) {
        if (Edit) {
            this.editButton = html.createElement(this.controls, "INPUT");
            this.editButton.type = 'button';
            this.editButton.value = "Edit";
            this.editButton.disabled = !(Edit);
            this.editButton.onclick = function () {
                var p1 = session.Portal.ShowPopup(this, 500, 500, true, 9);

                var _self = p1;
                _self.selectedTarget = null;
                _self.selected = null;


                _self.controls = html.createElement(_self.contents, "DIV");

                var l = html.createElement(_self.controls, "DIV");
                l.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_General_Name");
                _self.txtName = html.createElement(_self.controls, "INPUT");
                _self.txtName.value = _this.ContentLink.Name;

                html.createElement(_self.controls, "BR");

                var l = html.createElement(_self.controls, "DIV");
                l.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_General_Domain");
                _self.txtDomain = html.createElement(_self.controls, "TEXTAREA");
                _self.txtDomain.style.width = '100%';
                _self.txtDomain.style.height = '200px';
                _self.txtDomain.value = _this.ContentLink.CLPDomain.replace(/,/g, "\n");

                var l = html.createElement(_self.controls, "DIV");
                l.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_General_Info");
                _self.txtInfo = html.createElement(_self.controls, "TEXTAREA");
                _self.txtInfo.style.width = '100%';
                _self.txtInfo.style.height = '200px';
                _self.txtInfo.value = _this.ContentLink.Info;

                var l = html.createElement(_self.controls, "DIV");
                l.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_General_ErrorMessage");
                _self.txtErrorMessage = html.createElement(_self.controls, "TEXTAREA");
                _self.txtErrorMessage.style.width = '100%';
                _self.txtErrorMessage.style.height = '200px';
                _self.txtErrorMessage.value = _this.ContentLink.ErrorMessage;


                _self.Ok = function () {
                    system.doRequest({
                        "RequestType": 501,
                        "SessionGuid": session.SessionGuid,
                        "SubjectID": _this.Owner.DataNode,
                        "Active": 1,
                        "CLPCustomerID": _this.ContentLink.CLPCustomerID,
                        "Name": _self.txtName.value,
                        "Domain": _self.txtDomain.value,
                        "Info": _self.txtInfo.value,
                        "ErrorMessage": _self.txtErrorMessage.value
                    }, function (response, completed) {

                        _this.Owner.ContentLinks = response.Data.ContentLinks;
                        _this.Owner.ShowContentLinks();
                    });
                }
            }

            this.deleteButton = html.createElement(this.controls, "INPUT");
            this.deleteButton.type = 'button';
            this.deleteButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Edit_Delete");
            this.deleteButton.disabled = !(Edit);
            this.deleteButton.onclick = function () {
                system.doRequest({
                    "RequestType": 501,
                    "SessionGuid": session.SessionGuid,
                    "SubjectID": _this.Owner.DataNode,
                    "CLPCustomerID": _this.ContentLink.CLPCustomerID,
                    "Active": 0

                }, function (response, completed) {
                    _this.Owner.ContentLinks = response.Data.ContentLinks;
                    _this.Owner.ShowContentLinks();
                });
            }
        }

        this.panel.onclick = function () {
            _this.Owner.ShowCustomer(_this)
        }
    }

 
}


function ContentLinkEntry(Owner, ContentLink, Edit) {
    this.Owner = Owner;
    this.ContentLink = ContentLink;
    this.panel = html.createElement(Owner.contentLinkLayer, "DIV");
    this.panel.style.display = 'table-row';
    if (ContentLink == null) {
        this.panel.style.backgroundColor = "#D6D6D6";
        this.panel.style.fontWeight = "bold";
    }
    this.open = false;

    var _this = this;

  
    this.name = html.createElement(this.panel, 'SPAN');
    this.name.innerHTML = (this.ContentLink == null) ? system.GetCustomerConfigText("UI/Portal/TXT_General_Name") : (this.ContentLink.NodeName + " (" + this.ContentLink.NodeID + ")");
    this.name.style.display = 'table-cell';
    this.name.style.padding = '5px';

    if (ContentLink != null) {
        this.c = 0;
        for (var a in this.ContentLink.Use) {
            var u = this.ContentLink.Use[a];
            this.c += u.Users;
        }
    }

    this.count = html.createElement(this.panel, 'SPAN');
    this.count.innerHTML = (this.ContentLink == null) ? system.GetCustomerConfigText("UI/Portal/TXT_General_Use") : this.c.toString();
    this.count.style.display = 'table-cell';
    this.count.style.padding = '5px';

    var ex = html.createElement(this.panel, 'SPAN');
    ex.innerHTML = (this.ContentLink == null) ? system.GetCustomerConfigText("UI/Portal/TXT_General_LastExport") : this.ContentLink.Exported
    ex.style.display = 'table-cell';
    ex.style.padding = '5px';

    this.controls = html.createElement(this.panel, 'SPAN');
    this.controls.style.display = 'table-cell';
    this.controls.style.padding = '5px';

    if (this.ContentLink != null) {
        if (this.ContentLink.CLPType == 0) {
            this.startButton = html.createElement(this.controls, "INPUT");
            this.startButton.type = 'button';
            this.startButton.value = system.GetCustomerConfigText("UI/Export/TXT_Export");
            this.startButton.onclick = function () {
                system.doRequest({ "RequestType": 303, "SessionGuid": session.SessionGuid, "SubjectID": _this.ContentLink.NodeID, "ExportType": 3, "CLPID": _this.ContentLink.CLPID }, function (response, completed) {
                    session.Portal.Controls.ShowExports();
                });
            }
        }
        else if (this.ContentLink.CLPType == 1) {
            var tc = html.createElement(this.controls, 'SPAN');
            tc.innerHTML = 'TinCan';
        }


        if (Edit) {
            this.deleteButton = html.createElement(this.controls, "INPUT");
            this.deleteButton.type = 'button';
            this.deleteButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Edit_Delete");
            this.deleteButton.disabled = !(Edit);
            this.deleteButton.onclick = function () {
                system.doRequest({
                    "RequestType": 500,
                    "SessionGuid": session.SessionGuid,
                    "SubjectID": _this.Owner.DataNode,
                    "CLPID": _this.ContentLink.CLPID,
                    "CLPCustomerID": _this.Owner.SelectedCustomer.ContentLink.CLPCustomerID,
                    "Active": 0

                }, function (response, completed) {
                    _this.Owner.ContentLinks = response.Data.ContentLinks;
                    _this.Owner.ShowContentLinks();
                });
            }
        }


        this.panel.onclick = function () {
            _this.Owner.ShowUse(_this)
        }
    }
}


function ContentLinkUseEntry(Owner, ContentLink, Edit) {
    this.Owner = Owner;
    this.ContentLink = ContentLink;
    this.panel = html.createElement(Owner.contentLinkUseLayer, "DIV");
    this.panel.style.display = 'table-row';
    if (ContentLink == null) {
        this.panel.style.backgroundColor = "#D6D6D6";
        this.panel.style.fontWeight = "bold";
    }
    this.open = false;

    var _this = this;


    this.Year = html.createElement(this.panel, 'SPAN');
    this.Year.innerHTML = (this.ContentLink == null) ? system.GetCustomerConfigText("UI/Portal/TXT_General_Year") : this.ContentLink.Year;
    this.Year.style.display = 'table-cell';
    this.Year.style.padding = '5px';

    this.Month = html.createElement(this.panel, 'SPAN');
    this.Month.innerHTML = (this.ContentLink == null) ? system.GetCustomerConfigText("UI/Portal/TXT_General_Month") : this.ContentLink.Month;
    this.Month.style.display = 'table-cell';
    this.Month.style.padding = '5px';

    this.Users = html.createElement(this.panel, 'SPAN');
    this.Users.innerHTML = (this.ContentLink == null) ? system.GetCustomerConfigText("UI/Portal/TXT_General_Starts") : this.ContentLink.Users;
    this.Users.style.display = 'table-cell';
    this.Users.style.padding = '5px';

    this.DistinctUsers = html.createElement(this.panel, 'SPAN');
    this.DistinctUsers.innerHTML = (this.ContentLink == null) ? system.GetCustomerConfigText("UI/Portal/TXT_General_UniqueUsers") : this.ContentLink.DistinctUsers;
    this.DistinctUsers.display = 'table-cell';
    this.DistinctUsers.style.padding = '5px';



}





//
//data
//
function Data(Owner, DataNode, Done, Edit) {
    var _this = this;
    this.Done = Done;
    this.Owner = Owner; 
    this.DataNode = DataNode;
    this.Edit = Edit;

    this.contentLayer = Owner;
    this.contentLayer.innerHTML = '';

    this.title = html.createElement(this.contentLayer, "H1");

    this.TopControls = html.createElement(this.contentLayer, "DIV");
    this.DataNodeTree = html.createElement(this.contentLayer, "DIV");
    this.DataControls = html.createElement(this.contentLayer, "DIV");
    this.DataInserters = html.createElement(this.contentLayer, "DIV");
    this.DataNodeTree.style.overflow = 'auto';
    this.DataNodeTree.style.backgroundColor = '#eef0f2';
    html.addGradient(this.DataNodeTree, 'top', 'white', '#eef0f2');
    this.DataNodeTree.style.boxShadow = '1px 1px 4px #888';
    this.DataNodeTree.style.padding = '5px';
    this.DataNodeEdit = html.createElement(this.contentLayer, "DIV");
    this.DataNodeEdit.style.verticalAlign = 'top';
    this.DataNodeEdit.style.overflow = 'auto';

    this.EditComponent = new GenericDataEditComponent(Edit, this.TopControls, this.TopControls, null, this.DataNodeTree, true, this.DataControls, this.DataNodeEdit, this.DataInserters, this);

    this.CloseQuery = function (D) {
        _this.EditComponent.CloseQuery(
        function () {
            if (!_this.Done(D)) {
                D();
            }
        }
        );
    }

    system.RequireNodeID(this.DataNode, this, function (sender, node) {
        _this.title.innerHTML = (_this.Edit ? system.GetCustomerConfigText("UI/Portal/TXT_Edit_Title") : system.GetCustomerConfigText("UI/Portal/TXT_View_Title")).replace('{0}', node.name);
        _this.EditComponent.LoadData(_this.DataNode, node.data, node.type);
    }, 3, false, 0);

    var _this = this;
    addEvent(window, 'resize',
            function () {
                _this.Resize();
            });
    this.Resize();
}

Data.prototype.Resize = function () {

    html.position(this.title, 10, 10, null, null, null, null);
    html.position(this.TopControls, 10, this.title.offsetHeight + 40, null, null, 350, null);
    html.position(this.DataControls, 10, null, null, this.DataInserters.offsetHeight+10, 350, null);
    html.position(this.DataInserters, 10, null, null, 10, 350, null);
    html.position(this.DataNodeTree, 10, this.title.offsetHeight + 40 + this.TopControls.offsetHeight+10, null, this.DataInserters.offsetHeight + this.DataControls.offsetHeight+20, 350, null);
    html.position(this.DataNodeEdit, 400, this.title.offsetHeight + 40, 10, 10, null, null);
}

function PendingChanges(Done, Editor) {
    this.Done = Done;
    this.Editor = Editor;
    this.jobs = 1;
    this.done = 0;
    this.previewUpdates = [];
        
}
PendingChanges.prototype.OneDone = function () {
    this.done++;
    if (window.console && window.console.log) console.log("Jobs: "+this.jobs+", Done: "+this.done);
    if (this.done == this.jobs) {

        
        for (var i in this.previewUpdates) {
            this.Editor.PreviewUpdate(this.previewUpdates[i]);
        }
        if (this.Done != null) this.Done();
    }
}


PendingChanges.prototype.AddJob = function(){
    this.jobs++;
}

function GenericDataEditComponent(Edit, DataNodeSave, DataNodeApply, DataBreadCrums, DataNodeTree, ShowTreeRoot, DataControls, DataNodeEdit, DataInserters, Owner) {
    this.Edit = Edit;
    this.Owner = Owner;
    this.SelectedNode = null;
    this.DataNodeTree = DataNodeTree; 
    this.DataControls = DataControls;
    this.DataNodeEdit = DataNodeEdit;
    this.DataInserters = DataInserters;
    this.DataNodeSave = DataNodeSave;
    this.DataNodeApply = DataNodeApply;
    this.DataBreadCrums = DataBreadCrums;
    this.ShowTreeRoot = ShowTreeRoot;
    CurrentEditor = this;
}

GenericDataEditComponent.prototype.FindByEditParents = function (EditParents) {
    if (this.RootNode == null) return;

    

    if (this.SelectedNode != null) {
        var s = this.SelectedNode;
        if (s.Type == "Array") s = s.Parent;
        if (s.DataOrig == EditParents[EditParents.length - 1].Data) this.RootNode;
    }

    var cc = [this.RootNode];
    return this.findByEditParentsHelper(EditParents, cc, 0);
}

GenericDataEditComponent.prototype.findByEditParentsHelper = function (EditParents, ChildNodes, i) {
    var d = EditParents[i].Data;

    for (var j in ChildNodes) {
        var c = ChildNodes[j];

        if (c.DataOrig == d) {
            if (i + 1 == EditParents.length) {
                //c.Select();
                return c;
            }
            else {
                if (!c.childrenLoaded) c.LoadChildren();
                for (var k in c.Children) {
                    var c2 = c.Children[k];
                    if (c2.Type == "Array") {
                        if (!c2.childrenLoaded) c2.LoadChildren();
                        var ec = this.findByEditParentsHelper(EditParents, c2.Children, i + 1);
                        if (ec != null) {
                            c.Open();
                            c2.Open();
                            return ec;
                        }
                    }
                }
            }
        }


    }
    return null;
}

GenericDataEditComponent.prototype.CloseQuery = function (D) {
    if (this.Edit && this.saveButton.disabled == false) {
        var popup = session.Portal.ShowPopup(this, 400, 100, true, 14);
        html.createText(popup.contents, null, system.GetCustomerConfigText("UI/Portal/TXT_General_SaveChanges"));
        var _this = this;
        popup.Yes = function () {
            //lang = null;
            _this.save(D);

        }
        popup.No = function () {
            if (window.console && window.console.log) console.log("cancel");
            _this.cancel();
            //lang = null;
            system.KnownIDS[_this.ID.toString()].RefreshKnown(D, function (sender) {
                if (window.console && window.console.log) console.log("afterrefreshknown");
                sender();
            });
        }
    }
    else {
        //lang = null;
        D();
    }
}

GenericDataEditComponent.prototype.PendingChange = function () {
    if (this.Edit){
        this.saveButton.disabled = false;
        this.cancelButton.disabled = false;
        this.applyButton.disabled = false;
    }
}

GenericDataEditComponent.prototype.WYSIWYGUpdate = function (Control, ReloadChildren, ReloadContent) {
    if (this.Edit) {
        this.saveButton.disabled = false;

        var editParents = [];
        this.WYSIWYGEditor.findEditParents(editParents, Control);
        var ec = this.FindByEditParents(editParents);
        if (ec != null) {
            if (ReloadChildren) {
                if (ec.Type == "Complex") {
                    if (!ec.childrenLoaded) ec.LoadChildren();
                    for (var i in ec.Children) {
                        if (ec.Children[i].Type == "Array") {
                            ec.Children[i].Reset();
                            ec.Children[i].LoadChildren();
                        }
                    }
                }
                else {
                    ec.Reset();
                    ec.LoadChildren();
                }
            }
            if (ReloadContent) {
                this.Select(ec);
            }
        }
    }
}


GenericDataEditComponent.prototype.LoadData = function (ID, Data, NodeType) {


    var _this = this;
    this.DataData = Data;
    this.ID = ID;

    var ci = system.GetKnownNodeData(NodeType);

    if (ci != null) {
        var rpt = system.GetDataNode(ci, "RootPropertyType", 0);
        if (!_this.DataData.P) _this.DataData.P = rpt;
        _this.Def = system.GetPropertyType(rpt);
        if (_this.Def == null) {
            return;
        }
    }
    else {
        return;
    }


    if (this.Edit) {
        this.saveButton = html.createElement(this.DataNodeSave, "INPUT");
        this.saveButton.type = 'button';
        this.saveButton.value = system.GetCustomerConfigText("UI/Portal/TXT_General_Save");
        this.saveButton.disabled = true;
        this.saveButton.onclick = function () {
            _this.save();
        }

        this.cancelButton = html.createElement(this.DataNodeApply, "INPUT");
        this.cancelButton.type = 'button';
        this.cancelButton.value = system.GetCustomerConfigText("UI/Portal/TXT_General_Cancel");
        this.cancelButton.disabled = true;
        this.cancelButton.onclick = function () {
            _this.cancel();
        }


        this.applyButton = html.createElement(this.DataNodeApply, "INPUT");
        this.applyButton.type = 'button';
        this.applyButton.value = system.GetCustomerConfigText("UI/Portal/TXT_General_Apply");
        this.applyButton.disabled = true;
        this.applyButton.onclick = function () {
            _this.apply();
        }
    }

    this.editLanguage = html.createElement(this.DataNodeApply, "SELECT");
    var prefLang = 0;
    prefLang = system.GetDataNode(_this.DataData, "DefaultLanguage", prefLang);
    if (prefLang == 0) prefLang = system.GetDataNode(session.UserData, "Language", prefLang);
    if (prefLang == 0) prefLang = system.GetDataNode(system.CustomerData, "DefaultLanguage", prefLang);
    var languages = system.KnownNodesByType(453);
    for (var i in languages) {
        var l = languages[i];
        var option = html.createElement(this.editLanguage, "OPTION");
        option.text = system.GetDataText(l.data, "FullName", l.name, false);
        option.value = l.id.toString();
    }
    var option = html.createElement(this.editLanguage, "OPTION");
    option.text = system.GetCustomerConfigText("UI/Portal/TXT_General_Default");
    option.value = '0';
    var option = html.createElement(this.editLanguage, "OPTION");
    option.text = system.GetCustomerConfigText("UI/Portal/TXT_General_All");
    option.value = '-1';
    this.editLanguage.onchange = function () {
        lang = ExtractNumber(_this.editLanguage.value);
        _this.RootNode.ChangeLanguage();
        if (_this.WYSIWYGEditor != null) {
            _this.WYSIWYGEditor.ChangeLanguage();
        }
        _this.Select(_this.SelectedNode);
    };
    this.editLanguage.value = prefLang.toString();
    lang = ExtractNumber(_this.editLanguage.value);


    this.DataFieldContainer = new DataFieldContainer(this.DataNodeEdit, this.Edit);


    if (this.Edit) {


        this.AddButtons = {};
        this.HideInserters = function () {
            for (var i in this.AddButtons) {
                if (this.WYSIWYGEditor != null) {
                    this.AddButtons[i].Hide();
                }
                else {
                    this.AddButtons[i].style.display = 'none';
                }
            }
        }
        this.ShowInserter = function (propertytype, clickable, parentType) {
            if (this.AddButtons[propertytype] == null) {
                var an = system.GetKnownNodeData(propertytype)
                if (an == null) return;
                var ant = system.GetDataText(an, "Name", '', false);
                var f = function () {
                    var d = { "P": propertytype
                    };
                    _this.SelectedNode.Insert(d, null);
                }

                if (this.WYSIWYGEditor != null) {
                    this.AddButtons[propertytype] = this.WYSIWYGEditor.CreateInserter(propertytype, ant, f, system.GetDataValue(an, "ToolboxLevel", 1));
                }
                else {

                    var addButton = html.createElement(this.DataInserters, "INPUT");
                    addButton.type = "BUTTON";
                    addButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Edit_AddType").replace('{0}', ant);
                    addButton.style.display = 'none';
                    addButton.onclick = f;
                    this.AddButtons[propertytype] = addButton;
                }
            }
            if (this.WYSIWYGEditor != null) {
                this.AddButtons[propertytype].Show(clickable, parentType);
            }
            else {
                this.AddButtons[propertytype].style.display = '';
            }

        }

        this.upButton = html.createElement(this.DataControls, "INPUT");
        this.upButton.type = "BUTTON";
        this.upButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Edit_MoveUp");
        this.upButton.onclick = function () {
            _this.SelectedNode.Parent.Move(_this.SelectedNode, -1);
        }
        this.downButton = html.createElement(this.DataControls, "INPUT");
        this.downButton.type = "BUTTON";
        this.downButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Edit_MoveDown");
        this.downButton.onclick = function () {
            _this.SelectedNode.Parent.Move(_this.SelectedNode, 1);
        }

        this.deleteButton = html.createElement(this.DataControls, "INPUT");
        this.deleteButton.type = "BUTTON";
        this.deleteButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Edit_Delete");
        this.deleteButton.onclick = function () {
            _this.SelectedNode.Parent.Delete(_this.SelectedNode);
        }
    }


    this.copyButton = html.createElement(this.DataControls, "INPUT");
    this.copyButton.type = 'button';
    this.copyButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Edit_Copy");
    this.copyButton.onclick = function () {
        if (_this.SelectedNode != null) {
            html.ClipBoardType = _this.SelectedNode.Data.P;
            html.ClipBoardData = _this.SelectedNode.Data;
            _this.Select(_this.SelectedNode);
        }
    }

    if (this.Edit) {
        this.pasteButton = html.createElement(this.DataControls, "INPUT");
        this.pasteButton.type = 'button';
        this.pasteButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Edit_Paste");
        this.pasteButton.onclick = function () {
            var data = system.cloneData(html.ClipBoardData);
            if (_this.WYSIWYGEditor != null) {
                if (!_this.WYSIWYGEditor.EditTryInsert(data.P, data, null)) {
                    _this.SelectedNode.Insert(data, null);
                }
            }
            else {
                _this.SelectedNode.Insert(data, null);
            }
        }

        this.overwriteButton = html.createElement(this.DataControls, "INPUT");
        this.overwriteButton.type = 'button';
        this.overwriteButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Edit_Overwrite");
        this.overwriteButton.onclick = function () {
            var data = system.cloneData(html.ClipBoardData);
            _this.SelectedNode.Parent.Insert(data, _this.SelectedNode.DataIndexer);
        }
    }


    this.RootNode = new DataNode(this, this.DataNodeTree, "", this.Def, null, this.DataData, "Complex");
    this.RootNode.panel.style.display = 'inline-block';
    this.RootNode.Open();
    if (!this.ShowTreeRoot) this.RootNode.header.style.display = 'none';
    this.RootNode.Select();
}

function BreadCrum(Owner, DataNode, i) {
    this.Index = i;
    this.Element = html.createElement(Owner, "SPAN");
    this.Element.style.cursor = 'pointer';
    var _this = this;
    this.Element.onclick = function () {
        _this.DataNode.Select();
    }
    this.Update(DataNode, true);
    
    
}
BreadCrum.prototype.Update = function (DataNode, Visible) {
    this.DataNode = DataNode;
    if (Visible) this.Element.innerHTML = ((this.Index>0)?" > ":"") + DataNode.label;
    this.Element.style.display = Visible ? 'inline' : 'none';

}

GenericDataEditComponent.prototype.UpdateInserters = function () {
    this.HideInserters();
    this.pasteButton.style.display = 'none';

    var types = {};
    if (this.WYSIWYGEditor != null) {
        this.WYSIWYGEditor.EditViewing(types);

        for (var i in types) {
            var p = ExtractNumber(i);
            var ci = system.GetPropertyType(p);
            for (var j in ci) {
                var prop = ci[j];
                if (prop.P == 383) {
                    for (var k in prop.ElementTypes) {

                        var it = system.GetDataNode(prop.ElementTypes[k], "Type", 0);
                        this.ShowInserter(it, false, i);
                        if (html.ClipBoardType == it) {
                            this.pasteButton.style.display = '';
                        }
                    }
                }
                else if (prop.P == 166) {
                    for (var k in prop.Search) {
                        var it = system.GetDataNode(prop.Search[k], "SearchDown", 0);
                        this.ShowInserter(it, false, i);
                    }
                }
            }
        }
    }
    if (this.SelectedNode != null && this.SelectedNode.Type == "Array") {
        for (var i in this.SelectedNode.Def.ElementTypes) {
            var it = system.GetDataNode(this.SelectedNode.Def.ElementTypes[i], "Type", 0);
            this.ShowInserter(it, true);
            if (html.ClipBoardType == it) {
                this.pasteButton.style.display = '';
            }
        }
    }
    if (this.Owner.Resize) this.Owner.Resize();
}

GenericDataEditComponent.prototype.Select = function (DataNode) {
    var selectionChanged = DataNode != this.SelectedNode;

    if (this.SelectedNode != null && DataNode != this.SelectedNode) {
        this.SelectedNode.DeSelect();
    }
    this.SelectedNode = DataNode;
    this.copyButton.style.display = (DataNode != null && DataNode.Data.P != null) ? '' : 'none';
    this.DataFieldContainer.SelectNode(this.SelectedNode);
    if (selectionChanged) {
        if (this.DataBreadCrums != null) {
            if (this.BreadCrums == null) this.BreadCrums = [];
            var p = [];
            if (DataNode != null) DataNode.PathToRoot(p);
            for (var i in p) {

                if (this.BreadCrums.length > i) {
                    this.BreadCrums[i].Update(p[i], true);
                }
                else {
                    this.BreadCrums[i] = new BreadCrum(this.DataBreadCrums, p[i], i);
                }

            }
            for (var i = p.length; i < this.BreadCrums.length; i++) {
                this.BreadCrums[i].Update(null, false);
            }
        }
    }

    if (!this.Edit) {
        if (this.Owner.Resize) this.Owner.Resize();
        return;
    }

    this.overwriteButton.style.display = (DataNode != null && DataNode.Data.P != null && DataNode.Parent != null && html.ClipBoardType == DataNode.Data.P) ? '' : 'none';


    if (DataNode != null && DataNode.Parent != null && DataNode.Parent.Type == "Array") {
        this.deleteButton.style.display = (this.SelectedNode != null) ? '' : 'none';
        this.upButton.style.display = (this.SelectedNode && !this.SelectedNode.First()) ? '' : 'none';
        this.downButton.style.display = (this.SelectedNode && !this.SelectedNode.Last()) ? '' : 'none';
    }
    else {
        this.deleteButton.style.display = 'none';
        this.upButton.style.display = 'none';
        this.downButton.style.display = 'none';
    }

    this.UpdateInserters();

    if (this.WYSIWYGEditor != null && this.SelectedNode != null) {
        if (this.SelectedNode.Type == "Array") this.WYSIWYGEditor.PreviewSelect(this.SelectedNode.Parent.GetEditControl(), true);
        else this.WYSIWYGEditor.PreviewSelect(this.SelectedNode.GetEditControl(), true);
    }

}

GenericDataEditComponent.prototype.PreviewUpdate = function (DataNode) {
    if (this.WYSIWYGEditor != null && DataNode != null) {
        var ec = null;
        if (DataNode.Type == "Array") ec = DataNode.Parent.GetEditControl();
        else ec = DataNode.GetEditControl();
        if (ec != null && ec.UpdateData != null) ec.UpdateData();
    }
}

GenericDataEditComponent.prototype.apply = function (done) {
    var _this = this;
    this.DataFieldContainer.SelectNode(null);
    this.applyButton.disabled = true;
    this.cancelButton.disabled = true;


    var p = new PendingChanges(function () {
        _this.RootNode.Cancel();
        if (done != null) done();
        else _this.Select(_this.SelectedNode);
    }, this);

    this.RootNode.Apply(p);

    p.OneDone();
 


}

GenericDataEditComponent.prototype.cancel = function () {
    var _this = this;
    this.DataFieldContainer.SelectNode(null);
    this.RootNode.Cancel();
    this.saveButton.disabled = true;
    this.applyButton.disabled = true;
    this.cancelButton.disabled = true;

    if (this.SelectedNode != null) {
        var c = this.SelectedNode;
        while (c.Parent != null) {
            if (c.Parent.SearchChild(c) == null) {
                this.SelectedNode = null;
                break;
            }
            c = c.Parent;
        }
    }

    this.Select(this.SelectedNode);

}

GenericDataEditComponent.prototype.save = function (AfterSave) {
    var _this = this;
    _this.saveButton.disabled = true;

    this.apply(function () {
      
        system.saveData(_this.ID, _this.DataData, function () {
           
            _this.Select(_this.SelectedNode);
            if (AfterSave != null) AfterSave();
        });
    
    });
}

//
//datafield
//
function DataFieldContainer(Owner, Edit) {
    this.Owner = Owner;
    this.Edit = Edit;
    this.DataFields = [];
    var _this = this;

    this.Controls = html.createElement(this.Owner, "DIV");

    if (this.Edit) {
        this.Clear = html.createElement(this.Controls, "INPUT");
        this.Clear.type = "BUTTON";
        this.Clear.value = system.GetCustomerConfigText("UI/Portal/TXT_Data_Clear");
        this.Clear.onclick = function () {
            _this.SelectedDataField.Clear();
            _this.UpdateState();
        }

        this.SelectReferenceNode = html.createElement(this.Controls, "INPUT");
        this.SelectReferenceNode.type = "BUTTON";
        this.SelectReferenceNode.value = system.GetCustomerConfigText("UI/Portal/TXT_Data_SelectNode");
        this.SelectReferenceNode.onclick = function () {
            var popup = session.Portal.ShowPopup(this, 300, 400, false, 9);
            popup.tree = new NodeTree(popup.contents, true);
            popup.ok.disabled = true;
            var n = _this.SelectedDataField.currentNode;
            popup.nodetype = _this.SelectedDataField.NodeType;
            if (n == null) n = session.LastReferenceSelection;
            if (n != null) {
                popup.tree.Jump(ExtractNumber(n));
            }
            popup.tree.OnSelect = function (selected) {
                popup.selected = selected;
                if (popup.nodetype != null && selected.Node != null) {
                    popup.ok.disabled = selected.Node.type != popup.nodetype;
                }
                else popup.ok.disabled = false;
                if (selected != null) {
                    session.LastReferenceSelection = selected.NodeID;
                }
            }
            popup.Ok = function () {
                if (popup.selected != null) {
                    if(_this.SelectedDataField.UpdateList)_this.SelectedDataField.UpdateList();
                    _this.SelectedDataField.selectNode(popup.selected.NodeID);
                    
                }
            }
        }

        this.FileControls = html.createElement(this.Controls, "DIV");
        this.EditFileInput = html.createElement(this.FileControls, "INPUT");
        this.EditFileInput.type = "FILE";
        this.progress = html.createText(this.FileControls, null, "");
        this.progress.style.display = 'inline';
        this.fileHandler = function (e) {
            e.stopPropagation();
            e.preventDefault();

            var selField = _this.SelectedDataField;

            var files = e.target.files || e.dataTransfer.files;
            if (files.length < 1) return;
            var reader = new FileReader();
            reader.onerror = function (event) {

            }
            reader.onload = function (event) {
                var data = event.target.result;
                var name = _this.selFile.fileName;
                var size = _this.selFile.fileSize;
                if (name == null) name = _this.selFile.name;
                if (size == null) size = _this.selFile.size;
                system.createResource(data, name, size, function (id) {
                    selField.selectFile(id);
                    _this.progress.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_General_Done");
                }
            ,
            function (p) {
                _this.progress.innerHTML = Math.round(p).toString() + '%';
            }
            );
            };
            _this.selFile = files[0];
            reader.readAsDataURL(files[0]);
        }
        addEvent(this.EditFileInput,"change", this.fileHandler);

        this.TextFormattingControls = html.createElement(this.Controls, "DIV");
        this.EM = html.createElement(this.TextFormattingControls, "INPUT");
        this.EM.type = "BUTTON";
        this.EM.value = "EM";
        this.EM.onclick = function () {
            if (_this.SelectedDataField != null) _this.SelectedDataField.em();
        }
        this.H = html.createElement(this.TextFormattingControls, "INPUT");
        this.H.type = "BUTTON";
        this.H.value = "H";
        this.H.onclick = function () {
            if (_this.SelectedDataField != null) _this.SelectedDataField.h();
        }
        this.OL = html.createElement(this.TextFormattingControls, "INPUT");
        this.OL.type = "BUTTON";
        this.OL.value = "OL";
        this.OL.onclick = function () {
            if (_this.SelectedDataField != null) _this.SelectedDataField.ol();
        }
        this.UL = html.createElement(this.TextFormattingControls, "INPUT");
        this.UL.type = "BUTTON";
        this.UL.value = "UL";
        this.UL.onclick = function () {
            if (_this.SelectedDataField != null) _this.SelectedDataField.ul();
        }

        this.B = html.createElement(this.TextFormattingControls, "INPUT");
        this.B.type = "BUTTON";
        this.B.value = "B";
        this.B.onclick = function () {
            if (_this.SelectedDataField != null) _this.SelectedDataField.b();
        }
        this.I = html.createElement(this.TextFormattingControls, "INPUT");
        this.I.type = "BUTTON";
        this.I.value = "I";
        this.I.onclick = function () {
            if (_this.SelectedDataField != null) _this.SelectedDataField.i();
        }
        this.U = html.createElement(this.TextFormattingControls, "INPUT");
        this.U.type = "BUTTON";
        this.U.value = "U";
        this.U.onclick = function () {
            if (_this.SelectedDataField != null) _this.SelectedDataField.u();
        }
        this.SUP = html.createElement(this.TextFormattingControls, "INPUT");
        this.SUP.type = "BUTTON";
        this.SUP.value = "SUP";
        this.SUP.onclick = function () {
            if (_this.SelectedDataField != null) _this.SelectedDataField.sup();
        }
        this.SUB = html.createElement(this.TextFormattingControls, "INPUT");
        this.SUB.type = "BUTTON";
        this.SUB.value = "SUB";
        this.SUB.onclick = function () {
            if (_this.SelectedDataField != null) _this.SelectedDataField.sub();
        }
        this.TABLE = html.createElement(this.TextFormattingControls, "INPUT");
        this.TABLE.type = "BUTTON";
        this.TABLE.value = "TABLE";
        this.TABLE.onclick = function () {
            if (_this.SelectedDataField != null) _this.SelectedDataField.table();
        }
        this.TR = html.createElement(this.TextFormattingControls, "INPUT");
        this.TR.type = "BUTTON";
        this.TR.value = "TR";
        this.TR.onclick = function () {
            if (_this.SelectedDataField != null) _this.SelectedDataField.tr();
        }
        this.TH = html.createElement(this.TextFormattingControls, "INPUT");
        this.TH.type = "BUTTON";
        this.TH.value = "TH";
        this.TH.onclick = function () {
            if (_this.SelectedDataField != null) _this.SelectedDataField.th();
        }
        this.TD = html.createElement(this.TextFormattingControls, "INPUT");
        this.TD.type = "BUTTON";
        this.TD.value = "TD";
        this.TD.onclick = function () {
            if (_this.SelectedDataField != null) _this.SelectedDataField.td();
        }

    }
    this.Fields = html.createElement(this.Owner, "DIV");
    this.Fields.style.overflow = 'auto';
    
    this.DataFieldGroups = {
        '5': new DataFieldGroup(this.Fields, system.GetCustomerConfigText("UI/Portal/TXT_Data_Cat_ID"), 5),
        '1': new DataFieldGroup(this.Fields, system.GetCustomerConfigText("UI/Portal/TXT_Data_Cat_Content"), 1),
        '2': new DataFieldGroup(this.Fields, system.GetCustomerConfigText("UI/Portal/TXT_Data_Cat_Style"), 2),
        '3': new DataFieldGroup(this.Fields, system.GetCustomerConfigText("UI/Portal/TXT_Data_Cat_Behavior"), 3),
        '4': new DataFieldGroup(this.Fields, system.GetCustomerConfigText("UI/Portal/TXT_Data_Cat_WYSIWYG"), 4),
        '0': new DataFieldGroup(this.Fields, system.GetCustomerConfigText("UI/Portal/TXT_Data_Cat_Misc"), 0)
    };

}

DataFieldContainer.prototype.SelectNode = function (DataNode) {
    for (var i in this.DataFieldGroups) {
        this.DataFieldGroups[i].Clear();
    }
    this.DataNode = DataNode;
    this.DataFields = [];
    if (DataNode == null || DataNode.Type == "Array") return;
    var Def = this.DataNode.Def;
    var Data = this.DataNode.Data;


    for (var i in Def) {
        var d = Def[i];
        var n = d.P;
        if (n != 383 && n != 483) {
            
            this.DataFields[this.DataFields.length] = new DataField(this, this.DataNode, i, d, n);
        }

    }
    this.SelectDataField(null);
}


DataFieldContainer.prototype.SelectDataField = function (Field) {
    if (this.SelectedDataField != null) {
        this.SelectedDataField.Select(false);
    }
    this.SelectedDataField = Field;
    if (this.SelectedDataField != null) {
        this.SelectedDataField.Select(true);
    }
    this.UpdateState();
}

DataFieldContainer.prototype.UpdateState = function () {
    if (this.Edit) {
        this.progress.innerHTML = '';
        this.Clear.disabled = (this.SelectedDataField != null && this.SelectedDataField.orig != null) ? false : true;
        this.SelectReferenceNode.style.display = (this.SelectedDataField != null && this.SelectedDataField.CanSelectNodes) ? 'inline' : 'none';
        this.FileControls.style.display = (this.SelectedDataField != null && this.SelectedDataField.CanSelectResources) ? 'inline' : 'none';
        this.TextFormattingControls.style.display = (this.SelectedDataField != null && this.SelectedDataField.CanFormatText) ? 'inline' : 'none';

    }
    html.position(this.Fields, 0, this.Controls.offsetHeight + 5, 0, 0, null, null);
}


function DataFieldGroup(Owner, Name, Category) {
    this.Category = Category;

    this.panel = html.createElement(Owner, "DIV");
    this.panel.style.left = '0px';
    this.panel.style.right = '0px';
    this.collapsed = false;
    this.childCount = 0;
    this.header = html.createElement(this.panel, 'DIV');
    this.header.style.whiteSpace = 'nowrap';
    this.icon = html.createElement(this.header, 'IMG');
    this.name = html.createElement(this.header, 'SPAN');
    this.name.innerHTML = '<SMALL>' + Name + '</SMALL>';
    this.name.style.color = '#888';
    this.header.style.cursor = 'pointer';
    var _this = this;
    this.header.onclick = function () {
        if (_this.collapsed) _this.Open();
        else _this.Collapse();
    }
    this.fields = [];
    this.children = html.createElement(this.panel, 'DIV');

}

DataFieldGroup.prototype.Clear = function () {
    for (var i in this.fields) {
        this.fields[i].Delete();
    }
    this.childCount = 0;
    this.fields = [];
    this.UpdateState();
}

DataFieldGroup.prototype.Add = function (field) {
    this.fields[this.childCount] = field;
    this.childCount++;
    this.UpdateState();
    return html.createElement(this.children, "DIV");
}

DataFieldGroup.prototype.Open = function () {
    this.collapsed = false;
    this.UpdateState();
}

DataFieldGroup.prototype.Collapse = function () {
    this.collapsed = true;
    this.UpdateState();
}

DataFieldGroup.prototype.UpdateState = function () {
    if (this.childCount == 0) {
        this.panel.style.display = 'none';
    }
    else {
        this.panel.style.display = '';
        if (this.collapsed) {
            this.icon.src = system.GetCustomerConfigResource('UI/Tree/IMG_Open')
            this.children.style.display = 'none';
        }
        else {
            this.icon.src = system.GetCustomerConfigResource('UI/Tree/IMG_Close')
            this.children.style.display = '';
        }
    }
}


function DataField(DataFieldContainer, DataNode, Name, Def, n) {
    this.DataFieldContainer = DataFieldContainer;
    this.DataNode = DataNode;
    this.Def = Def;
    this.Name = Name;
    this.Selected = false;

    this.IsMultiLang = system.GetDataValue(Def, "IsMultiLang", 0);
    this.PropCat = system.GetDataValue(Def, "Category", 0);

    this.IsParentName = system.GetDataValue(Def, "IsParentName", 0);
    var _this = this;

    this.Container = this.DataFieldContainer.DataFieldGroups[this.PropCat.toString()].Add(this);
    this.Container.style.left = '0px';
    this.Container.style.right = '0px';
    this.Container.style.padding = '5px';


    this.Container.onmousedown = function () {
        _this.DataFieldContainer.SelectDataField(_this);
    }

    this.CanSelectNodes = false;
    this.CanFormatText = false;
    this.CanSelectResources = false;

    this.EditControl = null;

    if (n == 164) {
        //text

        this.TextType = system.GetDataValue(Def, "TextType", 0);

        this.AddLabel(this.Container);
        html.createElement(this.Container, "BR");

        if (this.TextType == 0) {
            this.EditControl = html.createElement(this.Container, "INPUT");
            this.EditControl.type = "TEXT";
        }
        else {
            this.EditControl = html.createElement(this.Container, "TEXTAREA");
            this.EditControl.style.height = '200px';
        }
        if (this.TextType == 2) {
            this.CanFormatText = true;
        }
        this.EditControl.style.width = '265px';


        this.Changed = function () {
            var str = (_this.EditControl.value == '') ? ((this.orig == null) ? null : '') : _this.EditControl.value;
            this.orig = str;

            if (_this.TextType == 2 && str != null) {
                str = _this.text2html(str);
            }
            
            return _this.DataNode.PrepareEdit(this.Name, "T", this.IsMultiLang, true, str);
            
        }

        this.Restore = function () {
            var str = (_this.orig == null) ? '' : _this.orig;
            if (_this.TextType == 2 && str != null) {
                str = _this.html2text(str);
            }
            _this.EditControl.value = str;
        }

        this.AfterSave = function () {
            this.orig = _this.DataNode.PrepareEdit(this.Name, "T", this.IsMultiLang, false, null);
            this.Restore();
            this.Check();
        }

    }
    else if (n == 387) {
        //password
        this.AddLabel(this.Container);
        html.createElement(this.Container, "BR");
        this.EditControl = html.createElement(this.Container, "INPUT");
        this.EditControl.type = "PASSWORD";




        this.Changed = function () {
            var str = (_this.EditControl.value == '') ? ((this.orig == null) ? null : '') : _this.EditControl.value;
            this.orig = str;

            return _this.DataNode.PrepareEdit(this.Name, "T", this.IsMultiLang, true, str);
        }

        this.Restore = function () {
            var str = (_this.orig == null) ? '' : _this.orig;

            _this.EditControl.value = _this.orig;
        }

        this.AfterSave = function () {
            this.orig = _this.DataNode.PrepareEdit(this.Name, "T", this.IsMultiLang, false, null);
            this.Restore();
            this.Check();
        }

    }
    else if (n == 168) {
        //value

        this.Default = system.GetDataValue(Def, "Default", 0);

        this.AddLabel(this.Container);
        html.createElement(this.Container, "BR");
        this.EditControl = html.createElement(this.Container, "INPUT");
        this.EditControl.type = "TEXT";



        this.Changed = function () {
            var str = ExtractNumber(_this.EditControl.value);
            var str = (str == this.Default) ? ((this.orig == null) ? null : this.Default) : str;
            this.orig = str;
            return _this.DataNode.PrepareEdit(this.Name, "V", this.IsMultiLang, true, str);
        }

        this.Restore = function () {
            var str = (_this.orig == null) ? this.Default : _this.orig;
            _this.EditControl.value = str.toString();
        }

        this.AfterSave = function () {
            this.orig = _this.DataNode.PrepareEdit(this.Name, "V", this.IsMultiLang, false, null);
            this.Restore();
            this.Check();
        }

    }
    else if (n == 478) {
        //bit

        this.Default = system.GetDataValue(Def, "Default", 0);

        this.EditControl = html.createElement(this.Container, "INPUT");
        this.EditControl.type = "CHECKBOX";
        this.AddLabel(this.Container);



        this.Changed = function () {
            var str = _this.EditControl.checked ? 1 : 0;
            var str = (str == this.Default) ? ((this.orig == null) ? null : this.Default) : str;
            this.orig = str;
            return _this.DataNode.PrepareEdit(this.Name, "V", this.IsMultiLang, true, str);
        }

        this.Restore = function () {
            var str = (_this.orig == null) ? this.Default : _this.orig;
            _this.EditControl.checked = (str==1)?true:false;
        }

        this.AfterSave = function () {
            this.orig = _this.DataNode.PrepareEdit(this.Name, "V", this.IsMultiLang, false, null);
            this.Restore();
            this.Check();
        }

        this.EditControl.onclick = function () {
            _this.Check();
        }

    }

    else if (n == 167) {
        //node
        this.NodeType = system.GetDataNode(Def, "NodeType", null);
        this.ShowKnown = system.GetDataValue(Def, "ShowKnown", 0);

        this.CanSelectNodes = true;

        this.AddLabel(this.Container);
        if (this.ShowKnown) {
            this.EditControl = html.createElement(this.Container, "SELECT");
            var option = html.createElement(this.EditControl, "OPTION");
            option.value = -1;
            option.text = system.GetCustomerConfigText("UI/Portal/TXT_Data_None");
            this.UpdateList = function () {
                var kts = system.KnownNodesByType(this.NodeType);
                var index = 1;
                for (var i in kts) {
 
                    if (this.EditControl.options.length <= index) {
                        option = html.createElement(this.EditControl, "OPTION");
                    }
                    else {
                        option = this.EditControl.options[index];
                    }
                    index++;
                    option.value = i;
                    system.RequireNodeID(i, option, function (sender, node) {
                        if (node.type == 453) {
                            sender.text = system.GetDataText(node.data, "FullName", node.name, false);
                        }
                        else {
                            sender.text = node.name;
                        }
                    }, 1, false, 0);
                    //if (kts[i] != null) option.text = kts[i].name;
                }
            }
            this.UpdateList();
        }
        else {
            this.EditContainerNode = html.createElement(this.Container, "SPAN");
            this.EditContainerNode.style.color = 'blue';
        }
        this.currentNode = null;



        this.Changed = function () {
            if (_this.ShowKnown) {
                _this.currentNode = ExtractNumber(_this.EditControl.value);

            }

            _this.orig = (_this.currentNode == -1) ? null : _this.currentNode;
         
            return _this.DataNode.PrepareEdit(this.Name, "N", this.IsMultiLang, true, _this.orig);
        }



        this.Restore = function () {
            
            _this.selectNode(_this.orig);
        }

        this.AfterSave = function () {
            this.orig = _this.DataNode.PrepareEdit(this.Name, "N", this.IsMultiLang, false, null);
            this.Restore();
            this.Check();
        }

    }
    else if (n == 166) {
        //reference

        this.AddLabel(this.Container);
        this.EditControl = html.createElement(this.Container, "SELECT");
        var option = html.createElement(this.EditControl, "OPTION");
        option.value = 0;
        option.text = system.GetCustomerConfigText("UI/Portal/TXT_Data_None");
        for (var i in Def.Search) {
            var search = Def.Search[i];
            var up = system.GetDataNode(search, "SearchUp", null);
            var down = system.GetDataNode(search, "SearchDown", null);
            var s = this.DataNode;
            while (s != null && s.Data.P != up) {
                s = s.Parent;
            }

            if (s != null && s.Data.P == up) {
                var result = [];
                this.findChildren(s.Data, result, down, true);
                for (var i in result) {
                    var val = result[i];
                    var option = html.createElement(this.EditControl, "OPTION");
                    if (val.L == null) 
                    {
                        system.assignLocalID(val);
                    }
                    option.value = val.L;
                    this.DataNode.CalculateParentName(val, option, "text");
                }
            }
        }
        this.Default = 0;

        this.Changed = function () {
            var str =  ExtractNumber(_this.EditControl.value);
            var str = (str == this.Default) ? ((this.orig == null) ? null : this.Default) : str;
            this.orig = str;
            return _this.DataNode.PrepareEdit(this.Name, "R", this.IsMultiLang, true, str);
        }

        this.Restore = function () {
            _this.EditControl.value = (_this.orig==null)?0:_this.orig;
        }

        this.AfterSave = function () {
            this.orig = _this.DataNode.PrepareEdit(this.Name, "R", this.IsMultiLang, false, null);
            this.Restore();
            this.Check();
        }


    }
    else if (n == 479) {
        //enum

        this.AddLabel(this.Container);
        this.EditControl = html.createElement(this.Container, "SELECT");
        this.Default = null;
        for (var i in Def.Values) {
            var val = Def.Values[i];
            var option = html.createElement(this.EditControl, "OPTION");
            option.value = system.GetDataValue(val, "Key", 0);
            option.text = system.GetDataText(val, "Value", '', false);
            if (system.GetDataValue(val, "Default", 0) == 1) {
                this.EditControl.value = option.value;
                this.Default = ExtractNumber(option.value);
            }
        }


        this.Changed = function () {
            var str = ExtractNumber(_this.EditControl.value);
            var str = (str == this.Default) ? ((this.orig == null) ? null : this.Default) : str;
            this.orig = str;
            return _this.DataNode.PrepareEdit(this.Name, "V", this.IsMultiLang, true, str);
        }

        this.Restore = function () {
            _this.EditControl.value = (_this.orig==null)?this.Default:_this.orig;
        }

        this.AfterSave = function () {
            this.orig = _this.DataNode.PrepareEdit(this.Name, "V", this.IsMultiLang, false, null);
            this.Restore();
            this.Check();
        }

    }
    else if (n == 480) {
        //list

        this.AddLabel(this.Container);
        this.EditControl = html.createElement(this.Container, "SELECT");
        
        var contpath = system.GetDataText(Def, "ContainerPath", "", false);
        var proppath = system.GetDataText(Def, "PropertyPath", "", false);
        var colorpath = system.GetDataText(Def, "ColorPath", "", false);
        this.loaded = false;
        var cont = system.GetDataNode(this.DataNode.DataEditor.DataData, contpath, null);
        if (cont != null) {
            system.RequireNodeID(cont, this, function (sender, node) {

                var prop = system.GetDataKey(node.data, proppath.split('/'), null);
                if (prop != null) {
                    var zerofound = false;
                    for (var i in prop) {
                        
                        if (system.GetDataValue(prop[i], "Key", 0) == 0) zerofound = true;

                    }
                    if (!zerofound) {
                        var option = html.createElement(sender.EditControl, "OPTION");
                        option.value = 0;
                        option.text = "-";
                    }


                    for (var i in prop) {
                        var option = html.createElement(sender.EditControl, "OPTION");
                        option.value = system.GetDataValue(prop[i], "Key", 0);
                        option.text = system.GetDataText(prop[i], "Name", '', false);
                        if (colorpath != null) {
                            option.style.backgroundColor = system.GetDataText(prop[i], colorpath, '', false);
                        }
                    }
                }
                sender.loaded = true;
                if (sender.Restore) {
                    sender.Restore();
                    sender.Changed();
                }

            }, 2, false, 0)
        }
        //TODO: Calculate default value
        this.Default = 0;



        this.Changed = function () {
            if (_this.loaded) {
                var str = ExtractNumber(_this.EditControl.value);
                var str = (str == this.Default) ? ((this.orig == null) ? null : this.Default) : str;
                this.orig = str;
                return _this.DataNode.PrepareEdit(this.Name, "V", this.IsMultiLang, true, str);
            }
        }

        this.Restore = function () {
            if (_this.loaded) {
                _this.EditControl.value = _this.orig;
            }
        }

        this.AfterSave = function () {
            this.orig = _this.DataNode.PrepareEdit(this.Name, "V", this.IsMultiLang, false, null);
            this.Restore();
            this.Check();
        }

    }
    else if (n == 165) {
        //resource
        this.FileType = system.GetDataValue(Def, "FileType", 0);

        this.CanSelectResources = true;
        this.AddLabel(this.Container);
        this.EditContainerResource = html.createElement(this.Container, "DIV");
        this.dropArea = html.createElement(this.EditContainerResource, "DIV");
        this.dropArea.style.border = "1px solid black";
        this.dropArea.style.margin = "5px";
        this.dropArea.style.padding = "5px";
        this.dropArea.style.display = "inline-block";
        addEvent(this.dropArea,"drop", function (e) {
            _this.DataFieldContainer.SelectDataField(_this);
            _this.DataFieldContainer.fileHandler(e);
        });
        this.dropArea.style.minHeight = '50px';
        this.dropArea.style.minWidth = '50px';

        if (this.FileType == 0) {
            this.img = html.createElement(this.dropArea, "IMG");
            this.img.style.maxHeight = '200px';
            this.img.style.maxWidth = '200px';
        }
        this.filelabel = html.createElement(this.EditContainerResource, "DIV");
        this.filelabel.style.margin = "5px";
        this.filelabel.style.display = "inline-block";
        this.filelabel.style.maxWidth = '200px';
        this.filelabel.style.cursor = 'pointer';
        this.filelabel.onclick = function () {
            if (_this.currentFile != null) {
                window.open(FileByFileResourceID(_this.currentFile), 'resource');
            }
        }
        this.currentFile = null;



        this.Changed = function () {
            _this.orig = _this.currentFile;
            return _this.DataNode.PrepareEdit(this.Name, "F", this.IsMultiLang, true, _this.currentFile);
        }

        this.Restore = function () {
            _this.selectFile(_this.orig);
        }

        this.AfterSave = function () {
            this.orig = _this.DataNode.PrepareEdit(this.Name, "F", this.IsMultiLang, false, null);
            this.Restore();
            this.Check();
        }

    }
    else {
        return;
    }


    if (this.EditControl != null) {

        if (this.DataFieldContainer.Edit) {

            this.EditControl.onfocus = function () {
                _this.checker = setInterval((function (self) {
                    return function () { self.Check(); }
                })(_this), 100);
            }
            this.EditControl.onblur = function () {
                clearInterval(_this.checker);
                _this.Check();
            }
        }
        else {
            this.EditControl.readOnly = true;
            this.EditControl.disabled = true;
        }
    }

    if (this.AfterSave) this.AfterSave();

}

DataField.prototype.Delete = function () {
    clearInterval(this.checker);

    this.Container.parentNode.removeChild(this.Container);
}

DataField.prototype.AddLabel = function (Owner) {
    this.label = system.GetDataText(this.Def, "FullName", '', false );

    if (this.IsMultiLang == 1) {
        var l = lang;
        var code = '';
        if (l == -1) code = system.GetCustomerConfigText("UI/Portal/TXT_General_All");
        else if (l == 0) code = system.GetCustomerConfigText("UI/Portal/TXT_General_Default");
        else {
            code = system.GetDataText(system.GetKnownNodeData(l), "Code", '', false);
        }
        this.label += ' (' + code + ')';

    }

    this.LabelControl = html.createElement(Owner, 'SPAN');
    this.LabelControl.style.whiteSpace = 'nowrap';
    this.LabelControl.innerHTML = this.label;



    if (system.GetDataValue(session.UserData, "Debug", 0) == 1) {
        this.debug = html.createElement(Owner, 'SPAN');
        this.debug.style.whiteSpace = 'nowrap';
        this.debug.style.color = 'red';
        var d = system.GetDataText(this.Def, "Name", '', false);
        var l = null;
        if (this.DataNode.Data[this.Name]) l = this.DataNode.Data[this.Name].L;
        this.debug.innerHTML = "<SMALL><SMALL>&nbsp;" + d + ((l != null) ? ",&nbsp;" + l : '') + "</SMALL></SMALL>";

    }
}

DataField.prototype.Clear = function () {
    this.orig = null;
    this.Restore();
    this.Check();
}

DataField.prototype.Check = function () {
    if (this.Changed && this.Changed()) {
        this.LabelControl.style.fontWeight = 'bold';
        this.LabelControl.innerHTML = this.label + ' *';
        if (this.IsParentName) {
            this.DataNode.UpdateName();
        }
    }
    else {
        this.LabelControl.style.fontWeight = 'normal';
        this.LabelControl.innerHTML = this.label;
    }
    if (this.IsMultiLang == 1)
    {
        var d = this.DataNode.Data[this.Name];
        var t = "";
        if (d != null) {
            
            if (d.T != null) {
                if (isNaN(d.T)) {
                    for (l in d.T) {
                        var te = TextByTextResourceID(d.T[l]).replaceAll("\n", "").replaceAll("\r", "");
                        if (te.length > 20) te = te.substr(0,20) + "...";
                        t += ((langcodes[l]) ? langcodes[l] : system.GetCustomerConfigText("UI/Portal/TXT_General_Default")) + " - " + te + "\n";
                    }
                }
            }
            if (d.F != null) {
                if (isNaN(d.F)) {

                    for (l in d.F) {
                        var te = FileObjectByFileResourceID(d.F[l])
                        t += ((langcodes[l]) ? langcodes[l] : system.GetCustomerConfigText("UI/Portal/TXT_General_Default")) + " - " + te.Name + "\n";
                    }
                }
            }
           

        }
        this.LabelControl.title = t;
    }
    this.DataFieldContainer.UpdateState();
}

DataField.prototype.Select = function (Selected) {
    this.Selected = Selected;
    this.UpdateState();
}

DataField.prototype.UpdateState = function () {
    this.Container.style.backgroundColor = (this.Selected ? '#C0C0C0' : 'white');
}

DataField.prototype.findChildren = function (Data, Result, Search, SkipRoot) {
    if (!SkipRoot && Data.P == Search) Result[Result.length] = Data;
    for (var i in Data) {

        if (isArray(Data[i])) {



            for (var j in Data[i]) {

                if (Data[i][j].P == null) {
                    var Def = system.GetPropertyType(Data.P);
                    if (Def != null) {
                        for (var k in Def[i].ElementTypes) {
                            var d = Def[i].ElementTypes[k];
                            if (system.GetDataValue(d, "Default", 0) == 1) {
                                Data[i][j].P = system.GetDataNode(d, "Type", 0);
                            }
                        }
                    }
                }

                this.findChildren(Data[i][j], Result, Search, false);
            }
        }
    }
}

DataField.prototype.selectFile = function (file) {
    this.currentFile = file;
    if (file == null) {
        this.filelabel.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Data_None");
        if (this.FileType == 0) this.img.src = '';
    }
    else {
        var fo = FileObjectByFileResourceID(file);
        if (fo != null) {
            this.filelabel.innerHTML = fo.Name + ' ('+ FileSizeString(fo.Size)+')';
            if (this.FileType == 0) this.img.src = FileByFileResourceID(file);
        }
    }
    this.Check();
}

DataField.prototype.selectNode = function (node) {
    this.currentNode = node;
    if (this.ShowKnown) {
        var sel = node;
        if (sel == null || sel == -1) sel = -1;
        else {
            if (system.KnownNodesByType(this.NodeType)[node.toString()] == null) {
                system.KnownNodesByType(this.NodeType)[node.toString()] = {};
                this.UpdateList();
            }
        }
        this.EditControl.value = sel;
    }
    else {
        if (node == null) {
            this.EditContainerNode.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Data_None");
        }
        else {
            var _this = this;
            system.RequireNodeID(node, _this.EditContainerNode, function (sender, node) {
                sender.innerHTML = node.name;
            }, 1, false, 0);
        }
    }
    this.Check();

}


DataField.prototype.html2text =function (input) {
    var text = input;
    text = text.replace(/^[\s]*|[\s]*$/g, "");
    text = text.replace(/[\s]+/g, " ");

    text = text.replace(/\[/g, '\\[');
    text = text.replace(/\]/g, '\\]');
    //text = text.replace(/&amp;/g, '&');
    text = text.replace(/<em>/gi, "[em]");
    text = text.replace(/<\/em>/gi, "[/em]");
    text = text.replace(/^<h>/gi, "[h]");
    text = text.replace(/<h>/gi, "[h]");
    text = text.replace(/<\/h>/gi, "[/h]");

    text = text.replace(/<u>/gi, "[u]");
    text = text.replace(/<\/u>/gi, "[/u]");
    text = text.replace(/<i>/gi, "[i]");
    text = text.replace(/<\/i>/gi, "[/i]");
    text = text.replace(/<b>/gi, "[b]");
    text = text.replace(/<\/b>/gi, "[/b]");
    text = text.replace(/<sup>/gi, "[sup]");
    text = text.replace(/<\/sup>/gi, "[/sup]");
    text = text.replace(/<sub>/gi, "[sub]");
    text = text.replace(/<\/sub>/gi, "[/sub]");
    text = text.replace(/<img>/gi, "[img]");
    text = text.replace(/<\/img>/gi, "[/img]");
    text = text.replace(/<txt>/gi, "[txt]");
    text = text.replace(/<\/txt>/gi, "[/txt]");

    text = text.replace(/<th>/gi, "[th]");
    text = text.replace(/<\/th>/gi, "[/th]");
    text = text.replace(/<td>/gi, "[td]");
    text = text.replace(/<\/td>/gi, "[/td]");
    text = text.replace(/[\s]*<tr>/gi, "[tr]");
    text = text.replace(/<\/tr>[\s]*/gi, "[/tr]\r\n");
    text = text.replace(/^<table>/gi, "[table]\r\n");
    text = text.replace(/<table>/gi, "\r\n[table]\r\n");
    text = text.replace(/<\/table>/gi, "[/table]\r\n")

    text = text.replace(/[\s]*<li>/gi, "[li]");
    text = text.replace(/<\/li>[\s]*/gi, "[/li]\r\n");
    text = text.replace(/^<ul>/gi, "[ul]\r\n");
    text = text.replace(/<ul>/gi, "\r\n[ul]\r\n");
    text = text.replace(/<\/ul>/gi, "[/ul]\r\n");
    text = text.replace(/^<ol>/gi, "[ol]\r\n");
    text = text.replace(/<ol>/gi, "\r\n[ol]\r\n");
    text = text.replace(/<\/ol>/gi, "[/ol]\r\n");
    text = text.replace(/[\s]*<br[\s\/]*>[\s]*/gi, "\r\n");
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&lt;/g, '<');

    return text;
}
DataField.prototype.text2html = function(input) {
    var text = input;
   // text = text.replace(/&/g, '&amp;');
    text = text.replace(/</g, '&lt;');
    text = text.replace(/>/g, '&gt;');
    text = text.replace(/\\\[/g, '[');
    text = text.replace(/\\\]/g, ']');

    text = text.replace(/\[h\]/g, "<h>");
    text = text.replace(/\[\/h\]/g, "</h>");
    text = text.replace(/\[em\]/g, "<em>");
    text = text.replace(/\[\/em\]/g, "</em>");

    text = text.replace(/\[img\]/g, "<img>");
    text = text.replace(/\[\/img\]/g, "</img>");
    text = text.replace(/\[txt\]/g, "<txt>");
    text = text.replace(/\[\/txt\]/g, "</txt>");

    text = text.replace(/\[sub\]/g, "<sub>");
    text = text.replace(/\[\/sub\]/g, "</sub>");
    text = text.replace(/\[sup\]/g, "<sup>");
    text = text.replace(/\[\/sup\]/g, "</sup>");
    text = text.replace(/\[b\]/g, "<b>");
    text = text.replace(/\[\/b\]/g, "</b>");
    text = text.replace(/\[i\]/g, "<i>");
    text = text.replace(/\[\/i\]/g, "</i>");
    text = text.replace(/\[u\]/g, "<u>");
    text = text.replace(/\[\/u\]/g, "</u>");

    text = text.replace(/[\s]*\[th\][\s]*/g, "<th>");
    text = text.replace(/[\s]*\[\/th\][\s]*/g, "</th>");
    text = text.replace(/[\s]*\[td\][\s]*/g, "<td>");
    text = text.replace(/[\s]*\[\/td\][\s]*/g, "</td>");
    text = text.replace(/(\r?\n|\r)?\[table\][\s]*/g, "<table>");
    text = text.replace(/[\s]*\[\/table\](\r?\n|\r)?/g, "</table>");
    text = text.replace(/[\s]*\[tr\][\s]*/g, "<tr>");
    text = text.replace(/[\s]*\[\/tr\][\s]*/g, "</tr>");

    text = text.replace(/(\r?\n|\r)?\[ul\][\s]*/g, "<ul>");
    text = text.replace(/[\s]*\[\/ul\](\r?\n|\r)?/g, "</ul>");
    text = text.replace(/(\r?\n|\r)?\[ol\][\s]*/g, "<ol>");
    text = text.replace(/[\s]*\[\/ol\](\r?\n|\r)?/g, "</ol>");
    text = text.replace(/[\s]*\[li\][\s]*/g, "<li>");
    text = text.replace(/[\s]*\[\/li\][\s]*/g, "</li>");
    text = text.replace(/\r?\n|\r/g, "<br>");
    return text;
}


DataField.prototype.b = function () {
    this.replace('b', false);
}
DataField.prototype.i = function () {
    this.replace('i', false);
}
DataField.prototype.u = function () {
    this.replace('u', false);
}
DataField.prototype.h = function () {
    this.replace('h', false);
}
DataField.prototype.em = function () {
    this.replace('em', false);
}
DataField.prototype.ol= function() {
    this.replace('ol', true);
}
DataField.prototype.ul= function() {
    this.replace('ul', true);
}
DataField.prototype.table = function () {
    this.replace('table', false);
}
DataField.prototype.tr = function () {
    this.replace('tr', false);
}
DataField.prototype.td = function () {
    this.replace('td', false);
}
DataField.prototype.th = function () {
    this.replace('th', false);
}
DataField.prototype.sup = function () {
    this.replace('sup', false);
}
DataField.prototype.sub = function () {
    this.replace('sub', false);
}


DataField.prototype.replace = function (rep, li) {
    var before = '[' + rep + ']';
    var after = '[/' + rep + ']';
    var beforereg = '\\[' + rep + '\\]';
    var afterreg = '\\[\\/' + rep + '\\]';


    if (li) {
        before += '\n';
        after = '\n' + after;

    }
    this.EditControl.focus();
    /*if (typeof document.selection != 'undefined') {
        var range = document.selection.createRange();
        var insText = range.text;
        if (li) insText = this.replaceLi(insText);
        range.text = before + insText + after;
        range = document.selection.createRange();
        if (insText.length == 0) {
            range.move('character', -after.length);
        } else {
            range.moveStart('character', before.length + insText.length + after.length);
        }
        range.select();
    }*/
    if (typeof this.EditControl.selectionStart != 'undefined') {
        var start = this.EditControl.selectionStart;
        var end = this.EditControl.selectionEnd;

        

        var t = this.EditControl.value;

        if (end>start && (t.substr(end-1, 1) == '\n' || t.substr(end-1, 1) == ' ')) {
            end--;
        }

        var find = { "b": [], "i": [], "u": [], "em": [], "h": [], "ol": [], "ul": [], "table": [], "tr": [], "th": [], "td": [], "sub": [], "sup": [] };
        for (var i = 0; i < t.length; i++) {
            for (var k in find) {
                if (t.substr(i, k.length + 2) == '[' + k + ']') {
                    find[k][find[k].length] = { "pos": i, "length": k.length + 2, "start": true };
                    if (start > i && start < i + k.length + 2) start = i + k.length + 2;
                    if (end > i && end < i + k.length + 2) end = i;
                }
                if (t.substr(i, k.length + 3) == '[/' + k + ']') {
                    find[k][find[k].length] = { "pos": i, "length": k.length + 3, "start": false };
                    if (start > i && start < i + k.length + 3) start = i ;
                    if (end > i && end < i + k.length + 3) end = i + k.length + 3;

                }
            }
        }

        var flag = 0;
        var startflag = false;
        var endflag = false;
        var starttoken = null;
        var endtoken = null;
        for (var k in find[rep]) {
            var fk = find[rep][k];
            if (fk.start) {
                flag++;
                if (fk.pos < start) startflag = true;
                if (fk.pos < end) endflag = true;

                if (starttoken == null) starttoken = fk;
                if (fk.pos < end) endtoken = null;
            }
            else {
                flag--;
                if (fk.pos < start) startflag = false;
                if (fk.pos+fk.length <= end) endflag = false;
                
                if (endtoken == null) endtoken = fk;
                if (fk.pos<start) starttoken = null;
            }
        }
        var selstart = start;
        var selend = end;

        if (startflag && endflag) {
            //remove
            var startpos = 0;
            var endpos = t.length;
            if (starttoken != null) startpos = starttoken.pos;
            if (endtoken != null) endpos = endtoken.pos + endtoken.length;

            var insText = t.substring(startpos, endpos);
            insText = insText.replaceAll(beforereg, "").replaceAll(afterreg, "");

            if (li) {
                insText = this.removeLi(insText);
            }

            this.EditControl.value = t.substring(0, startpos) + insText + t.substring(endpos);

            selstart = startpos;
            selend = selstart + insText.length;
        }
        else if (startflag  && !endflag) {
            //extend end

            var insText = t.substring(start, end);
            insText = insText.replaceAll(beforereg, "").replaceAll(afterreg, "");

            if (li) {
                insText = this.removeLi(insText);
                insText = this.replaceLi(insText);
            }

            this.EditControl.value = t.substring(0, start) + insText + after + t.substring(end);

            selstart = start;
            selend = selstart + insText.length;

        }
        else if (!startflag  && endflag) {
            var insText = t.substring(start, end);
            insText = insText.replaceAll(beforereg, "").replaceAll(afterreg, "");

            if (li) {
                insText = this.removeLi(insText);
                insText = this.replaceLi(insText);
            }

            this.EditControl.value = t.substring(0, start) + before + insText + t.substring(end);

            selstart = start + before.length;
            selend = selstart + insText.length;
        }
        else {
            //add
            var insText = t.substring(start, end);
            insText = insText.replaceAll(beforereg, "").replaceAll(afterreg, "");

            if (li) {
                insText = this.removeLi(insText);
                insText = this.replaceLi(insText);
            }

            this.EditControl.value = t.substring(0, start) + before + insText + after + t.substring(end);

            selstart = start + before.length;
            selend = selstart + insText.length;
        }
        this.EditControl.selectionStart = selstart;
        this.EditControl.selectionEnd = selend;
    }
}

DataField.prototype.replaceLi= function(inp) {
    return '[li]' + inp.replace(/\r?\n|\r/g, "[/li]\n[li]") + '[/li]';
}

DataField.prototype.removeLi = function (inp) {

    return inp.replaceAll('\\[li\\]', "").replaceAll('\\[\\/li\\]', "");
}

String.prototype.replaceAll = function (replaceThis, withThis) {
    var re = new RegExp(replaceThis, "g");
    return this.replace(re, withThis);
};

//
//datanode
//
function DataNode(DataEditor, Owner, Name, Def, Parent, Data, Type, DataIndexer) 
{
    this.Edits = [];
    this.Children = [];
    this.DataIndexer = DataIndexer;
    this.DataEditor = DataEditor;
    this.Parent = Parent;
    this.Def = Def;
    this.Type = Type;

    this.DataOrig = Data;
    this.Reset();

    this.Name = Name;
    var _this = this;

    this.collapsed = true;
    this.childrenLoaded = false;
    this.hasChildren = false;
    this.selected = false;

    this.panel = html.createElement(Owner, "DIV");

    this.header = html.createElement(this.panel, 'DIV');
    this.header.style.whiteSpace = 'nowrap';
    this.icon = html.createElement(this.header, 'IMG');
    this.name = html.createElement(this.header, 'SPAN');
    if (system.GetDataValue(session.UserData, "Debug", 0) == 1) {
        this.debug = html.createElement(this.header, 'SPAN');
        this.debug.style.whiteSpace = 'nowrap';
        this.debug.style.color = 'red';
    }
    this.header.style.cursor = 'pointer';
    this.header.onclick = function () {
        _this.Select();
    }
    this.header.onmousemove = function (e) {
        if (_this.DataEditor.WYSIWYGEditor != null) {
            if (e == null) e = window.event;
            e.stopPropagation();
            if (_this.Type == "Array") _this.DataEditor.WYSIWYGEditor.PreviewSelect(_this.Parent.GetEditControl(), false);
            else _this.DataEditor.WYSIWYGEditor.PreviewSelect(_this.GetEditControl(), false);
           
        }
    }
    this.icon.onclick = function () {
        if (_this.hasChildren) {
            if (_this.collapsed) _this.Open();
            else _this.Collapse();
        }
    }

    this.children = html.createElement(this.panel, 'DIV');
    this.children.style.margin = '0px 0px 0px 20px';
    this.children.style.display = 'none';
    if (Type == "Complex") {
        this.LoadChildren();
        this.value = html.createElement(this.header, 'SPAN');
        this.value.style.color = 'blue';
        this.value.style.margin = '0px 0px 0px 10px';
    }
    else if (Type == "Array") {
        this.name.style.color = 'blue';
    }

    if (Type == "Array" || this.Children.length > 0) {
        this.hasChildren = true;
    }

    this.UpdateStatus(false);
}

DataNode.prototype.GetEditControl = function () {
    if (this.editControl == null) this.editControl = html.findEditControlByData(this.DataOrig);
    return this.editControl;
}

DataNode.prototype.First = function () {
    if (this.Parent == null) return true;
    return arrayIndexOf( this.Parent.Children, this) == 0;
}

DataNode.prototype.Last = function () {
    if (this.Parent == null) return true;
    return arrayIndexOf(this.Parent.Children,this) == this.Parent.Children.length - 1;
}

DataNode.prototype.Select = function () {
    this.selected = true;
    this.UpdateStatus(false);
}

DataNode.prototype.DeSelect = function () {
    this.selected = false;
    this.UpdateStatus(false);
}

DataNode.prototype.Open = function () {
    this.collapsed = false;
    if (!this.childrenLoaded) {
        this.LoadChildren();
    }
    this.UpdateStatus(false);
}

DataNode.prototype.Collapse = function () {
    this.collapsed = true;
    this.UpdateStatus(false);
}


DataNode.prototype.UpdateStatus = function (Silent) {
    if (!this.hasChildren) {
        this.icon.src = system.GetCustomerConfigResource('UI/Tree/IMG_Empty')
    }
    else if (this.collapsed) {
        this.icon.src = system.GetCustomerConfigResource('UI/Tree/IMG_Open')
    }
    else {
        this.icon.src = system.GetCustomerConfigResource('UI/Tree/IMG_Close')
    }
    this.UpdateName();
    this.header.style.backgroundColor = this.selected ? '#C0C0C0' : 'transparent';

    if (this.hasChildren) this.children.style.display = this.collapsed ? 'none' : '';

    if (this.selected && !Silent) this.DataEditor.Select(this);
}


DataNode.prototype.ChangeLanguage = function () {
    for (var i in this.Children) {
        this.Children[i].ChangeLanguage();
    }
    this.UpdateName();
}


DataNode.prototype.SearchChild = function (SearchFor) {
    for (var i in this.Children) {
        if (this.Children[i] == SearchFor || this.Children[i].DataOrig == SearchFor) return this.Children[i];
    }
}

DataNode.prototype.LoadChildren = function (select) {
    this.childrenLoaded = true;
    this.NewChildren = [];
    var firstMatch = null;

    if (this.Type == "Array") {

        var index = 0;
        for (var i in this.Data) {
            var obj = this.Data[i];
            if (obj.P == null) {

                for (var j in this.Def.ElementTypes) {
                    var d = this.Def.ElementTypes[j];
                    if (system.GetDataValue(d, "Default", 0) == 1) {
                        obj.P = system.GetDataNode(d, "Type", 0);
                    }
                }
            }

            var m = this.SearchChild(obj);
            if (m == null) {
                m = new DataNode(this.DataEditor, this.children, "", system.GetPropertyType(obj.P), this, obj, "Complex", index);
            }
            this.NewChildren[index] = m;

            this.children.insertBefore(m.panel, null);
            if (firstMatch == null) firstMatch = m.panel;
            index++;
        }
    }
    else {
        for (var i in this.Def) {
            var d = this.Def[i];
            var n = d.P;

            var m = this.SearchChild(this.Data[i]);
            if (m == null) {
                if (n == 383) {
                    //array
                    if (this.Data[i] == null) {
                        var e = [];
                        this.Data[i] = e;
                        this.DataOrig[i] = e;
                    }

                    m = new DataNode(this.DataEditor, this.children, i, d, this, this.Data[i], "Array", i);

                }
                else if (n == 483) {
                    //complex
                    if (this.Data[i] == null) {
                        var e = {};
                        this.Data[i] = e;
                        this.DataOrig[i] = e;
                    }
                    var np = system.GetDataNode(d, "Type", 0);
                    if (this.Data[i].P == null) {

                        this.Data[i].P = np;
                    }


                    m = new DataNode(this.DataEditor, this.children, i, system.GetPropertyType(np), this, this.Data[i], "Complex", i);
                }
            }
            if (m != null) {
                this.NewChildren[this.NewChildren.length] = m;

                this.children.insertBefore(m.panel, null);
                if (firstMatch == null) firstMatch = m.panel;
            }
        }
    }
    this.Children = this.NewChildren;

    while (this.children.childNodes.length > 0 && this.children.firstChild != firstMatch) this.children.removeChild(this.children.firstChild);

    if (select != null) {
        var sel = this.SearchChild(select);
        if (sel != null) sel.Select();
    }

}

DataNode.prototype.Delete = function (Subject) {
    var index = arrayIndexOf(this.Data,Subject.DataOrig);
    this.Data.splice(index, 1);
    this.LoadChildren(null);
    this.DataEditor.Select(this);
    this.DataEditor.PendingChange();
    this.Changed = true;
}

DataNode.prototype.Move = function (Subject, Direction) {
    if (Direction == 1) {
        var index = arrayIndexOf(this.Data,Subject.DataOrig);
        var item = this.Data[index];
        this.Data.splice(index, 1);
        this.Data.splice(index + 1, 0, item);

    }
    if (Direction == -1) {
        var index = arrayIndexOf(this.Data,Subject.DataOrig);
        var item = this.Data[index];
        this.Data.splice(index, 1);
        this.Data.splice(index - 1, 0, item);

    }
    this.LoadChildren(Subject);
    this.DataEditor.PendingChange();
    this.Changed = true;
}

DataNode.prototype.Insert = function (Subject, Overwrite) {
    if (Overwrite != null) {
        this.Data[Overwrite] = Subject;
    }
    else {
        this.Data[this.Data.length] = Subject;
    }
    this.Open();


    this.LoadChildren(Subject);
    this.DataEditor.PendingChange();
    this.Changed = true;
}


DataNode.prototype.PathToRoot = function (Path) {
    if (this.Parent != null) this.Parent.PathToRoot(Path);
    if (this.Type == "Complex") Path[Path.length] = this;
}

DataNode.prototype.PrepareEdit = function (Var, Type, IsMultiLang, CheckChanged, NewValue) {
    var eh = this.Edits[Var];
    if (eh == null) {
        eh = { "Type": Type, "Before": {}, "After": {} };
        this.Edits[Var] = eh;
    }
    var l = (IsMultiLang ? lang : -1);
    var val = null;
    var def = null;
    if (Type == "V") {
        val = system.GetDataValue(this.Data, Var, null);
        def = null;
    }
    else if (Type == "T") {
        val = system.GetDataText(this.Data, Var, null, true);
        def = null;
    }
    else if (Type == "N") {
        val = system.GetDataNode(this.Data, Var, null);
        def = null;
    }
    else if (Type == "F") {
        val = system.GetDataFileID(this.Data, Var, null, true);
        def = null;
    }
    else if (Type == "R") {
        val = system.GetDataReference(this.Data, Var, null);
        def = null;
    }


    if (!(l.toString() in eh.Before)) {

        if ("0" in eh.Before) {
            eh.After[l.toString()] = eh.After["0"];
            eh.Before[l.toString()] = eh.After[l.toString()]
        }
        else if ("-1" in eh.Before) {
            eh.After[l.toString()] = eh.After["-1"];
            eh.Before[l.toString()] = eh.After[l.toString()]
        }
        else {
            eh.Before[l.toString()] = val;
            eh.After[l.toString()] = eh.Before[l.toString()]
        }
    }
    if (CheckChanged) {
        eh.After[l.toString()] = NewValue;
        var changed = eh.After[l.toString()] != eh.Before[l.toString()];
        if (changed && IsMultiLang) {
            if (l == -1) {
                for (var i in eh.Before) {
                    if (i != "-1") {
                        delete eh.Before[i];
                        delete eh.After[i];
                    }
                }
            }
            if (l != -1 && ("-1" in eh.Before)) {
                if (eh.Before["-1"] != eh.After["-1"]) {
                    eh.Before["0"] = eh.Before["-1"];
                    eh.After["0"] = eh.After["-1"];
                }
                delete eh.Before["-1"];
                delete eh.After["-1"];
            }
        }
        if (changed) this.DataEditor.PendingChange();
        this.Changed = true;
        return changed;
    }
    else {
        if (eh.After[l.toString()] == null) return def;
        else return eh.After[l.toString()];
    }
    return null;
}

DataNode.prototype.UpdateName = function () {
    if (this.Type == 'Complex') {
        if (this.Data.P != null) {
            this.label = system.GetDataText(system.GetKnownNodeData(this.Data.P), "Name", "", false);
        }
        else {
            this.label = '';
        }
        this.name.innerHTML = this.label + ':';
        if (this.Name == '') {
            this.CalculateParentName(this.Data, this.value, "innerHTML");
        }
        else {
            this.value.innerHTML = system.GetDataText(this.Parent.Def[this.Name], "FullName", this.Name, false);
        }

        if (this.debug) {
            this.debug.innerHTML = "<SMALL><SMALL>" + ((this.Data.P != null) ? "&nbsp;" + this.Data.P : '') + ((this.Data.L != null) ? ",&nbsp;" + this.Data.L : '') + "</SMALL></SMALL>";
        }
    }
    else {
        this.name.innerHTML = system.GetDataText(this.Def, "FullName", null, false);

        if (this.debug) {
            var d = system.GetDataText(this.Def, "Name", '', false);
            this.debug.innerHTML = "<SMALL><SMALL>&nbsp;" + d + ((this.Data.P != null) ? ",&nbsp;" + this.Data.P : '') + ((this.Data.L != null) ? ",&nbsp;" + this.Data.L : '') + "</SMALL></SMALL>";
        }
    }


}

DataNode.prototype.CalculateParentName = function (Data, Component, Var) {
    var p = system.GetPropertyType(Data.P);
    for (var i in p) {
        if (system.GetDataValue(p[i], "IsParentName", 0) == 1) {
            system.SetComponentDataStringValue(Data, i, "", Component, Var);
        }
    }
}

DataNode.prototype.Cancel = function () {
    for (var i in this.Children) {
        this.Children[i].Cancel();
    }
    if (this.Changed) {
        this.Reset();
        this.LoadChildren();
        this.Edits = [];
        this.UpdateStatus(true);
        this.Changed = false;
    }

}

function TextUpdate(Data, Var, Lang, PendingChanges) {
    this.Data = Data;
    this.Var = Var;
    this.Lang = Lang;
    this.PendingChanges = PendingChanges;
}

DataNode.prototype.Apply = function (p) {
    if (this.Changed) p.previewUpdates[p.previewUpdates.length] = this;

    for (var i in this.Children) {
        this.Children[i].Apply(p);
    }

    if (this.Changed) {

        this.Set();

        for (var e in this.Edits) {
            for (var j in this.Edits[e].Before) {
                if (this.Edits[e].Before[j] != this.Edits[e].After[j]) {
                    var Type = this.Edits[e].Type;
                    var Val = this.Edits[e].After[j];
                    if (Type == "V") {
                        val = system.saveValueData(this.DataOrig, e, Val, null);
                    }
                    else if (Type == "T") {

                        if (Val != null) {
                            p.AddJob();
                            system.createText(Val, function (id, Object) {
                                val = system.saveTextData(Object.Data, Object.Var, id, null, Object.Lang);
                                Object.PendingChanges.OneDone();
                            }, new TextUpdate(this.DataOrig, e, j, p));
                        }
                        else {
                            val = system.saveTextData(this.DataOrig, e, Val, null, j);
                        }
                    }
                    else if (Type == "N") {
                        val = system.saveNodeData(this.DataOrig, e, Val, null);
                    }
                    else if (Type == "F") {
                        val = system.saveResourceData(this.DataOrig, e, Val, null, j);
                    }
                    else if (Type == "R") {
                        val = system.saveReferenceData(this.DataOrig, e, Val, null);
                    }
                }
            }
        }

    }
}

DataNode.prototype.Set = function () {
    if (this.Type == "Array") {
        this.DataOrig.splice(0, this.DataOrig.length);
        for (var i in this.Data) {
            this.DataOrig[i] = this.Data[i];
        }
    }
    else {

        for (var i in this.Data) {
            if (i == "L" && this.DataOrig[i] != this.Data[i]) {

            }
            else {
                this.DataOrig[i] = this.Data[i];
            }
        }
    }
}

DataNode.prototype.Reset = function () {
    if (this.Type == "Array") {
        this.Data = [];
        for (var i in this.DataOrig) {
            this.Data[i] = this.DataOrig[i];
        }
    }
    else {
        this.Data = {};
        for (var i in this.DataOrig) {
            this.Data[i] = this.DataOrig[i];
        }
    }
}

//
//editor
//
function Inserter(Owner, Type, EmptyObject, Name, Editor, Click, level) {
    this.Click = Click;

    this.pb = new PortalButton(Owner, null, level + 6, EmptyObject, Name, Click);
    this.border = this.pb.container;
    
    this.Type = Type;
    this.Owner = Owner;
    this.EmptyObject = EmptyObject;
    this.Editor = Editor;
    this.img = html.createElement(this.pb.container, "IMG");
    this.img.src = system.GetCustomerConfigResource('UI/WYSIWYGEditor/IMG_Add');
    this.img.style.position = 'absolute';
    this.img.style.display = 'none';
    this.img.style.width = '32px';
    this.img.style.height = '32px';
    this.img.style.left = '0px';
    this.img.style.top = '0px';
 
    html.addDragElement(this.border, this);
    this.DragDelta = function (x, y) {
        this.img.style.left =(x-16+this.startPos[0])+ 'px';
        this.img.style.top = (y-16 + this.startPos[1]) + 'px';

    }
    this.DragStart = function (x, y) {
        x = x + this.border.offsetLeft;
        y = y + this.border.offsetTop;
        this.img.style.left = (x - 16) + 'px';
        this.img.style.top = (y - 16) + 'px';
        this.img.style.display = '';
        this.startPos = [x, y];

    }
    this.NeedDropTarget = true;
    this.DragStop = function (x, y, target, offset) {
        this.img.style.display = 'none';

        if (x > -10 && x < 10 && y > -10 && y < 10 && this.clickable) {
            this.Click();
        }
        else if (target != null) {

            if (this.startPos[0] + x < 0 || this.startPos[0] + x > this.Editor.editLayer.offsetWidth ||
            this.startPos[1] + y < 0 || this.startPos[1] + y > this.Editor.editLayer.offsetHeight) {

                if (target != null) {
                    if (this.parentTypes[target.Data.P]) {
                        if (Editor.EditInsert(target, this.Type, system.cloneData(this.EmptyObject), offset)) return true;
                    }
                }
            }
        }
        return false;
    }
    this.parentTypes = {};
}

Inserter.prototype.Hide = function () {
    this.pb.UpdateToolboxItem(false, false);
}
Inserter.prototype.Show = function (clickable, parentType) {
    this.clickable = clickable;
    this.pb.UpdateToolboxItem(true, clickable);
    if (parentType != null) {
        this.parentTypes[parentType] = true;
    }
}

Editor.prototype.EditInsert = function (target, type, data, offset) {
    if (target.EditIsActive == null || target.EditIsActive()) {
        if (target.EditInsert) {
            return target.EditInsert(type, data, offset, this);
        }
    }
}

Editor.prototype.EditTryInsert = function (type, data, offset) {
    return this.Block.EditTryInsert(type, data, offset, this);
}

function Operation(Owner, Option, Editor) {

    this.Element = Element;
    this.Option = Option;
    this.Editor = Editor;

    this.img = html.createElement(Owner, "IMG");
    if (this.Option == "FRONT") {
        this.img.src = system.GetCustomerConfigResource('UI/WYSIWYGEditor/IMG_BringToFront');
    }
    else if (this.Option == "DELETE") {
        this.img.src = system.GetCustomerConfigResource('UI/WYSIWYGEditor/IMG_Delete'); ;
    }
    else if (this.Option == "CROPJPG") {
        this.img.src = system.GetCustomerConfigResource('UI/WYSIWYGEditor/IMG_CropJPG'); ;
    }
    else if (this.Option == "CROPPNG") {
        this.img.src = system.GetCustomerConfigResource('UI/WYSIWYGEditor/IMG_CropPNG'); ;
    }
    this.img.style.position = 'absolute';
    this.img.style.width = '32px';
    this.img.style.height = '32px';
    var _this = this;
    this.img.onclick = function () {
        if (_this.Option == "FRONT") {
            _this.Editor.GenericDataEditComponent.apply(function () { });
            if (_this.Control.Front()) {
                _this.Editor.GenericDataEditComponent.WYSIWYGUpdate(_this.Control.EditParent, true, false);
            }
        }
        else if (_this.Option == "DELETE") {
            _this.Editor.GenericDataEditComponent.apply(function () { });
            if (_this.Control.Delete()) {
                _this.Editor.selectElement(null, null);
                _this.Editor.GenericDataEditComponent.WYSIWYGUpdate(_this.Control.EditParent, true, false);
            }
        }
        else if (_this.Option == "CROPJPG") {
            _this.Editor.GenericDataEditComponent.apply(function () { });
            if (_this.Control.Crop(function () {
                _this.Editor.GenericDataEditComponent.WYSIWYGUpdate(_this.Control, false, true);

            }, "JPG")) {
            }
        }
        else if (_this.Option == "CROPPNG") {
            _this.Editor.GenericDataEditComponent.apply(function () { });
            if (_this.Control.Crop(function () {
                _this.Editor.GenericDataEditComponent.WYSIWYGUpdate(_this.Control, false, true);

            },"PNG")) {
            }
        }
    }

    this.setPosition = function (Element, Control, pos) {
        this.Element = Element;
        this.Control = Control;
        this.img.style.display = '';
        if (this.Option == "FRONT") {
            this.img.style.left = (pos[0] + this.img.offsetWidth / 2) + 'px';
            this.img.style.top = (pos[1] - this.img.offsetHeight ) + 'px';
        }
        else if (this.Option == "DELETE") {
            this.img.style.left = (pos[0] + this.img.offsetWidth * 3 / 2) + 'px';
            this.img.style.top = (pos[1] - this.img.offsetHeight) + 'px';
        }
        else if (this.Option == "CROPJPG") {
            this.img.style.left = (pos[0] + this.img.offsetWidth * 5 / 2) + 'px';
            this.img.style.top = (pos[1] - this.img.offsetHeight) + 'px';
        }
        else if (this.Option == "CROPPNG") {
            this.img.style.left = (pos[0] + this.img.offsetWidth * 7 / 2) + 'px';
            this.img.style.top = (pos[1] - this.img.offsetHeight) + 'px';
        }

    }
    this.hide = function () {
        this.img.style.display = 'none';
    }
}

function Mover(Owner, Option, Editor) {
    

    this.Element = Element;
    this.Option = Option;
    this.Editor = Editor;

    this.img = html.createElement(Owner, "IMG");
    this.img.src = system.GetCustomerConfigResource('UI/WYSIWYGEditor/IMG_Move') ;
    this.img.style.position = 'absolute';

    if (this.Option == "MOVE") {
        this.img.src = system.GetCustomerConfigResource('UI/WYSIWYGEditor/IMG_Move'); ;
        this.img.style.width = '32px';
        this.img.style.height = '32px';
    }
    else if (this.Option == "SIZE") {
        this.img.src = system.GetCustomerConfigResource('UI/WYSIWYGEditor/IMG_Resize') ;
        this.img.style.width = '32px';
        this.img.style.height = '32px';
    }
    else if (this.Option == "EDITMOVE") {
        this.img.src = system.GetCustomerConfigResource('UI/WYSIWYGEditor/IMG_Translate') ;
        this.img.style.width = '24px';
        this.img.style.height = '24px';
    }
    else if (this.Option == "EDITSIZE") {
        this.img.src = system.GetCustomerConfigResource('UI/WYSIWYGEditor/IMG_Scale') ;
        this.img.style.width = '24px';
        this.img.style.height = '24px';
    }
    else if (this.Option == "EDITROT") {
        this.img.src = system.GetCustomerConfigResource('UI/WYSIWYGEditor/IMG_Rotate') ;
        this.img.style.width = '24px';
        this.img.style.height = '24px';
    }


    this.setPosition = function (Element, Control, pos) {
        this.Element = Element;
        this.Control = Control;
        this.img.style.display = '';
        if (this.Option == "MOVE") {
            this.img.style.left = (pos[0] - this.img.offsetWidth*2 /3 ) + 'px';
            this.img.style.top = (pos[1] - this.img.offsetHeight*2 /3 ) + 'px';
        }
        else if (this.Option == "SIZE") {
            this.img.style.left = (pos[0] + this.Element.offsetWidth - this.img.offsetWidth / 3 ) + 'px';
            this.img.style.top = (pos[1] + this.Element.offsetHeight - this.img.offsetHeight / 3 ) + 'px';
        }
        else if (this.Option == "EDITMOVE") {
            this.img.style.left = (pos[0] + this.Element.offsetWidth/2 - this.img.offsetWidth *3/ 2) + 'px';
            this.img.style.top = (pos[1] + this.Element.offsetHeight/2 - this.img.offsetHeight / 2) + 'px';
        }
        else if (this.Option == "EDITSIZE") {
            this.img.style.left = (pos[0] + this.Element.offsetWidth/2 - this.img.offsetWidth / 2) + 'px';
            this.img.style.top = (pos[1] + this.Element.offsetHeight/2 - this.img.offsetHeight / 2) + 'px';
        }
        else if (this.Option == "EDITROT") {
            this.img.style.left = (pos[0] + this.Element.offsetWidth/2 + this.img.offsetWidth / 2) + 'px';
            this.img.style.top = (pos[1] + this.Element.offsetHeight/2 - this.img.offsetHeight / 2) + 'px';
        }

    }
    this.hide = function () {
        this.img.style.display = 'none';
    }

    html.addDragElement(this.img, this);
    this.DragDelta = function (x, y) {
        if (this.Option == "MOVE") {
            //this.Editor.GenericDataEditComponent.apply();
            if (this.Control.MoveDelta(x, y)) {
                //this.Editor.GenericDataEditComponent.WYSIWYGUpdate(this.Control, false, true);
                this.Editor.updateEditRectPosition();
            }
        }
        else if (this.Option == "SIZE") {
            //this.Editor.GenericDataEditComponent.apply();
            if (this.Control.SizeDelta(x, y)) {
                //this.Editor.GenericDataEditComponent.WYSIWYGUpdate(this.Control, false, true);
                this.Editor.updateEditRectPosition();
            }
        }
        else if (this.Option == "EDITMOVE") {
            //this.Editor.GenericDataEditComponent.apply();
            if (this.Control.editTranslate(x, y)) {
                //this.Editor.GenericDataEditComponent.WYSIWYGUpdate(this.Control, false, true);
            }
        }
        else if (this.Option == "EDITSIZE") {
            //this.Editor.GenericDataEditComponent.apply();
            if (this.Control.editScale(x)) {
                //this.Editor.GenericDataEditComponent.WYSIWYGUpdate(this.Control, false, true);
            }
        }
        else if (this.Option == "EDITROT") {
            //this.Editor.GenericDataEditComponent.apply();
            if (this.Control.editRotate(x)) {
                //this.Editor.GenericDataEditComponent.WYSIWYGUpdate(this.Control, false, true);
            }
        }

    }
    this.DragStart = function () {
        this.Editor.GenericDataEditComponent.apply(function () { });
        this.Control.ResetDelta();

    }
    this.DragStop = function (x, y) {
        this.Editor.GenericDataEditComponent.WYSIWYGUpdate(this.Control, false, true);

    }






}



function GridLine(Owner, Horizontal) {
    this.Line = html.createElement(Owner, "DIV");
    this.Line.style.position = 'absolute';
    this.Line.style.backgroundColor = 'rgba(128,128,128,0.5)';
    this.Horizontal = Horizontal;


}

GridLine.prototype.Place = function (Left, Top, Size) {
    if (this.Horizontal) {
        this.Line.style.height = '1px';
        this.Line.style.width = Size + 'px';
    }
    else {
        this.Line.style.height = Size + 'px';
        this.Line.style.width = '1px';
    }
    this.Line.style.left = Left + 'px';
    this.Line.style.top = Top + 'px';
    this.Line.style.display = '';
}

GridLine.prototype.Hide = function () {
    this.Line.style.display = 'none';
}

function Grid(Owner) {
    this.Owner = Owner;
    this.VerGridLines = [];
    this.HorGridLines = [];
}

Grid.prototype.Hide = function () {
    for (var x = 0; x <= this.Cols; x++) {
        this.VerGridLines[x].Hide();
    }
    for (var x = 0; x <= this.Rows; x++) {
        this.HorGridLines[x].Hide();
    }
}

Grid.prototype.Place = function (Left, Top, Cols, ColWidth, Rows, RowHeight) {
    this.Rows = Rows;
    this.Cols = Cols;
    for (var x = 0; x <= Cols; x++) {
        if (this.VerGridLines[x] == null) this.VerGridLines[x] = new GridLine(this.Owner, false);
        this.VerGridLines[x].Place(Left + x * ColWidth, Top, Rows * RowHeight);
    }
    for (var x = 0; x <= Rows; x++) {
        if (this.HorGridLines[x] == null) this.HorGridLines[x] = new GridLine(this.Owner, true);
        this.HorGridLines[x].Place(Left, Top + x * RowHeight, Cols * ColWidth);
    }

}

function Editor(Owner, Block) {
    this.Block = Block;
    this.Owner = Owner;


    this.EditViewing = function (types) {
        this.Block.EditViewing(types);
    }
    var _this = this;

    this.GridLayer = html.createElement(Owner, "DIV");

    this.GridOverlay = new Grid(this.GridLayer);


    this.hoverRectLeft = html.createElement(Owner, "DIV");
    this.hoverRectLeft.style.position = 'absolute';
    this.hoverRectLeft.style.width = '1px';
    this.hoverRectLeft.style.backgroundColor = 'blue';

    this.hoverRectTop = html.createElement(Owner, "DIV");
    this.hoverRectTop.style.position = 'absolute';
    this.hoverRectTop.style.height = '1px';
    this.hoverRectTop.style.backgroundColor = 'blue';

    this.hoverRectRight = html.createElement(Owner, "DIV");
    this.hoverRectRight.style.position = 'absolute';
    this.hoverRectRight.style.width = '1px';
    this.hoverRectRight.style.backgroundColor = 'blue';

    this.hoverRectBottom = html.createElement(Owner, "DIV");
    this.hoverRectBottom.style.position = 'absolute';
    this.hoverRectBottom.style.height = '1px';
    this.hoverRectBottom.style.backgroundColor = 'blue';

    this.editRectLeft = html.createElement(Owner, "DIV");
    this.editRectLeft.style.position = 'absolute';
    this.editRectLeft.style.width = '1px';
    this.editRectLeft.style.backgroundColor = 'red';

    this.editRectTop = html.createElement(Owner, "DIV");
    this.editRectTop.style.position = 'absolute';
    this.editRectTop.style.height = '1px';
    this.editRectTop.style.backgroundColor = 'red';

    this.editRectRight = html.createElement(Owner, "DIV");
    this.editRectRight.style.position = 'absolute';
    this.editRectRight.style.width = '1px';
    this.editRectRight.style.backgroundColor = 'red';

    this.editRectBottom = html.createElement(Owner, "DIV");
    this.editRectBottom.style.position = 'absolute';
    this.editRectBottom.style.height = '1px';
    this.editRectBottom.style.backgroundColor = 'red';

    this.editMove = new Mover(Owner, "MOVE", this);
    this.editSize = new Mover(Owner, "SIZE", this);
    this.editEditMove = new Mover(Owner, "EDITMOVE", this);
    this.editEditSize = new Mover(Owner, "EDITSIZE", this);
    this.editEditRot = new Mover(Owner, "EDITROT", this);
    this.editFront = new Operation(Owner, "FRONT", this);
    this.editDelete = new Operation(Owner, "DELETE", this);
    this.editCropJPG = new Operation(Owner, "CROPJPG", this);
    this.editCropPNG = new Operation(Owner, "CROPPNG", this);


    this.editLayer = html.createElement(Owner, "DIV");
    this.editLayer.style.position = 'absolute';
    //this.editLayer.style.right = '5px';
    this.editLayer.style.backgroundColor = '#FFFFFF';
    this.editLayer.style.background = '-ms-linear-gradient(top, #FFFFFF, #B0B0B0)';
    this.editLayer.style.background = '-webkit-linear-gradient(top, #FFFFFF, #B0B0B0)';
    this.editLayer.style.background = '-moz-linear-gradient(top, #FFFFFF, #B0B0B0)';
    this.editLayer.style.padding = '5px';
    this.editLayer.style.top = '20px';
    this.editLayer.style.border = '1px solid B0B0B0';
    this.editLayer.style.width = '350px';
    this.editLayer.style.zIndex = 2;

    this.caption = html.createElement(this.editLayer, "DIV");
    this.caption.innerHTML = system.GetCustomerConfigText("UI/WYSIWYGEditor/TXT_Title");
    this.caption.style.backgroundColor = '#FFFFFF';
    this.caption.style.padding = '5px';
    this.caption.style.cursor = 'default';

    this.dock = 0;
    this.knownParentWidth = this.editLayer.offsetParent.offsetWidth;
    this.editLayer.style.left = (this.knownParentWidth - 300 - 20 - 10) + 'px';

    this.ArrangeControls = function (maxHeight, fill) {
        var h = 0;
        var dh = this.caption.offsetHeight;
        html.position(this.caption, 0, h, 0, null, null, null);
        h += dh;
        dh = this.DataNodeSave.offsetHeight;
        html.position(this.DataNodeSave, 0, h, 0, null, null, null);
        h += dh;
        html.position(this.editAll, 0, h, 0, 0, null, null);

        var eh = 0;
        if (html.editing) {
            var vh0 = 0;
            if (this.treeExpanded) {
                vh0 = this.DataNodeTree.offsetHeight;
            }
            var vh1 = this.DataControls.offsetHeight;
            var vh2 = this.DataInserters.offsetHeight;
            var vh3 = this.DataNodeEdit.offsetHeight;

            if (this.collapsed) {
                this.DataNodeApply.style.display = 'none';
                this.TreeExpander.style.display = 'none';
                this.DataNodeTree.style.display = 'none';
                this.DataControls.style.display = 'none';
                this.DataNodeEdit.style.display = 'none';
                html.position(this.DataInserters, 0, eh, 0, null, null, null);
                eh += vh2;

            }
            else {
                this.DataNodeApply.style.display = '';
                this.TreeExpander.style.display = '';
                //this.DataNodeTree.style.display = '';
                this.DataControls.style.display = '';
                this.DataNodeEdit.style.display = '';
                if (this.treeExpanded) {
                    this.icon.src = system.GetCustomerConfigResource('UI/Tree/IMG_Close');
                    this.DataNodeTree.style.display = '';
                }
                else {
                    this.icon.src = system.GetCustomerConfigResource('UI/Tree/IMG_Open');
                    this.DataNodeTree.style.display = 'none';
                }

                dh = this.DataNodeApply.offsetHeight;
                html.position(this.DataNodeApply, 0, 0, 0, null, null, null);
                eh += dh;
                dh = this.TreeExpander.offsetHeight;
                html.position(this.TreeExpander, 0, eh, 0, null, null, null);
                eh += dh;

                var rest = maxHeight - h - eh - vh1 - vh2;
                if (rest < 0) rest = 0;
                if (this.treeExpanded) {
                    vh0 = rest / 3;
                    vh3 = rest * 2 / 3;

                }
                else {
                    vh0 = 0;
                    vh3 = rest;
                }
                //else {
                html.position(this.DataNodeTree, 0, eh, 0, null, null, vh0);
                eh += vh0;
                html.position(this.DataControls, 0, eh, 0, null, null, null);
                eh += vh1;
                html.position(this.DataInserters, 0, eh, 0, null, null, null);
                eh += vh2;
                html.position(this.DataNodeEdit, 0, eh, 0, null, null, vh3);
                eh += vh3;
            }


            //}
        }

        return h + eh;
    }
    this.Resize = function (newx, newy) {
        var oldx = ExtractNumber(this.editLayer.style.left);
        var oldy = ExtractNumber(this.editLayer.style.top);
        if (newx == null) newx = oldx;
        if (newy == null) newy = oldy;
        try{
        var w = this.editLayer.offsetParent.offsetWidth;
        var h = this.editLayer.offsetParent.offsetHeight;
        }
        catch (err){
            return;
        }
        var d = this.dock;
        if (newx <= 0) {
            this.dock = -1;

        }
        else if (newx + 310 >= w) {
            this.dock = 1;
        }
        else if (this.knownParentWidth == this.editLayer.offsetParent.offsetWidth) {
            this.dock = 0;
        }
        if (this.dock == -1) {
            newx = 0;
            newy = 0;
        }
        if (this.dock == 1) {
            newx = w - 300 - 10;
            newy = 0;
        }
        if (this.dock == -1) {
            this.ArrangeControls(h - 10, true);
            html.position(this.editLayer, 0, 0, null, null, 300, h - 10);
            this.Block.Root.style.left = '310px';
            this.Block.Root.style.right = '0px';

        }
        else if (this.dock == 1) {
            this.ArrangeControls(h - 10, true);
            html.position(this.editLayer, w - 300 - 10, 0, null, null, 300, h - 10);
            this.Block.Root.style.left = '0px';
            this.Block.Root.style.right = '310px';
        }
        else {
            if (newy < 0) newy = 0;
            if (this.knownParentWidth != this.editLayer.offsetParent.offsetWidth) {
                if (this.knownParentWidth > 310) newx = oldx * (w - 310) / (this.knownParentWidth - 360);
            }
            var newh = h - 100;
            newh = this.ArrangeControls(newh, false);

            html.position(this.editLayer, newx, newy, null, null, 300, newh);
            this.Block.Root.style.left = '0px';
            this.Block.Root.style.right = '0px';
        }
        if (this.dock != d) {
            html.doCenterElements();
            this.selectElement(_this.selectedElement, _this.selectedControl);
        }
        this.knownParentWidth = w;
        if (this.GenericDataEditComponent) this.GenericDataEditComponent.DataFieldContainer.UpdateState();
    }

    html.addDragElement(this.caption, this);
    this.DragDelta = function (x, y) {
        var newx = (x + this.startPos[0]);
        var newy = (y + this.startPos[1]);
        this.Resize(newx, newy);
    }
    this.DragStart = function (x, y) {


        this.startPos = [ExtractNumber(_this.editLayer.style.left), ExtractNumber(_this.editLayer.style.top)];

    }
    this.DragStop = function (x, y, target, offset) {

        return false;
    }

    this.DataNodeSave = html.createElement(this.editLayer, "DIV");
    this.editAll = html.createElement(this.editLayer, "DIV");
    this.editAll.style.display = 'none';
    this.editAll.style.margin = '5px';
    this.editAll.style.width = '300px';
    this.DataNodeApply = html.createElement(this.editAll, "DIV");
    this.TreeExpander = html.createElement(this.editAll, "DIV");
    this.icon = html.createElement(this.TreeExpander, 'IMG');
    this.DataBreadCrums = html.createElement(this.TreeExpander, "SPAN");
    this.DataBreadCrums.style.backgroundColor = '#C0C0C0';
    this.DataNodeTree = html.createElement(this.editAll, "DIV");
    this.DataControls = html.createElement(this.editAll, "DIV");
    this.DataInserters = html.createElement(this.editAll, "DIV");
    this.DataNodeEdit = html.createElement(this.editAll, "DIV");
    this.DataNodeTree.style.overflow = 'auto';



    this.toggleTree = function (Expanded) {
        this.treeExpanded = Expanded;
        this.Resize();
    }
    this.toggleTree(false);
    this.icon.onclick = function () {
        _this.toggleTree(!_this.treeExpanded);
    }

    this.collapsed = false;
    this.expandButton = html.createElement(this.DataNodeSave, "INPUT");
    this.expandButton.type = 'button';
    this.expandButton.value = '^';
    this.expandButton.onclick = function () {
        _this.collapsed = !_this.collapsed;
        if (_this.collapsed) {

            _this.expandButton.value = 'v';

        }
        else {

            _this.expandButton.value = '^';


        }
        _this.Resize();
    }
    _this.expandButton.disabled = true;

    this.editButton = html.createElement(this.DataNodeSave, "INPUT");
    this.editButton.type = 'button';
    this.editButton.value = system.GetCustomerConfigText("UI/WYSIWYGEditor/TXT_Edit");
    this.editButton.onclick = function () {
        if (html.editing) {
            html.toggleEdit(false, _this);
            _this.editButton.value = system.GetCustomerConfigText("UI/WYSIWYGEditor/TXT_Edit");
            _this.hoverElement(null);
            _this.selectElement(null, null);
            _this.editAll.style.display = 'none';
            _this.expandButton.disabled = true;
            
        }
        else {
            html.toggleEdit(true, _this);
            _this.editButton.value = system.GetCustomerConfigText("UI/WYSIWYGEditor/TXT_StopEditing");
            _this.editAll.style.display = '';
            _this.expandButton.disabled = false;

        }
        _this.Resize();
    }
    html.toggleEdit(false, this);


    this.GenericDataEditComponent = new GenericDataEditComponent(true, this.DataNodeSave, this.DataNodeApply, this.DataBreadCrums, this.DataNodeTree, false, this.DataControls, this.DataNodeEdit, this.DataInserters, this);
    this.GenericDataEditComponent.WYSIWYGEditor = this;
    this.PreviewSelect = function (EditControl, Select) {
        if (html.editing && EditControl != null) {
            var element = html.editElements[arrayIndexOf(html.editControls,EditControl)];
            if (Select) {
                this.hoverElement(null);
                this.selectElement(element, EditControl, false);
            }
            else {
                if (EditControl.EditIsActive && EditControl.EditIsActive()) this.hoverElement(element);
                else this.hoverElement(null);
            }
        }
    }
    this.ChangeLanguage = function () {
        this.Block.UpdateData(true);
    }
    this.CreateInserter = function (propertytype, name, click, level) {
        var i = new Inserter(this.DataInserters, propertytype, { "P": propertytype }, name, this, click, level);
        return i;

    }

    this.GenericDataEditComponent.LoadData(this.Block.SLM.DataNode, this.Block.SLM.data, this.Block.SLM.nodetype);

    this.closeButton = html.createElement(this.DataNodeSave, "INPUT");
    this.closeButton.type = 'button';
    this.closeButton.value = system.GetCustomerConfigText("UI/WYSIWYGEditor/TXT_Close");
    this.closeButton.onclick = function () {
        _this.Block.SLM.Close();
    }


    this.editLevels = html.createElement(this.editLayer, "DIV");



    this.selectedElement = null;
    this.editables = null;

    this.findEditParents = function (editParents, control) {
        if (control.EditParent != null) this.findEditParents(editParents, control.EditParent);
        editParents[editParents.length] = control;
    }
    this.selectElement = function (element, control, force) {

        var newControl = (control != _this.selectedControl)
        if (force != null && force) newControl = true;
        this.GenericDataEditComponent.UpdateInserters();

        this.selectedControl = control;
        this.selectedElement = element;

        if (newControl && control != null) {
            if (control.EditIsActive) control.EditIsActive(true);
            var editParents = [];
            this.findEditParents(editParents, control);
            var ec = this.GenericDataEditComponent.FindByEditParents(editParents);
            if (ec != null) {
                var sel = ec.DataEditor.SelectedNode;

                if (!ec.selected) {
                    if (sel.Type != "Array" || sel.Parent != ec) {
                        ec.Select();
                    }
                }
                //ec.Select();
            }

        }



        this.editMove.hide();
        this.editSize.hide();
        this.editCropJPG.hide();
        this.editCropPNG.hide();

        this.editEditMove.hide();
        this.editEditSize.hide();
        this.editEditRot.hide();

        this.editFront.hide();
        this.editDelete.hide();

        this.GridOverlay.Hide();

        if (element == null) {
            this.editRectLeft.style.display = 'none';
            this.editRectTop.style.display = 'none';
            this.editRectRight.style.display = 'none';
            this.editRectBottom.style.display = 'none';
        }
        else {
            this.editRectLeft.style.display = '';
            this.editRectTop.style.display = '';
            this.editRectRight.style.display = '';
            this.editRectBottom.style.display = '';

            this.updateEditRectPosition();
        }

    }



    this.updateEditRectPosition = function () {
        if (this.selectedControl == null) return;
        var page = this.selectedControl.FindPage();
        if (page != null) {
            var pos = findPos(html.editElements[arrayIndexOf(html.editControls,page)]);
            this.GridOverlay.Place(pos[0], pos[1], page.Cols, page.ColWidth, page.Rows, page.RowHeight);
        }


        var pos = findPos(this.selectedElement);




        this.editRectLeft.style.left = pos[0] + 'px';
        this.editRectLeft.style.top = pos[1] + 'px';
        this.editRectLeft.style.height = (this.selectedElement.offsetHeight - 1) + 'px';
        this.editRectTop.style.left = pos[0] + 'px';
        this.editRectTop.style.top = pos[1] + 'px';
        this.editRectTop.style.width = (this.selectedElement.offsetWidth - 1) + 'px';
        this.editRectRight.style.left = (pos[0] + this.selectedElement.offsetWidth - 1) + 'px';
        this.editRectRight.style.top = pos[1] + 'px';
        this.editRectRight.style.height = (this.selectedElement.offsetHeight - 1) + 'px';
        this.editRectBottom.style.left = pos[0] + 'px';
        this.editRectBottom.style.top = (pos[1] + this.selectedElement.offsetHeight - 1) + 'px';
        this.editRectBottom.style.width = (this.selectedElement.offsetWidth - 1) + 'px';

        if (this.selectedControl.MoveDelta != null) {
            this.editMove.setPosition(this.selectedElement, this.selectedControl, pos);
        }
        if (this.selectedControl.SizeDelta != null) {
            this.editSize.setPosition(this.selectedElement, this.selectedControl, pos);

        }
        if (this.selectedControl.Front != null) {
            this.editFront.setPosition(this.selectedElement, this.selectedControl, pos);
        }
        if (this.selectedControl.Delete != null) {
            this.editDelete.setPosition(this.selectedElement, this.selectedControl, pos);
        }
        if (this.selectedControl.Crop != null) {
            this.editCropJPG.setPosition(this.selectedElement, this.selectedControl, pos);
            this.editCropPNG.setPosition(this.selectedElement, this.selectedControl, pos);
        }

        if (this.selectedControl.editTranslate != null) {
            this.editEditMove.setPosition(this.selectedElement, this.selectedControl, pos);
        }
        if (this.selectedControl.editScale != null) {
            this.editEditSize.setPosition(this.selectedElement, this.selectedControl, pos);
        }
        if (this.selectedControl.editRotate != null) {
            this.editEditRot.setPosition(this.selectedElement, this.selectedControl, pos);
        }

    }

    this.hoverElement = function (element) {

        if (element == null) {
            this.hoverRectLeft.style.display = 'none';
            this.hoverRectTop.style.display = 'none';
            this.hoverRectRight.style.display = 'none';
            this.hoverRectBottom.style.display = 'none';
        }
        else {
            this.hoverRectLeft.style.display = '';
            this.hoverRectTop.style.display = '';
            this.hoverRectRight.style.display = '';
            this.hoverRectBottom.style.display = '';

            var pos = findPos(element);

            this.hoverRectLeft.style.left = pos[0] + 'px';
            this.hoverRectLeft.style.top = pos[1] + 'px';
            this.hoverRectLeft.style.height = (element.offsetHeight - 1) + 'px';
            this.hoverRectTop.style.left = pos[0] + 'px';
            this.hoverRectTop.style.top = pos[1] + 'px';
            this.hoverRectTop.style.width = (element.offsetWidth - 1) + 'px';
            this.hoverRectRight.style.left = (pos[0] + element.offsetWidth - 1) + 'px';
            this.hoverRectRight.style.top = pos[1] + 'px';
            this.hoverRectRight.style.height = (element.offsetHeight - 1) + 'px';
            this.hoverRectBottom.style.left = pos[0] + 'px';
            this.hoverRectBottom.style.top = (pos[1] + element.offsetHeight - 1) + 'px';
            this.hoverRectBottom.style.width = (element.offsetWidth - 1) + 'px';
        }

    }


    addEvent(window,'resize',
            function () {
                _this.selectElement(_this.selectedElement, _this.selectedControl);
                _this.Resize();
            });
    this.Resize();


    this.selectElement(null, null);
}





//
//export
//
function Export(Owner, SelectedNode, StartExport) {
    var _this = this;
    this.Owner = Owner;
    this.StartExport = StartExport;
    this.SelectedNode = SelectedNode;

    this.CloseQuery = function (Done) {
        if (Done != null) Done();
    }

    this.contentLayer = Owner;
    this.contentLayer.innerHTML = '';
    this.title = html.createElement(this.contentLayer, "H1");
    this.title.innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Title");

    this.startExportLayer = html.createElement(this.contentLayer, "DIV");
    this.viewExportLayer = html.createElement(this.contentLayer, "DIV");

    this.refreshButton = html.createElement(this.viewExportLayer, "INPUT");
    this.refreshButton.type = 'button';
    this.refreshButton.value = system.GetCustomerConfigText("UI/Export/TXT_Refresh");
    this.refreshButton.onclick = function () {
        _this.load();
    }

    this.startScorm = html.createElement(this.startExportLayer, "INPUT");
    this.startScorm.type = "radio";
    this.startScorm.name = "TYPE";
    this.startScorm.checked = true;
    this.startScorm.value = "SCORM";
    html.createElement(this.startExportLayer, 'SPAN').innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Type_OfflineSCORM");
    html.createElement(this.startExportLayer, "BR");

    /*this.startCLP = html.createElement(this.startExportLayer, "INPUT");
    this.startCLP.type = "radio";
    this.startCLP.name = "TYPE";
    this.startCLP.value = "CLP";
    html.createElement(this.startExportLayer, 'SPAN').innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Type_CLP");
    html.createElement(this.startExportLayer, "BR");*/

    this.startText = html.createElement(this.startExportLayer, "INPUT");
    this.startText.type = "radio";
    this.startText.name = "TYPE";
    this.startText.value = "TEXT";
    html.createElement(this.startExportLayer, 'SPAN').innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Type_Text");
    html.createElement(this.startExportLayer, "BR");
    var s = html.createElement(this.startExportLayer, 'DIV');
    s.style.marginLeft = '20px';
    this.checkTXT = html.createElement(s, "INPUT");
    this.checkTXT.type = "checkbox";
    this.checkTXT.value = "TXT";
    this.checkTXT.checked = true;
    html.createElement(s, 'SPAN').innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Item_Text");
    html.createElement(s, "BR");
    this.checkIMG = html.createElement(s, "INPUT");
    this.checkIMG.type = "checkbox";
    this.checkIMG.value = "IMG";
    this.checkIMG.checked = true;
    html.createElement(s, 'SPAN').innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Item_Images");
    html.createElement(s, "BR");
    this.checkOther = html.createElement(s, "INPUT");
    this.checkOther.type = "checkbox";
    this.checkOther.value = "OTHER";
    html.createElement(s, 'SPAN').innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Item_Other");
    html.createElement(s, "BR");
    this.checkIDs = html.createElement(s, "INPUT");
    this.checkIDs.type = "checkbox";
    this.checkIDs.value = "ID";
    html.createElement(s, 'SPAN').innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Item_IDs");
    html.createElement(s, "BR");
    this.checkPackage = html.createElement(s, "INPUT");
    this.checkPackage.type = "checkbox";
    this.checkPackage.value = "PACKAGE";
    this.checkPackage.checked = true;
    html.createElement(s, 'SPAN').innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Item_Package");
    html.createElement(s, "BR");

    this.startQ = html.createElement(this.startExportLayer, "INPUT");
    this.startQ.type = "radio";
    this.startQ.name = "TYPE";
    this.startQ.value = "Q";
    html.createElement(this.startExportLayer, 'SPAN').innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Type_Q");
    html.createElement(this.startExportLayer, "BR");


    this.startT = html.createElement(this.startExportLayer, "INPUT");
    this.startT.type = "radio";
    this.startT.name = "TYPE";
    this.startT.value = "T";
    html.createElement(this.startExportLayer, 'SPAN').innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Type_T");
    html.createElement(this.startExportLayer, "BR");


    var prefLang = system.GetDataNode(session.UserData, "Language", 0);
    if (prefLang == 0) prefLang = system.GetDataNode(system.CustomerData, "DefaultLanguage", prefLang);
    var languages = system.KnownNodesByType(453);

    this.targetLanguage = html.createElement(s, "SELECT");
    for (var i in languages) {
        var l = languages[i];
        var option = html.createElement(this.targetLanguage, "OPTION");
        option.text = system.GetDataText(l.data, "FullName", l.name, false);
        option.value = l.id.toString();
    }
    this.targetLanguage.value = prefLang.toString();


    this.startButton = html.createElement(this.startExportLayer, "INPUT");
    this.startButton.type = 'button';
    this.startButton.value = system.GetCustomerConfigText("UI/Export/TXT_Export");
    this.startButton.onclick = function () {
        _this.start();
    }




    this.start = function () {
        var exportType = 0;
        if (_this.startText.checked) exportType = 2;
        //if (_this.startCLP.checked) exportType = 3;
        if (_this.startQ.checked) exportType = 4;
        if (_this.startT.checked) exportType = 5;
        var data = { "TXT": _this.checkTXT.checked, "IMG": _this.checkIMG.checked, "OTHER": _this.checkOther.checked, "ID": _this.checkIDs.checked, "PACKAGE": _this.checkPackage.checked }
        system.doRequest({ "RequestType": 303, "SessionGuid": session.SessionGuid, "SubjectID": _this.SelectedNode, "ExportType": exportType, "TargetLanguage": ExtractNumber(_this.targetLanguage.value), "Data": data }, function (response, completed) {
            _this.load();
            _this.startExportLayer.style.display = 'none';
            _this.viewExportLayer.style.display = '';
        });
    }

    html.createElement(this.viewExportLayer, "BR");
    html.createElement(this.viewExportLayer, "BR");

    this.load = function () {
        this.refreshButton.disabled = true;
        system.doRequest({ "RequestType": 300, "SessionGuid": session.SessionGuid }, function (response, completed) {
            _this.ExportData = response.Data.Exports;
            _this.show();
            _this.refreshButton.disabled = false;
        });
    }


    this.show = function () {
        if (this.tab != null) {
            this.viewExportLayer.removeChild(this.tab);
        }
        var table = html.createElement(this.viewExportLayer, "TABLE");
        table.style.backgroundColor = '#eef0f2';
        html.addGradient(table, 'top', 'white', '#eef0f2');
        table.style.boxShadow = '1px 1px 4px #888';
        table.style.padding = '5px';

        this.tab = table;
        table.cellPadding = 10;
        var htmlr = document.createElement('tr');
        table.appendChild(htmlr);
        var htmlc;

        var headers = ['TXT_Header_Export', 'TXT_Header_Node', 'TXT_Header_Type', 'TXT_Header_Date', 'TXT_Header_Status'];
        var stat = ['TXT_Status_Init', 'TXT_Status_Data', 'TXT_Status_Code', 'TXT_Status_Modules', 'TXT_Status_Skin', 'TXT_Status_Resources', 'TXT_Status_Menu', 'TXT_Status_Finishing', 'TXT_Status_Complete', 'TXT_Status_Error', 'TXT_Status_Expired'];
        for (var i in headers) {
            htmlc = document.createElement('td');
            htmlr.appendChild(htmlc);
            htmlc.innerHTML = '<B>' + system.GetCustomerConfigText("UI/Export/" + headers[i]) + '</B>';
        }

        for (var i in this.ExportData) {

            var row = this.ExportData[i];
            htmlr = document.createElement('tr');
            table.appendChild(htmlr);
            htmlc = document.createElement('td');
            htmlr.appendChild(htmlc);
            if (row.Status < 8) {
                htmlc.innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Wait");
            }
            else if (row.Status == 8) {
                if (row.Extension == '') {
                    htmlc.innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Done");
                }
                else {
                    var ah = document.createElement('a');
                    htmlc.appendChild(ah);
                    ah.innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Download");
                    ah.href = 'Resource.aspx?eid=' + row.ExportID;
                    ah.target = '_blank';
                }
            }
            else if (row.Status > 8) {
                htmlc.innerHTML = system.GetCustomerConfigText("UI/Export/TXT_TryAgain");
            }

            htmlc = document.createElement('td');
            htmlr.appendChild(htmlc);


            if (row.Extension != '') {
                htmlc.innerHTML = row.NodeID;
                system.RequireNodeID(row.NodeID, htmlc, function (sender, node) {
                    sender.innerHTML = node.name;
                }, 1, false, 0);
            }
            else {
                htmlc.innerHTML = row.Filename;
            }


            var htmlc = document.createElement('td');
            htmlr.appendChild(htmlc);
            if (row.ExportType == 0) {
                htmlc.innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Type_OfflineSCORM");
            }
            else if (row.ExportType == 1) {
                htmlc.innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Type_Translate");
            }
            else if (row.ExportType == 2) {
                htmlc.innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Type_Text");
            }
            else if (row.ExportType == 3) {
                htmlc.innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Type_CLP");
            }
            else if (row.ExportType == 4) {
                htmlc.innerHTML = system.GetCustomerConfigText("UI/Export/TXT_Type_Q");
            }

            htmlc = document.createElement('td');
            htmlr.appendChild(htmlc);
            htmlc.innerHTML = eval('new' + row.Date.replace(/\//g, ' ')).getIsoDate();

            htmlc = document.createElement('td');
            htmlr.appendChild(htmlc);
            htmlc.innerHTML = system.GetCustomerConfigText("UI/Export/" + stat[row.Status]);
        }
    }

    if (this.StartExport) {
        this.viewExportLayer.style.display = 'none';
    }
    else {
        this.load();
        this.startExportLayer.style.display = 'none';
    }

   
}

//
//generic
//
var supportsTouch = 'createTouch' in document;



function GetRandomization(length) {
    var temp = [];
    for (var i = 0; i < length; i++) {
        temp[i] = i;
    }
    var result = [];
    for (var i = 0; i < length; i++) {
        var pick = Math.floor(Math.random() * (length-i));
        result[i] = temp[pick];
        temp[pick] = temp[length - i - 1];
    }
    return result;
}

function FixRedraw(element) {
    try {
        element.parentNode.style.cssText += "";
        element.parentNode.style.zoom = 1;
        element.style.cssText += "";
        element.style.zoom = 1;
    } catch (ex) { }
}

function getCookie(c_name) {
    var i, x, y, ARRcookies = document.cookie.split(";");
    for (i = 0; i < ARRcookies.length; i++) {
        x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
        x = x.replace(/^\s+|\s+$/g, "");
        if (x == c_name) {
            return unescape(y);
        }
    }
}

function addEvent(sender, ev, func) {
    if (sender.addEventListener && ev != 'playStateChange') {
        sender.addEventListener(ev, func, false);
    }
    else {
        if (ev == 'resize') ev = 'onresize';
        sender.attachEvent(ev, func);
    }
}

function stopVideos(elt) {
    var vs = elt.getElementsByTagName('video');
    for (i = 0; i < vs.length; i++) {
        vs[i].src = '';
    }
   
}


var html5 = !!document.createElement('video').canPlayType;
var ie7 = document.all && !document.querySelector;
var ie8 = document.all && document.querySelector && !document.addEventListener;
var mobile = (/iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase()));
var isIE = (navigator.userAgent.indexOf("MSIE") != -1);

function safeColor(color) {
    if (color == null) return null;
    var result = color;
    if (!html5 && color.toLowerCase().substr(0, 4) == 'rgba') {
        var f = color.indexOf('(');
        var i = color.lastIndexOf(',');
        result = 'rgb' + color.substring(f, i) + ')';
    }
    return result.trim();
}

function setOpacity(obj, o) {

    try {
        if (html5) {
            obj.style.opacity = o
        }
        else {
            if (o == null || o.toString() == '') obj.style.filter = '';
            else obj.style.filter = 'alpha(opacity='+Math.round(o*100)+')';

        }
    }
    catch (e) {

    }
}

if (!String.prototype.trim) {
    String.prototype.trim = function () { return this.replace(/^\s+|\s+$/g, ''); };
}

function arrayIndexOf(array, obj) {
    for (var i in array) {
        if (array[i] == obj) return ExtractNumber(i);
    }
    return -1;
}

function setCookie(c_name, value, exdays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
    document.cookie = c_name + "=" + c_value;
}

function FileSizeString(size) {
    if (size < 1000) return size + 'b';
    if (size < 1000000) return Math.round(size / 1024) + 'kb';
    return Math.round(size / 1024 / 1024) + 'Mb';
}

Date.prototype.getSmallDate = function () {
    return this.getFullYear() + '-' + (this.getMonth() + 1) + '-' + this.getDate();
}

Date.prototype.getIsoDate = function () {
    return this.getFullYear() + '-' + (this.getMonth()+1) + '-' + this.getDate() + ' ' +
    this.getHours() + ':' + this.getMinutes().padDigit() + ':' + this.getSeconds().padDigit();
}
Number.prototype.padDigit = function () {
    var n = this;
    return n = (n < 10) ? '0' + n : n;
}

function Extend(destination, source) {
    for (var property in source) {
        if (destination[property] == null) {
            destination[property] = source[property];
        }
    }
    return destination;
} 

function isArray(obj)
{
    return Object.prototype.toString.call(obj) == "[object Array]";
}

function findParent(node, search) {
    for (var i in search) {
        if (node == search[i]) return node;
    }
    if (node.parentNode == null) return null;
    return findParent(node.parentNode, search);
}

function findPos(obj) {
	var curleft = curtop = 0;
    if (obj && obj.offsetParent)
        do {
          
			curleft += obj.offsetLeft+obj.clientLeft;
			curtop += obj.offsetTop+obj.clientTop;
			var transform = html.getElementTransform(obj);
			if (transform != null) {
			    var m = /translateX\(([\-0-9]*)px\)/g.exec(transform);
			    if (m != null && m.length > 0)curleft += ExtractNumber(m[1]);
			}
    } while (obj = obj.offsetParent);
    return [curleft,curtop];
}


function ExtractNumber(value) {
    var n = parseInt(value);

    return n == null || isNaN(n) ? 0 : n;
}





function HTML() {
    this.LoadedFonts = [];

    this.Reset = function () {
        this.centerElements = [];
        this.dragElement = null;
        this.dragControl = null;
        this.dragElements = [];
        this.dragControls = [];
        this.dragX = 0;
        this.dragY = 0;
        this.editControl = null;
        this.editElement = null;
        this.editElements = [];
        this.editControls = [];
        this.editor = null;
        this.editing = false;
        this.editObservers = [];
        this.keyhandlers = [];
        this.lastkeyhandler = 0;

    }


    this.doCenterElements = function () {
        for (var i in _this.centerElements) {
            html.centerElement(_this.centerElements[i]);
        }
    }
    this.getCenterElement = function (elt) {
        for (var i in _this.centerElements) {
            if (_this.centerElements[i].Element == elt) return _this.centerElements[i];
        }
    }
    var _this = this;
    addEvent (window,'resize',
                function () {
                    _this.doCenterElements();
                });



    this.addDragElement = function (e, c) {
        if (_this.testDragElement(e) == -1) {
            _this.dragElements[_this.dragElements.length] = e;
            _this.dragControls[_this.dragControls.length] = c;
        }
    }
    this.testDragElement = function(e)
    {
        return arrayIndexOf(_this.dragElements, e);
    }
    this.removeDragElement = function (e) {
        var index = _this.testDragElement(e);
        if (index > -1) {
            _this.dragElements.splice(index, 1);
            _this.dragControls.splice(index, 1);
        }
    }


    this.addEditElement = function (e, c) {
        _this.editElements[_this.editElements.length] = e;
        _this.editControls[_this.editControls.length] = c;

    }
    this.findEditControlByData = function (data) {
        for (var ec in this.editControls) {
            if (this.editControls[ec].Data == data) return this.editControls[ec];
        }
    }


    this.toggleEdit = function (edit, editor) {
        this.editor = editor;
        this.editing = edit;
        for (var eo in this.editObservers) this.editObservers[eo](this.editing);
    }
    
    this.addEditObserver = function (o) {
        this.editObservers[this.editObservers.length] = o;
       
    }

    var stylesheet = document.createElement("style");
    stylesheet.setAttribute("type", "text/css");
    document.getElementsByTagName("head")[0].appendChild(stylesheet);
    this.stylesheet = document.styleSheets[document.styleSheets.length - 1];

    this.fileDragHover = function (e) {
        e.stopPropagation();
        e.preventDefault();

    }
    this.fileDrop = function (e) {
        e.stopPropagation();
        e.preventDefault();

    }


    addEvent(document,"dragover", this.fileDragHover);
    addEvent(document,"dragleave", this.fileDragHover);
    addEvent(document,"drop", this.fileDrop); 

    document.onkeydown = function (e) {
        if (e == null)
            e = window.event;
        var keyCode = ('which' in e) ? e.which : e.keyCode;
        if (keyCode == 16 || keyCode == 17 || keyCode == 18) return;
        for (var i in _this.keyhandlers) {
            if (_this.keyhandlers[i] != null) {
                try{
                    if (_this.keyhandlers[i](keyCode, e.ctrlKey, e.altKey, e.shiftKey)) {
                        if (e.cancelBubble) event.cancelBubble = true;
                        if (e.preventDefault) event.preventDefault();
                        return;
                    }
                }
                catch (err) {

                }
            }
        }
    }

    this.keyhandlers = [];
    this.lastkeyhandler = 0;
    this.regKeyHandler = function (handler) {
        var i = this.lastkeyhandler;
        this.lastkeyhandler++;
        this.keyhandlers[i.toString()] = handler;
        return i;
    }
    this.unregKeyHandler = function (index) {
        this.keyhandlers[index.toString()] = null;
    }



    document.onselectstart = function (e) {
        if (e == null)
            e = window.event;

        if (e.target != null) {
            if (e.target.nodeName == 'INPUT' || e.target.nodeName == 'TEXTAREA' || e.target.nodeName == 'VIDEO' || e.target.nodeName == 'OBJECT' || e.target.nodeName == 'A' || e.target.nodeName == 'SELECT' || e.target.nodeName == 'OPTION') return true;
        }
        return false;
    };

 

    var handler1 = function (e) {
        _this.lastTouch = null;
        if (e == null)
            e = window.event;
        if (supportsTouch && e.touches) {
            //e.preventDefault();
            if (e.touches.length == 1) {
                var oe = e;

                e = e.touches[0];
                _this.lastTouch = e;
                if (e.target.nodeName == 'INPUT' || e.target.nodeName == 'TEXTAREA' || e.target.nodeName == 'VIDEO' || e.target.nodeName == 'OBJECT' || e.target.nodeName == 'A' || e.target.nodeName == 'SELECT' || e.target.nodeName == 'OPTION') {
                    // alert(e.target.nodeName);
                }
                else {
                    //alert('prevent');
                    //oe.preventDefault();
                }

            }
            else return true;
        }

        if (e == null) return true;
        var target = e.target != null ? e.target : e.srcElement;
        if (_this.editing) {
            var findTarget = findParent(target, _this.editElements);
            if (findTarget != null) {
                _this.editor.selectElement(findTarget, _this.editControls[arrayIndexOf(_this.editElements,findTarget)]);
                return true;
            }


        }

        if (target != null) {
            //alert(e.target.nodeName);

            if (target.nodeName == 'INPUT' || target.nodeName == 'TEXTAREA' || target.nodeName == 'VIDEO' || target.nodeName == 'OBJECT' || target.nodeName == 'A' || target.nodeName == 'SELECT' || target.nodeName == 'OPTION') {

                return true;
            }
            else {

            }
        }

        var findTarget = findParent(target, _this.dragElements);


        if (findTarget != null) {

            _this.dragElement = findTarget;
            _this.dragControl = _this.dragControls[arrayIndexOf(_this.dragElements,findTarget)];
            //console.log(e.offsetX + ' - ' + e.layerX + ' - ' + e.clientX);
            //if (typeof e.layerX == 'undefined') {
                var pos = findPos(findTarget);
                var sx = e.clientX - pos[0];
                var sy = e.clientY - pos[1];
            //}
            _this.dragControl.DragStart(sx, sy);
            _this.dragX = -e.clientX;
            _this.dragY = -e.clientY;
            if (e.stopPropagation) e.stopPropagation();
            document.body.focus();



            return false;


        }
        // return true;

    }

    if (supportsTouch){
        document['ontouchstart'] = handler1;
    }
    document['onmousedown'] = handler1;


    var handler2 = function (e) {
        if (e == null) {
            e = window.event;
        }
        if (_this.dragElement == null && _this.editing) {
            var target = e.target != null ? e.target : e.srcElement;
            if (target != _this.editor.hoverRect && target != _this.editor.editRect) {
                var findTarget = findParent(target, _this.editElements);
                if (findTarget != null) {
                    _this.editor.hoverElement(findTarget);
                }
                else {
                    _this.editor.hoverElement(null);
                }
            }
        }


        if (_this.dragElement != null) {

            if (supportsTouch && e.touches) {
                if (e.touches.length == 1) {

                    e = e.touches[0];
                    _this.lastTouch = e;
                }
                else return;
            }

            _this.dragControl.DragDelta(_this.dragX + e.clientX, _this.dragY + e.clientY);
        }
    }

    if (supportsTouch) {
        document['ontouchmove'] = handler2;
    }
    document['onmousemove'] = handler2;


    var handler3 = function (e) {

        if (_this.dragElement != null) {
            if (e == null) {
                e = window.event;
            }
            if (supportsTouch && e.touches) {

                e = _this.lastTouch;
            }

            var findControl = null;
            var offset = null;

            if (_this.editing) {
                if (_this.dragControl.NeedDropTarget) {

                    for (var ee = _this.editElements.length - 1; ee >= 0; ee--) {
                        var findTarget = _this.editElements[ee];
                        offset = findPos(findTarget);
                        if (e.clientX > offset[0] && e.clientX < offset[0] + findTarget.offsetWidth
                    && e.clientY > offset[1] && e.clientY < offset[1] + findTarget.offsetHeight) {
                            var localOffset = [e.clientX - offset[0], e.clientY - offset[1]];
                            var findControl = _this.editControls[arrayIndexOf(_this.editElements,findTarget)];
                            if (_this.dragControl.DragStop(_this.dragX + e.clientX, _this.dragY + e.clientY, findControl, localOffset)) {
                                break;
                            }
                        }

                    }

                }
            }

            if (findControl == null) {
                _this.dragControl.DragStop(_this.dragX + e.clientX, _this.dragY + e.clientY, null, null);
            }

            _this.dragElement = null;
        }
    }
    if (supportsTouch) {
        document['ontouchend'] = handler3;
    }
    document['onmouseup'] = handler3;

}

var html = new HTML();




HTML.prototype.createElement = function (Owner, ElementType) {
    var element = document.createElement(ElementType);
    element.style.zIndex = 1;
    element.ondragstart = function () { return false; };

    if (Owner != null) Owner.insertBefore(element, null);
    return element;
}

HTML.prototype.insertElement = function (Owner, ElementType, Before) {
    var element = document.createElement(ElementType);

    element.ondragstart = function () { return false; };
 
    if (Owner != null) Owner.insertBefore(element, Before);
    return element;
}

HTML.prototype.styleElement = function (Element, Style) {
    if (Style == null || Element == null) return;
    html.checkRTL(Element);
    Element.style.position = system.GetDataText(Style, "Position", 'absolute', false);
    Element.style.width = system.GetDataText(Style, "Width", null, false);
    var h = system.GetDataText(Style, "Height", null, false);
    if (h != null) Element.style.height = system.GetDataText(Style, "Height", null, false);
    Element.style.left = system.GetDataText(Style, "Left", null, false);
    Element.style.right = system.GetDataText(Style, "Right", null, false);
    Element.style.top = system.GetDataText(Style, "Top", null, false);
    Element.style.bottom = system.GetDataText(Style, "Bottom", null, false);

    try {
        Element.style.fontFamily = system.GetDataText(Style, "FontFamily", null, false);
        if (Style.FontFace) {
            if (Style.FontFace.Family && (Style.FontFace.Source||Style.FontFace.SourceEOT||Style.FontFace.SourceWOFF||Style.FontFace.SourceSVG)) {
                html.loadFont(Style.FontFace);
            }
            if (Style.FontFace.Family) {
                Element.style.fontFamily = system.GetDataText(Style, "FontFace/Family", null, false);
            }
        }
        Element.style.fontSize = system.GetDataText(Style, "FontSize", null, false);
        Element.style.fontWeight = system.GetDataText(Style, "FontWeight", null, false);
        Element.style.fontStyle = system.GetDataText(Style, "FontStyle", null, false);
        Element.style.textDecoration = system.GetDataText(Style, "TextDecoration", null, false);
        



    }
    catch (e){

    }

    try{
        Element.style.lineHeight = system.GetDataText(Style, "LineHeight", null, false);
        Element.style.textAlign = system.GetDataText(Style, "TextAlign", null, false);
        Element.style.textShadow = system.GetDataText(Style, "TextShadow", null, false);
    }
    catch (e) {

    }

    try {
        Element.style.boxShadow = system.GetDataText(Style, "BoxShadow", null, false);
    }
    catch (e) {

    }


    try {
        Element.style.color = safeColor(system.GetDataText(Style, "Color", null, false));
    }
    catch (e) {

    }

    try {
        Element.style.backgroundColor = safeColor(system.GetDataText(Style, "BackgroundColor", null, false));
    }
    catch (e) {

    }


    var src = system.GetDataFile(Style, "BackgroundImage/Source", '', false)
    if (src != '') {

        if (Element.firstChild == null) {
            var img = html.createInterfaceImage(Element, Style.BackgroundImage);
            img.style.zIndex = 0;
        }
        else {
            if (Element.firstChild.style.zIndex == 0) {
                Element.firstChild.src = src;
            }
            else {
                var img = html.insertElement(Element, "IMG", Element.firstChild);
                html.styleElement(img, Style.BackgroundImage);
                img.src = src;
                img.style.zIndex = 0;
            }
        }
    }
    else {
        if (Element.firstChild != null && Element.firstChild.style != null && Element.firstChild.style.zIndex == -1) {
            Element.removeChild(Element.firstChild);
        }
    }


   // if (Style.Transition) html.applyElementTransition(Element, system.GetDataText(Style, "Transition", '', false));
    if (Style.Transform) html.applyElementTransform(Element, system.GetDataText(Style, "Transform", null, false));
    if (Style.Opacity) setOpacity(Element, system.GetDataText(Style, "Opacity", null, false));
    try{
        if (Style.Display) Element.style.display = system.GetDataText(Style, "Display", null, false);
    }
    catch (e){

    }





    try{
        var b = system.GetDataText(Style, "Border/Border", null, false);
        if (b == null) b = "";
        Element.style.borderLeft = system.GetDataText(Style, "Border/BorderLeft", b, false);
        Element.style.borderRight = system.GetDataText(Style, "Border/BorderRight", b, false);
        Element.style.borderTop = system.GetDataText(Style, "Border/BorderTop", b, false);
        Element.style.borderBottom = system.GetDataText(Style, "Border/BorderBottom", b, false);
        Element.style.padding = system.GetDataText(Style, "Padding", null, false);

    }
    catch (e){

    }

    try{
        Element.style.margin = system.GetDataText(Style, "Margin", null, false);
    }
    catch (e) {

    }

    if (Style.RelPos) {
        var relpos = system.GetDataText(Style, "RelPos", null, false);

        if (relpos != null && relpos != '') {
            var elt = { "Element": Element, "RelPos": relpos.split(';'), "Offset": [0, 0] };
            this.centerElements[this.centerElements.length] = elt;
            html.centerElement(elt);
        }
    }
}

HTML.prototype.applyElementPerspective = function (element, transform) {
    element.style.webkitPerspective = transform;
    element.style.msPerspective = transform;
    //element.style.MozPerspective = transform;
    element.style.MozTransform = 'perspective('+transform+'px)'
    element.style.oPerspective = transform;
    element.style.perspective = transform;
}

HTML.prototype.applyElementTransformStyle = function (element, transform) {
    element.style.webkitTransformStyle = transform;
    element.style.msTransformStyle = transform;
    element.style.MozTransformStyle = transform;
    element.style.oTransformStyle = transform;
    element.style.transformStyle = transform;
}

HTML.prototype.applyElementTransform = function(element, transform) {
    element.style.webkitTransform = transform;
    element.style.msTransform = transform;
    element.style.MozTransform = transform;
    element.style.oTransform = transform;
    element.style.transform = transform;
}
HTML.prototype.applyElementTransformOrigin = function (element, transformorigin) {
    element.style.webkitTransformOrigin = transformorigin;
    element.style.msTransformOrigin = transformorigin;
    element.style.MozTransformOrigin = transformorigin;
    element.style.oTransformOrigin = transformorigin;
    element.style.transformOrigin = transformorigin;
}
HTML.prototype.applyElementTransition = function (element, transition) {
    var t = transition.split("|");
    try{
        element.style.webkitTransition =  t[0];
        element.style.msTransition = (t.length>1)?t[1]:t[0];
        element.style.MozTransition = (t.length>1)?t[2]:t[0];
        element.style.oTransition = (t.length>1)?t[3]:t[0];
        element.style.transition = (t.length > 1) ? t[4] : t[0];
    }
    catch (e) {

    }
}

HTML.prototype.getElementTransition = function(element) {
    if (element.style.webkitTransition) return element.style.webkitTransition;
    if (element.style.msTransition) return element.style.msTransition;
    if (element.style.MozTransition) return element.style.MozTransition;
    if (element.style.oTransition) return element.style.oTransition;
    if (element.style.transition) return element.style.transition;
}

HTML.prototype.getElementTransform = function (element) {
    if (element.style.webkitTransform) return element.style.webkitTransform;
    if (element.style.msTransform) return element.style.msTransform;
    if (element.style.MozTransform) return element.style.MozTransform;
    if (element.style.oTransform) return element.style.oTransform;
    if (element.style.transform) return element.style.transform;
}


HTML.prototype.centerElement = function (elt) {
    if (elt.Element.parentNode == null) return;
    try {
        elt.Element.style.left = Math.round(elt.Element.parentNode.offsetWidth * parseInt(elt.RelPos[0]) / 100 + parseInt(elt.RelPos[1]) + elt.Offset[0]) + "px"
        elt.Element.style.top = Math.round(elt.Element.parentNode.offsetHeight * parseInt(elt.RelPos[2]) / 100 + parseInt(elt.RelPos[3]) + elt.Offset[1]) + "px"
    }
    catch (e) {

    }

}


HTML.prototype.createInterfaceImage = function (Owner, Style) {
    return html.createInterfaceImageEx(Owner, Style, null);
}

HTML.prototype.createInterfaceImageEx = function (Owner, Style, OverrideSource) {
    var element = html.createElement(Owner, "img");
    var src = system.GetDataFile(OverrideSource, null, '', false);
    if (src == '') src = system.GetDataFile(Style, 'Source', '', false);
    if (src != '') {
        element.src = src;
    }

    if (Style != null) html.styleElement(element, Style);
    return element;
}

HTML.prototype.prepareInterfaceImage = function (Owner, Source) {
    var element = html.createElement(Owner, "img");
    element.src = system.GetDataFile(Source, null, '', true);
    return element;
}

HTML.prototype.createVideo = function (Owner, controls, Before, audio) {
    var element = null;
    if (html5) {
        var element = html.insertElement(Owner, audio ? "audio" : "video", Before);
        element.controls = null;

    }
    else {
        var element = html.createElement(Owner, "object");
        element.classid = "CLSID:6BF52A52-394A-11d3-B153-00C04F79FAA6";
            element.uiMode = 'none';
            //if (controls)
                element.windowlessVideo = true;
            element.settings.autoStart = false;
    }

    return element;
}

HTML.prototype.addAudioSources = function (element, ms) {
    if (!html5) {
        if (ms != '') {
            element.url = ms;
        }
    }
    else {
        if (ms != '') {
            var found = null;
            for (var i in element.childNodes) {
                if (element.childNodes[i].type == 'video/mp3') {
                    found = element.childNodes[i];
                }
            }
            if (found) {
                found.src = ms;
            }
            else {
                var source = document.createElement('source');
                source.src = ms;
                source.type = 'audio/mp3';
                element.insertBefore(source, null);
            }
        }

    }
}


HTML.prototype.addVideoSources = function (element, ms, ws, wmv, va, vtt) {
    if (!html5) {
        if (wmv != '') {
            element.url = wmv;
        }
        else {
            element.url = ms;
        }
    }
    else {
        if (ms != '') {
            var found = null;
            for (var i in element.childNodes) {
                if (element.childNodes[i].type == 'video/mp4') {
                    found = element.childNodes[i];
                }
            }
            if (found) {
                found.src = ms;
            }
            else {
                var source = document.createElement('source');
                source.src = ms;
                source.type = 'video/mp4';
                element.insertBefore(source, null);
                


            }
        }
        if (ws != '') {
            var found = null;
            for (var i in element.childNodes) {
                if (element.childNodes[i].type == 'video/webm') {
                    found = element.childNodes[i];
                }
            }
            if (found) {
                found.src = ws;
            }
            else {
                var source = document.createElement('source');
                source.src = ws;
                source.type = 'video/webm';
                element.insertBefore(source, null);
            }
        }

        if (vtt != '' && vtt != null) {

            //var vtt = ms.replace('.mp4', '.vtt');
            //if (ms != vtt) {
            var videoelement = element;
            var videoasset = va;
            element.addEventListener("loadedmetadata", function () {
                var track = document.createElement('track');
                track.src = vtt;
                track.kind = 'captions';

                track.addEventListener("load", function () {
                    va.setTrack(track.track);
                    track.track.mode = "hidden";
                });

                videoelement.insertBefore(track, null);
                track.track.mode = "showing";
            });
            //}

        }

    }
}

HTML.prototype.createLayer = function (Owner, Style) {
    var element = html.createElement(Owner, "div");
    element.style.backgroundImage = 'url(#)';

    if (Style != null) html.styleElement(element, Style);
    return element;
}

HTML.prototype.createText = function (Owner, Style, Text) {
    var element = html.createElement(Owner, "div");
    element.style.cursor = 'default';

    if (Text != '') {
        html.fillText(element, Style, Text);
    }

    return element;
}

HTML.prototype.fillText = function (element, Style, Text) {
    if (element == null) return;



    if (Text != null) {
        var t = Text.replace(/<img>[^<]*<\/img>/gi, function rep(x) {
            var name = x.substring(5, x.length - 6);
            for (var i = 0; i < CurrentBlock.Data.Media.length; i++) {
                var vn = system.GetDataText(CurrentBlock.Data.Media[i], "Name", "", false);
                if (vn == name) {
                    return "<img style='vertical-align:middle' src='" + system.GetDataFile(CurrentBlock.Data.Media[i], "Image", "", true) + "'/>";
                }
            }
            return "";
        });

        var t = t.replace(/<txt>[^<]*<\/txt>/gi, function rep(x) {
            var name = x.substring(5, x.length - 6);
            for (var i = 0; i < CurrentBlock.Data.Media.length; i++) {
                var vn = system.GetDataText(CurrentBlock.Data.Media[i], "Name", "", false);
                if (vn == name) {
                    return system.GetDataText(CurrentBlock.Data.Media[i], "Text", "", true);
                }
            }
            return "";
        });
        element.innerHTML = t;
    }
    if (Style != null) html.styleElement(element, Style);
    
    return element;
}

HTML.prototype.styleFormattedElement = function (element, Style) {
    if (element == null) return;

    if (Style != null && Style.Body) html.styleElement(element, Style.Body);
    this.styleSubElements(element, Style);
}

HTML.prototype.styleSubElements = function(element, Style){
    if (element)
    for (var i in element.childNodes) {
        var elt = element.childNodes[i];
        if (elt.nodeName == 'FONT') {
            if (Style != null && Style.Em) html.styleElement(elt, Style.Em);
        }
        else if (elt.nodeName == 'SPAN') {
            if (Style != null && Style.H) html.styleElement(elt, Style.H);
        }
        else if (elt.nodeName == 'UL') {
            try{
                elt.style.listStyleType = system.GetDataText(Style.Body, "UnorderedListStyleType", null, false);
            }
            catch (e){
            }
        }
        else if (elt.nodeName == 'OL') {
            try{
                elt.style.listStyleType = system.GetDataText(Style.Body, "OrderedListStyleType", null, false);
            }
            catch (e) {
            }
        }
        else if (elt.nodeName == 'TABLE') {
            if (Style != null && Style.TABLE) html.styleElement(elt, Style.TABLE);
        }
        else if (elt.nodeName == 'TD') {
            if (Style != null && Style.TD) html.styleElement(elt, Style.TD);
        }
        else if (elt.nodeName == 'TH') {
            if (Style != null && Style.TH) html.styleElement(elt, Style.TH);
        }
    this.styleSubElements(elt, Style);
    }
}

HTML.prototype.createFormattedText = function (Owner, Style, Text) {
    
    var element = html.createElement(Owner, "div");
    element.style.cursor = 'default';

    if (Text != '') html.fillFormattedText(element, Style, Text);

    return element;
}

HTML.prototype.fillFormattedText = function (element, Style, Text) {

    if (Text != null) {
        var t = Text.replace(/<img>[^<]*<\/img>/gi, function rep(x) {
            var name = x.substring(5, x.length - 6);
            for (var i = 0; i < CurrentBlock.Data.Media.length; i++){
                var vn = system.GetDataText(CurrentBlock.Data.Media[i], "Name", "", false);
                if (vn == name) {
                    return "<img style='vertical-align:middle' src='" + system.GetDataFile(CurrentBlock.Data.Media[i], "Image", "", true) + "'/>";
                }
            }
            return "";
        });

        var t = t.replace(/<txt>[^<]*<\/txt>/gi, function rep(x) {
            var name = x.substring(5, x.length - 6);
            for (var i = 0; i < CurrentBlock.Data.Media.length; i++) {
                var vn = system.GetDataText(CurrentBlock.Data.Media[i], "Name", "", false);
                if (vn == name) {
                    return system.GetDataText(CurrentBlock.Data.Media[i], "Text", "", true);
                }
            }
            return "";
        });

        element.innerHTML = t.replace(/<em>/g, '<font>').replace(/<\/em>/g, '</font>').replace(/<\/h>/g, '</span>').replace(/<h>/g, '<span>');
    }
    html.styleFormattedElement(element, Style);

    return element;
}

HTML.prototype.loadFont = function (FontFace) {
    var family = system.GetDataText(FontFace, "Family", '', false);
    
    if (this.LoadedFonts[family] == null) {
        this.LoadedFonts[family] = true;
        var source = system.GetDataFile(FontFace, "Source", '', false);
        var sourceeot = system.GetDataFile(FontFace, "SourceEOT", '', false);
        var sourcewoff = system.GetDataFile(FontFace, "SourceWOFF", '', false);
        var sourcesvg = system.GetDataFile(FontFace, "SourceSVG", '', false);

        var b = 'src: ';
        var comma = false;
        if (sourceeot != '') {
            b = "src: url('" + sourceeot + "');" + b + "url('" + sourceeot + ((sourceeot.indexOf('?')>-1)?"":"?")+"#iefix') format('embedded-opentype')"
            comma = true;
        }
        if (sourcesvg != '') {
            if (comma) b += ',';
            b += "url('" + sourcesvg + "') format('svg')"
            comma = true;
        }
        if (sourcewoff != '') {
            if (comma) b += ',';
            b += "url('" + sourcewoff + "') format('woff')"
            comma = true;
        }
        if (source != '') {
            if (comma) b += ',';
            b += "url('"+source+"') format('truetype')"
        }

        var rule = '\n@font-face {font-family:\'' + family + '\'; '+b+';}';
        try {
            
            if (this.stylesheet.insertRule) {
                this.stylesheet.insertRule(rule, 0);
            }
            else {
                if (ie7stylesheet==null) {
                    ie7stylesheet = document.createElement('style');
                    ie7stylesheet.type = "text/css";
                    document.getElementsByTagName('head')[0].appendChild(ie7stylesheet);
                }
                ie7stylerules = ie7stylerules + rule;
                    //s.styleSheet.cssText = rule;
                

            }
        }
        catch (e) 
        {
         
        }
    }
}

var ie7stylerules = '';
var ie7stylesheet = null;

HTML.prototype.positionCustomerConfigLayer = function (element, pos) {
    this.position(element,
    system.GetCustomerConfigValueNull(pos + "Left"),
    system.GetCustomerConfigValueNull(pos + "Top"),
    system.GetCustomerConfigValueNull(pos + "Right"),
    system.GetCustomerConfigValueNull(pos + "Bottom"),
    system.GetCustomerConfigValueNull(pos + "Width"),
    system.GetCustomerConfigValueNull(pos + "Height"));

}

HTML.prototype.position = function (element, left, top, right, bottom, width, height) {
    element.style.position = 'absolute';
    if (left != null) element.style.left = left + 'px';
    if (top != null) element.style.top = top + 'px';
    if (right != null) element.style.right = right + 'px';
    if (bottom != null) element.style.bottom = bottom + 'px';
    if (width != null) element.style.width = width + 'px';
    if (height != null) element.style.height = height + 'px';
}

HTML.prototype.addGradient = function (element, direction, start, end) {
    try{
        element.style.background = '-ms-linear-gradient(' + direction + ',' + start + ', ' + end + ')';
        element.style.background = '-webkit-linear-gradient(' + direction + ',' + start + ', ' + end + ')';
        element.style.background = '-moz-linear-gradient(' + direction + ',' + start + ', ' + end + ')';
        element.style.background = 'linear-gradient(' + direction + ',' + start + ', ' + end + ')';
    }
    catch (e) {

    }
}

var rtlChar = /[\u0590-\u083F]|[\u08A0-\u08FF]|[\uFB1D-\uFDFF]|[\uFE70-\uFEFF]/mg;
HTML.prototype.checkRTL = function (element) {
    if (element) {
        if (element.childNodes) {
            for (var i = 0; i < element.childNodes.length;i++) {
                var elt = element.childNodes[i];
                html.checkRTL(elt);
            }
        }

        try{
            var isRTL = (element.textContent?element.textContent: element.innerText).match(rtlChar);
            if (isRTL !== null) {
                element.style.direction = 'rtl';
            }
            else {
                element.style.direction = 'ltr';
            }
        }
        catch (e) {

        }

    }
}



//
//json2
//
/*
    json2.js
    2012-10-08

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());


//
//license
//
function License(Owner, DataNode, Done, Auth, Authorization) {
    var _this = this;
    this.Done = Done;
    this.loading = 0;
    this.Owner = Owner;
    this.DataNode = DataNode;
    this.Auth = Auth;
    if (this.Auth != null) this.Auth = this.Auth.data;
    this.Authorization = Authorization;

    this.CloseQuery = function (Done) {
        if (Done != null) Done();
    }

    this.contentLayer = Owner;
    this.contentLayer.innerHTML = '';

    this.title = html.createElement(this.contentLayer, "H1");

    this.loadLicenses = function () {
        system.doRequest({ "RequestType": 8, "SessionGuid": session.SessionGuid, "SubjectID": _this.DataNode }, function (response, completed) {
            _this.CustomerLicenses = response.Data.Licenses;
            _this.show();
        });
    }

    this.show = function () {
        _this.licenseLayer = html.createElement(_this.contentLayer, "DIV");
        _this.licenseLayer.style.backgroundColor = '#eef0f2';
        html.addGradient(_this.licenseLayer, 'top', 'white', '#eef0f2');
        _this.licenseLayer.style.boxShadow = '1px 1px 4px #888';
        _this.licenseLayer.style.padding = '5px';
        _this.ShowLicenses();

        if (_this.Authorization.TargetNodeID != _this.DataNode && system.GetDataValue(_this.Auth,"EditLicenses",0) == 1) {
            html.createElement(_this.contentLayer, "H2").innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Lic_Add");

            new LicenseControls(_this);
        }
    }

    this.ShowLicenses = function () {
        this.licenseLayer.innerHTML = '';
        for (var a in _this.CustomerLicenses) {
            new CustomerLicense(_this, _this.CustomerLicenses[a], _this.Authorization.TargetNodeID!=_this.DataNode && system.GetDataValue(_this.Auth,"EditLicenses",0) == 1);
        }
    }

    system.RequireNodeID(this.DataNode, this, function (sender, node) {
        _this.loadLicenses();
        _this.title.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Lic_Title").replace('{0}', node.name);
    },1,false,0);
}

function LicenseControls(Owner) {
    this.Owner = Owner;
    var _this = this;
    this.selected = null;


    this.UpdateView = function () {

    }

    this.controls = html.createElement(Owner.contentLayer, "DIV");

    var l = html.createElement(this.controls, "DIV");
    l.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_General_StartDate");
    this.txtStartDate = html.createElement(this.controls, "INPUT");
    var l = html.createElement(this.controls, "DIV");
    l.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_General_EndDate");
    this.txtEndDate = html.createElement(this.controls, "INPUT");
    var l = html.createElement(this.controls, "DIV");
    l.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_General_Count");
    this.txtLicenseCount = html.createElement(this.controls, "INPUT");



    this.addLicenseButton = html.createElement(this.controls, "INPUT");
    this.addLicenseButton.type = "BUTTON";
    this.addLicenseButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Edit_Add");
    this.addLicenseButton.onclick = function () {
        system.doRequest({ "RequestType": 28, "SessionGuid": session.SessionGuid, "SubjectID": _this.Owner.DataNode, "LicenseCount": parseInt(_this.txtLicenseCount.value), "StartDate": _this.txtStartDate.value, "EndDate": _this.txtEndDate.value }, function (response, completed) {
            _this.txtLicenseCount.value = '';
            _this.txtStartDate.value = '';
            _this.txtEndDate.value = '';
            _this.Owner.CustomerLicenses = response.Data.Licenses;
            _this.Owner.ShowLicenses();
        });
    }

    this.UpdateView();
}


function CustomerLicense(Owner, License, Edit) {
    this.Owner = Owner;
    this.License = License;
    this.panel = html.createElement(Owner.licenseLayer, "DIV");

    var _this = this;

    this.deleteButton = html.createElement(this.panel, "INPUT");
    this.deleteButton.type = 'button';
    this.deleteButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Edit_Delete");

    this.deleteButton.onclick = function () {
        system.doRequest({ "RequestType": 38, "SessionGuid": session.SessionGuid, "SubjectID": _this.License.LicenseID }, function (response, completed) {
            _this.Owner.CustomerLicenses = response.Data.Licenses;
            _this.Owner.ShowLicenses();
        });
    }

    this.deleteButton.disabled = !(Edit);

    this.name = html.createElement(this.panel, 'SPAN');
    this.name.innerHTML =
    eval('new' + this.License.StartDate.replace(/\//g, ' ')).getSmallDate() + ' - ' +
    eval('new' + this.License.EndDate.replace(/\//g, ' ')).getSmallDate() + ' : ' +
    system.GetCustomerConfigText("UI/Portal/TXT_Lic_Usage").replace('{0}', this.License.Count.toString()).replace('{1}', ((this.License.LicenseCount == -1) ? system.GetCustomerConfigText("UI/Portal/TXT_General_Unlimited") : this.License.LicenseCount));

}



//
//login
//
function Login(Owner) {
    this.statusenum = {
        "-2": "TXT_LoadingCustomer",
        "-1": "TXT_CreatingSession",
        "1": "TXT_SessionClosed",
        "2": "TXT_SessionExpired",
        "3": "TXT_Kicked",
        "4": "TXT_UnknownSession",
        "10": "TXT_InvalidUser",
        "11": "TXT_InvalidPassword",
        "12": "TXT_InvalidCustomer",
        "20": "TXT_RequestError",
        "21": "TXT_DatabaseError",
        "22": "TXT_ConnectionError",
        "30": "TXT_NotLocked",
        "40": "TXT_LicenseError"
    }

    this.panel = html.createElement(Owner, "DIV");
    html.position(this.panel, 0, 0, 0, 0, null, null);

    this.backgroundTop = html.createElement(this.panel, "DIV");
    this.backgroundBottom = html.createElement(this.panel, "DIV");
    this.logoTop = html.createElement(this.panel, "IMG");
    this.logoBottom = html.createElement(this.panel, "IMG");
    this.banner = html.createElement(this.panel, "DIV");

    this.loginControl = html.createElement(this.panel, "DIV");
    this.loginControl.style.backgroundColor = '#eef0f2';
    html.addGradient(this.loginControl, 'top', 'white', '#eef0f2');
    this.loginControl.style.boxShadow = '1px 1px 4px #888';
    this.loginControl.style.padding = '20px';



    this.applicationPanel = html.createElement(this.panel, "DIV");
    this.applicationPanel.style.display = "none";
    this.applicationPanel.style.backgroundColor = "white";
    html.position(this.applicationPanel, 0, 0, 0, 0, null, null);
   

    var _this = this;


    system.failure = function (err, message) { _this.Failure(err, message); };

    this.usernameLabel = html.createText(this.loginControl, null, "UserName");
    this.usernameText = html.createElement(this.loginControl, "INPUT");
    this.usernameText.type = "TEXT";

    
    this.customernameLabel = html.createText(this.loginControl, null, "CustomerName");
    this.customernameText = html.createElement(this.loginControl, "INPUT");
    this.customernameText.type = "TEXT";
    if (system.CustomerID == system.UniverseID) {
        
    }
    else {
        this.customernameText.value = system.CustomerName;
        this.customernameText.style.display = 'none';
        this.customernameLabel.style.display = 'none';
    }
    
    
    this.passwordLabel = html.createText(this.loginControl, null, "Password");
    this.passwordText = html.createElement(this.loginControl, "INPUT");
    try{
        this.passwordText.type = "PASSWORD";
    }
    catch (err){
        this.passwordText.setAttribute('type', 'PASSWORD');
    }
    this.passwordText.onkeydown = function (e) {
        if ((e && e.keyCode == 13) || (!e && window.event.keyCode == 13)) _this.LogIn();
    }

    html.createElement(this.loginControl, "BR");
    this.keepPassword = html.createElement(this.loginControl, "INPUT");
    try{
        this.keepPassword.type = "CHECKBOX";
    }
    catch (err) {
        this.keepPassword.setAttribute('type', 'CHECKBOX');
    }
    this.keepPasswordLabel = html.createElement(this.loginControl, "FONT");
    

    this.statusLabel = html.createText(this.loginControl, null, "");




    addEvent(window,'resize',
            function () {
             
                _this.Resize();
            });
    

    this.getCookies();

    this.ApplyCustomerStyle();
}

Login.prototype.keepAlive = function () {
    system.doRequest({ "RequestType": 100, "SessionGuid": session.SessionGuid, "LastKnownPosition": system.LastKnownPosition }, function (response, completed) {
    });
}

Login.prototype.ApplyCustomerStyle = function () {
    if (system.CustomerID == this.CurrentCustomerID) return;
    this.CurrentCustomerID = system.CustomerID;
    this.backgroundTop.style.backgroundImage = 'url(' + system.GetCustomerConfigResource("UI/Login/BackgroundTop/BackgroundImage") + ')';
    html.positionCustomerConfigLayer(this.backgroundTop, "UI/Login/BackgroundTop/");
    this.backgroundBottom.style.backgroundImage = 'url(' + system.GetCustomerConfigResource("UI/Login/BackgroundBottom/BackgroundImage") + ')'; ;
    html.positionCustomerConfigLayer(this.backgroundBottom, "UI/Login/BackgroundBottom/");
    this.logoTop.src = system.GetCustomerConfigResource("UI/Login/LogoTop/BackgroundImage");
    html.positionCustomerConfigLayer(this.logoTop, "UI/Login/LogoTop/");
    this.logoBottom.src = system.GetCustomerConfigResource("UI/Login/LogoBottom/BackgroundImage");
    html.positionCustomerConfigLayer(this.logoBottom, "UI/Login/LogoBottom/");
    this.banner.style.color = system.GetCustomerConfigText("UI/Login/LayerCustomerName/TextColor");
    html.positionCustomerConfigLayer(this.banner, "UI/Login/LayerCustomerName/");
    if (system.CustomerID != system.UniverseID) {
        this.banner.innerHTML = system.CustomerName;
    }
    html.positionCustomerConfigLayer(this.loginControl, "UI/Login/LayerLoginPanel/");
    if (this.loginButton != null) {
        this.loginControl.removeChild(this.loginButton.container);
        this.loginButton = null;
    }
    var _this = this;
    this.loginButton = new PortalButton(this.loginControl, null, 5, null
    , system.GetCustomerConfigText("UI/Login/TXT_Login")
    , function () {
        _this.LogIn();
    }
    );
    html.positionCustomerConfigLayer(this.loginButton.container, "UI/Login/LayerLogin/");

    this.usernameLabel.innerHTML = system.GetCustomerConfigText("UI/Login/TXT_UserName");
    this.customernameLabel.innerHTML = system.GetCustomerConfigText("UI/Login/TXT_CustomerName");
    this.passwordLabel.innerHTML = system.GetCustomerConfigText("UI/Login/TXT_Password");
    this.keepPasswordLabel.innerHTML = system.GetCustomerConfigText("UI/Login/TXT_KeepPassword");

    this.Resize();
}

Login.prototype.Resize = function () {
    this.loginControl.style.left = ((this.panel.offsetWidth - this.loginControl.offsetWidth) / 2)+'px';
    this.loginControl.style.top = ((this.panel.offsetHeight - this.backgroundTop.offsetHeight - this.backgroundBottom.offsetHeight - this.loginControl.offsetHeight) / 2 + this.backgroundTop.offsetHeight) + 'px' ;

}

var session;

Login.prototype.LogIn = function () {
    var _this = this;
    var pwd = this.passwordText.value;

    if (this.loginButton.disabled) return;
    this.loginButton.SetEnabled(false);
    if (!this.keepPassword.checked) this.passwordText.value = '';
    document.body.focus();

    setCookie("USERNAME", this.usernameText.value, 365);
    setCookie("CUSTOMERNAME", this.customernameText.value, 365);
    setCookie("REMEMBERPASSWORD", this.keepPassword.checked ? "1" : "0", 365);

    this.UpdateStatus(-2);

    system.Reset();
    system.LoadCustomer(this.customernameText.value, function () {
        _this.ApplyCustomerStyle();
        _this.UpdateStatus(-1);

        system.doRequest({ "RequestType": 26, "UserName": _this.usernameText.value, "CustomerID": system.CustomerID, "Password": pwd }, function (response, completed) {
            _this.loginButton.SetEnabled(true);
            _this.UpdateStatus(response.Status);
            if (response.Status == 0) {
                session = response.Data;
                system.RequireNodeID(session.UserID, _this, null, 2, true, 0);

                if (_this.keepPassword.checked) {
                    setCookie("PASSWORD", pwd, 365);
                }
                else {
                    setCookie("PASSWORD", "", 365);
                }

                if (response.Data.LicenseDaysLeft <= 30) {
                    if (response.Data.LicensesRequired > 0) {
                        alert(system.GetCustomerConfigText("UI/Login/TXT_LicenseExpires").replace('{0}', response.Data.LicenseDaysLeft));
                    }
                }

                _this.applicationPanel.style.display = "";
                _this.applicationPanel.innerHTML = '';
                session.Portal = new Portal(_this.applicationPanel, _this);
                _this.keepAliveInterval = setInterval((function (self) {
                    return function () { self.keepAlive(); }
                })(_this), 10000);
            }
        });
    });
}

Login.prototype.getCookies = function(){
    var username = getCookie("USERNAME");
    if (username != null && username != "") this.usernameText.value = username;
    var customername = getCookie("CUSTOMERNAME");
    if (system.CustomerID==system.UniverseID && customername != null && customername != "") this.customernameText.value = customername;
    var password = getCookie("PASSWORD");
    if (password != null && password != "") this.passwordText.value = password;
    var r = getCookie("REMEMBERPASSWORD");
    if (r != null && r != "") this.keepPassword.checked = (r=='1')?true:false;
}

Login.prototype.LogOut = function () {
    var _this = this;
    system.doRequest({ "RequestType": 36, "SessionGuid": session.SessionGuid }, function (response, completed) {
        _this.UpdateStatus(response.Status);

        if (response.Status == 0) {
            _this.Reset();
            _this.getCookies();
        }
    });
}

Login.prototype.Failure = function (err, message) {
    this.Reset();
    this.loginButton.SetEnabled(true);
    this.UpdateStatus(err);

}

Login.prototype.Reset = function () {
    clearInterval(this.keepAliveInterval);
    if (session != null) {
        session.Portal = null;
    }
    session = null;
    this.applicationPanel.style.display = "none";
}


Login.prototype.UpdateStatus = function (status) {
    if (status == 0) this.statusLabel.innerHTML = '';
    else {
        this.statusLabel.innerHTML = system.GetCustomerConfigText("UI/Login/LoginStatus/"+ this.statusenum[status.toString()]);
    }
}

//
//lz-string_min
//
var LZString={_f:String.fromCharCode,_keyStrBase64:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",_keyStrUriSafe:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",_getBaseValue:function(r,e){if(LZString._baseReverseDic||(LZString._baseReverseDic={}),!LZString._baseReverseDic[r]){LZString._baseReverseDic[r]={};for(var t=0;t<r.length;t++)LZString._baseReverseDic[r][r[t]]=t}return LZString._baseReverseDic[r][e]},compressToBase64:function(r){if(null==r)return"";var e=LZString._compress(r,6,function(r){return LZString._keyStrBase64.charAt(r)});switch(e.length%4){default:case 0:return e;case 1:return e+"===";case 2:return e+"==";case 3:return e+"="}},decompressFromBase64:function(r){return null==r?"":""==r?null:LZString._decompress(r.length,32,function(e){return LZString._getBaseValue(LZString._keyStrBase64,r.charAt(e))})},compressToUTF16:function(r){return null==r?"":LZString._compress(r,15,function(r){return String.fromCharCode(r+32)})+" "},decompressFromUTF16:function(r){return null==r?"":""==r?null:LZString._decompress(r.length,16384,function(e){return r.charCodeAt(e)-32})},compressToUint8Array:function(r){for(var e=LZString.compress(r),t=new Uint8Array(2*e.length),n=0,o=e.length;o>n;n++){var i=e.charCodeAt(n);t[2*n]=i>>>8,t[2*n+1]=i%256}return t},decompressFromUint8Array:function(r){if(null===r||void 0===r)return LZString.decompress(r);for(var e=new Array(r.length/2),t=0,n=e.length;n>t;t++)e[t]=256*r[2*t]+r[2*t+1];var o="";return e.forEach(function(r){o+=String.fromCharCode(r)}),LZString.decompress(o)},compressToEncodedURIComponent:function(r){return null==r?"":LZString._compress(r,6,function(r){return LZString._keyStrUriSafe.charAt(r)})},decompressFromEncodedURIComponent:function(r){return null==r?"":""==r?null:LZString._decompress(r.length,32,function(e){return LZString._getBaseValue(LZString._keyStrUriSafe,r.charAt(e))})},compress:function(r){return LZString._compress(r,16,function(r){return String.fromCharCode(r)})},_compress:function(r,e,t){if(null==r)return"";{var n,o,i,s={},a={},c="",l="",p="",u=2,f=3,h=2,d="",g=0,S=0;LZString._f}for(i=0;i<r.length;i+=1)if(c=r[i],Object.prototype.hasOwnProperty.call(s,c)||(s[c]=f++,a[c]=!0),l=p+c,Object.prototype.hasOwnProperty.call(s,l))p=l;else{if(Object.prototype.hasOwnProperty.call(a,p)){if(p.charCodeAt(0)<256){for(n=0;h>n;n++)g<<=1,S==e-1?(S=0,d+=t(g),g=0):S++;for(o=p.charCodeAt(0),n=0;8>n;n++)g=g<<1|1&o,S==e-1?(S=0,d+=t(g),g=0):S++,o>>=1}else{for(o=1,n=0;h>n;n++)g=g<<1|o,S==e-1?(S=0,d+=t(g),g=0):S++,o=0;for(o=p.charCodeAt(0),n=0;16>n;n++)g=g<<1|1&o,S==e-1?(S=0,d+=t(g),g=0):S++,o>>=1}u--,0==u&&(u=Math.pow(2,h),h++),delete a[p]}else for(o=s[p],n=0;h>n;n++)g=g<<1|1&o,S==e-1?(S=0,d+=t(g),g=0):S++,o>>=1;u--,0==u&&(u=Math.pow(2,h),h++),s[l]=f++,p=String(c)}if(""!==p){if(Object.prototype.hasOwnProperty.call(a,p)){if(p.charCodeAt(0)<256){for(n=0;h>n;n++)g<<=1,S==e-1?(S=0,d+=t(g),g=0):S++;for(o=p.charCodeAt(0),n=0;8>n;n++)g=g<<1|1&o,S==e-1?(S=0,d+=t(g),g=0):S++,o>>=1}else{for(o=1,n=0;h>n;n++)g=g<<1|o,S==e-1?(S=0,d+=t(g),g=0):S++,o=0;for(o=p.charCodeAt(0),n=0;16>n;n++)g=g<<1|1&o,S==e-1?(S=0,d+=t(g),g=0):S++,o>>=1}u--,0==u&&(u=Math.pow(2,h),h++),delete a[p]}else for(o=s[p],n=0;h>n;n++)g=g<<1|1&o,S==e-1?(S=0,d+=t(g),g=0):S++,o>>=1;u--,0==u&&(u=Math.pow(2,h),h++)}for(o=2,n=0;h>n;n++)g=g<<1|1&o,S==e-1?(S=0,d+=t(g),g=0):S++,o>>=1;for(;;){if(g<<=1,S==e-1){d+=t(g);break}S++}return d},decompress:function(r){return null==r?"":""==r?null:LZString._decompress(r.length,32768,function(e){return r.charCodeAt(e)})},_decompress:function(r,e,t){var n,o,i,s,a,c,l,p,u=[],f=4,h=4,d=3,g="",S="",m=LZString._f,v={val:t(0),position:e,index:1};for(o=0;3>o;o+=1)u[o]=o;for(s=0,c=Math.pow(2,2),l=1;l!=c;)a=v.val&v.position,v.position>>=1,0==v.position&&(v.position=e,v.val=t(v.index++)),s|=(a>0?1:0)*l,l<<=1;switch(n=s){case 0:for(s=0,c=Math.pow(2,8),l=1;l!=c;)a=v.val&v.position,v.position>>=1,0==v.position&&(v.position=e,v.val=t(v.index++)),s|=(a>0?1:0)*l,l<<=1;p=m(s);break;case 1:for(s=0,c=Math.pow(2,16),l=1;l!=c;)a=v.val&v.position,v.position>>=1,0==v.position&&(v.position=e,v.val=t(v.index++)),s|=(a>0?1:0)*l,l<<=1;p=m(s);break;case 2:return""}for(u[3]=p,i=S=p;;){if(v.index>r)return"";for(s=0,c=Math.pow(2,d),l=1;l!=c;)a=v.val&v.position,v.position>>=1,0==v.position&&(v.position=e,v.val=t(v.index++)),s|=(a>0?1:0)*l,l<<=1;switch(p=s){case 0:for(s=0,c=Math.pow(2,8),l=1;l!=c;)a=v.val&v.position,v.position>>=1,0==v.position&&(v.position=e,v.val=t(v.index++)),s|=(a>0?1:0)*l,l<<=1;u[h++]=m(s),p=h-1,f--;break;case 1:for(s=0,c=Math.pow(2,16),l=1;l!=c;)a=v.val&v.position,v.position>>=1,0==v.position&&(v.position=e,v.val=t(v.index++)),s|=(a>0?1:0)*l,l<<=1;u[h++]=m(s),p=h-1,f--;break;case 2:return S}if(0==f&&(f=Math.pow(2,d),d++),u[p])g=u[p];else{if(p!==h)return null;g=i+i[0]}S+=g,u[h++]=i+g[0],f--,i=g,0==f&&(f=Math.pow(2,d),d++)}}};"undefined"!=typeof module&&null!=module&&(module.exports=LZString);


//
//nodetree
//
function NodeTree(Owner, embed) {

    var _this = this;

    if (embed != null && embed == true) {
        this.panel = Owner;
    }
    else {
        this.panel = html.createElement(Owner, "DIV");
        this.panel.style.display = 'inline-block';
    }
    this.panel.style.overflow = 'auto';
    this.panel.style.padding = '5px';

    this.panel.style.backgroundColor = system.GetCustomerConfigText("UI/Tree/BackgroundColor");
    this.roots = [];

    var firstnode = null;
    for (var a in session.Authorizations) {
        var Authorization = session.Authorizations[a];
        if (system.GetDataValue(system.GetKnownNodeData(Authorization.Role), "Discover", 0) == 1) {
            var title = html.createElement(this.panel, 'DIV');

            title.innerHTML = '<SMALL>' + system.GetCustomerConfigText("UI/Tree/TXT_Role").replace('{0}',system.GetDataText(system.GetKnownNodeData(Authorization.Role),"FullName","", false) ) + '</SMALL>';
            title.style.color = system.GetCustomerConfigText("UI/Tree/RoleColor");
            var root = new Node(this, null, Authorization.TargetNodeID, null, Authorization);
            root.panel.style.display = 'inline-block';
            root.Open();
            if (firstnode == null) firstnode = root;
            this.roots[this.roots.length] = root;
        }

    }

    this.selected = null;
    this.OnSelect = null;
    this.Select = function (Node) {
        if (this.selected != null && this.selected != Node) this.selected.DeSelect();
        this.selected = Node;

        if (this.OnSelect != null) this.OnSelect(this.selected);


    }
    if (firstnode != null) firstnode.Select();
}

NodeTree.prototype.jump = function (target, hints) {
    this.jumpHints = hints;
    this.jumpTarget = target;
    for (var i in this.roots) {
        this.roots[i].tryJump();
    }
}

NodeTree.prototype.Jump = function (nodeid) {
    var _this = this;
    system.doRequest({ "RequestType": 400, "SessionGuid": session.SessionGuid, "SubjectID": nodeid }, function (response, completed) {

        if (response.Status == 0) {
            _this.jump(nodeid, response.Data.Parents);
        }

    }, null);
}

function Node(Owner, ParentNode, NodeID, LinkID, Authorization) {
    var _this = this;
    this.tree = Owner;
    this.NodeID = NodeID;
    this.Node = null;
    this.LinkID = LinkID;
    this.ParentNode = ParentNode;
    this.Authorization = Authorization

    this.panel = html.createElement((ParentNode == null) ? Owner.panel : ParentNode.children, "DIV");
    this.header = html.createElement(this.panel, 'DIV');
    this.header.style.whiteSpace = 'nowrap';
    this.children = html.createElement(this.panel, 'DIV');
    this.icon = html.createElement(this.header, 'IMG');
    this.iconType = html.createElement(this.header, 'IMG');
    this.iconType.style.display = 'none';
    this.name = html.createElement(this.header, 'SPAN');
    this.name.style.whiteSpace = 'nowrap';
    this.name.style.color = system.GetCustomerConfigText('UI/Tree/NodeNameColor');
    if (session != null && system.GetDataValue(session.UserData, "Debug", 0) == 1) {
        this.debug = html.createElement(this.header, 'SPAN');
        this.debug.style.whiteSpace = 'nowrap';
        this.debug.style.color = 'red';
    }
    this.children.style.margin = '0px 0px 0px 20px';
    this.children.style.display = 'none';
    this.header.style.cursor = 'pointer';


    this.iconType.style.height = '20px';

    this.HasParent = function (Node) {
        if (Node == this) return true;
        if (this.ParentNode != null) return this.ParentNode.HasParent(Node);
        return false;
    }

    this.name.onclick = function () {
        _this.Select();
    }
    this.iconType.onclick = function () {
        _this.Select();
    }
    this.icon.onclick = function () {
        if (_this.childNodes.length>0) {
            if (_this.collapsed) _this.Open();
            else _this.Collapse();
        }
    }


    this.collapsed = true;
    this.loaded = false;
    this.selected = false;
    this.childNodes = [];

    this.LoadData = function () {
        this.name.innerHTML = this.Node.name;
        if (this.debug) this.debug.innerHTML = "<SMALL><SMALL>&nbsp;" + this.NodeID + ",&nbsp;" + this.Node.type + "</SMALL></SMALL>";
        this.iconType.src = system.GetDataFile(system.GetKnownNodeData(this.Node.type), "IconSource", '', false);
        this.iconType.style.display = '';
        this.UpdateChildren();
        if (this.ParentNode != null) this.ParentNode.UpdateStatus();
    }

    this.UpdateStatus = function () {
        var childrenLoaded = true;
        if (!this.collapsed)
        for (var c in this.childNodes) {
            if (!this.childNodes[c].loaded) {
                childrenLoaded = false;
                break;
            }
        }

        if (!this.loaded || !childrenLoaded) {
            this.icon.src = system.GetCustomerConfigResource('UI/Tree/IMG_Wait');
        }
        else if (this.childNodes.length == 0) {
            this.icon.src = system.GetCustomerConfigResource('UI/Tree/IMG_Empty');
        }
        else if (this.collapsed) {
            this.icon.src = system.GetCustomerConfigResource('UI/Tree/IMG_Open');
        }
        else {
            this.icon.src = system.GetCustomerConfigResource('UI/Tree/IMG_Close');
        }
        this.header.style.backgroundColor = this.selected ? system.GetCustomerConfigText('UI/Tree/SelectedNodeBackgroundColor') : 'transparent';
        this.children.style.display = (this.collapsed || !childrenLoaded) ? 'none' : '';

        if (this.selected) Owner.Select(this);
    }

    this.IntoView = function () {
        if (!this.loaded) {
            system.RequireNodeID(NodeID, this, function (sender, node) {

                _this.Node = node;
                _this.loaded = true;
                _this.LoadData();
            }, 5, true, 3);
        }
    }


    this.UpdateChildren = function (PreferSel) {
        var sel = PreferSel;
        var selNode = null;
        if (this.tree.selected != null && sel == null) sel = this.tree.selected.NodeID;

        var newChildNodes = [];
        var firstMatch = null;
        if (this.Node.links != null) {

            for (var i in this.Node.links) {
                var n = null;
                var link = this.Node.links[i];

                for (var j in this.childNodes) {
                    if (this.childNodes[j].LinkID == link.LinkID) {
                        n = this.childNodes[j];

                        break;
                    }
                }
                if (n == null) {
                    n = new Node(this.tree, this, link.ToNodeID, link.LinkID, this.Authorization);
                }
                newChildNodes[i] = n;
                this.children.insertBefore(n.panel, null);
                if (firstMatch == null) firstMatch = n.panel;

                if (sel == link.ToNodeID) selNode = newChildNodes[i];

            }
        }
        this.childNodes = newChildNodes;
        while (this.children.childNodes.length > 0 && this.children.firstChild != firstMatch) this.children.removeChild(this.children.firstChild);
        if (selNode != null) selNode.Select();


        if (!_this.collapsed) {
            for (var c in _this.childNodes) {
                this.childNodes[c].IntoView();
            }
        }

        this.UpdateStatus();

        if (this.tree.jumpTarget != null) {
            this.tryJump();
        }


    }

    this.Select = function () {
        this.selected = true;
        Owner.Select(this);
        this.UpdateStatus();
    }

    this.DeSelect = function () {
        this.selected = false;
        this.UpdateStatus();
    }

    this.Open = function () {
        this.collapsed = false;
        this.IntoView();
        for (var c in this.childNodes) {
            this.childNodes[c].IntoView();
        }
        this.UpdateStatus();
    }

    this.Collapse = function () {
        this.collapsed = true;
        this.UpdateStatus();

    }

    this.tryJump = function () {
        if (this.NodeID == this.tree.jumpTarget) {
            this.tree.jumpTarget = null;
            this.Select();
        }
        for (var i in this.tree.jumpHints) {
            if (this.tree.jumpHints[i] == this.NodeID) {
                if (this.collapsed) this.Open();
                for (var j in this.childNodes) {
                    this.childNodes[j].tryJump();
                }
            }
        }
    }
}

//
//nodetype
//
function NodeType(Owner, DataNode, Done, Edit) {

    var NodeType_ParentNodeType = 185;
    system.propertytypes[NodeType_ParentNodeType] = {
  
        "ParentNodeType": { "NodeID": 167 }
    }

    var NodeType_Root = 161;
    system.propertytypes[NodeType_Root] =
    {
        "RootPropertyType": { "NodeID": 167 },
        "IsAuthorizable": { "NodeID": 168 },
        "ParentNodeTypes": [{ "Type": { "NodeID": NodeType_ParentNodeType }, "Default": { "Value": 1}}]
    }

    new Data(Owner, DataNode, Done, Edit, system.propertytypes[NodeType_Root]);
}


//
//popup
//
function Popup(Owner, Sender, Width, Height, Center, Type) {
    var _this = this;
    this.Owner = Owner;
    this.Type = Type;
    
    this.Ok = null;
    this.Yes = null;
    this.No = null;
    this.popup = html.createElement(this.Owner, "DIV");
    this.popup.style.zIndex = 1000;
    html.position(this.popup, 0, 0, 0, 0, null, null);

    this.bg = html.createElement(this.popup, "DIV");
    html.position(this.bg, 0, 0, 0, 0, null, null);
    this.bg.style.backgroundColor = '#808080';
    this.bg.style.opacity = 0.5;

    this.layer = html.createElement(this.popup, "DIV");
    this.layer.style.backgroundColor = '#ffffff';
    this.layer.style.border = '1px solid #c0c0c0';



    var pos;
    if (!Center) {
        pos = findPos(Sender);
        pos = [pos[0] - Width / 2 , pos[1] - Height / 2 ];
        if (pos[0] < 0) pos[0] = 0;
        if (pos[1] < 0) pos[1] = 0;
        if (pos[0] + Width > this.popup.offsetWidth) pos[0] = this.popup.offsetWidth - Width;
        if (pos[1] + Height > this.popup.offsetWidth) pos[1] = this.popup.offsetHeight - Height;

    }
    else {
        pos = [(this.popup.offsetWidth-Width)/2,(this.popup.offsetHeight-Height)/2];
    }
    html.position(this.layer, pos[0], pos[1], null, null, Width, Height);

    this.contents = html.createElement(this.layer, "DIV");
    html.position(this.contents, 0, 0, 0, 30, null, null);
    this.contents.style.padding = '20px';
    this.contents.style.overflow = 'auto';

    this.controls = html.createElement(this.layer, "DIV");
    html.position(this.controls, 0, null, 0, 0, null, 30);

    if ((this.Type & 1) == 1) {
        this.ok = html.createElement(this.controls, "INPUT");
        this.ok.type = "Button";
        this.ok.value = system.GetCustomerConfigText("UI/Portal/TXT_General_OK");
        this.ok.onclick = function () {
            if (_this.Ok) {
                _this.Ok();
            }
            _this.Close();
        }
    }
    if ((this.Type & 2) == 2) {
        this.yes = html.createElement(this.controls, "INPUT");
        this.yes.type = "Button";
        this.yes.value = system.GetCustomerConfigText("UI/Portal/TXT_General_Yes");
        this.yes.onclick = function () {
            if (_this.Yes) {
                _this.Yes();
            }
            _this.Close();
        }
    }
    if ((this.Type & 4) == 4) {
        this.no = html.createElement(this.controls, "INPUT");
        this.no.type = "Button";
        this.no.value = system.GetCustomerConfigText("UI/Portal/TXT_General_No");
        this.no.onclick = function () {
            if (_this.No) {
                _this.No();
            }
            _this.Close();
        }
    }

    if ((this.Type & 8) == 8) {
        this.cancel = html.createElement(this.controls, "INPUT");
        this.cancel.type = "Button";
        this.cancel.value = system.GetCustomerConfigText("UI/Portal/TXT_General_Cancel");
        this.cancel.onclick = function () {
            _this.Close();
        }
    }

}
Popup.prototype.Close = function () {
    this.Owner.removeChild(this.popup);
}

//
//portal
//
function Portal(Owner, Login) {
    this.Login = Login;
    this.Owner = Owner;

    this.rootPanel = html.createElement(Owner, "DIV");
    html.position(this.rootPanel, 0, 0, 0, 0);

    this.panel = html.createElement(this.rootPanel, "DIV");
    html.position(this.panel, 0, 0, 0, 0);
    this.panel.style.overflow = 'auto';

    this.contentPanel = html.createElement(this.rootPanel, "DIV");
    this.contentPanel.style.display = "none";
    html.position(this.contentPanel, 0, 0, 0, 0);
    this.contentPanel.style.backgroundColor = "white";

    this.header = html.createElement(this.panel, "DIV");
    this.tree = html.createElement(this.panel, "DIV");
    this.editor = html.createElement(this.panel, "DIV");
    this.controls = html.createElement(this.panel, "DIV");
    this.status = html.createElement(this.panel, "DIV");
    this.status.style.overflow = 'hidden';
    this.status.style.padding = '2px';
    system.status = this.status;

    this.status.style.backgroundImage = 'url(' + system.GetCustomerConfigResource("UI/Menu/StatusBackgroundSource") + ')';
    this.statusHeight = system.GetCustomerConfigValue("UI/Menu/StatusHeight");
    this.header.style.backgroundImage = 'url(' + system.GetCustomerConfigResource("UI/Menu/TitleBackgroundSource") + ')';
    this.headerHeight = system.GetCustomerConfigValue("UI/Menu/TitleHeight");
    this.controls.style.backgroundImage = 'url(' + system.GetCustomerConfigResource("UI/Menu/ToolboxBackgroundSource") + ')';
    this.controlsHeight = system.GetCustomerConfigValue("UI/Menu/ToolboxHeight");
    this.treeWidth = system.GetCustomerConfigValue("UI/Tree/Width");
    
    html.position(this.header, 0, 0, 0, null, null, this.headerHeight);
    html.position(this.status, 0, null, 0, 0, null, this.statusHeight-4);
    html.position(this.controls, 0, this.headerHeight, 0, null, null, this.controlsHeight);

    this.editor.style.backgroundColor = 'white';
    this.editor.style.overflow = 'auto';
    this.editor.style.padding = '10px';
    this.editor.style.backgroundImage = 'url(' + system.GetCustomerConfigResource("UI/Menu/IMG_Watermark") + ')';
    this.editor.style.backgroundRepeat = 'no-repeat';
    this.editor.style.backgroundPosition = system.GetCustomerConfigText("UI/Menu/WatermarkPosition");

    var _this = this;
    addEvent(window,'resize',
            function () {
                _this.Resize();
            });
    this.Resize();

    var welcome = html.createElement(this.panel, "DIV");
    welcome.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_General_Welcome").replace('{0}', session.UserName);
    welcome.style.color = system.GetCustomerConfigText("UI/Menu/LayerUserName/TextColor");
    html.positionCustomerConfigLayer(welcome, "UI/Menu/LayerUserName/");

    var banner = html.createElement(this.panel, "DIV");
    banner.innerHTML = system.CustomerName;
    banner.style.color = system.GetCustomerConfigText("UI/Menu/LayerCustomerName/TextColor");
    html.positionCustomerConfigLayer(banner, "UI/Menu/LayerCustomerName/");

    var logo = html.createElement(this.panel, "IMG");
    logo.src = system.GetCustomerConfigResource("UI/Menu/LayerLogo/BackgroundImage");
    html.positionCustomerConfigLayer(logo, "UI/Menu/LayerLogo/");


    this.logout = function () {
        var nodeid = 0;
        if (_this.treeView.selected != null) {
            var nodeid = _this.treeView.selected.NodeID;
        }
        setCookie("LASTNODEID", nodeid, 365);
        _this.Login.LogOut();
    }

    this.generalButton = new PortalButton(this.panel, null, 5, null
    , system.GetCustomerConfigText("UI/Menu/TXT_General")
    , function () {
        _this.ShowMenu(true, false);
    }
    );
    html.positionCustomerConfigLayer(this.generalButton.container, "UI/Menu/LayerGeneral/");

    this.nodeButton = new PortalButton(this.panel, null, 5, null
    , system.GetCustomerConfigText("UI/Menu/TXT_Node")
    , function () {
        _this.ShowMenu(false, true);
    }
    );
    html.positionCustomerConfigLayer(this.nodeButton.container, "UI/Menu/LayerNode/");

    this.panel.onmousedown = function () {
        _this.ShowMenu(false, false);
    }

    this.toolbarTreeFunctions = html.createElement(this.controls, "DIV");
    this.toolbarTreeFunctions.style.width = system.GetCustomerConfigValue("UI/Menu/TreeToolboxWidth") + 'px';
    this.toolbarTreeFunctions.style.display = 'inline-block';
    this.toolbarTreeFunctions.style.verticalAlign = 'top';
    this.toolbarTreeFunctions.style.padding = '5px 0px 5px 0px';

    var sep = html.createElement(this.controls, "IMG");
    sep.src = system.GetCustomerConfigResource("UI/Menu/ToolboxSeparatorSource");
    sep.style.verticalAlign = 'middle';
    sep.style.display = 'inline-block';

    this.toolbarInserters = html.createElement(this.controls, "DIV");
    this.toolbarInserters.style.width = system.GetCustomerConfigValue("UI/Menu/InsertersToolboxWidth") + 'px';
    this.toolbarInserters.style.display = 'inline-block';
    this.toolbarInserters.style.verticalAlign = 'top';
    this.toolbarInserters.style.padding = '5px 0px 5px 0px';

    var sep = html.createElement(this.controls, "IMG");
    sep.src = system.GetCustomerConfigResource("UI/Menu/ToolboxSeparatorSource");
    sep.style.verticalAlign = 'middle';
    sep.style.display = 'inline-block';

    this.toolbarContentFunctions = html.createElement(this.controls, "DIV");
    this.toolbarContentFunctions.style.width = system.GetCustomerConfigValue("UI/Menu/ContentToolboxWidth") + 'px';
    this.toolbarContentFunctions.style.display = 'inline-block';
    this.toolbarContentFunctions.style.verticalAlign = 'middle';

    this.toolbarNodeFunctions = html.createElement(this.panel, "DIV");
    this.toolbarNodeFunctions.style.position = 'absolute';
    this.toolbarNodeFunctions.style.borderLeft = system.GetCustomerConfigText("UI/Menu/MenuBorder");
    this.toolbarNodeFunctions.style.borderBottom = system.GetCustomerConfigText("UI/Menu/MenuBorder");
    this.toolbarNodeFunctions.style.borderRight = system.GetCustomerConfigText("UI/Menu/MenuBorder");
    this.toolbarNodeFunctions.style.right = (system.GetCustomerConfigValue("UI/Menu/LayerNode/Right")-(system.GetCustomerConfigValue("UI/Buttons/BtnGeneral/Width") - system.GetCustomerConfigValue("UI/Buttons/BtnMenu/Width"))/2) + 'px';
    this.toolbarNodeFunctions.style.top = this.headerHeight + 'px';

    this.toolbarGeneralFunctions = html.createElement(this.panel, "DIV");
    this.toolbarGeneralFunctions.style.position = 'absolute';
    this.toolbarGeneralFunctions.style.borderLeft = system.GetCustomerConfigText("UI/Menu/MenuBorder");
    this.toolbarGeneralFunctions.style.borderBottom = system.GetCustomerConfigText("UI/Menu/MenuBorder");
    this.toolbarGeneralFunctions.style.borderRight = system.GetCustomerConfigText("UI/Menu/MenuBorder");
    this.toolbarGeneralFunctions.style.right = (system.GetCustomerConfigValue("UI/Menu/LayerGeneral/Right")-(system.GetCustomerConfigValue("UI/Buttons/BtnNode/Width") - system.GetCustomerConfigValue("UI/Buttons/BtnMenu/Width"))/2) + 'px';
    this.toolbarGeneralFunctions.style.top = this.headerHeight + 'px';

    this.ShowMenu(false, false);

    this.treeView = new NodeTree(this.tree, true);
    this.Controls = new Controls(this, this.treeView);

    var nodeid = ExtractNumber(getCookie("LASTNODEID"));
    if (nodeid > 0) {
        this.treeView.Jump(nodeid);
    }
}

Portal.prototype.ShowPopup = function (Sender, Width, Height, Center, Type) {
    return new Popup(this.Owner, Sender, Width, Height, Center, Type);
}

Portal.prototype.Resize = function () {

    html.position(this.tree, 0, this.headerHeight + this.controlsHeight, null, this.statusHeight, this.treeWidth-10, null);
    html.position(this.editor, this.treeWidth, this.headerHeight + this.controlsHeight, 0, this.statusHeight, null, null);
}

Portal.prototype.ShowMenu = function (General, Node) {
    this.general =  General && !this.general;
    this.node = Node && !this.node;
    this.toolbarGeneralFunctions.style.display = this.general ? '' : 'none';
    this.toolbarNodeFunctions.style.display = this.node ? '' : 'none';
}

function Controls(Owner, NodeTree) {
    this.portal = Owner;
    this.NodeTree = NodeTree;
    this.clipboard = null;
    this.currentEditor = null;

    var _this = this;
    _this.selected = null;
    this.NodeTree.OnSelect = function (selected) {
        if (_this.selected != selected) {
            if (_this.currentEditor != null) _this.currentEditor.CloseQuery(function () {
                _this.portal.editor.innerHTML = '';
            });
        }
        if (selected == null) {
            system.LastKnownPosition = null;
        }
        else {
            system.LastKnownPosition = selected.NodeID;
        }
        _this.selected = selected;
        _this.UpdateView();
    }

    this.GetAuth = function (node) {
        var auth = null;
        if (node != null) {
            auth = node.Authorization;  
        }
        return auth;
    }

    this.GetRole = function (auth) {
        var role = null;
        if (auth != null) {
            role = system.GetKnownNode(auth.Role);
        }
        return role;
    }

    this.newEditor = function (Starter) {
        if (_this.currentEditor != null) {
            _this.currentEditor.CloseQuery(Starter);
        }
        else Starter();
    }

    this.ToClipboard = function () {
        _this.clipboard = _this.selected;
        _this.UpdateView();
    }

    this.MoveHere = function () {
        system.doRequest({ "RequestType": 14, "SessionGuid": session.SessionGuid, "SubjectID": _this.clipboard.LinkID, "TargetID": _this.selected.NodeID }, function (response, completed) {

            if (response.Status == 0) {
                system.HandleResponse(response.Data);
                if (completed != null) {
                    completed.Select();
                }
            }
        }, _this.selected);
    }

    this.LinkHere = function () {
        system.doRequest({ "RequestType": 24, "SessionGuid": session.SessionGuid, "SubjectID": _this.selected.NodeID, "TargetID": _this.clipboard.NodeID }, function (response, completed) {

            if (response.Status == 0) {
                system.HandleResponse(response.Data);
                if (completed != null) {
                    completed.Select();
                }
            }
        }, _this.selected);
    }

    this.DuplicateHere = function () {
        system.doRequest({ "RequestType": 44, "SessionGuid": session.SessionGuid, "SubjectID": _this.clipboard.NodeID, "TargetID": _this.selected.NodeID }, function (response, completed) {
            if (response.Status == 0) {
                system.HandleResponse(response.Data);
                if (completed != null) {
                    completed.Select();
                }
            }
        }, _this.selected);
    }
    this.EditData = function () {
        _this.newEditor(function () {
            system.doRequest({ "RequestType": 27, "SessionGuid": session.SessionGuid, "SubjectID": _this.selected.NodeID },
        function (response, completed) {
            closeQuery = true;
            if (response.Status == 0) {
                if (response.Data.Locked) {
                    textLocked = true;
                    _this.currentEditor = new Data(_this.portal.editor, _this.selected.NodeID, function (D) {
                        
                        system.doRequest({ "RequestType": 37, "SessionGuid": session.SessionGuid, "SubjectID": response.Data.LockID }, function () {
                            closeQuery = false;
                            textLocked = false;
                            if (D != null) {
                                D();

                            }
                        });
                        if (D != null) return true;
                    }, true);
                }
                else {
                    alert(system.GetCustomerConfigText("UI/Portal/TXT_General_InUse").replace('{0}', response.Data.Reason));
                }
            }
        });

        });

    }

    this.EditWYSIWYG = function () {
        _this.newEditor(function () {
            system.doRequest({ "RequestType": 27, "SessionGuid": session.SessionGuid, "SubjectID": _this.selected.NodeID },
        function (response, completed) {
            closeQuery = true;
            if (response.Status == 0) {
                if (response.Data.Locked) {
                    textLocked = true;
                    stopVideos(_this.portal.contentPanel);

                    _this.portal.contentPanel.innerHTML = '';
                    _this.portal.contentPanel.style.display = '';
                    LMSInitialize();
                    new SLM(_this.portal.contentPanel, _this.selected.NodeID, function (D) {
                        if (window.console && window.console.log) console.log("unlocking");
                        system.doRequest({ "RequestType": 37, "SessionGuid": session.SessionGuid, "SubjectID": response.Data.LockID }, function () {
                            closeQuery = false;
                            textLocked = false;
                            if (window.console && window.console.log) console.log("unlocked");
                            stopVideos(_this.portal.contentPanel);
                            _this.portal.contentPanel.innerHTML = '';
                            _this.portal.contentPanel.style.display = 'none';
                            if (D != null) {
                                D();

                            }
                        });
                        if (D != null) return true;
                    }, true);
                }
                else {
                    alert(system.GetCustomerConfigText("UI/Portal/TXT_General_InUse").replace('{0}', response.Data.Reason));
                }
            }
        });
            _this.currentEditor = null;
            _this.portal.editor.innerHTML = '';
        });
    }

    this.ViewData = function () {
        _this.newEditor(function () {
            _this.currentEditor = new Data(_this.portal.editor, _this.selected.NodeID, function () {
            }, false);
        });
    }

    this.Preview = function () {
        _this.newEditor(function () {
            stopVideos(_this.portal.contentPanel);
            _this.portal.contentPanel.innerHTML = '';
            _this.portal.contentPanel.style.display = '';
            LMSInitialize();
            new SLM(_this.portal.contentPanel, _this.selected.NodeID, function () {
                stopVideos(_this.portal.contentPanel);
                _this.portal.contentPanel.innerHTML = '';
                _this.portal.contentPanel.style.display = 'none';
            }, false);
            _this.currentEditor = null;
            _this.portal.editor.innerHTML = '';
        });
    }

    this.PreviewInBrowser = function () {
        window.open('slimconnector.aspx?nodeid=' + _this.selected.NodeID + '&sessionguid=' + session.SessionGuid)
    }

    this.EditAuthorizations = function () {
        _this.newEditor(function () {
            _this.currentEditor = new Authorize(_this.portal.editor, _this.selected.NodeID, function () {
            }, _this.GetRole(_this.GetAuth(_this.selected)));
        });
    }

    this.EditLicenses = function () {
        _this.newEditor(function () {
            _this.currentEditor = new License(_this.portal.editor, _this.selected.NodeID, function () {
            }, _this.GetRole(_this.GetAuth(_this.selected)), _this.GetAuth(_this.selected));
        });
    }

    this.ShowContentLink = function () {
        _this.newEditor(function () {
            _this.currentEditor = new ContentLink(_this.portal.editor, _this.selected.NodeID, function () {
            }, _this.GetRole(_this.GetAuth(_this.selected)), _this.GetAuth(_this.selected));
        });
    }

    this.Translate = function () {
        _this.newEditor(function () {
            _this.currentEditor = new Translate(_this.portal.editor, _this.selected.NodeID, function () {
            }, _this.GetRole(_this.GetAuth(_this.selected)), _this.GetAuth(_this.selected));
        });
    }

    this.ShowSessionHistory = function () {
        _this.newEditor(function () {
            _this.currentEditor = new Report(_this.portal.editor, _this.selected.NodeID, 206, _this.GetRole(_this.GetAuth(_this.selected)));
        });
    }

    this.ShowNodeHistory = function () {
        _this.newEditor(function () {
            _this.currentEditor = new Report(_this.portal.editor, _this.selected.NodeID, 203, _this.GetRole(_this.GetAuth(_this.selected)));
        });
    }

    this.ShowRecycleBin = function () {
        _this.newEditor(function () {
            _this.currentEditor = new Report(_this.portal.editor, _this.selected.NodeID, 210, _this.GetRole(_this.GetAuth(_this.selected)));
        });
    }

    this.Export = function () {
        _this.newEditor(function () {
            _this.currentEditor = new Export(_this.portal.editor, _this.selected.NodeID, true);
        });
    }

    this.Rename = function () {
        var j = prompt(system.GetCustomerConfigText("UI/Portal/TXT_Edit_Rename").replace('{0}', _this.selected.Node.name), _this.selected.Node.name)
        if (j != _this.selected.NodeName && j != null) {
            system.doRequest({ "RequestType": 13, "SessionGuid": session.SessionGuid, "SubjectID": _this.selected.NodeID, "NodeName": j }, function (response, completed) {
                if (response.Status == 0) {
                    system.HandleResponse(response.Data);
                }
            }, _this.selected);
        }
    }

    this.Delete = function () {
        if (confirm(system.GetCustomerConfigText("UI/Portal/TXT_General_Confirm"))) {
            system.doRequest({ "RequestType": 34, "SessionGuid": session.SessionGuid, "SubjectID": _this.selected.LinkID }, function (response, completed) {
                if (response.Status == 0) {
                    system.HandleResponse(response.Data);
                    if (completed.ParentNode != null) {
                        completed.ParentNode.Select();
                    }
                }
            }, _this.selected);
        }
    }

    this.MoveUp = function () {
        var objectid = _this.selected.ParentNode.childNodes[arrayIndexOf(_this.selected.ParentNode.childNodes,_this.selected) - 1].NodeID;
        system.doRequest({ "RequestType": 14, "SessionGuid": session.SessionGuid, "SubjectID": _this.selected.LinkID, "OrderID": objectid }, function (response, completed) {
            if (response.Status == 0) {
                system.HandleResponse(response.Data);
            }
        }, _this.selected);
    }

    this.MoveDown = function () {
        var objectid = _this.selected.ParentNode.childNodes[arrayIndexOf(_this.selected.ParentNode.childNodes,_this.selected) + 1].NodeID;
        system.doRequest({ "RequestType": 14, "SessionGuid": session.SessionGuid, "SubjectID": _this.selected.LinkID, "OrderID": objectid }, function (response, completed) {
            if (response.Status == 0) {
                system.HandleResponse(response.Data);
            }
        }, _this.selected);
    }
    this.Refresh = function () {
        if (_this.selected != null) {
            _this.selected.Node.RefreshKnown();
        }
    }

    this.ShowProperties = function () {
        if (_this.selected != null) {
            _this.newEditor(function () {
                _this.currentEditor = new Properties(_this.portal.editor, _this.selected, function () { }, _this.GetAuth(_this.selected));
            });
        }
    }

    this.Jump = function () {
        var j = prompt(system.GetCustomerConfigText("UI/Portal/TXT_General_Jump"), "")
        if (j != "") {
            j = ExtractNumber(j);
            system.doRequest({ "RequestType": 400, "SessionGuid": session.SessionGuid, "SubjectID": j }, function (response, completed) {
                if (response.Status == 0) {
                    _this.NodeTree.jump(j, response.Data.Parents);
                }
            }, _this.selected);
        }
    }

    this.ShowExports = function () {
        _this.newEditor(function () {
            _this.currentEditor = new Export(_this.portal.editor);
        });
    }

    this.Insert = function (NodeType, Name) {
        system.doRequest({ "RequestType": 24, "SessionGuid": session.SessionGuid, "SubjectID": _this.selected.NodeID, "NodeName": Name, "NodeType": NodeType }, function (response, completed) {

            if (response.Status == 0) {
                system.HandleResponse(response.Data);
            }
        }, _this.selected);
    }

    this.LogOut = function () {
        _this.portal.logout();
    }

    this.UpdateView = function () {
        var auth = _this.GetRole(_this.GetAuth(_this.selected));
        if (auth != null) auth = auth.data;
        var clipAuth = _this.GetRole(_this.GetAuth(_this.clipboard));
        if (clipAuth != null) clipAuth = clipAuth.data;
        var clipboardfits = false;
        for (var i in this.PortalButtons) {
            var pb = this.PortalButtons[i];
            var first = (_this.selected != null && _this.selected.ParentNode != null && arrayIndexOf(_this.selected.ParentNode.childNodes,_this.selected) > 0) ? false : true
            var last = (_this.selected != null && _this.selected.ParentNode != null && arrayIndexOf(_this.selected.ParentNode.childNodes,_this.selected) < _this.selected.ParentNode.childNodes.length - 1) ? false : true;
            var enabled = pb.UpdateView(_this.selected, auth, clipboardfits && !_this.selected.HasParent(_this.clipboard), clipAuth, first, last);
            if (_this.clipboard != null && pb.Type == 4 && enabled && pb.ConfigItem.id == _this.clipboard.Node.type) clipboardfits = true;
        }
        _this.portal.Resize();
    }

    this.PortalButtons = [];
    var nodetypes = system.KnownNodesByType(159);
    for (var i in nodetypes) {
        this.PortalButtons[this.PortalButtons.length] = new PortalButton(this, null, 4, nodetypes[i]);
    }

    var p = system.GetKnownNodeData(528);
    if (p != null) {
        for (var i in p.Properties) {
            var b = p.Properties[i];
            var t = system.GetDataText(b, "Name", '', false);

            if (t != '') this.PortalButtons[this.PortalButtons.length] = new PortalButton(this, t);

        }
    }
  
    this.UpdateView();
}

//
//portalbutton
//
function PortalButton(Controls, ButtonConfig, Type, ConfigItem, Text, Click) {
    this.Click = null;
    this.ButtonConfig = ButtonConfig;
    this.Controls = Controls;
    if (this.ButtonConfig != null) {
        this.Type = system.GetCustomerConfigValue("UI/Toolbar/" + ButtonConfig + "/Type");
        this.Icon = system.GetCustomerConfigResource("UI/Toolbar/" + ButtonConfig + "/Icon");
        this.Text = system.GetCustomerConfigText("UI/Toolbar/" + ButtonConfig + "/Text");
        this.Code = system.GetCustomerConfigText("UI/Toolbar/" + ButtonConfig + "/CodeFunction");
        this.Authorization = system.GetCustomerConfigText("UI/Toolbar/" + ButtonConfig + "/RequiredAuthorization");
        this.ClipboardAuthorization = system.GetCustomerConfigText("UI/Toolbar/" + ButtonConfig + "/ClipboardAuthorization");
        this.NodeTypeProperty = system.GetCustomerConfigText("UI/Toolbar/" + ButtonConfig + "/RequiredNodeTypeProperty");
        this.NeedParent = system.GetCustomerConfigValue("UI/Toolbar/" + ButtonConfig + "/ParentRequired");
        this.NotFirst = system.GetCustomerConfigValue("UI/Toolbar/" + ButtonConfig + "/NotFirst");
        this.NotLast = system.GetCustomerConfigValue("UI/Toolbar/" + ButtonConfig + "/NotLast");
        this.ClipboardFits = system.GetCustomerConfigValue("UI/Toolbar/" + ButtonConfig + "/ClipboardFits");

        if (this.Type == 0) {
            this.Owner = Controls.portal.toolbarTreeFunctions;
        }
        if (this.Type == 1) {
            this.Owner = Controls.portal.toolbarContentFunctions;
        }
        if (this.Type == 2) {
            this.Owner = Controls.portal.toolbarNodeFunctions;
        }
        if (this.Type == 3) {
            this.Owner = Controls.portal.toolbarGeneralFunctions;
        }

        this.Click = Controls[this.Code];
    }
    else if (Type == 4) {
        this.Type = Type;
        this.ConfigItem = ConfigItem;
        this.Owner = Controls.portal.toolbarInserters;

        this.Icon = system.GetDataFile(ConfigItem.data, "IconSource", '', false);
        this.Text = system.GetCustomerConfigText("UI/Portal/TXT_Edit_AddType").replace('{0}', system.GetDataText(ConfigItem.data, "Name", ConfigItem.name, false));
        this.NewItem = system.GetCustomerConfigText("UI/Portal/TXT_General_NewType").replace('{0}', system.GetDataText(ConfigItem.data, "Name", ConfigItem.name, false));
        var _this = this;
        this.Click = function () {
            this.Controls.Insert(_this.ConfigItem.id, this.NewItem);
        }

    }
    else if (Type == 5) {
        this.Type = Type;
        this.Owner = Controls;
        this.Text = Text;
        this.Click = Click;
    }
    else if (Type >= 7) {
        this.Type = Type;
        this.Owner = Controls;

        this.Icon = system.GetDataFile(system.GetKnownNodeData(ConfigItem.P), "IconSource", '', false);
        this.Text = system.GetCustomerConfigText("UI/Portal/TXT_Edit_AddType").replace('{0}', Text);

        var _this = this;
        //this.Click = Click;
    }

    this.ButtonTypeConfigStr = "UI/Buttons/" + ["BtnTree", "BtnContent", "BtnNode", "BtnGeneral", "BtnInsert", "BtnMenu", "BtnOS", "BtnToolbox1", "BtnToolbox2", "BtnToolbox3", "BtnToolbox4"][this.Type] + "/";
    this.bgSrc = system.GetCustomerConfigResource(this.ButtonTypeConfigStr + "IMG_Background");
    this.disSrc = system.GetCustomerConfigResource(this.ButtonTypeConfigStr + "IMG_Disabled");
    this.oSrc = system.GetCustomerConfigResource(this.ButtonTypeConfigStr + "IMG_Overlay");
    this.opSrc = system.GetCustomerConfigResource(this.ButtonTypeConfigStr + "IMG_OverlayPlus");
    this.w = system.GetCustomerConfigValue(this.ButtonTypeConfigStr + "Width");
    this.h = system.GetCustomerConfigValue(this.ButtonTypeConfigStr + "Height");


    this.container = html.createElement(this.Owner, "DIV");
    this.container.style.cursor = 'Pointer';
    if (this.Type == 2 || this.Type == 3) {
        this.container.style.display = 'block';
    }
    else {
        this.container.style.display = 'inline-block';
    }

    if (this.Type != 6) {
        this.background = html.createElement(this.container, "IMG");
        this.background.style.position = 'absolute';
        this.background.src = this.bgSrc;
        this.overlay = html.createElement(this.container, "IMG");
        this.overlay.style.position = 'absolute';
        this.overlay.src = this.oSrc;
        this.overlay.style.display = 'none';
        this.container.style.width = this.w + "px";
        this.container.style.height = this.h + "px";
    }
    else {

    }

    if (this.Type == 0 || this.Type == 1 || this.Type == 4 || this.Type >= 7) {
        this.icon = html.createElement(this.container, "IMG");
        this.icon.style.position = 'absolute';
        this.icon.src = this.Icon;
        this.container.title = this.Text;
    }
    else {
        this.text = html.createElement(this.container, "SPAN");
        this.text.style.position = 'absolute';
        this.text.innerHTML = this.Text;
        this.text.style.verticalAlign = 'middle';
        this.text.style.color = system.GetCustomerConfigText(this.ButtonTypeConfigStr + "FontColor");
        this.text.style.padding = system.GetCustomerConfigText(this.ButtonTypeConfigStr + "Padding");
        if (Type == 5) {
            this.text.style.textAlign = 'center';
            this.text.style.width = '100%';
        }
    }
    if (this.Type == 4 || this.Type >= 7) {
        this.overlayPlus = html.createElement(this.container, "IMG");
        this.overlayPlus.style.position = 'absolute';
        this.overlayPlus.src = this.opSrc;
    }



    this.disabled = false;
    this.mouseDown = false;
    this.mouseIn = false;

    var _this = this;

    if (supportsTouch) {
        _this.container.ontouchstart = function (e) {
            e.preventDefault();
            if (!_this.disabled) {
                if (e.touches.length == 1 && _this.Click != null) _this.Click();
                if (_this.Type == 2 || _this.Type == 3) _this.Controls.portal.ShowMenu(false, false);

            }
        };
    }
    //else {

        _this.container.onmouseover = function () {
            if (!_this.disabled) {
                _this.mouseIn = true;
                _this.updateSrc();
            }
        };
        _this.container.onmouseout = function () {
            _this.mouseIn = false;
            _this.updateSrc();
        };
        _this.container.onmousedown = function (e) {
            if (e == null)
                e = window.event;

            _this.mouseDown = true;
            _this.updateSrc();


            if (_this.Type < 7) {
                if (e.stopPropagation) e.stopPropagation();
                return false;
            }

        };
        _this.container.onmouseup = function () {
            if (_this.mouseIn && _this.Click != null && !_this.disabled) _this.Click();
            _this.mouseDown = false;
            _this.updateSrc();

            if (_this.Type == 2 || _this.Type == 3) _this.Controls.portal.ShowMenu(false, false);

        };
    //}
    this.updateSrc();
}

PortalButton.prototype.UpdateView = function (selected, auth, clipboardFits, clipAuth, first, last) {
    var enabled = true;
    if (this.Type == 3) {

    }
    else if (this.Type == 4) {
        var found = false;
        if (selected != null && selected.Node != null) for (var pnt in this.ConfigItem.data.ParentNodeTypes) {
            var p = this.ConfigItem.data.ParentNodeTypes[pnt];
            if (selected.Node.type == system.GetDataNode(p, "ParentNodeType", 0)) {
                found = true;
            }
        }
        if (system.GetDataValue(auth, "Structurize", 0) == 0) enabled = false;
        else enabled = found;

    }
    else {
        if (selected == null || selected.Node == null) enabled = false;
        if (enabled && this.NodeTypeProperty != '') {
            if (system.GetDataValue(system.GetKnownNodeData(selected.Node.type), this.NodeTypeProperty, 0) == 0) enabled = false;
        }
        if (enabled && this.NeedParent == 1) {
            if (selected.ParentNode == null) enabled = false;
        }
        if (enabled && this.NotFirst == 1) {
            if (first) enabled = false;
        }
        if (enabled && this.NotLast == 1) {
            if (last) enabled = false;
        }
        if (enabled && this.Authorization != '') {
            if (system.GetDataValue(auth, this.Authorization, 0) == 0) enabled = false;
        }
        if (enabled && this.ClipboardFits == 1) {
            if (!clipboardFits) enabled = false;

        }
        if (enabled && this.ClipboardAuthorization != '') {
            if (system.GetDataValue(clipAuth, this.ClipboardAuthorization, 0) == 0) enabled = false;
        }


    }
    this.disabled = !enabled;
    this.updateSrc();
    return enabled;
}

PortalButton.prototype.UpdateToolboxItem = function (visible, clickable) {
    this.disabled = !visible;
    this.clickable = clickable;
    this.container.style.cursor = this.clickable ? 'pointer' : 'default';
    this.updateSrc();
}

PortalButton.prototype.SetEnabled = function (enabled) {
    this.disabled = !enabled;
    this.updateSrc();
}

PortalButton.prototype.updateSrc = function () {
    if (this.Type == 4 || this.Type >= 7) {
        this.container.style.display = this.disabled ? 'none' : 'inline-block';
    }
    if (this.Type >= 7) {
        this.overlayPlus.style.display = this.clickable ? '' : 'none';
    }

    if (this.disabled) {
        this.overlay.style.display = 'none';
        this.background.src = this.disSrc;
    }
    else if (this.mouseIn) {
        this.background.src = this.bgSrc;
        this.overlay.style.display = '';
    }
    else {
        this.background.src = this.bgSrc;
        this.overlay.style.display = 'none';
    }

}



//
//properties
//
function Properties(Owner, SelectedNode, Done, Auth) {
    this.Done = Done;
    this.CloseQuery = function (Done) {
        if (Done != null) Done();
    }
    this.contentLayer = Owner;
    this.contentLayer.innerHTML = '';
    this.title = html.createElement(this.contentLayer, "H1");
    this.title.innerHTML = system.GetCustomerConfigText("UI/TXT_Prop_Title").replace('{0}',SelectedNode.Node.name);
    var p = html.createElement(this.contentLayer, "SPAN");
    var properties = '<UL><LI>' + system.GetCustomerConfigText("UI/TXT_Prop_NodeID") + ': <B>' + SelectedNode.NodeID + '</B></LI>';
    properties += '<LI>' + system.GetCustomerConfigText("UI/TXT_Prop_DownloadStatus").replace('{0}', SelectedNode.Node.required).replace('{1}', SelectedNode.Node.loaded).replace('{2}', SelectedNode.Node.notauthorized) + '</LI>';
    properties += '<LI>' + system.GetCustomerConfigText("UI/TXT_Prop_NodeType") + ':';
    properties += '<UL><LI>' + system.GetCustomerConfigText("UI/TXT_Prop_NodeID") + ': <B>' + SelectedNode.Node.type + '</B></LI>';
    var cf = system.GetKnownNode(SelectedNode.Node.type);
    if (cf != null) {
        properties += '<LI>' + system.GetCustomerConfigText("UI/TXT_Prop_NodeName") + ': <B>' + cf.name + '</B></LI>';
    }
    properties += '</UL></LI>';
    if (SelectedNode.LinkID != null) {
        properties += '<LI>' + system.GetCustomerConfigText("UI/TXT_Prop_LinkID") + ': <B>' + SelectedNode.LinkID + '</B></LI>';
    }
    if (SelectedNode.ParentNode != null) {
        properties += '<LI>' + system.GetCustomerConfigText("UI/TXT_Prop_Parent") + ':';
        properties += '<UL><LI>' + system.GetCustomerConfigText("UI/TXT_Prop_NodeName") + ': <B>' + SelectedNode.ParentNode.Node.name + '</B></LI><LI>' + system.GetCustomerConfigText("UI/TXT_Prop_NodeID") + ': <B>' + SelectedNode.ParentNode.NodeID + '</B></LI>';
        properties += '<LI>' + system.GetCustomerConfigText("UI/TXT_Prop_NodeType") + ': <UL><LI>' + system.GetCustomerConfigText("UI/TXT_Prop_NodeID") + ': <B>' + SelectedNode.ParentNode.Node.type + '</B></LI>';
        cf = system.GetKnownNode(SelectedNode.ParentNode.Node.type);
        if (cf != null) {
            properties += '<LI>' + system.GetCustomerConfigText("UI/TXT_Prop_NodeName") + ': <B>' + cf.name + '</B></LI>';
        }
        properties += '</UL></UL></LI>';
    }
    properties += '<LI>' + system.GetCustomerConfigText("UI/TXT_Prop_CurrentAuthorization") + ':';
    properties += '<UL><LI>' + system.GetCustomerConfigText("UI/TXT_Prop_AuthorizationID") + ': <B>' + Auth.AuthorizationID + '</B></LI>';
    properties += '<LI>' + system.GetCustomerConfigText("UI/TXT_Prop_User") + ': <B>' + Auth.UserNodeID + '</B></LI>';
    properties += '<LI>' + system.GetCustomerConfigText("UI/TXT_Prop_Target") + ': <B>' + Auth.TargetNodeID + '</B></LI>';
    properties += '<LI>' + system.GetCustomerConfigText("UI/TXT_Prop_Role") + ':<UL>';
    cf = system.GetKnownNode(Auth.Role);
    if (cf != null) {
        properties += '<LI>' + system.GetCustomerConfigText("UI/TXT_Prop_NodeID") + ': <B>' + cf.id + '</B></LI>';
        properties += '<LI>' + system.GetCustomerConfigText("UI/TXT_Prop_NodeName") + ': <B>' + cf.name + '</B></LI>';
    }
    properties += '</UL></LI>';
    properties += '</UL>';
    properties += '<LI>' + system.GetCustomerConfigText("UI/TXT_Prop_CurrentSession") + ':';
    properties += '<UL><LI>' + system.GetCustomerConfigText("UI/TXT_Prop_GUID") + ': <B>' + session.SessionGuid + '</B></LI>';
    properties += '<LI>' + system.GetCustomerConfigText("UI/TXT_Prop_User") + ': <B>' + session.UserID + '</B></LI>';
    properties += '<LI>' + system.GetCustomerConfigText("UI/TXT_Prop_NodeName") + ': <B>' + session.UserName + '</B></LI>';
    properties += '<LI>' + system.GetCustomerConfigText("UI/TXT_Prop_LicenseDaysLeft").replace('{0}',  session.LicenseDaysLeft );
    properties += '</UL>';
    properties += '</UL>';
    p.innerHTML = properties;
}

//
//propertytype
//
function PropertyType(Owner, DataNode, Done, Edit) {



    var PropertyType_Root = 162;
    system.propertytypes[PropertyType_Root] =
    {
        "Name": { "NodeID": 164 }
    }

    new Data(Owner, DataNode, Done, Edit, system.propertytypes[PropertyType_Root]);
}


//
//report
//
function Report(Owner, DataNode, ReportType, Auth) {
    var _this = this;
    this.Auth = Auth;
    if (this.Auth != null) this.Auth = this.Auth.data;
    this.ReportType = ReportType;
    this.Owner = Owner;
    this.DataNode = DataNode;

    this.CloseQuery = function (Done) {
        if (Done != null) Done();
    }

    var ReportTypes = { "203": "TXT_Title_NodeHistory", "206": "TXT_Title_SessionHistory", "210": "TXT_Title_RecycleBin" };
    var UserStatus = { "0": "TXT_ContentStatus_Normal", "10": "TXT_ContentStatus_InternalReview", "20": "TXT_ContentStatus_ExternalReview", "30": "TXT_ContentStatus_Translate", "40": "TXT_ContentStatus_Published" };
    var SessionStatus = { "0": "TXT_SessionStatus_Active", "1": "TXT_SessionStatus_Closed", "2": "TXT_SessionStatus_Expired", "3": "TXT_SessionStatus_Kicked" };
    var MaintenanceStatus = { "0": "TXT_MaintenanceStatus_Work", "1": "TXT_MaintenanceStatus_Daily", "2": "TXT_MaintenanceStatus_Monthly", "3": "TXT_MaintenanceStatus_Yearly" };

    this.contentLayer = Owner;
    
    this.title = html.createElement(this.contentLayer, "H1");
    this.title.innerHTML = system.GetCustomerConfigText("UI/Report/"+ReportTypes[ReportType.toString()]);

    this.load = function () {
        this.contentLayer.innerHTML = '';
        system.doRequest({ "RequestType": ReportType, "SessionGuid": session.SessionGuid, "SubjectID": this.DataNode }, function (response, completed) {
            _this.ReportData = response.Data;
            _this.show();
        });
    }

    this.show = function () {
        var table = html.createElement(this.contentLayer, "TABLE");
        table.style.backgroundColor = '#eef0f2';
        html.addGradient(table, 'top', 'white', '#eef0f2');
        table.style.boxShadow = '1px 1px 4px #888';
        table.style.padding = '5px';

        table.cellPadding = 10;
        var htmlr = document.createElement('tr');
        table.appendChild(htmlr);
        for (var h in this.ReportData.Headers) {
            var htmlc = document.createElement('td');
            htmlr.appendChild(htmlc);
            htmlc.innerHTML = system.GetCustomerConfigText("UI/Report/" + this.ReportData.Headers[h].ColName);
        }
        for (var i in this.ReportData.Rows) {

            var row = this.ReportData.Rows[i];
            htmlr = document.createElement('tr');
            table.appendChild(htmlr);
            var rowid = 0;
            for (var ci in row) {
                var cell = row[ci];
                var htmlc = document.createElement('td');
                htmlr.appendChild(htmlc);
                var header = this.ReportData.Headers[ci];

                if (header.DataType == "Date") {
                    htmlc.innerHTML = eval('new' + cell.replace(/\//g, ' ')).getIsoDate();
                }
                else if (header.DataType == "SessionStatus") {
                    htmlc.innerHTML = system.GetCustomerConfigText("UI/Report/" + SessionStatus[cell.toString()]);
                }
                else if (header.DataType == "MaintenanceStatus") {
                    htmlc.innerHTML = system.GetCustomerConfigText("UI/Report/" + MaintenanceStatus[cell.toString()]);
                }
                else if (header.DataType == "UserStatus") {
                    if (system.GetDataValue(this.Auth, "Recover", 0) == 1 && this.ReportType == 203) {

                        var sel = [];
                        sel[0] = html.createElement(htmlc, "SELECT");
                        for (var i in UserStatus) {
                            var option = html.createElement(sel[0], "OPTION");
                            option.value = i;
                            option.text = system.GetCustomerConfigText("UI/Report/" + UserStatus[i.toString()]);
                            if (i == cell["UserStatus"].toString()) {
                                sel[0].value = i;
                            }
                        }
                        html.createElement(htmlc, "BR");

                        sel[1] = html.createElement(htmlc, "INPUT");
                        sel[1].type = "CHECKBOX";
                        var k = html.createElement(htmlc, "SPAN");
                        k.innerHTML = system.GetCustomerConfigText("UI/Report/TXT_Keep");
                        sel[1].checked = (cell["Keep"] == 1) ? true : false;
                        html.createElement(htmlc, "BR");

                        sel[2] = html.createElement(htmlc, "INPUT");
                        sel[2].type = "TEXT";
                        sel[2].value = cell["Comment"];
                        new IDButton(htmlc, system.GetCustomerConfigText("UI/Report/TXT_Change"), rowid, function (id, param) {
                            system.doRequest({ "RequestType": 213, "SessionGuid": session.SessionGuid, "SubjectID": id,
                                "UserStatus": ExtractNumber(param[0].value),
                                "Keep": param[1].checked ? 1 : 0,
                                "Comment": param[2].value

                            }, function (response, completed) {
                                param[0].value = response.Data.NewUserStatus.toString();
                            });
                        }, sel, false);
                    }
                    else {
                        htmlc.innerHTML = UserStatus[cell.toString()];
                    }


                }
                else if (header.DataType == "ID") {
                    rowid = cell;
                    if (system.GetDataValue(this.Auth, "Recover", 0) == 1 && this.ReportType == 203) {
                        new IDButton(htmlc, system.GetCustomerConfigText("UI/Report/TXT_Restore"), cell, function (id) {
                            system.doRequest({ "RequestType": 53, "SessionGuid": session.SessionGuid, "SubjectID": id }, function (response, completed) {
                                if (response.Status == 0) {
                                    system.HandleResponse(response.Data);
                                    system.KnownIDS[_this.DataNode.toString()].RefreshKnown();
                                    _this.load();
                                }
                                //alert(system.GetCustomerConfigText("UI/Report/TXT_MustRefresh"));
                            }, null, true);
                        });
                        new IDButton(htmlc, system.GetCustomerConfigText("UI/Report/TXT_Preview"), cell, function (id) {
                            window.open('SLIMConnector.aspx?NodeHistoryID=' + id + '&SessionGUID=' + session.SessionGuid, 'preview');


                        });
                    }
                    else if (system.GetDataValue(this.Auth, "Recover", 0) == 1 && this.ReportType == 210) {
                        new IDButton(htmlc, system.GetCustomerConfigText("UI/Report/TXT_Restore"), cell, function (id) {
                            system.doRequest({ "RequestType": 54, "SessionGuid": session.SessionGuid, "SubjectID": id }, function (response, completed) {
                                if (response.Status == 0) {
                                    system.HandleResponse(response.Data);
                                    _this.load();
                                }
                                //alert(system.GetCustomerConfigText("UI/Report/TXT_MustRefresh"));
                            }, null, true);
                        });
                    }
                    else {
                        htmlc.innerHTML = cell;
                    }
                }
                else if (header.DataType == "NodeID") {

                    system.RequireNodeID(cell, htmlc, function (sender, node) {
                        sender.innerHTML = node.name;
                    }, 1, false, 0);
                }
                else {
                    htmlc.innerHTML = cell;
                }
            }
        }

    }

    this.load();
}

function IDButton(owner, face, id, event, param, query) {
    var restoreButton = html.createElement(owner, "INPUT");
    restoreButton.type = "BUTTON";
    restoreButton.value = face;
    this.id = id;
    this.param = param;
    this.event = event;
    this.query = query;
    var _this = this;
    restoreButton.onclick = function () {
        if (_this.query) if (!confirm(system.GetCustomerConfigText("UI/Report/TXT_Confirm"))) return;

        if (_this.param != null) {
            _this.event(_this.id, _this.param);
        }
        else {
            _this.event(_this.id);
        }
    }
}

//
//role
//
function Role(Owner, DataNode, Done, Edit) {

    var Role_Root = 236;
    system.propertytypes[Role_Root] = {

        "ReadNode": { "NodeID": 168 } ,
        "Discover": { "NodeID": 168 } ,
        "ReadAuthorizations": { "NodeID": 168 } ,
        "LockNodes": { "NodeID": 168 } ,
        "UpdateNodes": { "NodeID": 168 } ,
        "Structurize": { "NodeID": 168 } ,
        "InsertResources": { "NodeID": 168 } ,
        "EditAuthorizations": { "NodeID": 168 } ,
        "Recover": { "NodeID": 168 } ,
        "Report": { "NodeID": 168 } ,
        "Export": { "NodeID": 168 } ,
        "AllowConfig": { "NodeID": 168 } ,

        //specials
        "SpecialReadTreeOnce": { "NodeID": 168 } 
    
    };

    new Data(Owner, DataNode, Done, Edit, system.propertytypes[Role_Root]);


}

//
//skin
//
function Skin(Owner, DataNode, Done, Edit) {

    var Skin_BasicCCS = 169;
    system.propertytypes[Skin_BasicCCS] =
    {
        
        "RelPos" : {"NodeID":164},
        "Left" : {"NodeID":164},
        "Top" : {"NodeID":164},
        "Right" : {"NodeID":164},
        "Bottom" : {"NodeID":164},
        "Width" : {"NodeID":164},
        "Height" : {"NodeID":164},
        "Margin" : {"NodeID":164},
        "Padding" : {"NodeID":164},
        "Position" : {"NodeID":164},
        "TextAlign" : {"NodeID":164}
    };

    var Skin_Image = 170;
    system.propertytypes[Skin_Image] = Extend({
        "Source" : {"NodeID":165}
    },system.propertytypes[Skin_BasicCCS]);

    var Skin_Button = 171;
    system.propertytypes[Skin_Button]  = Extend({
        "HoverSource" : {"NodeID":165},
        "DownSource" : {"NodeID":165}

    },system.propertytypes[Skin_Image]);

    var Skin_NavigationButton = 172;
    system.propertytypes[Skin_NavigationButton] = Extend({
        "ActiveSource" : {"NodeID":165},
        "WrongSource" : {"NodeID":165},
        "WrongHoverSource" : {"NodeID":165},
        "WrongDownSource" : {"NodeID":165},
        "WrongActiveSource" : {"NodeID":165},
        "CorrectSource" : {"NodeID":165},
        "CorrectHoverSource" : {"NodeID":165},
        "CorrectDownSource" : {"NodeID":165},
        "CorrectActiveSource" : {"NodeID":165},
        "DisabledSource" : {"NodeID":165}

    },system.propertytypes[Skin_Button]);

    var Skin_Layer = 173;
    system.propertytypes[Skin_Layer] = Extend({
        "BackgroundColor" : {"NodeID":164},
        "BackgroundImage" : {"NodeID":Skin_Image},
        "Transition" : {"NodeID":164}
    }, system.propertytypes[Skin_BasicCCS]);

    var Skin_FontFace = 175;
    system.propertytypes[Skin_FontFace]= {
        "Family" : {"NodeID":164},
        "Source" : {"NodeID":165}
    };

    var Skin_Text = 174;
    system.propertytypes[Skin_Text] = Extend({

        "FontFace" : {"NodeID":Skin_FontFace},
        "FontSize" : {"NodeID":164},
        "LineHeight" : {"NodeID":164},
        "Color": { "NodeID": 164 },
        "FontStyle": { "NodeID": 164 },
        "TextDecoration": { "NodeID": 164 },
        "FontWeight": { "NodeID": 164 },
        "TextShadow": { "NodeID": 164 }
    }, system.propertytypes[Skin_BasicCCS]);



    var Skin_Navigation = 176
    system.propertytypes[Skin_Navigation] = {
  
        "Area" : {"NodeID":Skin_Layer},
        "ButtonBack" : {"NodeID":Skin_Button},
        "ButtonForward" : {"NodeID":Skin_Button},
        "ButtonNav" : {"NodeID":Skin_NavigationButton}
    };

    var Skin_Border = 177;
    system.propertytypes[Skin_Border]  = {
        "Border" : {"NodeID":164},
        "BorderLeft" : {"NodeID":164},
        "BorderTop" : {"NodeID":164},
        "BorderRight" : {"NodeID":164},
        "BorderBottom" : {"NodeID":164}
    };

    var Skin_AssetButton = 178;
    system.propertytypes[Skin_AssetButton] = {
        "BackgroundSource": { "NodeID": 165 },
        "Body": { "NodeID": Skin_Text },
        "H" : {"NodeID":Skin_Text},
        "Em": { "NodeID": Skin_Text }
    };


    var Skin_Asset = 184;
    system.propertytypes[Skin_Asset] = {
        "Name": { "NodeID": 164 },
        "Key": { "NodeID": 168 },

        "Padding": { "NodeID": 164 },
        "Margin": { "NodeID": 164 },
        "Border": { "NodeID": Skin_Border },
        "BackgroundColor": { "NodeID": 164 },
        "Title": { "NodeID": Skin_Text },
        "SubTitle": { "NodeID": Skin_Text },
        "Body": { "NodeID": Skin_Text },
        "H": { "NodeID": Skin_Text },
        "Em": { "NodeID": Skin_Text },
        "NotSelected": { "NodeID": Skin_AssetButton },
        "Hover": { "NodeID": Skin_AssetButton },
        "Selected": { "NodeID": Skin_AssetButton },
        "Correct": { "NodeID": Skin_AssetButton },
        "Wrong": { "NodeID": Skin_AssetButton },
        "TimerSource": { "NodeID": 165 },
        "TimerFillerSource": { "NodeID": 165 },
        "DownloadSource": { "NodeID": 165 },
        "DownloadLink": { "NodeID": Skin_Text }
    };
    

    var Skin_LightBox = 179;
    system.propertytypes[Skin_LightBox] = {
        "Name": { "NodeID": 164 },
        "Key" : {"NodeID":168},
        
        "Area" : {"NodeID":Skin_Layer},
        "OpenLightBoxButtonStyle" : {"NodeID":Skin_Button},
        "CloseLightBoxButtonStyle" : {"NodeID":Skin_Button},
        "Navigation" : {"NodeID":Skin_Navigation}                       
    };

    var Skin_Player = 180;
    system.propertytypes[Skin_Player] = {
        "Name" : {"NodeID":164},
        "Key" : {"NodeID":168},

        "ShowButton": { "NodeID": 168 },
        "Area" : {"NodeID":Skin_Layer},
        "Button" : {"NodeID":Skin_Button},
        "Navigation" : {"NodeID":Skin_Navigation}                       
    };

    var Skin_StyleColor = 181;
    system.propertytypes[Skin_StyleColor] = {
        "Name": { "NodeID": 164 },
        "Key" : {"NodeID":168},
        
        "Color" : {"NodeID":164}
    }




    var Skin_MenuAnimation = 183;
    system.propertytypes[Skin_MenuAnimation] = 
    {
                            		"Transition" : {"NodeID":164},
			                        "TransformHidden" : {"NodeID":164},
			                        "OpacityHidden" : {"NodeID":164},
			                        "TransformShown" : {"NodeID":164},
			                        "OpacityShown" : {"NodeID":164},
			                        "TransformUp" : {"NodeID":164},
			                        "OpacityUp" : {"NodeID":164},
			                        "FaderTransformShown" : {"NodeID":164},
			                        "FaderTransformHidden" : {"NodeID":164}
                            };


  

    var Skin_RapidElearning = 182;
    system.propertytypes[Skin_RapidElearning] =

                        {
                            "BackgroundImageStyle" : {"NodeID":Skin_Image},
                            "LogoImageStyle" : {"NodeID":Skin_Image},
                            "MenuButtonStyle" : {"NodeID":Skin_Button},
                            "MenuAreaStyle" : {"NodeID":Skin_Layer},
                            "MenuFaderStyle" : {"NodeID":Skin_Layer},
                            "MenuAnimation" : {"NodeID" : Skin_MenuAnimation},
                            "TitleStyle": { "NodeID": Skin_Text },
                            "LightBoxStyles": [{ "Type": { "NodeID": Skin_LightBox }, "Default": { "Value": 1}}],
                            "PlayerStyles": [{ "Type": { "NodeID": Skin_Player }, "Default": { "Value": 1}}],
                            "PageAreaStyle" : {"NodeID":Skin_Layer},
                            "GridStyle": { "NodeID": Skin_Layer },
                            "AssetStyles": [{ "Type": { "NodeID": Skin_Asset }, "Default": { "Value": 1}}],
                            "ColorStyles": [{ "Type": { "NodeID": Skin_StyleColor }, "Default": { "Value": 1}}]
                        }
                   

    var Skin_Root = 148;
    system.propertytypes[Skin_Root] = { "RapidElearning": { "NodeID": Skin_RapidElearning} };

    new Data(Owner, DataNode, Done, Edit, system.propertytypes[Skin_Root]);

    
}

//
//slm
//
function SLM(Owner, DataNode, Done, Edit) {
    var _this = this;
    this.Done = Done;
    this.loading = 0;
    this.Owner = Owner;
    this.DataNode = DataNode;
    this.Edit = Edit;

    html.Reset();

    this.contentLayer = html.createElement(Owner, "DIV");



    if (window.data && window.skin) {
        _this.skin = skin;
        _this.data = data;
        AddResources(skin_resources);
        AddResources(data_resources);
        AddTexts(skin_texts);
        AddTexts(data_texts);
        this.loaded();
    }
    else {

        this.load();
    }


}

SLM.prototype.load = function () {
    var _this = this;
    system.RequireNodeID(this.DataNode, this, function (sender, node) {
        _this.data = node.data;
        _this.nodetype = node.type;
        _this.dataloaded();
    },3, false, 0);
}
SLM.prototype.dataloaded = function () {
    var skin = system.GetDataNode(this.data, "PreferedSkin", null);
    if (skin == null) {

        var userskin = system.GetDataNode(session.UserData, "Skin", null);
        if (userskin == null) {
            alert(system.GetCustomerConfigText("UI/WYSIWYGEditor/TXT_NoSkin"));

        }
        else {
            if (confirm(system.GetCustomerConfigText("UI/WYSIWYGEditor/TXT_UseUserSkin"))) {
                system.saveNodeData(this.data, "PreferedSkin", userskin);
                skin = userskin;
            }
        }
    }
    if (skin != null) {
        var _this = this;
        system.RequireNodeID(skin, this, function (sender, node) {
            if (node.data != null) {
                _this.skin = node.data;
                _this.loaded();
            }
            else {
                alert(system.GetCustomerConfigText("UI/WYSIWYGEditor/TXT_SkinNotAllowed"));
                if (_this.Done != null) _this.Done();
            }
        },2, false, 0);
    }
    else {
        if (this.Done != null) this.Done();
    }
}

SLM.prototype.loaded = function () {
    var skinRapidElearning = this.skin.RapidElearning;
    var _this = this;
    this.closeButton = new Button(this.Owner, skinRapidElearning.CloseButtonStyle, function () {
        _this.Close();

    }, this, false);
    this.Close = function () {
        
        if (window.console && window.console.log) console.log("close");
        if (_this.Done != null) {
            SaveFieldAPI();
            if (_this.block && _this.block.Editor != null) {
                if (window.console && window.console.log) console.log("closequery");
                _this.block.Editor.GenericDataEditComponent.CloseQuery(function () {
                    if (window.console && window.console.log) console.log("done");
                    _this.Done();
                });
            }
            else {
                _this.Done();
            }
        }
        else {
            if (CLPInfo != null) {
                LMSFinish();
                LMSCloseWindow();
            }
            else {
                try {
                    if (window == window.parent || window.parent == null || window.opener != null || forceclose) {
                        window.top.close();
                    }
                    else {
                        LMSFinish();
                    }
                }
                catch (e) {

                }
            }
        }
        if (externalHandle != null && ('finish' in externalHandle)) externalHandle.finish();
        skinvarmode = null;
    }
    this.closeButton.element.style.zIndex = 3;

    

    this.block = new Block(this.contentLayer, this, skinRapidElearning, this.Edit);

  
    if (ie7stylesheet != null) ie7stylesheet.styleSheet.cssText = ie7stylerules;
}





//GENERIC

function Button(Owner, Style, Click, Block, CancelMenu, Encapsulated) {

    this.Click = Click;
    this.Block = Block;
    this.CancelMenu = CancelMenu;
    this._enabled = true;

    this._encapsulated = Encapsulated;
    this._border = null;
    if (this._encapsulated) {
        this._border = html.createLayer(Owner, "DIV");

        this.element = html.createInterfaceImageEx(this._border, null, null);

    }
    else {


        this.element = html.createInterfaceImageEx(Owner, null, null);
    }
    this.element.style.cursor = 'pointer';
    var _this = this;
    this.mouseIn = false;
    this.mouseDown = false;

    this.updateSrc = function () {
        if (_this.mouseDown) _this.element.src = _this.buttonfacedown.src;
        else if (_this.mouseIn) _this.element.src = _this.buttonfacehover.src;
        else _this.element.src = _this.buttonface.src;
    }

    if (supportsTouch) {
        _this.element.ontouchstart = function (e) {
            e.preventDefault();
            if (_this._enabled) if (!_this.CancelMenu || !_this.Block.menuUp || (_this.Block.ActivePlayer != null && _this.Block.ActivePlayer.PlayerButton == null)) {
                if (e.touches.length == 1) Click();
            }
        };
    }
    //else {

        _this.element.onmouseover = function () {
            if (_this._enabled) if (!_this.CancelMenu || !_this.Block.menuUp || (_this.Block.ActivePlayer != null && _this.Block.ActivePlayer.PlayerButton == null)) {
                _this.mouseIn = true;
                _this.updateSrc();
            }
        };
        _this.element.onmouseout = function () {
            _this.mouseIn = false;
            _this.updateSrc();
        };
        _this.element.onmousedown = function (e) {
            if (e == null)
                e = window.event;

            if (_this._enabled) if (!_this.CancelMenu || !_this.Block.menuUp || (_this.Block.ActivePlayer != null && _this.Block.ActivePlayer.PlayerButton == null)) {
                _this.mouseDown = true;
                _this.updateSrc();
                if (e.stopPropagation) e.stopPropagation();
                return false;
            }
        };
        _this.element.onmouseup = function () {
            if (_this._enabled) if (_this.mouseIn) _this.Click();
            _this.mouseDown = false;
            _this.updateSrc();
        };
    //}

    if (Style != null) this.ChangeStyle(Style);
}

Button.prototype.SetEnabled = function (Enabled) {
    this._enabled = Enabled;
}

Button.prototype.ChangeStyle = function (Style) {
    this.style = Style;
    if (this._encapsulated) {
        html.styleElement(this._border, this.style);
    }
    else {
        html.styleElement(this.element, this.style);
    }

    this.buttonface = html.prepareInterfaceImage(null, this.style.Source);
    this.buttonfacehover = html.prepareInterfaceImage(null, this.style.HoverSource );
    this.buttonfacedown = html.prepareInterfaceImage(null,  this.style.DownSource);

    this.updateSrc();
}



function ImageButton(Owner, Click, Block, CancelMenu, SourceDisabled, SourceNormal, SourceHover) {
    this.Data = Data;

    this.Click = Click;
    this.Block = Block;
    this.CancelMenu = CancelMenu;
    this._enabled = true;
    this.element = html.createInterfaceImageEx(Owner, null, null);
    this.element.style.cursor = 'pointer';
    var _this = this;
    this.mouseIn = false;
    this.mouseDown = false;

    this.updateSrc = function () {
        if (!_this._enabled) _this.element.src = _this.buttonfacedisabled.src;
        else {
            if (_this.mouseDown) _this.element.src = _this.buttonfacehover.src;
            else if (_this.mouseIn) _this.element.src = _this.buttonfacehover.src;
            else _this.element.src = _this.buttonface.src;
        }
    }

    if (supportsTouch) {
        _this.element.ontouchstart = function (e) {
            e.preventDefault();
            if (_this._enabled) if (!_this.CancelMenu || !_this.Block.menuUp || (_this.Block.ActivePlayer != null && _this.Block.ActivePlayer.PlayerButton == null)) {
                if (e.touches.length == 1) Click();
            }
        };
    }
    //else {

        _this.element.onmouseover = function () {
            if (_this._enabled) if (!_this.CancelMenu || !_this.Block.menuUp || (_this.Block.ActivePlayer != null && _this.Block.ActivePlayer.PlayerButton == null)) {
                _this.mouseIn = true;
                _this.updateSrc();
            }
        };
        _this.element.onmouseout = function () {
            _this.mouseIn = false;
            _this.updateSrc();
        };
        _this.element.onmousedown = function (e) {
            if (e == null)
                e = window.event;

            if (_this._enabled) if (!_this.CancelMenu || !_this.Block.menuUp || (_this.Block.ActivePlayer != null && _this.Block.ActivePlayer.PlayerButton == null)) {
                _this.mouseDown = true;
                _this.updateSrc();
                if (e.stopPropagation) e.stopPropagation();
                return false;
            }
        };
        _this.element.onmouseup = function () {
            if (_this._enabled) if (_this.mouseIn) _this.Click();
            _this.mouseDown = false;
            _this.updateSrc();
        };
    //}

    this.Change(SourceDisabled, SourceNormal, SourceHover);
}

ImageButton.prototype.SetEnabled = function (Enabled) {
    this._enabled = Enabled;
    this.updateSrc();
}

ImageButton.prototype.Change = function (SourceDisabled, SourceNormal, SourceHover) {


    this.buttonface = html.prepareInterfaceImage(null, SourceNormal);
    this.buttonfacedisabled = html.prepareInterfaceImage(null, SourceDisabled);
    this.buttonfacehover = html.prepareInterfaceImage(null, SourceHover);

    this.updateSrc();
}




function NavigationButton(Owner, Style, Page, Block, CancelMenu) {
    this.Block = Block;
    this.CancelMenu = CancelMenu;
    this.element = html.createInterfaceImage(Owner, null);
    this.element.style.cursor = 'pointer';
    
    this.buttonfacedisabled = html.prepareInterfaceImage(null, null);
    this.buttonface = html.prepareInterfaceImage(null, null);
    this.buttonfacehover = html.prepareInterfaceImage(null, null);
    this.buttonfacedown = html.prepareInterfaceImage(null, null);
    this.buttonfaceactive = html.prepareInterfaceImage(null,null);
    var _this = this;
    this.mouseIn = false;
    this.mouseDown = false;
    this.disabled = false;
    this.active = false;
    this.Page = Page;
    this.correct = null;
    this.seen = false;
    this.mark = 0;
    this.answered = true;

    this.changeActive = function (newActive, newAnswered) {
        this.active = newActive;
        this.answered = (newAnswered == null) ? true : newAnswered;

        if (this.correct == null && this.mark == 0) {
            if (!this.answered) {
                this.buttonface.src = system.GetDataFile(this.style, "NotAnsweredSource", system.GetDataFile(this.style, "SeenSource", system.GetDataFile(this.style, "Source", '', true), true), true);
                this.buttonfacehover.src = system.GetDataFile(this.style, "NotAnsweredHoverSource", system.GetDataFile(this.style, "SeenHoverSource", system.GetDataFile(this.style, "HoverSource", '', true), true), true);
                this.buttonfacedown.src = system.GetDataFile(this.style, "NotAnsweredDownSource", system.GetDataFile(this.style, "SeenDownSource", system.GetDataFile(this.style, "DownSource", '', true), true), true);
            }
            else {
                this.buttonface.src = system.GetDataFile(this.style, "SeenSource", system.GetDataFile(this.style, "Source", '', true), true);
                this.buttonfacehover.src = system.GetDataFile(this.style, "SeenHoverSource", system.GetDataFile(this.style, "HoverSource", '', true), true);
                this.buttonfacedown.src = system.GetDataFile(this.style, "SeenDownSource", system.GetDataFile(this.style, "DownSource", '', true), true);
            }
        }

        this.updateSrc();
    }

    this.changeCorrect = function (newCorrect, newSeen, newMark, newAnswered) {
        this.correct = newCorrect;
        this.seen = newSeen;
        this.mark = newMark;
        
        this.buttonfacedisabled.src = system.GetDataFile(this.style, "DisabledSource", '', true);
        if (newCorrect == null) {
            if (this.mark == 1) {
                if (newSeen) {
                    this.buttonface.src = system.GetDataFile(this.style, "MarkedSource", system.GetDataFile(this.style, "SeenSource", system.GetDataFile(this.style, "Source", '', true), true), true);
                    this.buttonfacehover.src = system.GetDataFile(this.style, "MarkedHoverSource", system.GetDataFile(this.style, "SeenHoverSource", system.GetDataFile(this.style, "HoverSource", '', true), true), true);
                    this.buttonfacedown.src = system.GetDataFile(this.style, "MarkedDownSource", system.GetDataFile(this.style, "SeenDownSource", system.GetDataFile(this.style, "DownSource", '', true), true), true);
                }
                else {
                    this.buttonface.src = system.GetDataFile(this.style, "Source", '', true);
                    this.buttonfacehover.src = system.GetDataFile(this.style, "HoverSource", '', true);
                    this.buttonfacedown.src = system.GetDataFile(this.style, "DownSource", '', true);
                }
                this.buttonfaceactive.src = system.GetDataFile(this.style, "MarkedActiveSource", system.GetDataFile(this.style, "ActiveSource", '', true), true);


            }
            else {
                if (newSeen) {


                    this.buttonface.src = system.GetDataFile(this.style, "SeenSource", system.GetDataFile(this.style, "Source", '', true), true);
                    this.buttonfacehover.src = system.GetDataFile(this.style, "SeenHoverSource", system.GetDataFile(this.style, "HoverSource", '', true), true);
                    this.buttonfacedown.src = system.GetDataFile(this.style, "SeenDownSource", system.GetDataFile(this.style, "DownSource", '', true), true);
                }
                else {
                    this.buttonface.src = system.GetDataFile(this.style, "Source", '', true);
                    this.buttonfacehover.src = system.GetDataFile(this.style, "HoverSource", '', true);
                    this.buttonfacedown.src = system.GetDataFile(this.style, "DownSource", '', true);
                }
                this.buttonfaceactive.src = system.GetDataFile(this.style, "ActiveSource", '', true);
            }
        }
        else if (newCorrect) {
            this.buttonface.src = system.GetDataFile(this.style, "CorrectSource", '', true);
            this.buttonfacehover.src = system.GetDataFile(this.style, "CorrectHoverSource", '', true);
            this.buttonfacedown.src = system.GetDataFile(this.style, "CorrectDownSource", '', true);
            this.buttonfaceactive.src = system.GetDataFile(this.style, "CorrectActiveSource", '', true);
        }
        else if (!newCorrect) {
            this.buttonface.src = system.GetDataFile(this.style, "WrongSource", '', true);
            this.buttonfacehover.src = system.GetDataFile(this.style, "WrongHoverSource", '', true);
            this.buttonfacedown.src = system.GetDataFile(this.style, "WrongDownSource", '', true);
            this.buttonfaceactive.src = system.GetDataFile(this.style, "WrongActiveSource", '', true);
        }
        this.updateSrc();
    }

    this.updateSrc = function () {
        if (_this.disabled) _this.element.src = _this.buttonfacedisabled.src;
        else if (_this.active) _this.element.src = _this.buttonfaceactive.src;
        else if (_this.mouseDown) _this.element.src = _this.buttonfacedown.src;
        else if (_this.mouseIn) _this.element.src = _this.buttonfacehover.src;
        else _this.element.src = _this.buttonface.src;
    }

    if (supportsTouch) {
        _this.element.ontouchstart = function (e) {
            e.preventDefault();
            if (e.touches.length == 1) {
                if (!_this.CancelMenu || !_this.Block.menuUp || (_this.Block.ActivePlayer != null && _this.Block.ActivePlayer.PlayerButton == null)) {
                    if (!_this.disabled && !_this.active) {
                        _this.Page.Player.ActivatePage(_this.Page);
                    }
                }
            }
        };
    }
    //else {

        _this.element.onmouseover = function () {
            if (!_this.CancelMenu || !_this.Block.menuUp || (_this.Block.ActivePlayer != null && _this.Block.ActivePlayer.PlayerButton == null)) {
                _this.mouseIn = true;
                _this.updateSrc();
            }
        };
        _this.element.onmouseout = function () {
            _this.mouseIn = false;
            _this.updateSrc();
        };
        _this.element.onmousedown = function (e) {
            if (e == null)
                e = window.event;

            if (!_this.CancelMenu || !_this.Block.menuUp || (_this.Block.ActivePlayer != null && _this.Block.ActivePlayer.PlayerButton == null)) {
                _this.mouseDown = true;
                _this.updateSrc();
                if (e.stopPropagation) e.stopPropagation();

                return false;
            }



        };
        _this.element.onmouseup = function () {
            if (_this.mouseIn && !_this.disabled && !_this.active) {
                _this.Page.Player.ActivatePage(_this.Page);
            }
            _this.mouseDown = false;
            _this.updateSrc();
        };

    //}

    if (Style != null) this.ChangeStyle(Style);
}

NavigationButton.prototype.ChangeStyle = function (Style) {
    this.style = Style;
    html.styleElement(this.element, this.style);

    this.changeCorrect(this.correct, this.seen, this.mark);

}

//
//slm_areaasset
//
function AreaAsset(Page, Data) {
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);


    this.area = html.createElement(this.Surface, "DIV");
    this.area.style.cursor = 'pointer';
    this.area.style.background = 'transparent';
    this.area.style.lineHeight = '0px';

    this.hoverImg = html.createElement(this.area, "IMG");
    this.hoverImg.style.position = 'absolute';
    this.hoverImg.style.display = 'none';

    this.hs = "";
    this.toggleImg = html.createElement(this.area, "IMG");
    this.toggleImg.style.position = 'absolute';
    this.toggleImg.style.display = 'none';

    this.mouseIn = false;
    this.mouseDown = false;
    var _this = this;

    if (supportsTouch) {
        this.area.ontouchstart = function (e) {
            e.preventDefault();
            if (html.editing) return false;
            if (e.touches.length == 1) {
                if (!_this.Page.Player.Block.menuUp && !html.editing) {
                    if (e.stopPropagation) e.stopPropagation();
                    _this.Click();
                }
            }
        };
    }
    //else {
        this.area.onmouseover = function () {
            if (!_this.Page.Player.Block.menuUp) {
                _this.mouseIn = true;
                if (_this.hs != "") _this.hoverImg.style.display = '';

            }
        };
        this.area.onmouseout = function () {
            _this.mouseIn = false;
            _this.hoverImg.style.display = 'none';

        };
        this.area.onmousedown = function (e) {
            if (e == null)
                e = window.event;

            if (!_this.Page.Player.Block.menuUp && !html.editing) {
                if (e.stopPropagation) e.stopPropagation();
                _this.mouseDown = true;

                return false;
            }

        };
        this.area.onmouseup = function () {
            _this.mouseDown = false;
            if (_this.mouseIn && !html.editing) _this.Click();
        };
    //}

    this.UpdateData();
}

AreaAsset.prototype.Click = function () {
    this.Page.SpreadEvent("LoadFrame", this, { "Page": this.refpage });
}

AreaAsset.prototype.UpdateData = function () {
    this.Page.PositionAsset(this);

    this.area.style.width = this.Surface.style.width;
    this.area.style.height = this.Surface.style.height;
    this.refpage = system.GetDataReference(this.Data, "FramePage", 0);
    this.togglesource = system.GetDataFile(this.Data, "ToggleSource", "", true)
    if (this.togglesource != "") {
        this.toggleImg.src = this.togglesource;

    }
    this.toggleImg.style.display = 'none';
    this.hs = system.GetDataFile(this.Data, "HoverSource", "", true);
    if (this.hs != "") {
        this.hoverImg.src = this.hs;
    }
    this.hoverImg.style.display = 'none';

}

AreaAsset.prototype.Toggle = function (On) {
    this.toggleImg.style.display = (On && this.togglesource !="") ? '' : 'none';
}

AreaAsset.prototype.AssetEvent = function (Event, Asset, Params) {
    if (Event == "FrameLoaded") {
        var t = system.GetDataValue(this.Data, "Type", 0);
        if (t == 0) {
            //check
            if (Params.Page == this.refpage) {
                this.Toggle(true);
            }
        }
        else if (t == 1) {
            //toggle
            this.Toggle(Params.Page == this.refpage);
        }
        else if (t == 2) {

        }
    }
}

AreaAsset.prototype.Leave = function () {
}
AreaAsset.prototype.Enter = function () {
}

//
//slm_asset
//





//
//slm_block
//
//BLOCKS
var CurrentEditor = null;
var CurrentBlock = null;
var Consuming = false;
function Block(Owner, SLM, skinRapidElearning, CanEdit) {
    CurrentBlock = this;



    this.skinRapidElearning = skinRapidElearning;
    this.MenuType = system.GetDataValue(skinRapidElearning, "MenuType", 0, false);

    this.Data = SLM.data;

    this.UpdateTextReplace();

    SCORMScore = system.GetDataValue(this.Data, "SCORMScore", 1)==1;
    SCORMSuspend = system.GetDataValue(this.Data, "SCORMSuspend", 0) == 1;
    if (citrix == false) {
        citrix = system.GetDataValue(this.Data, "CitrixSafe", 0) == 1;
    }
    AlwaysLog = system.GetDataValue(this.Data, "AlwaysLog", 0) == 1;
    if (CLPInfo != null) AlwaysLog = true;
    this.SLM = SLM;
    this.Owner = Owner;
    this.CanEdit = CanEdit;

    this.menuUp = false;
    this.LightBoxes = [];
    this.Players = [];
    this.Intro = null;
    this.ActivePlayer = null;

    skinvarmode = [];
    if (this.skinRapidElearning != null && this.skinRapidElearning.Fonts != null) {
        for (var f in this.skinRapidElearning.Fonts) {
            var fo = this.skinRapidElearning.Fonts[f];
            html.loadFont(fo);
            var vn = system.GetDataText(fo, "Var", "", false);
            if (vn != "") {
                skinvarmode[skinvarmode.length] = { "Name": "$" + vn + "$", "Value": system.GetDataText(fo, "Family", "", false) };
            }
        }
    }
    if (this.skinRapidElearning != null && this.skinRapidElearning.ColorStyles != null) {
        for (var f in this.skinRapidElearning.ColorStyles) {
            var fo = this.skinRapidElearning.ColorStyles[f];
            var vn = system.GetDataText(fo, "Var", "", false);
            if (vn != "") {
                skinvarmode[skinvarmode.length] = { "Name": "$" + vn + "$", "Value": system.GetDataText(fo, "Color", "", false) };
            }
        }
    }
    if (this.skinRapidElearning != null && this.skinRapidElearning.Vars != null) {
        for (var f in this.skinRapidElearning.Vars) {
            var fo = this.skinRapidElearning.Vars[f];
            var vn = system.GetDataText(fo, "Name", "", false);
            if (vn != "") {
                skinvarmode[skinvarmode.length] = { "Name": "$" + vn + "$", "Value": system.GetDataText(fo, "Value", "", false) };
            }
        }
    }

    


    this.Root = html.createElement(Owner, "DIV");
    this.Root.style.left = '0px';
    this.Root.style.top = '0px';
    this.Root.style.right = '0px';
    this.Root.style.bottom = '0px';
    this.Root.style.position = 'absolute';


    html.addEditElement(this.Root, this);
    this.EditParent = null;
    this.CanEditChild = function (Data) {
        for (var i in this.LightBoxes) {
            if (this.LightBoxes[i].Data == Data) return true;
        }
        for (var i in this.Players) {
            if (this.Players[i].Data == Data) return true;
        }
        return false;
    }
    this.EditChild = function (Editor, Data) {
        for (var i in this.LightBoxes) {
            if (this.LightBoxes[i].Data == Data) {
                this.ShowLightBox(this.LightBoxes[i]);
                Editor.selectElement(this.LightBoxes[i].playerArea, this.LightBoxes[i]);
            }
        }
        for (var i in this.Players) {
            if (this.Players[i].Data == Data) {
                this.ActivatePlayer(this.Players[i]);
                Editor.selectElement(this.Players[i].playerArea, this.Players[i]);
            }
        }
    }
    this.EditViewing = function (list) {
        list[this.Data.P.toString()] = true;
        var ol = this.OpenLightBox();
        if (ol != null) {
            ol.EditViewing(list);
        }
        else if (this.ActivePlayer != null) {
            this.ActivePlayer.EditViewing(list);
        }
    }

    this.EditTryInsert = function (Type, EmptyObject, Offset, Editor) {
        if (this.EditInsert(Type, EmptyObject, Offset, Editor)) return true;
        var ol = this.OpenLightBox();
        if (ol != null) {
            return ol.EditTryInsert(Type, EmptyObject, Offset, Editor);
        }
        else if (this.ActivePlayer != null) {
            return this.ActivePlayer.EditTryInsert(Type, EmptyObject, Offset, Editor);
        }
        return false;
    }

    this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
        if (Type == 397 || Type == 1579) {
            var clone = EmptyObject;
            if (clone.Pages == null || clone.Pages.length == 0) {
                clone.Pages = [{ "P": 399 }];
            }
            Editor.GenericDataEditComponent.apply();

            if (this.Data.Players == null) this.Data.Players = [];
            this.Data.Players[this.Data.Players.length] = clone;
            this.UpdateData();

            Editor.GenericDataEditComponent.WYSIWYGUpdate(this, true);

            var player = this.Players[this.Players.length - 1];
            this.ActivatePlayer(player);
            Editor.selectElement(player.Root, player);
            return true;

        }
        else if (Type == 398) {
            var clone = EmptyObject;
            if (clone.Pages == null || clone.Pages.length == 0) {
                clone.Pages = [{ "P": 399 }];
            }
            Editor.GenericDataEditComponent.apply();

            if (this.Data.LightBoxes == null) this.Data.LightBoxes = [];
            this.Data.LightBoxes[this.Data.LightBoxes.length] = clone;
            this.UpdateData();

            Editor.GenericDataEditComponent.WYSIWYGUpdate(this, true);

            var player = this.LightBoxes[this.LightBoxes.length - 1];
            this.ShowLightBox(player);
            Editor.selectElement(player.Root, player);

            return true;
        }
        return false;

    }

    this.IsEditActive = function (Activate) {
        return true;
    }

    if (this.CanEdit) {
        this.Editor = new Editor(Owner, this);

    }

    var image = html.createInterfaceImage(this.Root, this.skinRapidElearning.BackgroundImageStyle);

    var _this = this;

    if (this.MenuType == 0) {
        var logo = html.createInterfaceImage(this.Root, this.skinRapidElearning.LogoImageStyle);
        this.Title = html.createText(this.Root, this.skinRapidElearning.TitleStyle, '');

        var menuButton = new Button(this.Root, this.skinRapidElearning.MenuButtonStyle, function () { _this.toggleMenu(); }, this, false);
        var playerMenuArea = html.createLayer(this.Root, this.skinRapidElearning.MenuAreaStyle);
        this.playerMenuArea = playerMenuArea;
        playerMenuArea.style.overflow = 'hidden';
        this.playerFader = html.createLayer(playerMenuArea, this.skinRapidElearning.MenuFaderStyle);
        this.playerButtonContainer = html.createElement(this.playerFader, "DIV");
        if (!html5) this.playerButtonContainer.style.textAlign = 'center';
        
  
    }



    for (var pi in this.Data.LightBoxes) {
        this.LightBoxes[this.LightBoxes.length] = new Player(this, this.Root, this.Data.LightBoxes[pi], true);
    }

    for (var pi in this.Data.Players) {
        this.Players[this.Players.length] = new Player(this, this.Root, this.Data.Players[pi], false);
    }

    if (this.MenuType == 1 || this.MenuType == 2 || this.MenuType == 3) {
        var menuLayer = html.createLayer(this.Root, this.skinRapidElearning.MenuLayerStyle);
        this.menuLayer = menuLayer;
        if (this.MenuType == 1) {
            var menuButton = new Button(menuLayer, this.skinRapidElearning.MenuButtonStyle, function () { _this.toggleMenu(); }, this, false);
        }
        var playerMenuArea = html.createLayer(this.Root, this.skinRapidElearning.MenuAreaStyle);
        this.playerMenuArea = playerMenuArea;
        playerMenuArea.style.overflow = 'hidden';
        this.playerFader = html.createLayer(playerMenuArea, this.skinRapidElearning.MenuFaderStyle);

        var logo = html.createInterfaceImage(this.playerFader, this.skinRapidElearning.LogoImageStyle);
        var tot = system.GetDataValue(this.skinRapidElearning, "TitleOnTop", 0) == 1;
        if (tot) {
            this.Title = html.createText(this.Root, this.skinRapidElearning.TitleStyle, '');
        }
        else {
            this.Title = html.createText(this.playerFader, this.skinRapidElearning.TitleStyle, '');
        }

        this.playerButtonContainer = html.createLayer(this.playerFader, this.skinRapidElearning.MenuPlayerButtonContainer);

        if (!html5) {
            if (this.playerFader.style.textAlign != null && this.playerFader.style.textAlign != '') {
                this.playerButtonContainer.style.textAlign = this.playerFader.style.textAlign;
            }
            else {
                this.playerButtonContainer.style.textAlign = 'center';
            }
        }
        //this.playerButtonContainer.style.whiteSpace = 'nowrap';
        this.playerButtonContainer.style.position = 'relative';
        if (this.MenuType == 1) {
            var menuCloseButton = new Button(this.playerFader, this.skinRapidElearning.MenuButtonCloseStyle, function () { _this.toggleMenu(); }, this, false);
        }
        if (this.MenuType == 1 || this.MenuType==3) {


            this.progressLayer = html.createLayer(this.playerFader, this.skinRapidElearning.MenuProgress.ProgressLayer);
            var bgimg = html.createElement(this.progressLayer, 'IMG');
            bgimg.style.position = "absolute";
            bgimg.style.left = "0px";
            bgimg.style.top = "0px";
            bgimg.style.width = this.progressLayer.style.width;
            bgimg.style.height = this.progressLayer.style.height;




            this.fillProgress = html.createElement(this.progressLayer, "div");
            this.fillProgress.style.position = "absolute";
            this.fillProgress.style.left = "0px";
            this.fillProgress.style.top = "0px";
            this.fillProgress.style.overflowX = "hidden";
            this.fillProgress.style.width = "0px";
            this.fillProgress.style.height = this.progressLayer.style.height;
            var fillimg = html.createElement(this.fillProgress, 'IMG');
            fillimg.style.position = "absolute";
            fillimg.style.left = "0px";
            fillimg.style.top = "0px";
            fillimg.style.width = this.progressLayer.style.width;
            fillimg.style.height = this.progressLayer.style.height;
            bgimg.src = system.GetDataFile(this.skinRapidElearning.MenuProgress, "ProgressBackground", '', true);
            fillimg.src = system.GetDataFile(this.skinRapidElearning.MenuProgress, "ProgressFiller", '', true);

            this.progressLayerText = html.createText(this.playerFader, this.skinRapidElearning.MenuProgress.ProgressLayerText, "");
        }
    }






    if (!this.Data.OpenMenu) system.saveValueData(this.Data, "OpenMenu", 1, null);
    if (this.MenuType == 1 || this.MenuType == 0) {
        this.menuUp = system.GetDataValue(this.Data, "OpenMenu", 0) == 1;
    }
    else {
        this.menuUp = false;
    }
    this.updateMenu();



    this.UpdateData();

    this.CalculateScore = function (finalize) {
        if (finalize) {
            _this.Finalize();
        }
        _this.UpdateScore();
    }

    this.CalculateSuspendData = function (data) {
        var sd = '';
        sd += (_this.menuUp ? '1' : '0')
        data[_this.Data.L.toString()] = sd;

        for (var i in _this.Players) {
            _this.Players[i].CalculateSuspendData(data);
        }
        for (var i in _this.LightBoxes) {
            _this.LightBoxes[i].CalculateSuspendData(data);
        }
    }

    this.ConsumeSuspendData = function (data) {
        Consuming = true;




        for (var i in _this.Players) {
            _this.Players[i].ConsumeSuspendData(data);
        }
        for (var i in _this.LightBoxes) {
            _this.LightBoxes[i].ConsumeSuspendData(data);
        }
        Consuming = false;
    }

    CalculateScoreDelegate = this.CalculateScore;
    CalculateSuspendDataDelegate = this.CalculateSuspendData;
    if (this.Intro != null) this.ActivatePlayer(this.Intro);

    StartSCO(this);
}

Block.prototype.Finalize = function () {
    this.HideLightBoxes();
    if (this.ActivePlayer != null) this.ActivePlayer.Hide();

}

Block.prototype.GetScore = function (cat, fieldtype) {
    if (fieldtype == 11) {
        var score = [];
    }
    else {
        var score = 0;
    }
    for (var p in this.Players) {
        var selp = this.Players[p];
        if (fieldtype == 11) {
            score = score.concat(selp.GetScore(cat, fieldtype));
        }
        else {
            score += selp.GetScore(cat, fieldtype);
        }
    }
    for (var p in this.LightBoxes) {
        var selp = this.LightBoxes[p];
        if (fieldtype == 11) {
            score = score.concat(selp.GetScore(cat, fieldtype));
        }
        else {
            score += selp.GetScore(cat, fieldtype);
        }
    }
    return score;
}


Block.prototype.UpdateScore = function(){
    var t = 0;
    var tc = 0;
    var n = 0;
    var nc = 0;
    for (var i in this.LightBoxes) {
        this.LightBoxes[i].UpdateScore();
        t += this.LightBoxes[i].ScormWeighting;
        tc += this.LightBoxes[i].CompletionWeighting;
        n += this.LightBoxes[i].ScormScore * this.LightBoxes[i].ScormWeighting;
        nc += this.LightBoxes[i].ScormCompletion * this.LightBoxes[i].CompletionWeighting;
    }
    var fail = false;
    for (var i in this.Players) {
        this.Players[i].UpdateScore();
        t += this.Players[i].ScormWeighting;
        tc += this.Players[i].CompletionWeighting;
        n += this.Players[i].ScormScore * this.Players[i].ScormWeighting;
        nc += this.Players[i].ScormCompletion * this.Players[i].CompletionWeighting;

        if (this.Players[i].MustPass() == 1 && (this.Players[i].ScormResult != 'passed' && this.Players[i].ScormResult != 'completed')) {
            fail = true;
        }

    }
    var score = (t == 0) ? 100 : (n / t);
    var completion = (tc == 0) ? 100 : (nc / tc);

    if (this.MenuType == 1 || this.MenuType == 3) {
      
        this.fillProgress.style.width = Math.round(ExtractNumber(this.progressLayer.style.width) * completion / 100) + 'px';
        if (ie7) FixRedraw(this.fillProgress);
        html.fillText(this.progressLayerText, this.skinRapidElearning.MenuProgress.ProgressLayerText, system.GetDataText(this.skinRapidElearning.MenuProgress, "ProgressText", '', true).replace('{0}', Math.round(completion)));
    }

    if (scormdata != null) {
        scormdata.raw = Math.round(score);
        if (this.ScoreMethod == 2 && completion < 100) {
            scormdata.lesson_status = 'incomplete';
        }
        else {
            if (score >= this.ScoreThreshold && !fail) {
                scormdata.lesson_status = (this.ScoreMethod == 0 || this.ScoreMethod == 3) ? 'completed' : 'passed';
            }
            else {
                scormdata.lesson_status = (this.ScoreMethod == 0 || this.ScoreMethod == 3) ? 'incomplete' : 'failed';
            }
        }
    }
    FieldAPIScore = score;
}

Block.prototype.FindPage = function () {
    var ol = this.OpenLightBox();
    if (ol != null) return ol.FindPage();
    if (this.ActivePlayer != null) return this.ActivePlayer.FindPage();
    return null;
}

Block.prototype.GetPlayerStyles = function () {
    var result = {};
    for (var i in this.skinRapidElearning.PlayerStyles) {
        if (this.skinRapidElearning.PlayerStyles[i].Key != null) {
            result[system.GetDataValue(this.skinRapidElearning.PlayerStyles[i],"Key",0)] = system.GetDataText(this.skinRapidElearning.PlayerStyles[i],"Name", '', false);
        }
    }
    return result;
}

Block.prototype.GetPlayerStyle = function (key) {
    for (var i in this.skinRapidElearning.PlayerStyles) {
        if (system.GetDataValue(this.skinRapidElearning.PlayerStyles[i],"Key",0) == key) return this.skinRapidElearning.PlayerStyles[i];
    }
    return null;
}
Block.prototype.GetLightBoxStyles = function () {
    var result = {};
    for (var i in this.skinRapidElearning.LightBoxStyles) {
        result[system.GetDataValue(this.skinRapidElearning.LightBoxStyles[i], "Key", 0)] = system.GetDataText(this.skinRapidElearning.LightBoxStyles[i], "Name", '', false);
    }
    return result;
}
Block.prototype.GetLightBoxStyle = function (key) {
    for (var i in this.skinRapidElearning.LightBoxStyles) {
        if (system.GetDataValue(this.skinRapidElearning.LightBoxStyles[i],"Key",0) == key) return this.skinRapidElearning.LightBoxStyles[i];
    }
    return null;
}
Block.prototype.GetAssetStyles = function () {
    var result = {};
    for (var i in this.skinRapidElearning.AssetStyles) {
        result[system.GetDataValue(this.skinRapidElearning.AssetStyles[i], "Key", 0)] = system.GetDataText(this.skinRapidElearning.AssetStyles[i], "Name", '', false);
    }
    return result;
}
Block.prototype.GetAssetStyle = function (key) {
    for (var i in this.skinRapidElearning.AssetStyles) {
        if (system.GetDataValue(this.skinRapidElearning.AssetStyles[i],"Key",0) == key) return this.skinRapidElearning.AssetStyles[i];
    }
    return null;
}
Block.prototype.GetColorStyles = function () {
    var result = {};
    for (var i in this.skinRapidElearning.ColorStyles) {
        result[system.GetDataValue(this.skinRapidElearning.ColorStyles[i], "Key", 0)] = system.GetDataText(this.skinRapidElearning.ColorStyles[i], "Name", '', false);
    }
    return result;
}
Block.prototype.GetColorStyle = function (key) {
    for (var i in this.skinRapidElearning.ColorStyles) {
        if (system.GetDataValue(this.skinRapidElearning.ColorStyles[i], "Key", 0) == key) return this.skinRapidElearning.ColorStyles[i];
    }
    return null;
}


Block.prototype.GetSkinImages = function () {
    var result = {};
    for (var i in this.skinRapidElearning.Images) {
        result[system.GetDataValue(this.skinRapidElearning.Images[i], "Key", 0)] = system.GetDataText(this.skinRapidElearning.Images[i], "Name", '', false);
    }
    return result;
}
Block.prototype.GetSkinImage = function (key) {
    for (var i in this.skinRapidElearning.Images) {
        if (system.GetDataValue(this.skinRapidElearning.Images[i], "Key", 0) == key) return this.skinRapidElearning.Images[i];
    }
    return null;
}


Block.prototype.ShowLightBox = function (lightbox) {
 
    if (lightbox == this.OpenLightBox()) return;
    this.HideLightBoxes();

    if (this.ActivePlayer != null) {
        if (this.ActivePlayer.CurrentPage != null) {
            this.ActivePlayer.CurrentPage.SuspendBeforePopup();
        }
    }

    lightbox.Show(false);
}

Block.prototype.HideLightBox = function () {
    if (this.ActivePlayer != null) {
        if (this.ActivePlayer.CurrentPage != null) {
            this.ActivePlayer.CurrentPage.ResumeAfterPopup();
        }
    }
}

Block.prototype.HideLightBoxes = function () {
    for (var i in this.LightBoxes) {
        if (this.LightBoxes[i].Status == 'Show') this.LightBoxes[i].Hide();
    }
}

Block.prototype.OpenLightBox = function () {
    for (var i in this.LightBoxes) {
        if (this.LightBoxes[i].Status == 'Show') return this.LightBoxes[i];
    }
    return null;
}

Block.prototype.toggleMenu = function () {
    this.menuUp = !this.menuUp;
    this.updateMenu();
    if (this.ActivePlayer != null) {
        if (this.menuUp) {
            this.ActivePlayer.Up();

                SetScore(false);
                SaveState();

                html.doCenterElements();
        }
        else {
            this.ActivePlayer.Show(true);
        }
    }
    this.HideLightBoxes();
}

Block.prototype.updateMenu = function () {
    if (this.menuUp || this.MenuType == 2 || this.MenuType ==3) {
        for (var m in this.Players) {
            var mp = this.Players[m];
            if (mp.PlayerButton != null) {
                var playerEnabled = true;
                if (mp.Data.RequiredPlayers) {
                    for (var r in mp.Data.RequiredPlayers) {
                        var rp = mp.Data.RequiredPlayers[r];
                        var rpid = system.GetDataReference(rp, "RequiredPlayer", null);
                        if (rpid != null) {
                            for (var m2 in this.Players) {
                                var mp2 = this.Players[m2];
                                if (mp2.Data.L == rpid) {
                                    mp2.UpdateScore();
                                    if (mp2.ScormResult != 'completed' && mp2.ScormResult != 'passed') playerEnabled = false;
                                }
                            }
                        }
                    }
                }
                if (html.editing) playerEnabled = true;
                mp.PlayerButton.SetEnabled(playerEnabled);
            }
        }
        
        this.playerMenuArea.style.display = 'block';
        this.playerFader.style.top = '0px';
        this.playerMenuArea.style.pointerEvents = '';
        if (this.MenuType == 1 || this.MenuType == 2 || this.MenuType == 3) {
            this.UpdateScore();
            for (var m in this.Players) {
                var mp = this.Players[m];
                if (mp.PlayerButton != null) {
                    mp.PlayerButton.updateSrc();
                }
            }
        }
        //html.applyElementTransform(this.playerFader, system.GetDataText(this.skinRapidElearning, "MenuAnimation/FaderTransformShown", '', false));
    }
    else {
        this.playerMenuArea.style.display = 'none';
        this.playerFader.style.top = this.playerMenuArea.style.height;
        this.playerMenuArea.style.pointerEvents = 'none';
        //html.applyElementTransform(this.playerFader, system.GetDataText(this.skinRapidElearning, "MenuAnimation/FaderTransformHidden", '', false));
    }
}



Block.prototype.ActivatePlayer = function (Player) {
    if (Player != null && Player != this.ActivePlayer) {
        if (Player.Seen && Player.Reset) {
            var warning = system.GetDataText(Player.Data, "ResetWarning", '', true);
            if (warning != '') if (!confirm(warning)) {
                if (this.MenuType == 1) {
                    this.menuUp = true;
                }
                this.updateMenu();
                return;
            }
        }
    }

    if (this.MenuType == 2 || this.MenuType ==3) {

            SetScore(false);
            SaveState();

    }
    this.HideLightBoxes();

    this.menuUp = false;
    this.updateMenu();
    if (this.ActivePlayer == Player) {
        this.ActivePlayer.Show(true);
    }
    else {
        if (this.ActivePlayer != null) this.ActivePlayer.Hide();
        var oldActivePlayer = this.ActivePlayer;
        this.ActivePlayer = Player;

        if (oldActivePlayer != null && oldActivePlayer.PlayerButton != null) oldActivePlayer.PlayerButton.updateSrc();
        if (this.ActivePlayer.PlayerButton != null) this.ActivePlayer.PlayerButton.updateSrc();

        Player.Show(false);
    }
    if (!Player.IsLightBox) {
        if (scormdata != null) scormdata.lesson_location[0] = Player.Data.L;
    }
}

Block.prototype.Voice = function(Voice){
    if (this.voiceAudio == null && Voice != ""){
        this.voiceAudio = html.insertElement(this.Root, "audio", null);
        this.voiceAudio.style.display = 'none';
        this.voiceAudio.autoplay = true;
    }
    if (this.voiceAudio == null) return;
    if (Voice == "") {
        this.voiceAudio.pause();
        //this.voiceAudio.currentTime = 0;
    }
    this.voiceAudio.src = Voice;


}

Block.prototype.UpdateTextReplace = function () {
    textreplace = {};

    if (this.Data.Media != null) {
        for (var i = 0; i < this.Data.Media.length; i++) {
            if (this.Data.Media[i].P == 11908) {
                var vn = system.GetDataText(this.Data.Media[i], "Name", "", false);
                textreplace[vn] = system.GetDataText(CurrentBlock.Data.Media[i], "Text", "", true);
            }
        }
    }
}

Block.prototype.UpdateData = function (recurse) {
    this.UpdateTextReplace();



    html.fillText(this.Title, this.skinRapidElearning.TitleStyle, system.GetDataText(this.Data, "Title", '', true));

    var hm = system.GetDataValue(this.Data, "HideMenu", 0);
    if (typeof (this.menuLayer) != 'undefined') if (this.menuLayer != null) this.menuLayer.style.display = hm ? 'none' : '';


    if (this.Data.Players == null) this.Data.Players = [];

    var OrderedPlayers = [];//this.Data.Pages;
    for (var i = 0; i < this.Data.Players.length; i++) {
        var p = this.Data.Players[i];
        var include = this.CanEdit;
        if (!include) include = CheckConditions(p.Conditions);
        if (include) {
            OrderedPlayers[OrderedPlayers.length] = p;
        }
    }


    var match = [];
    var firstMatch = null;
    for (var di = 0; di < OrderedPlayers.length; di++) {
        var pdata = OrderedPlayers[di];
        var found = false;
        match[di] = null;
        for (var pbi = 0; pbi < this.Players.length; pbi++) {
            if (this.Players[pbi].Data == pdata) {
                match[di] = this.Players[pbi];
                found = true;
            }
        }
        if (!found) {
            var np = new Player(this, this.Root, pdata, false);
            this.Players[this.Players.length] = np;
            match[di] = np;
        }
        if (match[di].PlayerButton != null) {
            this.playerButtonContainer.insertBefore(match[di].PlayerButton.buttonContainer, null);
            if (firstMatch == null) firstMatch = match[di].PlayerButton.buttonContainer;
        }
    }
    for (var m in this.Players) {
        var mp = this.Players[m];
        if (arrayIndexOf(match, mp) == -1) {
            stopVideos(mp.playerArea);
            this.Root.removeChild(mp.playerArea);
        }
    }
    this.Players = match;
    while (this.playerButtonContainer.childNodes.length > 0 && this.playerButtonContainer.firstChild != firstMatch) this.playerButtonContainer.removeChild(this.playerButtonContainer.firstChild);


    if (this.Data.LightBoxes == null) this.Data.LightBoxes = [];
    match = [];
    for (var di = 0; di < this.Data.LightBoxes.length; di++) {
        var pdata = this.Data.LightBoxes[di];
        var found = false;
        match[di] = null;
        for (var pbi = 0; pbi < this.LightBoxes.length; pbi++) {
            if (this.LightBoxes[pbi].Data == pdata) {
                match[di] = this.LightBoxes[pbi];
                found = true;
            }
        }
        if (!found) {
            var np = new Player(this, this.Root, pdata, true);
            this.LightBoxes[this.LightBoxes.length] = np;
            match[di] = np;
        }
        this.Root.insertBefore(match[di].playerArea, null);

    }
    if (this.MenuType == 1 || this.MenuType == 2 || this.MenuType ==3) this.Root.insertBefore(this.menuLayer, null);
    if (this.MenuType == 1 || this.MenuType == 2 || this.MenuType == 3) this.Root.insertBefore(this.playerMenuArea, null);
    for (var m in this.LightBoxes) {
        var mp = this.LightBoxes[m];
        if (arrayIndexOf(match, mp) == -1) {
            stopVideos(mp.playerArea);
            this.Root.removeChild(mp.playerArea);
        }
    }
    this.LightBoxes = match;

    var i = system.GetDataValue(this.Data, "ShowClose", 1);
    if (i == 0) {
        this.SLM.closeButton.element.style.display = 'none';
    }
    else {
        this.SLM.closeButton.element.style.display = '';
        if (i == 1) {
            this.SLM.Owner.insertBefore(this.SLM.closeButton.element, null);
        }
        else if (i == 2) {
            this.playerFader.insertBefore(this.SLM.closeButton.element, null);
        }
    }


    this.ScoreMethod = system.GetDataValue(this.Data, "ScoreMethod", 0);
    this.ScoreThreshold = system.GetDataValue(this.Data, "ScoreThreshold", 100);
    this.ResumeMethod = system.GetDataValue(this.Data, "ResumeMethod", 1);
    this.ResumeWarning = system.GetDataText(this.Data, "ResumeWarning", "", true);

    if (recurse) {
        for (var pl in this.Players) {
            this.Players[pl].UpdateData(recurse);
        }
        for (var pl in this.LightBoxes) {
            this.LightBoxes[pl].UpdateData(recurse);
        }
    }



}

Block.prototype.SpreadEvent = function (Event, Asset, Params) {
    for (var a in this.Players) {
        var ass = this.Players[a];
        if (ass.SpreadEvent) ass.SpreadEvent(Event, Asset, Params);
        if (Event == "LoadPage" && Params.Found) {
            if (this.ActivePlayer != ass) this.ActivatePlayer(ass);
            if (ass.CurrentPage != Params.ActivatePage) {
                if (this.OpenLightBox() != null) this.HideLightBoxes();
                ass.ActivatePage(Params.ActivatePage);
            }
            if (Params.FramePages) {
                for (var i = Params.FramePages.length - 1; i >= 0; i--) {
                    Params.Frames[i].ActivatePage(Params.FramePages[i]);
                }
            }

            if (Params.FramePage) {
                Params.Frame.ActivatePage(Params.FramePage);
            }

            return;
        }
    }
    for (var a in this.LightBoxes) {
        var ass = this.LightBoxes[a];
        if (ass.SpreadEvent) ass.SpreadEvent(Event, Asset, Params);
        if (Event == "LoadPage" && Params.Found) {
            this.ShowLightBox(ass);
            if (ass.CurrentPage != Params.ActivatePage) {
                ass.ActivatePage(Params.ActivatePage);
            }

            if (Params.FramePages) {
                for (var i = Params.FramePages.length - 1; i >= 0; i--) {
                    Params.Frames[i].ActivatePage(Params.FramePages[i]);
                }
            }

            if (Params.FramePage) {
                Params.Frame.ActivatePage(Params.FramePage);
            }
            return;
        }
    }
}


function PlayerButton(Player) {
    this.Player = Player;
    this._enabled = true;
    
    this.buttonContainer = html.createLayer(Player.Block.playerButtonContainer, null);
    this.Block = Player.Block;
    this.CancelMenu = false;

    
    //this.button = new ButtonEx(this.buttonContainer, null, function () { Player.Block.ActivatePlayer(Player); }, this, false, Player.Data, "OverrideSource", "OverrideHoverSource", "OverrideDownSource");
    this.element = html.createLayer(this.buttonContainer);
    this.element.style.display = 'inline-block';
    this.element.style.backgroundColor = 'transparent';
    this.text = html.createText(this.buttonContainer, null, '');
    this.text.style.whiteSpace = 'normal';



    var _this = this;
    this.text.onclick = function () {
        if (_this._enabled && (!_this.CancelMenu || !_this.Block.menuUp)) {
            _this.Click();
        }
    }


    this.baseimage = html.createInterfaceImageEx(this.element, null, null);

    this.activeoverlay = html.createInterfaceImageEx(this.element, null, null);
    this.activeoverlay.style.position = 'absolute';
    this.activeoverlay.style.left = '0px';
    this.activeoverlay.style.top = '0px';
    this.doneoverlay = html.createInterfaceImageEx(this.element, null, null);
    this.doneoverlay.style.position = 'absolute';
    this.doneoverlay.style.left = '0px';
    this.doneoverlay.style.top = '0px';

    this.element.style.cursor = 'pointer';

    this.mouseIn = false;
    this.mouseDown = false;

    this.updateSrc = function () {

        if (!_this._enabled && this.buttonfacelocked != null) {
            _this.baseimage.src = _this.buttonfacelocked.src;
        }
        else {
            if (_this.mouseDown) _this.baseimage.src = _this.buttonfacedown.src;
            else if (_this.mouseIn) _this.baseimage.src = _this.buttonfacehover.src;
            else _this.baseimage.src = _this.buttonface.src;
        }

        _this.buttonContainer.style.cursor = (_this._enabled) ? 'pointer' : 'default';
        _this.text.style.cursor = (_this._enabled) ? 'pointer' : 'default';

        var showactiveoverlay = _this.activeoverlayavailable != '' && _this.Block.ActivePlayer == _this.Player;
        _this.activeoverlay.style.display = (showactiveoverlay) ? '' : 'none';
        _this.doneoverlay.style.display = (_this.doneoverlayavailable != '' && (_this.Player.ScormResult == 'passed' || _this.Player.ScormResult == 'completed') && (system.GetDataValue(this.Player.PlayerStyle, "HideDone", 0) == 0 || !showactiveoverlay) && (system.GetDataValue(this.Player.PlayerStyle, "HideMouse", 0) == 0 || (!_this.mouseDown && !_this.mouseIn))) ? '' : 'none';
        if (ie7) {
            FixRedraw(_this.doneoverlay);
            FixRedraw(_this.activeoverlay);
        }


        if (!_this._enabled) {
            html.styleElement(this.text, (!StyleEmpty(this.Player.PlayerStyle.TitleLocked) ? this.Player.PlayerStyle.TitleLocked : this.Player.PlayerStyle.Title));
        }
        else if (_this.Block.ActivePlayer == _this.Player) {
            if (!_this.mouseIn) {
                html.styleElement(this.text, (!StyleEmpty(this.Player.PlayerStyle.TitleActive) ? this.Player.PlayerStyle.TitleActive : this.Player.PlayerStyle.Title));
            }
            else {
                html.styleElement(this.text, (!StyleEmpty(this.Player.PlayerStyle.TitleActiveHover) ? this.Player.PlayerStyle.TitleActiveHover : (!StyleEmpty(this.Player.PlayerStyle.TitleActive) ? this.Player.PlayerStyle.TitleActive : this.Player.PlayerStyle.Title)));
            }
        }
        else if (_this.Player.ScormResult == 'passed' || _this.Player.ScormResult == 'completed') {
            if (!_this.mouseIn) {
                html.styleElement(this.text, (!StyleEmpty(this.Player.PlayerStyle.TitleCompleted) ? this.Player.PlayerStyle.TitleCompleted : this.Player.PlayerStyle.Title));
            }
            else {
                html.styleElement(this.text, (!StyleEmpty(this.Player.PlayerStyle.TitleCompletedHover) ? this.Player.PlayerStyle.TitleCompletedHover : (!StyleEmpty(this.Player.PlayerStyle.TitleCompleted) ? this.Player.PlayerStyle.TitleCompleted : this.Player.PlayerStyle.Title)));
            }
        }
        else {
            if (!_this.mouseIn) {
                html.styleElement(this.text, this.Player.PlayerStyle.Title);
            }
            else {
                html.styleElement(this.text, (!StyleEmpty(this.Player.PlayerStyle.TitleHover) ? this.Player.PlayerStyle.TitleHover : this.Player.PlayerStyle.Title));
            }
        }
    }

    if (supportsTouch) {
        _this.buttonContainer.ontouchstart = function (e) {
            e.preventDefault();
            if (_this._enabled) if (!_this.CancelMenu || !_this.Block.menuUp || (_this.Block.ActivePlayer != null && _this.Block.ActivePlayer.PlayerButton == null)) {
                if (e.touches.length == 1) _this.Click();
            }
        };
    }
    //else {

        _this.buttonContainer.onmouseover = function () {
            if (_this._enabled) if (!_this.CancelMenu || !_this.Block.menuUp || (_this.Block.ActivePlayer != null && _this.Block.ActivePlayer.PlayerButton == null)) {
                _this.mouseIn = true;
                _this.updateSrc();
            }
        };
        _this.buttonContainer.onmouseout = function () {
            _this.mouseIn = false;
            _this.updateSrc();
        };
        _this.buttonContainer.onmousedown = function (e) {
            if (e == null)
                e = window.event;

            if (_this._enabled) if (!_this.CancelMenu || !_this.Block.menuUp || (_this.Block.ActivePlayer != null && _this.Block.ActivePlayer.PlayerButton == null)) {
                _this.mouseDown = true;
                _this.updateSrc();
                if (e.stopPropagation) e.stopPropagation();
                return false;
            }
        };
        _this.buttonContainer.onmouseup = function () {
            if (_this._enabled) if (_this.mouseIn) _this.Click();
            _this.mouseDown = false;
            _this.updateSrc();
        };
    //}

    //if (Style != null) this.ChangeStyle(Style);

}

function StyleEmpty(Style) {
    //basic implementation
    for (var i in Style) {
        for (var j in Style[i]) {
            if (j == "T") return false;
        }
    }
    return true;
}

PlayerButton.prototype.Click = function () {
    this.Block.ActivatePlayer(this.Player);
}

PlayerButton.prototype.SetEnabled = function (Enabled) {
    if (this.buttonfacelocked == null) {
        if (Enabled && !this._enabled) setOpacity(this.buttonContainer, 1);
        else if (!Enabled) setOpacity(this.buttonContainer, 0.5);
    }

    this._enabled = Enabled;

    if (this.buttonfacelocked != null) {
        this.updateSrc();
    }
    //this.SetEnabled(Enabled);
    //setOpacity(this.buttonContainer, this._enabled ? 1 : 0.5);
}

PlayerButton.prototype.UpdateData = function () {
    html.fillText(this.text, this.Player.PlayerStyle.Title, system.GetDataText(this.Player.Data, "Title", '', true));
    this.ChangeStyle(this.Player.PlayerStyle);

    this.buttonContainer.style.position = 'relative';
    this.buttonContainer.style.verticalAlign = 'top';
    if (html5) {
        this.buttonContainer.style.display = 'inline-block';
    }
    else if (ie8) {
        this.buttonContainer.style.display = 'inline-block';

    }
    else {
        this.buttonContainer.style.display = 'inline';
        this.buttonContainer.style.zoom = '1';
        this.element.style.display = 'block';

    }
}


PlayerButton.prototype.ChangeStyle = function (Style) {
    this.style = Style;
    html.styleElement(this.element, this.style.Button);

    this.buttonface = html.prepareInterfaceImage(null, (this.Player.Data == null || this.Player.Data["OverrideSource"] == null) ? this.style.Button.Source : this.Player.Data["OverrideSource"]);
    this.buttonfacehover = html.prepareInterfaceImage(null, (this.Player.Data == null || this.Player.Data["OverrideHoverSource"] == null) ? this.style.Button.HoverSource : this.Player.Data["OverrideHoverSource"]);
    this.buttonfacedown = html.prepareInterfaceImage(null, (this.Player.Data == null || this.Player.Data["OverrideDownSource"] == null) ? this.style.Button.DownSource : this.Player.Data["OverrideDownSource"]);
    var li = (this.Player.Data == null || this.Player.Data["OverrideLockedSource"] == null) ? this.style.Button.LockedSource : this.Player.Data["OverrideLockedSource"];
    this.buttonfacelocked = (li==null)?null:html.prepareInterfaceImage(null, li);

    this.activeoverlayavailable = (this.Player.Data == null || this.Player.Data["OverrideActiveOverlaySource"] == null) ? system.GetDataFile(this.style, "ActiveOverlaySource", "", false) : system.GetDataFile(this.Player.Data, "OverrideActiveOverlaySource", "", false);
    this.doneoverlayavailable = (this.Player.Data == null || this.Player.Data["OverrideDoneOverlaySource"] == null) ? system.GetDataFile(this.style, "DoneOverlaySource", "", false) : system.GetDataFile(this.Player.Data, "OverrideDoneOverlaySource", "", false);
    this.activeoverlay.src = this.activeoverlayavailable;
    this.doneoverlay.src = this.doneoverlayavailable;

    this.baseimage.style.width = this.element.style.width;
    this.baseimage.style.height = this.element.style.height;
    this.activeoverlay.style.width = this.element.style.width;
    this.activeoverlay.style.height = this.element.style.height;
    this.doneoverlay.style.width = this.element.style.width;
    this.doneoverlay.style.height = this.element.style.height;

    this.updateSrc();
}


//
//slm_buttonasset
//
//button asset

function ButtonAsset(Page, Data) {
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);


    if (this.Data["Correct"] == null) system.saveValueData(this.Data, "Correct", 0, null);
    if (this.Data["ChangeAnswer"] == null) system.saveValueData(this.Data, "ChangeAnswer", 0, null);
    if (this.Data["Reset"] == null) system.saveValueData(this.Data, "Reset", 0, null);
    if (this.Data["NextPage"] == null) system.saveValueData(this.Data, "NextPage", 0, null);

    this.stage = html.createElement(this.Surface, "div");
    html.applyElementPerspective(this.stage, '1000');

    html.applyElementTransformStyle(this.stage, 'preserve-3d');
    this.obj = html.createElement(this.stage, "div");
    html.applyElementTransformStyle(this.obj, 'preserve-3d');
    this.container = html.createElement(this.obj, "div");
    html.applyElementTransformStyle(this.container, 'preserve-3d');
    this.neutral = html.createElement(this.container, "div");
    this.neutralimg = html.createElement(this.neutral, "IMG");

    if (!ie7) {
        this.neutrallabel = html.createText(this.neutral, null, '');
        this.neutralanswer = html.createFormattedText(this.neutral, null, '');
        this.neutrallabel.style.display = 'table-cell';
        this.neutralanswer.style.display = 'table-cell';
        this.neutrallabel.style.verticalAlign = 'top';
        this.neutralanswer.style.verticalAlign = 'top';
    }
    else {

        var table = document.createElement('table');
        table.cellSpacing = 0;
        table.cellPadding = 0;
        table.style.position = 'absolute';
        var htmlr = table.insertRow();
        var htmlc1 = htmlr.insertCell();
        htmlc1.style.verticalAlign = 'top';
        var htmlc2 = htmlr.insertCell();
        htmlc2.style.verticalAlign = 'top';
        this.neutrallabel = html.createText(htmlc1, null, '');
        this.neutralanswer = html.createFormattedText(htmlc2, null, '');
        table.style.zIndex = 1;
        this.neutral.appendChild(table);
    }


    this.hover = html.createElement(this.container, "div");
    this.hoverimg = html.createElement(this.hover, "IMG");
    this.hover.style.display = 'none';

    if (!ie7) {
        this.hoverlabel = html.createText(this.hover, null, '');
        this.hoveranswer = html.createFormattedText(this.hover, null, '');
        this.hoverlabel.style.display = 'table-cell';
        this.hoveranswer.style.display = 'table-cell';
        this.hoverlabel.style.verticalAlign = 'top';
        this.hoveranswer.style.verticalAlign = 'top';
    }
    else {

        var table = document.createElement('table');
        table.cellSpacing = 0;
        table.cellPadding = 0;
        table.style.position = 'absolute';
        var htmlr = table.insertRow();
        var htmlc1 = htmlr.insertCell();
        htmlc1.style.verticalAlign = 'top';
        var htmlc2 = htmlr.insertCell();
        htmlc2.style.verticalAlign = 'top';
        this.hoverlabel = html.createText(htmlc1, null, '');
        this.hoveranswer = html.createFormattedText(htmlc2, null, '');
        table.style.zIndex = 1;
        this.hover.appendChild(table);
    }

    this.correct = html.createElement(this.obj, "div");
    if (html5) {
        setOpacity(this.correct, 0);
    }
    else {
        this.correct.style.display = 'none';
    }
    this.correctimg = html.createElement(this.correct, "IMG");

    if (!ie7) {
        this.correctlabel = html.createText(this.correct, null, '');
        this.correctfeedback = html.createFormattedText(this.correct, null, '');
        this.correctlabel.style.display = 'table-cell';
        this.correctfeedback.style.display = 'table-cell';
        this.correctlabel.style.verticalAlign = 'top';
        this.correctfeedback.style.verticalAlign = 'top';
    }
    else {
       
        var table = document.createElement('table');
        table.cellSpacing = 0;
        table.cellPadding = 0;
        table.style.position = 'absolute';
        var htmlr = table.insertRow();
        var htmlc1 = htmlr.insertCell();
        htmlc1.style.verticalAlign = 'top';
        var htmlc2 = htmlr.insertCell();
        htmlc2.style.verticalAlign = 'top';
        this.correctlabel = html.createText(htmlc1, null, '');
        this.correctfeedback = html.createFormattedText(htmlc2, null, '');
        table.style.zIndex = 1;
        this.correct.appendChild(table);
    }

    this.wrong = html.createElement(this.obj, "div");
    if (html5) {
        setOpacity(this.wrong, 0);
    }
    else {
        this.wrong.style.display = 'none';
    }


    this.wrongimg = html.createElement(this.wrong, "IMG");

    if (!ie7) {
        this.wronglabel = html.createText(this.wrong, null, '');
        this.wrongfeedback = html.createFormattedText(this.wrong, null, '');
        this.wronglabel.style.display = 'table-cell';
        this.wrongfeedback.style.display = 'table-cell';
        this.wronglabel.style.verticalAlign = 'top';
        this.wrongfeedback.style.verticalAlign = 'top';
    }
    else {
        var table = document.createElement('table');
        table.cellSpacing = 0;
        table.cellPadding = 0;
        table.style.position = 'absolute';
        var htmlr = table.insertRow();
        var htmlc1 = htmlr.insertCell();
        htmlc1.style.verticalAlign = 'top';
        var htmlc2 = htmlr.insertCell();
        htmlc2.style.verticalAlign = 'top';
        this.wronglabel = html.createText(htmlc1, null, '');
        this.wrongfeedback = html.createFormattedText(htmlc2, null, '');
        table.style.zIndex = 1;
        this.wrong.appendChild(table);
    }

    this.clicked = false;
    this.fixed = false;



    this.click = function (Silent) {
        
        

        if (system.GetDataValue(this.Data, "CanClose", 0) == 1 && this.clicked && !Silent) {
            this.clicked = false;
        }
        else {
            if (this.fixed) return;
            this.clicked = true;
        }


        if (!Silent) {
            if (system.GetDataValue(this.Data, "Type", 1) != 5) this.Page.SpreadEvent("StudentResponse", this, null);

            if (system.GetDataValue(this.Data, "ChangeAnswer", 0) == 0) {
                this.Page.SpreadEvent("MCChoice", this, null);
            }
            else {
                this.Page.SpreadEvent("MCChange", this, null);
            }
            if (system.GetDataValue(this.Data, "NextPage", 0) == 1 && !html.editing) {
                this.Page.Player.Forward();
            }

            var juid = system.GetDataReference(this.Data, "Jump", 0);
            if (juid != 0) this.Page.Player.Block.SpreadEvent("LoadPage", this, { "Page": juid, "Found": false, "ActivatePage": null });
        }

        if (this.clicked) {
            if (system.GetDataValue(this.Data, "Correct", 0) == 1) {
                this.Correct();
            }
            else {
                this.Wrong();
            }
            //this.Page.UpdateNavigation();
           // this.Page.Player.UpdateButtons();
        }
        else {
            this.Reset();
        }
        if (!Silent) {
            this.Page.UpdateResultConditions();

        }
        this.Page.UpdateNavigation();
        this.Page.Player.UpdateButtons();
        this.Page.SpreadEvent("Toggle");

    }

    var _this = this;
    this.mouseIn = false;
    this.mouseDown = false;



    if (supportsTouch) {
        _this.stage.ontouchstart = function (e) {
            e.preventDefault();
            if (e.touches.length == 1) {
                if (!_this.Page.Player.Block.menuUp && !html.editing) {
                    if (e.stopPropagation) e.stopPropagation();
                    _this.click(false);
                }
            }
        };
    }
    //else {

        _this.stage.onmouseover = function () {
            if (!_this.Page.Player.Block.menuUp) {
                _this.mouseIn = true;
                _this.hover.style.display = '';
            }
        };
        _this.stage.onmouseout = function () {
            _this.mouseIn = false;
            _this.hover.style.display = 'none';
        };
        _this.stage.onmousedown = function (e) {
            if (e == null)
                e = window.event;

            if (!_this.Page.Player.Block.menuUp && !html.editing) {
                if (e.stopPropagation) e.stopPropagation();
                _this.mouseDown = true;


                return false;
            }

        };
        _this.stage.onmouseup = function () {
            _this.mouseDown = false;
            if (_this.mouseIn && !_this.Page.Player.Block.menuUp && !html.editing) _this.click(false);
        };
    //}



    this.UpdateData();

    this.CalculateSuspendData = function (data) {
        var sd = '';
        sd += (_this.clicked ? '1' : '0') ;
        data[_this.Data.L.toString()] = sd;
    }
    this.ConsumeSuspendData = function (data) {
        var sd = data[_this.Data.L.toString()];
        if (sd != null) {
            var sds = sd.split(',');
            if (sds.length >= 1 && sds[0] == '1') {
                _this.click(true);
            }
        }
    }
}



ButtonAsset.prototype.CanNext = function () {

    if (this.AllowNext == 0) return true;
    if (this.AllowNext == 1) {
        
        if (system.GetDataValue(this.Data, "Type", 1) == 1 || system.GetDataValue(this.Data, "Type", 1) ==5) {
            var selectedCount = this.Page.GetScore("", 9);

            return selectedCount > 0;
        }
        else {
            return this.clicked;
        }
    }
    if (this.AllowNext == 2) {
        return this.Page.GetScore(null, 4) == this.Page.GetScore(null, 5);
    }

}


ButtonAsset.prototype.IsDone = function () {

    return this.clicked;
}

ButtonAsset.prototype.GetScore = function (cat, fieldtype) {
    if (fieldtype == 1 || fieldtype == 2) {
        var score = 0;
        if (this.clicked) {
            for (var s in this.Data.Score) {
                var sels = this.Data.Score[s];
                var c = system.GetDataValue(sels, "Category", 0)
                if (cat == null||c == cat) {
                    score += system.GetDataValue(sels, "Score", 0);
                }
            }
        }
        return score;
    }
    else if (fieldtype == 3) {
        var ms = 0;

        for (var s in this.Data.Score) {
            var sels = this.Data.Score[s];
            if (cat == null || system.GetDataValue(sels, "Category", 0) == cat) {
                var nms = system.GetDataValue(sels, "Score", 0)
                if (nms > ms) ms = nms;
            }
        }
        return ms;
    }
    else if (fieldtype == 4) {
        var score = 0;
        if (this.clicked && system.GetDataValue(this.Data, "Correct", 0) == 1) score++;
        if (!this.clicked && system.GetDataValue(this.Data, "Correct", 0) == 0) score++;
        return score;
    }
    else if (fieldtype == 9) {
        var score = 0;
        if (this.clicked) score++;
        return score;
    }
}


ButtonAsset.prototype.UpdateAccent = function (Item, StyleItem) {
    var sa = system.GetDataFile(this.Style, StyleItem + "/Accent/Source", '', true);
    if (sa != '') {
        if (this[Item + "accent"] == null) {
            this[Item + "accent"] = html.createElement(this[Item], "img");
        }
        html.styleElement(this[Item + "accent"], this.Style[StyleItem].Accent);
        this[Item + "accent"].src = sa;
    }
    else {
        if (this[Item + "accent"] != null) {
            this[Item].removeChild(this[Item + "accent"]);
            this[Item + "accent"] = null;
        }
    }
}

ButtonAsset.prototype.UpdateData = function () {
    this.Page.PositionAsset(this);
    this.AllowNext = system.GetDataValue(this.Data, "AllowNext", 0);

    if (html5 && system.GetDataValue(this.Style, "Effects", 1) == 1) {
        html.applyElementTransition(this.container, 'opacity 0.5s,-webkit-transform 0.5s|opacity 0.5s,-ms-transform 0.5s|opacity 0.5s,-moz-transform 0.5s|opacity 0.5s,-o-transform 0.5s|opacity 0.5s,transform 0.5s|');
        html.applyElementTransition(this.correct, 'opacity 0.5s,-webkit-transform 0.5s|opacity 0.5s,-ms-transform 0.5s|opacity 0.5s,-moz-transform 0.5s|opacity 0.5s,-o-transform 0.5s|opacity 0.5s,transform 0.5s|');
        html.applyElementTransition(this.wrong, 'opacity 0.5s,-webkit-transform 0.5s|opacity 0.5s,-ms-transform 0.5s|opacity 0.5s,-moz-transform 0.5s|opacity 0.5s,-o-transform 0.5s|opacity 0.5s,transform 0.5s|');

        html.applyElementTransformStyle(this.stage, 'preserve-3d');
        html.applyElementTransformStyle(this.obj, 'preserve-3d');
        html.applyElementTransformStyle(this.container, 'preserve-3d');

    }
    else {
        html.applyElementTransition(this.container, '');
        html.applyElementTransition(this.correct, '');
        html.applyElementTransition(this.wrong, '');


        html.applyElementTransformStyle(this.stage, 'flat');
        html.applyElementTransformStyle(this.obj, 'flat');
        html.applyElementTransformStyle(this.container, 'flat');
    }

    this.Reset();




    this.neutralimg.src = system.GetDataFile(this.Style, "NotSelected/BackgroundSource", '', true);
    this.hoverimg.src = system.GetDataFile(this.Style, "Hover/BackgroundSource", '', true);
    this.correctimg.src = system.GetDataFile(this.Style, "Correct/BackgroundSource", '', true);
    this.wrongimg.src = system.GetDataFile(this.Style, "Wrong/BackgroundSource", '', true);

    this.UpdateAccent("neutral", "NotSelected");
    this.UpdateAccent("hover", "Hover");
    this.UpdateAccent("correct", "Correct");
    this.UpdateAccent("wrong", "Wrong");

    var sizeArray = [this.stage, this.obj, this.container, this.hover, this.hoverimg, this.neutral, this.neutralimg, this.correct, this.correctimg, this.wrong, this.wrongimg];
    for (var i in sizeArray) {
        sizeArray[i].style.width = ExtractNumber(this.Surface.style.width) + 'px';
        sizeArray[i].style.height = ExtractNumber(this.Surface.style.height) + 'px';
        sizeArray[i].style.position = 'absolute';
    }
    if (html5) {
        html.applyElementTransform(this.obj, 'translateZ(-' + Math.floor(ExtractNumber(this.Surface.style.height) / 2) + 'px)');
        this.container.style.webkitBackfaceVisibility = 'hidden';
        this.correct.style.webkitBackfaceVisibility = 'hidden';
        this.wrong.style.webkitBackfaceVisibility = 'hidden';

        this.Surface.style.overflowX = 'hidden';
        this.Surface.style.overflowY = 'hidden';
    }


    var t = system.GetDataText(this.Data, "Label", '', true);
    if (this.Style.NotSelected != null) html.fillText(this.neutrallabel, this.Style.NotSelected.H, t);
    if (this.Style.Hover != null) html.fillText(this.hoverlabel, this.Style.Hover.H, t);
    if (this.Style.Correct != null) html.fillText(this.correctlabel, this.Style.Correct.H, t);
    if (this.Style.Wrong != null) html.fillText(this.wronglabel, this.Style.Wrong.H, t);



    var t = system.GetDataText(this.Data, "Answer", '', true);
    if (this.Style.NotSelected != null) html.fillFormattedText(this.neutralanswer, this.Style.NotSelected, t);
    if (this.Style.Hover != null) html.fillFormattedText(this.hoveranswer, this.Style.Hover, t);


    var t = system.GetDataText(this.Data, "Feedback", '', true);
    if (this.Style.Correct != null) html.fillFormattedText(this.correctfeedback, this.Style.Correct, t);
    if (this.Style.Wrong != null) html.fillFormattedText(this.wrongfeedback, this.Style.Wrong, t);



}

ButtonAsset.prototype.Reset = function () {
    if (html5) {
        html.applyElementTransform(this.container, 'rotateX(0deg) translateZ(' + Math.floor(ExtractNumber(this.Surface.style.height) / 2) + 'px)');
        html.applyElementTransform(this.correct, 'rotateX(90deg) translateZ(' + Math.floor(ExtractNumber(this.Surface.style.height) / 2) + 'px)');
        html.applyElementTransform(this.wrong, 'rotateX(-90deg) translateZ(' + Math.floor(ExtractNumber(this.Surface.style.height) / 2) + 'px)');
        setOpacity(this.correct, 0);
        setOpacity(this.wrong, 0);
        setOpacity(this.container, 1);
    }
    else {
        this.correct.style.display = 'none';
        this.wrong.style.display = 'none';
        this.container.style.display = 'block';
    }
    this.clicked = false;
    this.fixed = false;

    this.Page.UpdateNavigation();
    this.Page.Player.UpdateButtons();

}

ButtonAsset.prototype.Correct = function () {
    if (system.GetDataValue(this.Data, "ShowFeedback", 1) == 0) return;
    if (html5) {
        html.applyElementTransform(this.container, 'rotateX(-90deg) translateZ(' + Math.floor(ExtractNumber(this.Surface.style.height) / 2) + 'px)');
        html.applyElementTransform(this.correct, 'rotateX(0deg) translateZ(' + Math.floor(ExtractNumber(this.Surface.style.height) / 2) + 'px)');
        html.applyElementTransform(this.wrong, 'rotateX(-180deg) translateZ(' + Math.floor(ExtractNumber(this.Surface.style.height) / 2) + 'px)');
        setOpacity(this.correct, 1);
        setOpacity(this.wrong, 0);
        setOpacity(this.container, 0);
    }
    else {
        this.correct.style.display = 'block';
        this.wrong.style.display = 'none';
        this.container.style.display = 'none';
    }
}

ButtonAsset.prototype.Wrong = function () {
    if (system.GetDataValue(this.Data, "ShowFeedback", 1) == 0) return;
    if (html5) {
        html.applyElementTransform(this.container, 'rotateX(90deg) translateZ(' + Math.floor(ExtractNumber(this.Surface.style.height) / 2) + 'px)');
        html.applyElementTransform(this.correct, 'rotateX(180deg) translateZ(' + Math.floor(ExtractNumber(this.Surface.style.height) / 2) + 'px)');
        html.applyElementTransform(this.wrong, 'rotateX(0deg) translateZ(' + Math.floor(ExtractNumber(this.Surface.style.height) / 2) + 'px)');
        setOpacity(this.correct, 0);
        setOpacity(this.wrong, 1);
        setOpacity(this.container, 0);
    }
    else {
        this.correct.style.display = 'none';
        this.wrong.style.display = 'block';
        this.container.style.display = 'none';
    }
}


ButtonAsset.prototype.AssetEvent = function (Event, Asset, Params) {
    if (system.GetDataValue(this.Data, "Type", 1) == 1 || system.GetDataValue(this.Data, "Type", 1) == 5) {
        if (Event == "MCChoice") {
            this.fixed = true;
            if (Asset != this && system.GetDataValue(this.Data, "Correct", 0) == 1) {
                this.Correct();
            }
        }
        if (Event == "MCChange") {
            if (Asset != this) {
                this.clicked = false;
                this.Reset();
            }
        }
    }
    if (Event == "Timer") {
        this.fixed = true;
        if (system.GetDataValue(this.Data, "Correct", 0) == 0) {
            this.Wrong();
        }
        else {
            this.Correct();
        }

    }
    if (Event == "TimerReset") {
        if (system.GetDataValue(this.Data, "Reset", 0) == 1) {
            this.Reset();
        }
    }


}

ButtonAsset.prototype.Leave = function () {

}
ButtonAsset.prototype.Enter = function () {
    if (system.GetDataValue(this.Data, "Reset", 0) == 1) {
        this.Reset();
    }
}

//
//slm_externasset
//
//Extern

function ExternAsset(Page, Data) {
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);


    this.iframe = null;
    this.href = null;
    this.active = false;


    this.UpdateData();
}

ExternAsset.prototype.UpdateData = function () {
    this.Page.PositionAsset(this);
    var linktext = system.GetDataText(this.Data, "LinkText", '', true);
    var _this = this;

    if (linktext == '') {
        if (this.iframe == null) {
            this.iframe = html.createElement(this.Surface, "IFRAME");
        }
        if (this.href != null) {
            this.Surface.removeChild(this.href);
            this.href = null;
        }
        this.iframe.style.width = this.Surface.style.width;
        this.iframe.style.height = this.Surface.style.height;
        this.iframe.style.border = '0px';
        var url = system.GetDataText(this.Data, "URL", '', true);
        if (url == '') {
            var startpage = system.GetDataText(this.Data, "StartPage", '', true);
            if (startpage == '') startpage = 'index.html';
        
            for (var i = 0; i < CurrentBlock.Data.Media.length; i++) {
                var vn = system.GetDataText(CurrentBlock.Data.Media[i], "Name", "", false);
                if ((vn+'/') == startpage.substr(0,vn.length+1)) {
                    startpage = startpage.substr(vn.length + 1);
                    url = 'ResourceArchive/' + system.GetDataFileObject(CurrentBlock.Data.Media[i], "Content", '', true).GUID + '/' + startpage;
                }
            }

            if (url == ''){
                url = 'ResourceArchive/' + system.GetDataFileObject(this.Data, "Content", '', true).GUID + '/' + startpage;
            }

        }
        this.url = url;
        if (system.GetDataValue(this.Data, "Refresh", 0) == 0 || this.active) {
            this.iframe.src = url;
        }

        this.iframe.style.overflow = (system.GetDataValue(this.Data, "Scroll", 1) == 1) ? 'auto' : 'hidden';
        this.iframe.scrolling = (system.GetDataValue(this.Data, "Scroll", 1) == 1) ? 'auto' : 'no';

    }
    else {
        if (this.iframe != null) {
            this.Surface.removeChild(this.iframe);
            this.iframe = null;
        }
        if (this.href == null) {
            this.href = html.createElement(this.Surface, "a");
            this.href.style.textDecoration = 'none';
            var handler1 = function (e) {
                if (e == null) e = window.event;
                if (e.preventDefault) e.preventDefault();
                else e.returnValue = false;
                return false;
            }
            if (supportsTouch) {
                this.href['ontouchstart'] = handler1;
            }
            this.href['onmousedown'] = handler1


            this.href['onclick'] = function (e) {
                if (e == null) e = window.event;
                if (e.preventDefault) e.preventDefault();
                else e.returnValue = false;
                return false;
            }
            var handler2 = function (e) {
                if (e == null) e = window.event;
                if (e.preventDefault) e.preventDefault();
                else e.returnValue = false;

                if (!_this.Page.Player.Block.menuUp && !html.editing) {
                    window.open(_this.href.href, _this.href.target);
                    if (system.GetDataValue(_this.Data, "Close", 0) == 1) {
                        _this.Page.Player.Block.SLM.Close();
                    }
                }
                return false;
            }
            if (supportsTouch) {
                this.href['ontouchend'] = handler2;
            }
            this.href['onmouseup'] = handler2;


            this.hrefimg = html.createElement(this.href, "img");
            this.hrefimg.border = '0';
            
            if (supportsTouch) {
                this.hrefimg['ontouchstart'] = function (e) {
                    return true;
                }
            }
            this.hrefimg['onmousedown'] = function (e) {
                return true;
            }

            var _this = this;
            if (this.Style != null) {
                this.hrefimg.onmouseover = function () {
                    if (!_this.Page.Player.Block.menuUp) {
                        var h = system.GetDataFile(_this.Style, "DownloadSourceHover", '', true);
                        if (h != '') _this.hrefimg.src = h;

                    }
                };
                this.hrefimg.onmouseout = function () {
                    _this.hrefimg.src = system.GetDataFile(_this.Style, "DownloadSource", '', true);
                };
            }


            this.hreftext = html.createElement(this.href, "span");
            this.href.style.cursor = 'pointer';
            if (supportsTouch) {
                this.hreftext['ontouchstart'] = function (e) {
                    return true;
                }
            }
            this.hreftext['onmousedown'] = function (e) {
                return true;
            }

            if (this.Style != null) {
                if (this.Style.DownloadSource != null) this.hrefimg.src = system.GetDataFile(this.Style, "DownloadSource", '', true);
                if (this.Style.DownloadLink != null) html.fillText(this.hreftext, this.Style.DownloadLink, linktext);
            }
            this.hreftext.style.zoom = 1;
        }

        this.href.href = system.GetDataText(this.Data, "URL", '', true);
        this.href.target = '_blank';
        this.hreftext.innerHTML = linktext;
    }
}


ExternAsset.prototype.Enter = function () {
    this.active = true;
    try {
        if (this.href != null) {
            this.hreftext.style.width = this.Surface.offsetWidth - this.hrefimg.offsetWidth - parseInt(this.Surface.style.paddingLeft) - parseInt(this.Surface.style.paddingRight) + 'px';
        }
        if (this.iframe != null) {
            if (system.GetDataValue(this.Data, "Refresh", 0) == 1) {
                this.iframe.src = this.url;
            }

        }
    }
    catch (e) {

    }
    //alert(this.hrefimg.offsetWidth + ' - ' + parseInt(this.Surface.style.paddingLeft));
}

ExternAsset.prototype.Leave = function () {
    this.active = false;
    if (this.iframe != null) {
        if (system.GetDataValue(this.Data, "Refresh", 0) == 1) {
            this.iframe.src = 'about:blank';
        }
        
    }
}

//
//slm_frameasset
//
//Frame

function FrameAsset(Page, Data) {
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);


    this.Block = this.Page.Player.Block;

    this.container = html.createElement(this.Surface, "DIV");

    this.Pages = [];
    this.EditViewing = function (list) {
        if (this.Data.P != null) {
            list[this.Data.P.toString()] = true;
        }
        if (this.CurrentPage != null) {
            this.CurrentPage.EditViewing(list);
        }
        this.UpdateShowing();
    }
    this.EditTryInsert = function (Type, EmptyObject, Offset, Editor) {
        if (this.EditInsert(Type, EmptyObject, Offset, Editor)) return true;
        if (this.CurrentPage != null) {
            if (Editor != null) {
                var p = Editor.selectedControl;
                while (p != null && p != this && p.EditParent != null) {
                    p = p.EditParent;
                }
                if (p == this) {
                    if (this.CurrentPage.EditTryInsert(Type, EmptyObject, Offset, Editor)) return true;
                }
            }
            
        }
        return false;
    }
    this.EditIsActive = function (Activate) {
        return this.Page.EditIsActive(Activate);
    }

    this.EditInsert = function (Type, EmptyObject, Offset, Editor) {

        if (Offset != null) {
            var l = system.GetDataValue(this.Data, "Left", 0);
            var t = system.GetDataValue(this.Data, "Top", 0);
            var w = system.GetDataValue(this.Data, "Width", 0);
            var h = system.GetDataValue(this.Data, "Height", 0);
            //l = 0;
            //t = 0;

            if (Offset == "Insert") {
                var col = l;
                var row = t;
            }
            else{
                var col = Math.floor(Offset[0] / this.Page.ColWidth);
                var row = Math.floor(Offset[1] / this.Page.RowHeight);

            }
            if (col >= l && col < l + w && row >= t && row < t + h) {

                if (Type == 399) {
                    var clone = EmptyObject;
                    Editor.GenericDataEditComponent.apply();

                    if (this.Data.Pages == null) this.Data.Pages = [];
                    this.Data.Pages[this.Data.Pages.length] = clone;
                    this.UpdateData();

                    Editor.GenericDataEditComponent.WYSIWYGUpdate(this, true);

                    var page = this.Pages[this.Pages.length - 1];
                    this.ActivatePage(page);
                    return true;
                }
                if (this.CurrentPage != null) {
                    if (this.CurrentPage.EditInsert(Type, EmptyObject, Offset, Editor)) {
                        
                        return true;
                    }
                }
            }
        }
        return false;

    }
    this.CurrentPage = null;

    var _this = this;
    this.CalculateSuspendData = function (data) {
        var sd = '';
        sd += ((_this.CurrentPage==null) ? 0 : _this.CurrentPage.Data.L) ;

        data[_this.Data.L.toString()] = sd;

        for (var i in _this.Pages) {
            _this.Pages[i].CalculateSuspendData(data);
        }
    }
    this.ConsumeSuspendData = function (data) {
        var sd = data[_this.Data.L.toString()];
        if (sd != null) {
            var sds = sd.split(',');
            if (sds.length > 0) {
                if (system.GetDataValue(this.Data, "RememberActivePage", 1) == 1) {
                    if (sds[0] != '') _this.LoadFrame(parseInt(sds[0]));
                }
            }
        }
        
        for (var i in _this.Pages) {
            _this.Pages[i].ConsumeSuspendData(data);
        }
      
    }


    this.UpdateData();
    this.Reset();
}



FrameAsset.prototype.LoadFrame = function (PageID) {
    if (PageID == 0) {
        this.ActivatePage(null);
        return false;
    }
    for (var p in this.Pages) {
        var page = this.Pages[p];
        if (page.Data.L == PageID) {
            this.ActivatePage(page);
            return true;
        }

    }
    return false;
   
}

FrameAsset.prototype.ActivatePage = function (Page) {
    var changed = this.CurrentPage != Page;
    if (this.CurrentPage != null && changed) {
        this.CurrentPage.Leave();
    }

    if (Page != null && this.Page.Player.CurrentPage != null) this.Page.Player.CurrentPage.SuspendBeforePopup();

    this.CurrentPage = null;
    var index = 0;
    for (var p in this.Pages) {
        index++;
        var page = this.Pages[p];
        if (page == Page) {
            page.Surface.style.display = 'inline';
            this.CurrentPage = Page;
            this.Page.SpreadEvent("FrameLoaded", this, { "Page": page.Data.L,"Index": index,"Total":this.Pages.length,"FrameL": this.Data.L });

        }
        else {
            page.Surface.style.display = 'none';
        }

    }

    if (this.CurrentPage != null && changed) {
        this.CurrentPage.Enter();
        this.CurrentPage.AfterEnter();
    }


    this.Page.Player.UpdateButtons();
    this.UpdateShowing();
}

FrameAsset.prototype.CanNext = function () {
    this.AllowNext = system.GetDataValue(this.Data, "AllowNext", 2);
    if (this.AllowNext == 0) return true;
    if (this.AllowNext == 1) {
        for (var p in this.Pages) {
            if (!this.Pages[p].Seen) return false;
        }
    }
    if (this.AllowNext == 2) {
        if (this.CurrentPage == null) return true;
        else return this.CurrentPage.CanNext();
    }
    return true;
}


FrameAsset.prototype.UpdateShowing = function () {
    if (system.GetDataValue(this.Data, "Hide", 0) == 1 && (this.CurrentPage == null || this.CurrentPage.Assets.length == 0) && !html.editing) {
        this.Surface.style.display = 'none';
    }
    else {
        this.Surface.style.display = '';
    }

}

FrameAsset.prototype.GetWidth = function () {
    return ExtractNumber(this.Surface.style.width);
}

FrameAsset.prototype.GetHeight = function(){
    return ExtractNumber(this.Surface.style.height);
}

FrameAsset.prototype.Forward = function () {
    if (this.CurrentPage.Index < this.Pages.length - 1) {
        return this.ActivatePage(this.Pages[this.CurrentPage.Index + 1]);
    }
    return false;
}

FrameAsset.prototype.UpdateData = function (recurse) {
    this.Page.PositionAsset(this);

    this.container.style.width = this.Surface.style.width;
    this.container.style.height = this.Surface.style.height;

    var gridWidth = system.GetDataValue(this.Data, "Width", 1);
    var gridHeight = system.GetDataValue(this.Data, "Height", 1);

    if (this.Data.Pages == null) this.Data.Pages = [];
    var skip = 0;
    var match = [];
    var firstMatch = null;
    for (var di = 0; di < this.Data.Pages.length; di++) {
        var pdata = this.Data.Pages[di];
        var found = false;
        match[di] = null;
        for (var pbi = 0; pbi < this.Pages.length; pbi++) {
            if (this.Pages[pbi].Data == pdata) {
                match[di] = this.Pages[pbi];
                found = true;
            }
        }
        if (!found) {
            var np = new Page(this, this.container, pdata, gridWidth, gridHeight);
            this.Pages[this.Pages.length] = np;
            match[di] = np;
        }
    }
    this.Pages = match;

    var i = 0;
    for (var p in this.Pages) {
        var page = this.Pages[p];
        page.Index = i;
        page.Surface.style.display = 'none';
        var relw = gridWidth;
        var relh = gridHeight;
        if (system.GetDataValue(this.Data, "GridAlign", 1) == 0) {
            relw = Math.round(relw / this.Page.ColWidth);
            relh = Math.round(relh / this.Page.RowHeight);
            if (relw < 1) relw = 1;
            if (relh < 1) relh = 1;
        }

        if (recurse || page.RequiredCols != relw || page.RequiredRows != relh || page.PixelWidth != this.GetWidth() || page.PixelHeight != this.GetHeight()) {
            page.RequiredCols = relw
            page.RequiredRows = relh;
            page.UpdateData(recurse);
        }
        i++;
    }

    if (system.GetDataValue(this.Data, "Score", 0) == 1) {
        this.GetScore = function (cat, fieldtype) {
            var s = 0;

            if (fieldtype == 3) {
                for (var p in this.Pages) {
                    s += 1;
                }
            }
            if (fieldtype == 2) {
                for (var p in this.Pages) {
                    s += this.Pages[p].Seen ? 1 : 0;
                }
            }


            return s;
        }
    }
    else {
        this.GetScore = null;
    }


    this.ActivatePage(this.CurrentPage);
}

FrameAsset.prototype.AssetEvent = function (Event, Asset, Params) {
    if (Event == "LoadFrame") {
        var page = Params.Page;
        var lf = Params.LoadedFrames;
        if (lf == null || arrayIndexOf(lf, this) == -1) {
            if (Params.Unload != null) {
                if (this.CurrentPage != null && this.CurrentPage.Data.L == Params.Unload) {
                    if (this.LoadFrame(page) && lf != null) {
                        lf[lf.length] = this;
                    }
                }
            }
            else {
                if (this.LoadFrame(page) && lf !=  null) {
                    lf[lf.length] = this;
                }
            }
        }
    }
    else if (Event == "LoadPage") {

        for (var p in this.Pages) {
            
            var page = this.Pages[p];
            if (page.Data.L == Params.Page) {

                Params.Found = true;
                Params.JustFound = true;
                Params.FramePage = page;
                Params.Frame = this;
                return;
            }
            else {
                Params.JustFound = false;
                page.SpreadEvent(Event, Asset, Params);

                if (Params.JustFound) {
                    if (Params.FramePages == null) {
                        Params.FramePages = [];
                        Params.Frames = [];
                    }
                    Params.FramePages.push(page);
                    Params.Frames.push(this);
                    return;
                }
            }

        }
    }
    else if (Event == "FrameMoveIndex") {
        if (Params.FrameL == this.Data.L) {
            this.ActivatePage(this.Pages[Params.FrameIndex]);
            

     
        }
    }
    if (this.CurrentPage != null) this.CurrentPage.SpreadEvent(Event, Asset, Params);
}

FrameAsset.prototype.Reset = function () {
    for (var p in this.Pages) {
        var selp = this.Pages[p];
        selp.Reset();
    }

    this.LoadFrame(system.GetDataReference(this.Data, "FirstPage", 0));
}

FrameAsset.prototype.SuspendBeforePopup = function () {
    if (this.CurrentPage != null) this.CurrentPage.SuspendBeforePopup();
}

FrameAsset.prototype.ResumeAfterPopup = function () {
    if (this.CurrentPage != null) this.CurrentPage.ResumeAfterPopup();
}

FrameAsset.prototype.Leave = function () {
    if (this.CurrentPage != null) this.CurrentPage.Leave();
}
FrameAsset.prototype.Enter = function () {
    if (system.GetDataValue(this.Data, "Reset", 0) == 1) {
        this.Reset();
    }
    if (this.CurrentPage != null) this.CurrentPage.Enter();
}

FrameAsset.prototype.UpdateButtons = function () {
    if (this.Page.Player.UpdateButtons) {
        this.Page.Player.UpdateButtons();
    }
}



FrameAsset.prototype.GetScoreGhost = function (cat, fieldtype) {
    //if (this.CurrentPage != null) {
    //    return this.CurrentPage.GetScore(cat, fieldtype);
    //}
    //return null;

    if (fieldtype == 11) {
        var score = [];
    }
    else {
        var score = 0;
    }
    for (var p in this.Pages) {
        var selp = this.Pages[p];
        if (fieldtype == 11) {
            score = score.concat(selp.GetScore(cat, fieldtype));
        }
        else {
            score += selp.GetScore(cat, fieldtype);
        }
    }
    return score;
}




//
//slm_framenavasset
//
//framenav asset
function FrameNavAsset(Page, Data) {
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);
    this.LastIndex = 0;
    this.LastCount = 0;
    var _this = this;
    this.Counter = html.createText(this.Surface, null, '');
    this.ButtonBack = new Button(this.Surface, null, function () { _this.Nav(-1); }, _this.Page.Player.Block, true);
    this.ButtonForward = new Button(this.Surface, null, function () { _this.Nav(1); }, _this.Page.Player.Block, true);
    

    this.UpdateData();


}

FrameNavAsset.prototype.Nav = function (Direction) {
    var i = this.LastIndex + Direction-1;
    this.Page.SpreadEvent("FrameMoveIndex", this, { "FrameL": system.GetDataReference(this.Data, "Frame", 0), "FrameIndex": i });
}

FrameNavAsset.prototype.AssetEvent = function (Event, Asset, Params) {
    if (Event == "FrameLoaded") {
        if (Params.FrameL == system.GetDataReference(this.Data, "Frame", 0)) {
  
            this.LastIndex = Params.Index;
            this.LastTotal = Params.Total;
            this.Update();


        }
    }
}


FrameNavAsset.prototype.Update = function () {
    this.ButtonBack.element.style.display = (this.LastIndex > 1) ? '' : 'none';
    this.ButtonForward.element.style.display = (this.LastIndex < this.LastTotal) ? '' : 'none';

    html.fillText(this.Counter, (this.PlayerStyle == null) ? null : this.PlayerStyle.Navigation.CounterLayer, this.LastIndex + "/" + this.LastTotal);
}


FrameNavAsset.prototype.UpdateData = function () {
    this.Page.PositionAsset(this);
    //this.Surface.style.backgroundColor = 'yellow';

    var ps = system.GetDataValue(this.Data, "NavigationType", 0);
    if (ps != 0) {
        this.PlayerStyle = this.Page.Player.Block.GetPlayerStyle(ps);
        if (this.PlayerStyle != null) {
            this.ButtonBack.ChangeStyle(this.PlayerStyle.Navigation.ButtonBack);
            this.ButtonForward.ChangeStyle(this.PlayerStyle.Navigation.ButtonForward);
        }
    }
    this.Update();
}

//
//slm_harmonica
//
//harmonica asset
function HarmonicaAsset(Page, Data) {
    this.Page = Page;
    this.Data = Data;
    this.ActiveBlock = null;

    Page.AddAsset(this);


    this.Blocks = new Array();
    this.BlockContainer = html.createLayer(this.Surface, null);

    if (Data.Blocks != null) {
        for (var a in Data.Blocks) {
            var Block = Data.Blocks[a];
            this.Blocks[a] = new HarmonicaBlock(this, Block);

        }
    }

    this.UpdateData();

    this.currentFeedback = null;
    this.ShowFeedback("");
}

HarmonicaAsset.prototype.Enter = function () {
    if (this.currentFeedback != "") this.ShowFeedback("");
}


HarmonicaAsset.prototype.AssetEvent = function (Event, Asset, Params) {
    if (Event == "SpreadFeedback") {
        if (this.Page.Data.L == Params.Target) {
            var fb = Params.Feedback;
            this.ShowFeedback(fb);
        }
    }

}
HarmonicaAsset.prototype.ShowFeedback = function (Feedback) {
    this.currentFeedback = Feedback;
    if (this.currentFeedback != "" && this.FeedbackBlock != null) {
        this.Activate(this.FeedbackBlock);
    }
    else {
        for (var pl in this.Blocks) {
            if (!this.Blocks[pl].Feedback) {
                this.Activate(this.Blocks[pl]);
                break;
            }
        }
    }
}


HarmonicaAsset.prototype.UpdateData = function () {
    this.Page.PositionAsset(this);


    if (this.Data.Blocks == null) this.Data.Blocks = [];

    var match = [];
    var firstMatch = null;
    for (var di = 0; di < this.Data.Blocks.length; di++) {
        var pdata = this.Data.Blocks[di];
        var found = false;
        match[di] = null;
        for (var pbi = 0; pbi < this.Blocks.length; pbi++) {
            if (this.Blocks[pbi].Data == pdata) {
                match[di] = this.Blocks[pbi];
                found = true;
            }
        }
        if (!found) {
            var np = new HarmonicaBlock(this, pdata);
            this.Blocks[this.Blocks.length] = np;
            match[di] = np;
        }
        if (match[di].container != null) {
            this.BlockContainer.insertBefore(match[di].container, null);
            if (firstMatch == null) firstMatch = match[di].container;
        }
    }
    this.Blocks = match;

    while (this.BlockContainer.childNodes.length > 0 && this.BlockContainer.firstChild != firstMatch) this.BlockContainer.removeChild(this.BlockContainer.firstChild);

    this.FeedbackBlock = null;
    for (var pl in this.Blocks) {
        this.Blocks[pl].UpdateData();
        if (this.Blocks[pl].Feedback) {
            this.FeedbackBlock = this.Blocks[pl];
        }
    }

}

HarmonicaAsset.prototype.Activate = function (block) {


    if (this.ActiveBlock != null) {
        this.ActiveBlock.Active = false;
        this.ActiveBlock.UpdateSRC();
    }
    this.ActiveBlock = block;
    if (this.ActiveBlock != null) {
        this.ActiveBlock.Active = true;
        this.ActiveBlock.UpdateSRC();
    }
    var h = 0;
    var top = true;
    for (var pl in this.Blocks) {
       
        var b = this.Blocks[pl];
        if (b.Top != top) {
            b.Top = top;
            b.UpdateSRC();
        }
        if (b == block) top = false;
        if (b == block || !b.Feedback) {
            h += b.labelcontainer.offsetHeight;
            b.container.style.width = this.Surface.offsetWidth + 'px';
        }
    }



    var y = 0;
    for (var pl in this.Blocks) {
        var b = this.Blocks[pl];

        if (b == block || !b.Feedback) {
            b.container.style.position = 'absolute';
            b.container.style.top = y + 'px';
            y += b.labelcontainer.offsetHeight;
            if (b == block) {
                b.container.style.height = (b.labelcontainer.offsetHeight + (this.Surface.offsetHeight - h)) + 'px';
                y += (this.Surface.offsetHeight - h);
            }
            else {
                b.container.style.height = b.labelcontainer.offsetHeight + 'px';
            }
        }
        else {
            b.container.style.height = '0px';
        }
    }
    block.bodycontainer.style.height = (this.Surface.offsetHeight - h) + 'px';
}



function HarmonicaBlock(HarmonicaAsset, Data) {
    this.Active = false;
    this.Top = false;
    this.HarmonicaAsset = HarmonicaAsset;
    this.Data = Data;
    this.container = html.createLayer(HarmonicaAsset.BlockContainer, null);

    html.applyElementTransition(this.container, "top 0.5s");

    html.addEditElement(this.container, this);
    this.EditParent = HarmonicaAsset;
    this.EditIsActive = function (Activate) {
        return this.EditParent.EditIsActive(Activate);
    }
    this.FindPage = function () {
        return this.EditParent.FindPage();
    }
    this.EditTryInsert = function (Type, EmptyObject, Offset, Editor) {
        return this.EditInsert(Type, EmptyObject, Offset, Editor);
    }
    this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
        return false;
    }

    this.labelcontainer = html.createFormattedText(this.container, null, '');
    this.toggle = html.createElement(this.container, "img");
    


    this.bodycontainer = html.createLayer(this.container, null);
    this.bodycontainer.style.overflowY = 'auto';
    this.bodycontainer.style.boxSizing = 'border-box'

    html.applyElementTransition(this.bodycontainer, "height 0.5s");

    var _this = this;
    var handler1 = function (e) {
        if (e == null) e = window.event;
        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;
        return false;
    }
    if (supportsTouch) {
        this.container['ontouchstart'] = handler1;
    }
    this.container['onmousedown'] = handler1;

    this.container['onclick'] = function (e) {
        if (e == null) e = window.event;
        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;
        return false;
    }
    var _this = this;
    var handler2 = function (e) {
        if (e == null) e = window.event;
        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;

        {
            _this.HarmonicaAsset.Activate(_this);
        }
        return false;
    }
    if (supportsTouch) {
        this.container['ontouchend'] = handler2;
    }
    this.container['onmouseup'] = handler2;

    _this.mouseInControl = false;
    this.container.onmouseover = function () {
        _this.await = setTimeout((function (_self) { return function () { _self.HarmonicaAsset.Activate(_self); } })(_this), 200);
        _this.mouseInControl = true;
        _this.UpdateSRC();
    }
    this.container.onmouseout = function () {
        clearTimeout(_this.await);
        _this.mouseInControl = false;
        _this.UpdateSRC();
    }


}

HarmonicaBlock.prototype.UpdateSRC = function () {



    var Style = this.Active ? this.HarmonicaAsset.Style.Selected : ((this.mouseInControl) ? this.HarmonicaAsset.Style.Hover : this.HarmonicaAsset.Style.NotSelected);
    this.toggle.style.display = this.Active ? 'none' : '';

    var src = '';
    

    if (this.Top) {
        if (this.mouseInControl) {
            src = system.GetDataFile(this.HarmonicaAsset.Style.Simulation, 'AccordeonDownSourceHover', '', false);
        }
        else {
            src = system.GetDataFile(this.HarmonicaAsset.Style.Simulation, 'AccordeonDownSource', '', false);
        }
    }
    else {
        if (this.mouseInControl) {
            src = system.GetDataFile(this.HarmonicaAsset.Style.Simulation, 'AccordeonUpSourceHover', '', false);
        }
        else {
            src = system.GetDataFile(this.HarmonicaAsset.Style.Simulation, 'AccordeonUpSource', '', false);
        }

    }
    if (src != '') {
        this.toggle.src = src;
    }

    if (this.Feedback) {
        html.fillFormattedText(this.bodycontainer, this.HarmonicaAsset.Style, this.HarmonicaAsset.currentFeedback);
        Style = this.HarmonicaAsset.Style.Wrong;
    }
    else {
        html.fillFormattedText(this.bodycontainer, this.HarmonicaAsset.Style, system.GetDataText(this.Data, "BlockBody", '', true));
    }
    html.fillFormattedText(this.labelcontainer, Style, system.GetDataText(this.Data, "BlockLabel", '-', true));




    this.labelcontainer.style.backgroundColor = safeColor(system.GetDataText(Style, "BackgroundColor", null, false));
    try {
        var b = system.GetDataText(Style, "Border/Border", null, false);
        if (b == null) b = "";
        this.labelcontainer.style.borderLeft = system.GetDataText(Style, "Border/BorderLeft", b, false);
        this.labelcontainer.style.borderRight = system.GetDataText(Style, "Border/BorderRight", b, false);
        this.labelcontainer.style.borderTop = system.GetDataText(Style, "Border/BorderTop", b, false);
        this.labelcontainer.style.borderBottom = system.GetDataText(Style, "Border/BorderBottom", b, false);

    }
    catch (e) {

    }
}

HarmonicaBlock.prototype.UpdateData = function () {
    var _this = this;
    this.Feedback = system.GetDataValue(this.Data, "Feedback", 0) == 1;
    html.styleElement(this.toggle, this.HarmonicaAsset.Style.Simulation.ToggleAccordeonLayer);
    this.UpdateSRC();
}


//
//slm_hotspotasset
//
//hotspot asset

function HotspotAsset(Page, Data) {
    var _this = this;
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);

    this.ResultsFixed = false;
    this.ResultsChecked = false;
    this.LastSubmittedClickType = -1;

    this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
        if (Type == 1507) {
            var clone = EmptyObject;

            if (Offset != null) {
                var x = Math.floor(Offset[0]-this.HSImage.offsetParent.offsetLeft) - 25;
                var y = Math.floor(Offset[1]-this.HSImage.offsetParent.offsetTop) - 25;
                if (x < 0) x = 0;
                if (y < 0) y = 0;


                system.saveValueData(clone, "Left",x, null);
                system.saveValueData(clone, "Top", y, null);
            }


            Editor.GenericDataEditComponent.apply();

            if (this.Data.Hotspots == null) this.Data.Hotspots = [];
            this.Data.Hotspots[this.Data.Hotspots.length] = clone;
            this.UpdateData();

            Editor.GenericDataEditComponent.WYSIWYGUpdate(this, true);

            return true;
        }
        return false;
    }

    if (this.Data["NextPage"] == null) system.saveValueData(this.Data, "NextPage", 0, null);
    if (this.Data["ChangeAnswer"] == null) system.saveValueData(this.Data, "ChangeAnswer", 1, null);
    if (this.Data["Reset"] == null) system.saveValueData(this.Data, "Reset", 0, null);
    if (this.Data["Check"] == null) system.saveValueData(this.Data, "Check", 0, null);


    this.Hotspots = [];
    this.DummyHotspot = null;

    this.ToggleEdit = function (editing) {
        for (var h in _this.Hotspots) _this.Hotspots[h].ToggleEdit(editing);
    }
    html.addEditObserver(this.ToggleEdit);

    this.container = html.createLayer(this.Surface, null);
    this.container.oncontextmenu = function () { return false; }
    this.Title = html.createText(this.container, null, '');
    this.SubTitle = html.createText(this.container, null, '');
    this.Question = html.createFormattedText(this.container, null, '');
    this.AnswerContainer = html.createLayer(this.container, null);
    this.FeedbackContainer = html.createLayer(this.container, null);
    this.CheckContainer = html.createLayer(this.FeedbackContainer, null);

    this.HSImage = html.createElement(this.AnswerContainer, "IMG");
    this.AnswerContainer.style.position = 'relative';





    this.UpdateData();

    this.CalculateSuspendData = function (data) {
        var sd = '|' + (this.ResultsChecked ? '1' : '0') + '|' + (this.ResultsFixed ? '1' : '0') + '|';
        if (this.DummyHotspot != null) {
            sd += (this.DummyHotspot.selected ? '1' : '0');
            if (this.DummyHotspot.iconPosition != null) sd += ',' + this.DummyHotspot.iconPosition[0].toString() + ',' + this.DummyHotspot.iconPosition[1].toString();
        }

        if (_this.Data.L != null) data[_this.Data.L.toString()] = sd;
        for (var i in _this.Hotspots) {
            _this.Hotspots[i].CalculateSuspendData(data);
        }
    }
    this.ConsumeSuspendData = function (data) {
        var sd = data[_this.Data.L.toString()];
        if (sd != null) {
            if (sd == '') {
                this.ResultsChecked = false;
                this.ResultsFixed = false;
            }
            else {
                var options = sd.split('|');
                this.ResultsChecked = (options[1].toString() == '1');
                this.ResultsFixed = (options[2].toString() == '1');
                if (options.length > 3 && this.DummyHotspot != null) {
                    var sds = options[3].split(',');
                    if (sds.length >= 3) {
                        this.DummyHotspot.iconPosition = [ExtractNumber(sds[1]), ExtractNumber(sds[2])];
                    }
                    if (sds.length >= 1 && sds[0] == '1') {
                        this.DummyHotspot.HotspotAsset.SelectAnswer(this.DummyHotspot, true);
                    }
                }
            }

        }
        for (var i in _this.Hotspots) {
            _this.Hotspots[i].ConsumeSuspendData(data);
        }
        if (this.ResultsChecked) this.FireCheck(true);
    }


    this.KeyHandler = function (keyCode, ctrl, alt, shift) {


        var sf = system.GetDataReference(_this.Data, "SpreadFeedback", 0);
        if (sf != 0) {

            var correct = false;
            var feedback = _this.FeedbackWrong;

            if (_this.Data.Shortcuts != null) {
                for (var i in _this.Data.Shortcuts) {
                    var sc = _this.Data.Shortcuts[i];
                    var k = system.GetDataValue(sc, "Key", 0);
                    var c = system.GetDataValue(sc, "Ctrl", 0) == 1;
                    var a = system.GetDataValue(sc, "Alt", 0) == 1;
                    var s = system.GetDataValue(sc, "Shift", 0) == 1;
                    if (keyCode == k && c == ctrl && a == alt && s == shift) {
                        correct = true;
                    }
                    else {
                        //correct = false;
                    }
                }
            }



            if (correct) {
                feedback = _this.FeedbackCorrect;
                var f = system.GetDataReference(_this.Data, "FrameCorrect", 0);
                if (f != 0) {
                    _this.Page.Player.Block.SpreadEvent("LoadPage", _this, { "Page": f, "Found": false, "ActivatePage": null });
                }
            }
            _this.Page.Player.Block.SpreadEvent("SpreadFeedback", _this, { "Feedback": feedback, "Target": sf });

        }




    }

}

HotspotAsset.prototype.AfterEnter = function () {
    this.kh = html.regKeyHandler(this.KeyHandler);
}

HotspotAsset.prototype.Leave = function () {
    if (this.kh != null) {
        html.unregKeyHandler(this.kh);
        this.kh = null;
    }
    if (this.MustSubmit) this.Page.SpreadEvent("StudentResponse", this, null);
}


HotspotAsset.prototype.GetScore = function (cat, fieldtype) {
    if (fieldtype == 1 || fieldtype == 2) {
        var score = 0;
        for (var a in this.Hotspots) {
            var ans = this.Hotspots[a];
            if (ans.selected) {
                for (var s in ans.Data.Score) {
                    var sels = ans.Data.Score[s];
                    if (cat == null || system.GetDataValue(sels, "Category", 0) == cat) {
                        score += system.GetDataValue(sels, "Score", 0);
                    }
                }
            }
        }
        return score;
    }
    else if (fieldtype == 3) {
        var check = system.GetDataValue(this.Data, "Check", 0);
        var ms = 0;
        for (var ans in this.Hotspots) {
            var selans = this.Hotspots[ans];
            for (var s in selans.Data.Score) {
                var sels = selans.Data.Score[s];
                if (cat == null || system.GetDataValue(sels, "Category", 0) == cat) {
                    var nms = system.GetDataValue(sels, "Score", 0);
                    if (check == 1) {
                        ms += nms;
                    }
                    else {
                        if (nms > ms) ms = nms;
                    }
                }
            }
        }
        return ms;
    }
    else if (fieldtype == 4) {
        var score = 0;

        var cor = true;
        for (var ans in this.Hotspots) {
            var selans = this.Hotspots[ans];
            if (system.GetDataValue(selans.Data, "Correct", 0) != (selans.selected ? 1 : 0)) {
                cor = false;
            }
        }
        if (cor) score++;
        return score;
    }
    else if (fieldtype == 5) {
        return 1;
    }
}

HotspotAsset.prototype.UpdateData = function (recurse) {

    this.Page.PositionAsset(this);

    if (this.Data.Title != null) {
        var t = system.GetDataText(this.Data, "Title", '', true);
        html.fillText(this.Title, this.Style.Title, t);
    }

    if (this.Data.SubTitle != null) {
        var t = system.GetDataText(this.Data, "SubTitle", '', true);
        html.fillText(this.SubTitle, this.Style.SubTitle, t);
    }

    var t = "";
    if (this.Data.Question != null) {
        var t = system.GetDataText(this.Data, "Question", '', true);
       
    }
    if (t == "") {
        this.Question.style.display = 'none';
    }
    else {
        this.Question.style.display = '';
        html.fillFormattedText(this.Question, this.Style, t);
    }

    this.CheckButton = system.GetDataValue(this.Data, "CheckButton", 0);
    this.FeedbackCorrect = system.GetDataText(this.Data, "FeedbackCorrect", '', true);
    this.FeedbackWrong = system.GetDataText(this.Data, "FeedbackWrong", '', true);
    this.AllowNext = system.GetDataValue(this.Data, "AllowNext", 1);
    this.ShowCorrect = system.GetDataValue(this.Data, "ShowCorrect", 1);

    this.HSImage.src = system.GetDataFile(this.Data, "Image", "", true);
 
    if (this.Data.Hotspots == null) this.Data.Hotspots = [];



    var match = [];
    this.AnswerContainer.insertBefore(this.HSImage, null);
    var firstMatch = this.HSImage;

    var check = system.GetDataValue(this.Data, "Check", 0);
    if (check == 0) {
        if (this.DummyHotspot == null) {
            this.DummyHotspot = new HotspotAssetHotspot(this, null, true);
        }
        this.AnswerContainer.insertBefore(this.DummyHotspot.element, null);
    }
    else {
        this.DummyHotspot = null;
    }


    for (var di = 0; di < this.Data.Hotspots.length; di++) {
        var pdata = this.Data.Hotspots[di];
        var found = false;
        match[di] = null;
        for (var pbi = 0; pbi < this.Hotspots.length; pbi++) {
            if (this.Hotspots[pbi].Data == pdata) {
                match[di] = this.Hotspots[pbi];
                found = true;
            }
        }
        if (!found) {
            var np = new HotspotAssetHotspot(this, pdata, false);
            this.Hotspots[this.Hotspots.length] = np;
            match[di] = np;
        }
        if (match[di].element != null) {
            this.AnswerContainer.insertBefore(match[di].element, null);
        }
    }
    this.Hotspots = match;

    while (this.AnswerContainer.childNodes.length > 0 && this.AnswerContainer.firstChild != firstMatch) this.AnswerContainer.removeChild(this.AnswerContainer.firstChild);

    if (this.DummyHotspot != null) this.DummyHotspot.UpdateData();
    for (var pl in this.Hotspots) {
        this.Hotspots[pl].UpdateData();
    }

    if (this.Style != null && this.Style.QuestionButtons != null) html.styleElement(this.CheckContainer, this.Style.QuestionButtons.LayerButtonCheck);
    if (this.CheckButton == 1 && this.Style != null && this.Style.QuestionButtons != null) {
        if (this.BtnCheckButton == null) {
            var _this = this;
            this.BtnCheckButton = new ImageButton(this.CheckContainer, function () { _this.FireCheck(false); }, this, false, this.Style.QuestionButtons.ButtonCheckDisabled, this.Style.QuestionButtons.ButtonCheck, this.Style.QuestionButtons.ButtonCheckMouse);
        }
        else {
            this.BtnCheckButton.Change(this.Style.QuestionButtons.ButtonCheckDisabled, this.Style.QuestionButtons.ButtonCheck, this.Style.QuestionButtons.ButtonCheckMouse);
        }

    }
    else {
        if (this.BtnCheckButton != null) {
            this.CheckContainer.removeChild(this.BtnCheckButton.element);
            this.BtnCheckButton = null;
        }
    }
    if (this.FeedbackCorrect != '') {
        if (this.LayerFeedbackCorrect == null) {
            this.LayerFeedbackCorrect = html.createFormattedText(this.FeedbackContainer, null, '');
        }
        html.fillText(this.LayerFeedbackCorrect, this.Style.FeedbackCorrect.Body, this.FeedbackCorrect);
        this.LayerFeedbackCorrect.style.display = 'none';
    }
    else {
        if (this.LayerFeedbackCorrect != null) {
            this.FeedbackContainer.removeChild(this.LayerFeedbackCorrect);
            this.LayerFeedbackCorrect = null;
        }
    }
    if (this.FeedbackWrong != '') {
        if (this.LayerFeedbackWrong == null) {
            this.LayerFeedbackWrong = html.createFormattedText(this.FeedbackContainer, null, '');
        }
        html.fillText(this.LayerFeedbackWrong, this.Style.FeedbackWrong.Body, this.FeedbackWrong);
        this.LayerFeedbackWrong.style.display = 'none';
    }
    else {
        if (this.LayerFeedbackWrong != null) {
            this.FeedbackContainer.removeChild(this.LayerFeedbackWrong);
            this.LayerFeedbackWrong = null;
        }
    }
    if (this.BtnCheckButton != null) {
        if (this.FeedbackContainer.firstChild != this.CheckContainer) this.FeedbackContainer.insertBefore(this.CheckContainer, this.FeedbackContainer.firstChild);
    }

    this.UpdateButtons();


}


HotspotAsset.prototype.AssetEvent = function (Event, Asset, Params) {
    if (Event == "Timer") {
        this.ResultsFixed = true;
        this.FireCheck(false);
    }
    else if (Event == "TimerReset") {
        this.Reset();
    }
    else if (Event == "FixResults") {
        this.ResultsFixed = true;
        this.FireCheck(false);
    }
}

HotspotAsset.prototype.Enter = function () {
    this.MustSubmit = false;
    if (system.GetDataValue(this.Data, "Reset", 0) == 1 && !this.ResultsFixed) {
        this.Reset();
    }
}



HotspotAsset.prototype.Reset = function () {

    this.Randomization = null;
    this.ResultsFixed = false;
    this.ReleaseCheck();

    if (this.DummyHotspot != null) if (this.DummyHotspot.selected) this.DummyHotspot.UpdateSelected(false);
    for (var pl in this.Hotspots) {
        if (this.Hotspots[pl].selected) this.Hotspots[pl].UpdateSelected(false);
    }

    this.UpdateButtons();
}


HotspotAsset.prototype.CanChange = function () {
    if (this.ResultsFixed) return false;
    if (this.ResultsChecked && system.GetDataValue(this.Data, "ChangeAnswer", 0) == 0) return false;
    return true;
}

HotspotAsset.prototype.Resend = function () {
    var sf = system.GetDataReference(this.Data, "SpreadFeedback", 0);
    if (sf != 0) {
        this.SubmitResult();
        return;
    }
}

HotspotAsset.prototype.SelectAnswer = function (Hotspot, Silent) {

    if (!Silent && !this.CanChange()) return;
    if (!Silent) this.ReleaseCheck();
    var check = system.GetDataValue(this.Data, "Check", 0);

    var same = false;
    if (check == 0) {
        if (this.DummyHotspot != null) {
            if (this.DummyHotspot == Hotspot && this.LastSubmittedClickType == Hotspot.LastClickType && Hotspot.selected) {
                this.Resend();
                return;
            }
            if (this.DummyHotspot.selected) this.DummyHotspot.UpdateSelected(false);
        }
        for (var pl in this.Hotspots) {
            if (this.Hotspots[pl] == Hotspot && this.LastSubmittedClickType == Hotspot.LastClickType && Hotspot.selected) {
                this.Resend();
                return;
            }
            if (this.Hotspots[pl].selected) this.Hotspots[pl].UpdateSelected(false);
        }
    }

    if (Hotspot != null) {
        Hotspot.UpdateSelected(Hotspot.selected ? false : true);
    }

    this.UpdateButtons();
    this.MustSubmit = true;

    if (Hotspot != null && !Silent)
    {
        this.LastSubmittedClickType = Hotspot.LastClickType;
        if (check == 0 && this.CheckButton == 0) this.SubmitResult();
    }
}

HotspotAsset.prototype.CanNext = function () {

    if (this.AllowNext == 0) return true;
    if (this.CheckButton == 1 && !this.ResultsChecked) return false;
    if (this.AllowNext == 1) {
        if (this.ResultsChecked) return true;
        return this.Answered();
    }
    if (this.AllowNext == 2) {
        return this.GetScore(null, 4) == this.GetScore(null, 5);
    }

}

HotspotAsset.prototype.Answered = function () {
    var isSelected = false;
    if (this.DummyHotspot != null) if (this.DummyHotspot.selected) isSelected = true;
    for (var pl in this.Hotspots) {
        if (this.Hotspots[pl].selected) isSelected = true;
    }
    return isSelected;
}

HotspotAsset.prototype.FireCheck = function (Silent) {
    this.ResultsChecked = true;
    if (this.DummyHotspot != null) this.DummyHotspot.FireCheck();
    for (var pl in this.Hotspots) {
        this.Hotspots[pl].FireCheck();
    }
    if (!Silent) this.SubmitResult();
    this.UpdateButtons();
}
HotspotAsset.prototype.ReleaseCheck = function () {
    this.ResultsChecked = false;
    if (this.DummyHotspot != null) this.DummyHotspot.ReleaseCheck();
    for (var pl in this.Hotspots) {
        this.Hotspots[pl].ReleaseCheck();
    }
    this.UpdateButtons();
}

HotspotAsset.prototype.UpdateButtons = function () {
    this.Page.UpdateNavigation();
    if (this.Page.Player.UpdateButtons) this.Page.Player.UpdateButtons();

    if (this.CheckButton == 1) {
        var isSelected = false;
        if (this.DummyHotspot != null) if (this.DummyHotspot.selected) isSelected = true;
        for (var pl in this.Hotspots) {
            if (this.Hotspots[pl].selected) isSelected = true;
        }
        this.BtnCheckButton.SetEnabled(isSelected);
    }

    var fbText = '';
    var fbFrame = [];

    var cc = this.CanChange();
    if (this.DummyHotspot != null) this.DummyHotspot.CanChange(cc);
    for (var pl in this.Hotspots) {
        if (this.Hotspots[pl].CanChange(cc));

        if (this.Hotspots[pl].selected != (system.GetDataValue(this.Hotspots[pl].Data, "Correct", 0) == 1)) {
            if (fbText == '' && this.Hotspots[pl].Feedback != '') {
                fbText = this.Hotspots[pl].Feedback;
            }
            if (this.Hotspots[pl].FeedbackFrame != 0) {
                fbFrame[fbFrame.length] = this.Hotspots[pl].FeedbackFrame;
            }
        }

    }

    if (fbText == '') fbText = this.FeedbackWrong;
    if (fbFrame.length == 0) fbFrame[fbFrame.length] = system.GetDataReference(this.Data, "FrameWrong", 0);

    var correct = this.GetScore(null, 4) == this.GetScore(null, 5);
    if (this.LayerFeedbackCorrect != null) {
        this.LayerFeedbackCorrect.style.display = (this.ResultsChecked && correct) ? '' : 'none';
    }
    if (this.LayerFeedbackWrong != null) {
        html.fillFormattedText(this.LayerFeedbackWrong, this.Style.FeedbackWrong, fbText);
        this.LayerFeedbackWrong.style.display = (this.ResultsChecked && !correct) ? '' : 'none';
    }

    if (this.ResultsChecked) {
        if (correct) this.Page.SpreadEvent("LoadFrame", this, { "Page": system.GetDataReference(this.Data, "FrameCorrect", 0) });
        else {
            var loadedFrames = [];
            for (var fbf in fbFrame) {
                var pack = { "Page": fbFrame[fbf], "LoadedFrames" : loadedFrames };
                this.Page.SpreadEvent("LoadFrame", this, pack);
            }
        }
    }
    else {
        this.Page.SpreadEvent("LoadFrame", this, { "Page": 0 });
    }

}

HotspotAsset.prototype.SubmitResult = function () {
    this.MustSubmit = false;
    this.Page.SpreadEvent("StudentResponse", this, null);
    this.Page.SpreadEvent("MCChoice", this, null);
    var sf = system.GetDataReference(this.Data, "SpreadFeedback", 0);
    if (sf != 0){
        var lr = (system.GetDataValue(this.Data, "LeftRight", 0) == 1);

        var correct = true;
        var feedback = this.FeedbackWrong;
        if (this.DummyHotspot != null) if (this.DummyHotspot.selected) {
            correct = false;

        }
        for (var pl in this.Hotspots) {
            var hs = this.Hotspots[pl];
            if (hs.selected) {
                if (!lr) {
                    hs.LastClickType = 0;
                }

                if (hs.LastClickType == 0) {
                    if (system.GetDataValue(hs.Data, "Correct", 0) == 1) {

                    }
                    else {
                        correct = false;
                        var fb = system.GetDataText(hs.Data, "Feedback", '', true);
                        if (fb != '') feedback = fb;
                    }
                }
                if (hs.LastClickType == 1) {
                    if (system.GetDataValue(hs.Data, "CorrectRight", 0) == 1) {

                    }
                    else {
                        correct = false;
                        var fb = system.GetDataText(hs.Data, "FeedbackRight", '', true);
                        if (fb != '') feedback = fb;
                    }
                }
                if (hs.LastClickType == 2) {
                    if (system.GetDataValue(hs.Data, "CorrectDouble", 0) == 1) {

                    }
                    else {
                        correct = false;
                        var fb = system.GetDataText(hs.Data, "FeedbackDouble", '', true);
                        if (fb != '') feedback = fb;
                    }
                }

            }
        }
        if (correct) {
            feedback = this.FeedbackCorrect;
            var f = system.GetDataReference(this.Data, "FrameCorrect", 0);
            if (f != 0) {
                this.Page.Player.Block.SpreadEvent("LoadPage", this, { "Page": f, "Found": false, "ActivatePage": null });
            }
        }
        this.Page.Player.Block.SpreadEvent("SpreadFeedback", this, { "Feedback": feedback, "Target": sf });

    }

    if (system.GetDataValue(this.Data, "NextPage", 0) == 1 && !html.editing) {
        this.Page.Player.Forward();
    }
}


HotspotAsset.prototype.GetResultsChecked = function () {
    return this.ResultsChecked;
}



/* HOTSPOT */

function HotspotAssetHotspot(HotspotAsset, Data, IsDummy) {
    var _this = this;
    this.HotspotAsset = HotspotAsset;
    this.Data = Data;
    this.IsDummy = IsDummy;



    this.element = html.createLayer(HotspotAsset.AnswerContainer, null);
    this.icon = html.createElement(this.element, "IMG");
    this.icon.style.position = 'absolute';

    this.icon.onload = function () {
        _this.PositionIcon();
    }
   
    this.PositionIcon = function () {
        var w = (this.icon.naturalWidth != null) ? this.icon.naturalWidth : this.icon.offsetWidth;
        var h = (this.icon.naturalHeight != null) ? this.icon.naturalHeight : this.icon.offsetHeight;
        if (w == 0 && h == 0) {
            var _this = this;
            this.icon.style.visibility = 'hidden';
            setTimeout((function (args) { return function () { args.PositionIcon(); } })(_this), 100);
            
        }
        else{
            this.icon.style.left = Math.floor(this.iconPosition[0] - w / 2) + 'px';
            this.icon.style.top = Math.floor(this.iconPosition[1] - h / 2) + 'px';
            this.icon.style.visibility = 'visible';
        }
    }
    this.iconPosition = [0, 0];

    if (!IsDummy) {
        html.addEditElement(this.element, this);
        this.EditParent = HotspotAsset;
        this.EditIsActive = function (Activate) {
            return this.EditParent.EditIsActive(Activate);
        }
        this.FindPage = function () {
            return this.EditParent.FindPage();
        }
        this.EditTryInsert = function (Type, EmptyObject, Offset, Editor) {
            return this.EditInsert(Type, EmptyObject, Offset, Editor);
        }
        this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
            return false;
        }
    }

    this.showanswers = false;
    this.selected = false;
    this.UpdateSelected = function (Selected) {
        this.selected = Selected;
        this.updateSrc();
    }
    this.mouseIn = false;
    this.mouseDown = false;

    this.updateSrc = function () {
        var vis = false;
        if (_this.showanswers && _this.HotspotAsset.ShowCorrect == 1) {
            if (!_this.selected) {
                _this.iconPosition = [ExtractNumber(_this.element.style.width) / 2, ExtractNumber(_this.element.style.height) / 2];
            }
            if (system.GetDataValue(this.Data, "Correct", 0) == 0) {
                if (_this.selected) {
                    vis = true;
                    _this.icon.src = system.GetDataFile(this.HotspotAsset.Style.QuestionButtons, "HotspotClickWrong", null, false);
                }
            }
            else {
                if (!this.selected) {
                    vis = true;
                    _this.icon.src = system.GetDataFile(this.HotspotAsset.Style.QuestionButtons, "HotspotCorrect", null, false);
                    
                }
                else {
                    vis = true;
                    _this.icon.src = system.GetDataFile(this.HotspotAsset.Style.QuestionButtons, "HotspotClickCorrect", null, false);
                }
            }
        }
        else {
            if (_this.selected) {
                vis = true;
                _this.icon.src = system.GetDataFile(this.HotspotAsset.Style.QuestionButtons, "HotspotClick", null, false);
            }
        }
        _this.icon.style.display = vis ? '' : 'none';

        
    }



    this.awaitdoubleclick = 0;
    this.LastClickType = 0;
    this.doClick = function (evt) {

        var clickType = 'LEFT';
        if (evt.which) {
            if (evt.which == 3) clickType = 'RIGHT';
            //if (evt.which == 2) clickType = 'MIDDLE';
        }
        else if (evt.button) {
            if (evt.button == 2) clickType = 'RIGHT';
            //if (evt.button == 4) clickType = 'MIDDLE';
        }

        if (clickType == 'RIGHT') {
            this.LastClickType = 1;
            this.awaitdoubleclick = 0;
            this.HotspotAsset.SelectAnswer(this, false);

        }
        else {
            if (this.awaitdoubleclick == 0) {
                setTimeout(this.doReset, 333);
                this.awaitdoubleclick = 1;
            }
            else {
                this.LastClickType = 2;
                this.awaitdoubleclick = 0;
                this.HotspotAsset.SelectAnswer(this, false);

            }
        }
    }
    this.doReset = function () {
        if (_this.awaitdoubleclick == 1) {
            _this.LastClickType = 0;
            _this.HotspotAsset.SelectAnswer(_this, false);

        }
        _this.awaitdoubleclick = 0;
    }


    if (supportsTouch) {
        _this.element.ontouchstart = function (e) {
            e.preventDefault();
            if (e.touches.length == 1) {
                if (!_this.HotspotAsset.Page.Player.Block.menuUp) {
                    if (e.stopPropagation) e.stopPropagation();

                    

                    if (_this.cc) {
                        var pos = findPos(_this.element);
                        _this.iconPosition = [e.touches[0].clientX - pos[0], e.touches[0].clientY - pos[1]];
                        _this.PositionIcon();

                        _this.doClick(e);
                    }
                }
            }
        };
    }
    //else {

        _this.element.onmouseover = function () {
        };
        _this.element.onmouseout = function () {
        };
        _this.element.onmousedown = function (e) {
            if (e == null)
                e = window.event;

            if (!_this.HotspotAsset.Page.Player.Block.menuUp && !html.editing) {
                if (e.stopPropagation) e.stopPropagation();
                _this.mouseDown = true;

                if (_this.cc) {
                    
                    var ox = 0;
                    var oy = 0;
                    if (e.offsetX) {
                        ox = e.offsetX;
                        oy = e.offsetY;
                        var target = e.target != null ? e.target : e.srcElement;
                        if (target.offsetParent == _this.element) {
                            ox += target.offsetLeft;
                            oy += target.offsetTop;
                        }
                    }
                    else {
                        var pos = findPos(_this.element);
                        ox = e.clientX - pos[0] ;
                        oy = e.clientY - pos[1];
                    }
                    if (ox> 0 && oy > 0 && ox < _this.element.offsetWidth && oy < _this.element.offsetHeight) {
                        _this.iconPosition = [ox,oy];

                        _this.PositionIcon();

                        _this.doClick(e);
                        return true;
                    }
                }
                return false;
            }

        };
        _this.element.onmouseup = function () {
            _this.mouseDown = false;
        };
    //}
    if (!IsDummy) {
        this.CalculateSuspendData = function (data) {
            var sd = '';
            sd += (_this.selected ? '1' : '0');
            if (this.iconPosition != null) sd += ',' + this.iconPosition[0].toString() + ',' + this.iconPosition[1].toString();
            if (_this.Data.L != null) data[_this.Data.L.toString()] = sd;
        }
        this.ConsumeSuspendData = function (data) {
            var sd = data[_this.Data.L.toString()];
            if (sd != null) {
                var sds = sd.split(',');
                if (sds.length >= 3) {
                    _this.iconPosition = [ExtractNumber(sds[1]), ExtractNumber(sds[2])];
                }
                if (sds.length >= 1 && sds[0] == '1') {
                    _this.HotspotAsset.SelectAnswer(_this, true);
                }

            }
        }


        this.Delete = function () {
            var i = arrayIndexOf(this.HotspotAsset.Data.Hotspots, this.Data);
            if (i > -1) {
                this.HotspotAsset.Data.Hotspots.splice(i, 1);
                this.HotspotAsset.UpdateData();
                return true;
            }
        }
        this.Front = function () {
            var i = arrayIndexOf(this.HotspotAsset.Data.Hotspots, this.Data);
            if (i > -1) {
                this.HotspotAsset.Data.Hotspots.splice(i, 1);
                this.HotspotAsset.Data.Hotspots[this.HotspotAsset.Data.Hotspots.length] = this.Data;
                this.HotspotAsset.UpdateData();
                return true;
            }
        }


        this.MoveDelta = function (x, y) {
            var newLeft = x + _this.start[0];
            var newTop = y + _this.start[1];
            var newWidth = _this.start[2];
            var newHeight = _this.start[3];


            if (newLeft < 0) newLeft = 0;
            if (newTop < 0) newTop = 0;

            var a = _this.Data;
            if (system.GetDataValue(a, "Left", 0) != newLeft ||
                system.GetDataValue(a, "Top", 0) != newTop ||
                system.GetDataValue(a, "Width", 0) != newWidth ||
                system.GetDataValue(a, "Height", 0) != newHeight) {

                system.saveValueData(a, "Left", newLeft, null);
                system.saveValueData(a, "Top", newTop, null);
                system.saveValueData(a, "Width", newWidth, null);
                system.saveValueData(a, "Height", newHeight, null);

                _this.UpdateData();
                return true;
            }
            else return false;
        }

        this.SizeDelta = function (x, y) {
            var newLeft = _this.start[0];
            var newTop = _this.start[1];
            var newWidth = x + _this.start[2];
            var newHeight = y + _this.start[3];

            if (newWidth < 1) newWidth = 1;
            if (newHeight < 1) newHeight = 1;

            var a = _this.Data;
            if (system.GetDataValue(a, "Left", 0) != newLeft ||
                system.GetDataValue(a, "Top", 0) != newTop ||
                system.GetDataValue(a, "Width", 0) != newWidth ||
                system.GetDataValue(a, "Height", 0) != newHeight) {

                system.saveValueData(a, "Left", newLeft, null);
                system.saveValueData(a, "Top", newTop, null);
                system.saveValueData(a, "Width", newWidth, null);
                system.saveValueData(a, "Height", newHeight, null);

                _this.UpdateData();
                return true;
            }
            else return false;
        }

        this.ResetDelta = function (x, y) {
            _this.start = [
            system.GetDataValue(_this.Data, "Left", 0),
            system.GetDataValue(_this.Data, "Top", 0),
            system.GetDataValue(_this.Data, "Width", 50),
            system.GetDataValue(_this.Data, "Height", 50)

            ];
        }
    }

}

HotspotAssetHotspot.prototype.ToggleEdit = function (editing) {
    this.element.style.border = editing?'2px solid green':'';
}

HotspotAssetHotspot.prototype.FireCheck = function () {
    this.showanswers = true;
    this.updateSrc();
}
HotspotAssetHotspot.prototype.ReleaseCheck = function () {
    this.showanswers = false;
    this.updateSrc();
}

HotspotAssetHotspot.prototype.UpdateData = function () {

    if (this.IsDummy) {
        this.element.style.left = 0 + 'px';
        this.element.style.top = 0 + 'px';
        this.element.style.right = 0 + 'px';
        this.element.style.bottom = 0 + 'px';
        this.element.style.position = 'absolute';
    }
    else {
        var x = system.GetDataValue(this.Data, "Left", 0);
        var y = system.GetDataValue(this.Data, "Top", 0);
        var w = system.GetDataValue(this.Data, "Width", 50);
        var h = system.GetDataValue(this.Data, "Height", 50);

        this.element.style.left = x + 'px';
        this.element.style.top = y + 'px';
        this.element.style.width = w + 'px';
        this.element.style.height = h + 'px';
        this.element.style.position = 'absolute';
    }



    this.ToggleEdit(html.editing);

    this.Feedback = system.GetDataText(this.Data, "Feedback", '', true);
    this.FeedbackFrame = system.GetDataReference(this.Data, "FeedbackFrame", 0);

    this.updateSrc();
}

HotspotAssetHotspot.prototype.CanChange = function (Allowed) {
    this.cc = Allowed;
}

//
//slm_imageasset
//

//image asset

function ImageAsset(Page, Data) {
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);
    this.ResultsFixed = false;



    this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
        if (Type == 398) {

            this.Page.Player.Block.EditInsert(Type, EmptyObject, Offset, Editor);
            system.saveReferenceData(this.Data, "LightBox", EmptyObject.L, null);
            this.UpdateData();

            Editor.GenericDataEditComponent.WYSIWYGUpdate(this, false, true);

            return true;
        }
        return false;
    }

    this.editTranslate = function (x, y) {
        system.saveValueData(this.Data, "OffsetLeft", this.origx + x, null);
        system.saveValueData(this.Data, "OffsetTop", this.origy + y, null);
        this.UpdateData();
        return true;
    }
    this.editScale = function (s) {
        system.saveValueData(this.Data, "Scale", this.origs + s, null);
        this.UpdateData();
        return true;
    }
    this.editRotate = function (a) {
        system.saveValueData(this.Data, "Angle", this.origa + a, null);
        this.UpdateData();
        return true;
    }

    this.Crop = function (Done, FileType) {
        var params = [
            this.padder.offsetWidth,
            this.padder.offsetHeight,
            system.GetDataValue(this.Data, "OffsetLeft", 0),
            system.GetDataValue(this.Data, "OffsetTop", 0),
            system.GetDataValue(this.Data, "Scale", 100),
            system.GetDataValue(this.Data, "Angle", 0)
        ];
       
        var _this = this;
        var rid = system.GetDataFileID(this.Data, "Source", null, true);
        if (rid != null) {
            system.cropResource(rid, params, function (newid) {
                system.saveValueData(_this.Data, "OffsetLeft", 0, null);
                system.saveValueData(_this.Data, "OffsetTop", 0, null);
                system.saveValueData(_this.Data, "Scale", 100, null);
                system.saveValueData(_this.Data, "Angle", 0, null);
                system.saveResourceData(
                _this.Data,
                "Source",
                newid,
                null,
                lang
                );
                _this.UpdateData();
                if (Done != null) Done();
            }, FileType);
        };
        var hrid = system.GetDataFileID(this.Data, "HoverSource", null, true);
        if (hrid != null) {
            system.cropResource(hrid, params, function (newid) {
                system.saveValueData(_this.Data, "OffsetLeft", 0, null);
                system.saveValueData(_this.Data, "OffsetTop", 0, null);
                system.saveValueData(_this.Data, "Scale", 100, null);
                system.saveValueData(_this.Data, "Angle", 0, null);
                system.saveResourceData(
                _this.Data,
                "HoverSource",
                newid,
                null,
                lang
                );
                _this.UpdateData();
                if (Done != null) Done();
            }, FileType);
        };
        var srid = system.GetDataFileID(this.Data, "SeenSource", null, true);
        if (srid != null) {
            system.cropResource(srid, params, function (newid) {
                system.saveValueData(_this.Data, "OffsetLeft", 0, null);
                system.saveValueData(_this.Data, "OffsetTop", 0, null);
                system.saveValueData(_this.Data, "Scale", 100, null);
                system.saveValueData(_this.Data, "Angle", 0, null);
                system.saveResourceData(
                _this.Data,
                "SeenSource",
                newid,
                null,
                lang
                );
                _this.UpdateData();
                if (Done != null) Done();
            }, FileType);
        };
        var arid = system.GetDataFileID(this.Data, "ActiveSource", null, true);
        if (arid != null) {
            system.cropResource(arid, params, function (newid) {
                system.saveValueData(_this.Data, "OffsetLeft", 0, null);
                system.saveValueData(_this.Data, "OffsetTop", 0, null);
                system.saveValueData(_this.Data, "Scale", 100, null);
                system.saveValueData(_this.Data, "Angle", 0, null);
                system.saveResourceData(
                _this.Data,
                "ActiveSource",
                newid,
                null,
                lang
                );
                _this.UpdateData();
                if (Done != null) Done();
            }, FileType);
        };
        var ahrid = system.GetDataFileID(this.Data, "ActiveHoverSource", null, true);
        if (ahrid != null) {
            system.cropResource(ahrid, params, function (newid) {
                system.saveValueData(_this.Data, "OffsetLeft", 0, null);
                system.saveValueData(_this.Data, "OffsetTop", 0, null);
                system.saveValueData(_this.Data, "Scale", 100, null);
                system.saveValueData(_this.Data, "Angle", 0, null);
                system.saveResourceData(
                _this.Data,
                "ActiveHoverSource",
                newid,
                null,
                lang
                );
                _this.UpdateData();
                if (Done != null) Done();
            }, FileType);
        };
    }

    this.ResetDelta = function () {
        this.start = [
            system.GetDataValue(this.Data, "Left", 0),
            system.GetDataValue(this.Data, "Top", 0),
            system.GetDataValue(this.Data, "Width", 1),
            system.GetDataValue(this.Data, "Height", 1)
        ];

        this.origx = system.GetDataValue(this.Data, "OffsetLeft", 0);
        this.origy = system.GetDataValue(this.Data, "OffsetTop", 0);
        this.origs = system.GetDataValue(this.Data, "Scale", 100);
        this.origa = system.GetDataValue(this.Data, "Angle", 0);
    }

    this.padder = html.createElement(this.Surface, "DIV");
    this.padder.style.width = '100%';
    this.padder.style.height = '100%';
    this.padder.style.position = 'relative';
    this.padder.style.overflow = 'hidden';


    this.scaler = html.createElement(this.padder, "DIV");
    this.scaler.style.position = 'absolute';

    var img = html.prepareInterfaceImage(this.scaler, null);
    img.style.position = 'absolute';
    img.style.left = '0px';
    img.style.top = '0px';
    this.image = img;

    this.On = false;
    this.Active = false;

    this.UpdateData();

    var _this = this;

    this.CalculateSuspendData = function (data) {
        var sd = '';
        sd += (this.On ? '1' : '0') + '|' + (this.ResultsFixed ? '1' : '0');

        if (_this.Data.L != null) data[_this.Data.L.toString()] = sd;
    }
    this.ConsumeSuspendData = function (data) {
        var sd = data[_this.Data.L.toString()];
        if (sd != null) {
            if (sd == '') {

            }
            else {
                var options = sd.split('|');
                this.On = (options[0].toString() == '1');
                if (options.length > 1) this.ResultsFixed = (options[1].toString() == '1');
                this.Toggle(this.On);
            }
        }
    }
}


ImageAsset.prototype.Reset = function () {

    this.On = false;
    this.ResultsFixed = false;
    this.Toggle(this.On);
}


ImageAsset.prototype.CanNext = function () {

    if (this.ConditionalShow != null && this.ConditionalShow == false) return true;

    if (this.AllowNext == 0) return true;
    if (this.AllowNext == 1) {
        return this.On;
    }
    if (this.AllowNext == 2){
        return this.Page.GetScore(null, 2) > 0;
    }
    if (this.AllowNext == 3) {
        return this.Page.GetScore(null, 2) == this.Page.GetScore(null, 3);
    }

    return false;
}





ImageAsset.prototype.UpdateData = function () {
    this.Page.PositionAsset(this);


    this.AllowNext = system.GetDataValue(this.Data, "AllowNext", 0);


    var v = system.GetDataValue(this.Data, "SourceSkin", null);
    var ssrc = null;
    if (v != null) {
        var ssrc = system.GetDataFile(this.Page.Player.Block.GetSkinImage(v), "Value", null, false);
    }
    if (ssrc != null){
        this.image.src = ssrc;
    }
    else {
        this.image.src = system.GetDataFile(this.Data, "Source", "", true);
    }


    v = system.GetDataValue(this.Data, "HoverSourceSkin", null);
    var hover = null;
    if (v != null) {
        hover = system.GetDataFile(this.Page.Player.Block.GetSkinImage(v), "Value", null, false);
    }
    if (hover == null) hover = system.GetDataFile(this.Data, "HoverSource", "", true);

    if (hover == "") {
        if (this.hoverimage != null) {
            this.scaler.removeChild(this.hoverimage);
            this.hoverimage = null;
        }
    }
    else {
        if (this.hoverimage == null) {
            this.hoverimage = html.prepareInterfaceImage(this.scaler, null);
            this.hoverimage.style.position = 'absolute';
            this.hoverimage.style.left = '0px';
            this.hoverimage.style.top = '0px';
        }
        this.hoverimage.style.display = 'none';
        this.hoverimage.src = hover;
    }

    v = system.GetDataValue(this.Data, "SeenSourceSkin", null);
    var seen = null;
    if (v != null) {
        seen = system.GetDataFile(this.Page.Player.Block.GetSkinImage(v), "Value", null, false);
    }
    if (seen == null) seen = system.GetDataFile(this.Data, "SeenSource", "", true);


    if (seen == "") {
        if (this.seenimage != null) {
            this.scaler.removeChild(this.seenimage);
            this.seenimage = null;
        }
    }
    else {
        if (this.seenimage == null) {
            this.seenimage = html.prepareInterfaceImage(this.scaler, null);
            this.seenimage.style.position = 'absolute';
            this.seenimage.style.left = '0px';
            this.seenimage.style.top = '0px';
        }
        this.seenimage.style.display = 'none';
        this.seenimage.src = seen;
    }

    v = system.GetDataValue(this.Data, "ActiveSourceSkin", null);
    var active = null;
    if (v != null) {
        active = system.GetDataFile(this.Page.Player.Block.GetSkinImage(v), "Value", null, false);
    }
    if (active == null) active = system.GetDataFile(this.Data, "ActiveSource", "", true);

    if (active == "") {
        if (this.activeimage != null) {
            this.scaler.removeChild(this.activeimage);
            this.activeimage = null;
        }
    }
    else {
        if (this.activeimage == null) {
            this.activeimage = html.prepareInterfaceImage(this.scaler, null);
            this.activeimage.style.position = 'absolute';
            this.activeimage.style.left = '0px';
            this.activeimage.style.top = '0px';
        }
        this.activeimage.style.display = 'none';
        this.activeimage.src = active;
    }

    v = system.GetDataValue(this.Data, "ActiveHoverSourceSkin", null);
    var activehover = null;
    if (v != null) {
        activehover = system.GetDataFile(this.Page.Player.Block.GetSkinImage(v), "Value", null, false);
    }
    if (activehover == null) activehover = system.GetDataFile(this.Data, "ActiveHoverSource", "", true);

    if (activehover == "") {
        if (this.activehoverimage != null) {
            this.scaler.removeChild(this.activehoverimage);
            this.activehoverimage = null;
        }
    }
    else {
        if (this.activehoverimage == null) {
            this.activehoverimage = html.prepareInterfaceImage(this.scaler, null);
            this.activehoverimage.style.position = 'absolute';
            this.activehoverimage.style.left = '0px';
            this.activehoverimage.style.top = '0px';
        }
        this.activehoverimage.style.display = 'none';
        this.activehoverimage.src = activehover;
    }

    var t = system.GetDataText(this.Data, "Title", '', true);

    if (t == '') {
        if (this.Title != null) {
            this.padder.removeChild(this.Title);
            this.Title = null;
        }
    }
    else {
        if (this.Title == null) {
            this.Title = html.createText(this.padder, null, '');
        }
        else {
            this.padder.insertBefore(this.Title, null);
        }
        html.fillText(this.Title, (this.Style == null) ? null : this.Style.Title, t);
        this.Title.style.cursor = 'inherit';
    }



    var x = system.GetDataValue(this.Data, "OffsetLeft", 0);
    var y = system.GetDataValue(this.Data, "OffsetTop", 0);
    var s = system.GetDataValue(this.Data, "Scale", 100) / 100;
    var a = system.GetDataValue(this.Data, "Angle", 0);


    this.scaler.style.left = x + 'px';
    this.scaler.style.top = y + 'px';


    html.applyElementTransformOrigin(this.image, 'center center');
    html.applyElementTransform(this.image, 'rotate(' + a + 'deg)');

    if (this.hoverimage != null) {
        html.applyElementTransformOrigin(this.hoverimage, 'center center');
        html.applyElementTransform(this.hoverimage, 'rotate(' + a + 'deg)');
    }

    if (this.activeimage != null) {
        html.applyElementTransformOrigin(this.activeimage, 'center center');
        html.applyElementTransform(this.activeimage, 'rotate(' + a + 'deg)');
    }

    if (this.activehoverimage != null) {
        html.applyElementTransformOrigin(this.activehoverimage, 'center center');
        html.applyElementTransform(this.activehoverimage, 'rotate(' + a + 'deg)');
    }

    html.applyElementTransformOrigin(this.scaler, 'top left');
    html.applyElementTransform(this.scaler, 'scale(' + s + ',' + s + ')');

    var lbid = system.GetDataReference(this.Data, "LightBox", 0);
    var juid = system.GetDataReference(this.Data, "Jump", 0);
    var fh = system.GetDataReference(this.Data, "FrameHover", 0);
    var ss = 0;
    if (this.Data.Score != null) ss = this.Data.Score.length;
    if (lbid != 0 || juid != 0 || this.hoverimage != null || fh != 0 || ss>0) {
        var _this = this;
        this.mouseIn = false;
        this.mouseDown = false;

        this.padder.style.cursor = 'pointer';



        if (supportsTouch) {
            this.padder.ontouchstart = function (e) {
                e.preventDefault();
                if (html.editing) return false;
                if (e.touches.length == 1) {
                    if (!_this.Page.Player.Block.menuUp && !html.editing) {
                        if (e.stopPropagation) e.stopPropagation();
                        _this.Clicked(false);
                    }
                }
            };
        }
        //else {
            this.padder.onmouseover = function () {
                if (!_this.Page.Player.Block.menuUp) {
                    _this.mouseIn = true;
                    if (_this.hoverimage != null && !_this.On) {
                        _this.hoverimage.style.display = '';
                    }
                    if (_this.activehoverimage != null && _this.On) {
                        _this.activehoverimage.style.display = '';
                    }


                    if (fh != 0) {
                        _this.Page.SpreadEvent("LoadFrame", _this, { "Page": fh });
                    }


                }
            };
            this.padder.onmouseout = function () {
                _this.mouseIn = false;
                if (_this.hoverimage != null) _this.hoverimage.style.display = 'none';
                if (_this.activehoverimage != null) _this.activehoverimage.style.display = 'none';

                if (system.GetDataReference(_this.Data, "FrameHover", 0) != 0) {
                    _this.Page.SpreadEvent("LoadFrame", _this, { "Page":0 , "Unload": fh });
                }

            };
            this.padder.onmousedown = function (e) {
                if (e == null)
                    e = window.event;

                if (!_this.Page.Player.Block.menuUp && !html.editing) {
                    if (e.stopPropagation) e.stopPropagation();
                    _this.mouseDown = true;

                    return false;
                }

            };
            this.padder.onmouseup = function () {
                _this.mouseDown = false;
                if (_this.mouseIn && !html.editing) _this.Clicked(false);
            };
        //}

        var style = null;
        var lid = lbid;
        var lb = null;
        if (lbid != 0) {
            if (system.GetDataValue(this.Style, "ShowLightBoxButtons", 1) == 1) {
                for (var p in this.Page.Player.Block.Data.LightBoxes) {
                    var lightbox = this.Page.Player.Block.Data.LightBoxes[p];
                    if (lightbox.L == lid) {
                        style = this.Page.Player.Block.GetLightBoxStyle(system.GetDataValue(lightbox, "LightBoxType", 0)).OpenLightBoxButtonStyle
                        lb = lightbox;
                    }
                }
            }
        }
        else if (juid != 0) {
            if (system.GetDataValue(this.Style, "ShowLinkButtons", 0) == 1) {
                lb = juid;
                style = this.Style.LinkButtonStyle;
            }
        }
        if (lb != null)
        {
            if (this.LBButton == null) {
                this.LBButton = new Button(this.Surface, style, function () {
                    _this.Clicked(true);
                }, this.Page.Player.Block, true);
                //if (lbid != 0 && lb != null) lb.OpenButtons[this.Data.L] = this.LBButton;
            }
            else {
                this.LBButton.ChangeStyle(style);
            }
        }
        else {
            if (this.LBButton != null) {
                this.Surface.removeChild(this.LBButton.element);

            }
            this.LBButton = null;
        }


        this.Clicked = function (LB) {
            var t = system.GetDataValue(this.Data, "Type", 1);
            if (this.ResultsFixed) return;
            if (t == 2 && this.On) return;
            var lbid = system.GetDataReference(this.Data, "LightBox", 0);
            var juid = system.GetDataReference(this.Data, "Jump", 0);
            if (lbid != 0) {
                var lid = lbid;
                for (var p in this.Page.Player.Block.LightBoxes) {
                    var lightbox = this.Page.Player.Block.LightBoxes[p];
                    if (lightbox.Data.L == lid) {
                        this.Page.Player.Block.ShowLightBox(lightbox);
                        if (t == 0 || t == 2) this.Toggle(true);
                        if (t == 3) this.Toggle(!this.On);
                    }
                }
            }
            else {
                if (t == 0 || t == 2 || t == 1) this.Toggle(true);
                if (t == 3) this.Toggle(!this.On);
                this.Page.Player.Block.SpreadEvent("LoadPage", this, { "Page": juid, "Found": false, "ActivatePage" : null });
               
            }
            
            if (ss > 0 || system.GetDataValue(this.Data, "HasResult", 0) > 0) {
                this.Page.SpreadEvent("MCChoice", this, { "Check": 1});
                this.Page.UpdateResultConditions();
            }
        }

    }
    else {
        this.Clicked = null;
        if (this.LBButton != null) {
            this.Surface.removeChild(this.LBButton.element);
        }
        this.LBButton = null;
        this.padder.onmousedown = null;
        this.padder.onmouseup = null;
        this.padder.onmouseover = null;
        this.padder.onmouseout = null;
        this.padder.ontouchstart = null;
        this.padder.style.cursor = 'default';
    }

    if (ss > 0 || system.GetDataValue(this.Data, "HasResult", 0)>0) {

        this.GetScore = function (cat, fieldtype) {
            if (fieldtype == 1 || fieldtype == 2) {
                var score = 0;
                if (this.On) {
                    for (var s in this.Data.Score) {
                        var sels = this.Data.Score[s];
                        var c = system.GetDataValue(sels, "Category", 0)
                        if (cat == null || c == cat) {
                            score += system.GetDataValue(sels, "Score", 0);
                        }
                    }
                }
                return score;
            }
            else if (fieldtype == 3) {
                var ms = 0;

                for (var s in this.Data.Score) {
                    var sels = this.Data.Score[s];
                    if (cat == null || system.GetDataValue(sels, "Category", 0) == cat) {
                        var nms = system.GetDataValue(sels, "Score", 0)
                        if (nms > ms) ms = nms;
                    }
                }
                return ms;
            }
            else if (fieldtype == 4) {
                var rt = system.GetDataValue(this.Data, "HasResult", 0);
                if ((rt == 1 && this.On) || (rt == 2 && !this.On) || rt == 0) return 1;
                return 0;
            }
            else if (fieldtype == 5) {
                var rt = system.GetDataValue(this.Data, "HasResult", 0);
                if (rt > 0) return 1;
                return 0;
            }
            else if (fieldtype == 9) {
                var score = 0;
                if (this.On) score++;
                return score;
            }
        }
    }
    else {
        this.GetScore = null;
    }

    this.UpdateState();

}

ImageAsset.prototype.IsDone = function () {
    var t = system.GetDataValue(this.Data, "Type", 1);
    if (t == 0 || t == 2 || t == 3) {
        //check
        return this.On;
    }
    return true;
}

ImageAsset.prototype.Toggle = function (On) {
    var t = system.GetDataValue(this.Data, "Type", 1);
    if (t == 0 || t==2) {
        //check
        if (!this.On) {
            this.On = On;
            this.Page.SpreadEvent("Toggle");
           
        }
        
    }
    else if (t == 1 || t == 3) {
        //toggle
        this.On = On;
    }
    if (this.On) this.Seen = true;

    this.UpdateState();
}

ImageAsset.prototype.Enter = function () {
    if (system.GetDataValue(this.Data, "Reset", 0)==1) {
        this.Reset();
    }
}

ImageAsset.prototype.UpdateState = function () {
    var t = system.GetDataValue(this.Data, "Type", 1);
    if (t != 2) {
        if (this.activeimage != null) {
            if (t == 0 && this.seenimage != null) {
                this.seenimage.style.display = (this.On && !this.Active) ? '' : 'none';
                this.activeimage.style.display = (this.On && this.Active) ? '' : 'none';
            }
            else {
                this.activeimage.style.display = this.On ? '' : 'none';
            }

            this.image.style.display = this.On ? 'none' : '';
        }
    }
    else {
        if (this.activeimage != null) {
            this.activeimage.style.display = 'none';
        }
        this.image.style.display = (this.On) ? 'none' : '';
    }

    this.Page.UpdateNavigation();
    this.Page.Player.UpdateButtons();
}

ImageAsset.prototype.AssetEvent = function (Event, Asset, Params) {
    if (Event == "FrameLoaded") {
        var t = system.GetDataValue(this.Data, "Type", 1);
        //var t = 1;
        this.Active = ((Params.Page == system.GetDataReference(this.Data, "Jump", 0)) || (system.GetDataReference(this.Data, "Jump", 0)==0 && Params.Page == system.GetDataReference(this.Data, "FrameHover", 0)));
        if (t == 0) {
            //check
            if (this.Active || (this.seenimage != null&&this.On)) {
                this.Toggle(true);
            }
        }
        else if (t == 1 || t == 3) {
            //toggle

            this.Toggle(this.Active);

        }
        else if (t == 2) {

        }

    }
    if (Event == "Timer") {
        this.ResultsFixed = true;
      
    }
    else if (Event == "TimerReset") {
        this.Reset();
    }
}

//
//slm_imapasset
//
//IMAP Asset

function IMAPAsset(Page, Data) {
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);

    this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
        if (Type == 415) {
            var clone = EmptyObject;
            Editor.GenericDataEditComponent.apply();

            if (this.Data.IMAPBlocks == null) this.Data.IMAPBlocks = [];
            this.Data.IMAPBlocks[this.Data.IMAPBlocks.length] = clone;
            this.UpdateData();

            Editor.GenericDataEditComponent.WYSIWYGUpdate(this, true);

            return true;
        }
        return false;
    }



    this.IMAPBlocks = new Array();


    this.container = html.createLayer(this.Surface, null);
    this.Title = html.createText(this.container, null, '');
    this.Body = html.createFormattedText(this.container, null, '');
    this.IMAPBlockContainer = html.createLayer(this.container, null);

    if (Data.IMAPBlocks != null) {
        for (var a in Data.IMAPBlocks) {
            var Block = Data.IMAPBlocks[a];
            this.IMAPBlocks[a] = new IMAPBlock(this, Block);

        }
    }

    this.UpdateData();
}
IMAPAsset.prototype.AfterEnter = function () {
    this.UpdateData();
}

IMAPAsset.prototype.UpdateData = function (recurse) {

    this.Page.PositionAsset(this);


    html.fillText(this.Title, this.Style.Title, system.GetDataText(this.Data, "Title", '', true));
    html.fillFormattedText(this.Body, this.Style, system.GetDataText(this.Data, "Body", '', true));

    this.IMAPBlockContainer.style.margin = '20px 0px 0px 0px';



    if (this.Data.IMAPBlocks == null) this.Data.IMAPBlocks = [];

    var match = [];
    var firstMatch = null;
    for (var di = 0; di < this.Data.IMAPBlocks.length; di++) {
        var pdata = this.Data.IMAPBlocks[di];
        var found = false;
        match[di] = null;
        for (var pbi = 0; pbi < this.IMAPBlocks.length; pbi++) {
            if (this.IMAPBlocks[pbi].Data == pdata) {
                match[di] = this.IMAPBlocks[pbi];
                found = true;
            }
        }
        if (!found) {
            var np = new IMAPBlock(this, pdata);
            this.IMAPBlocks[this.IMAPBlocks.length] = np;
            match[di] = np;
        }
        if (match[di].container != null) {
            this.IMAPBlockContainer.insertBefore(match[di].container, null);
            if (firstMatch == null) firstMatch = match[di].container;
        }
    }
    this.IMAPBlocks = match;

    while (this.IMAPBlockContainer.childNodes.length > 0 && this.IMAPBlockContainer.firstChild != firstMatch) this.IMAPBlockContainer.removeChild(this.IMAPBlockContainer.firstChild);

    var first = true;
    for (var pl in this.IMAPBlocks) {
        this.IMAPBlocks[pl].First = first;
        first = false;
        this.IMAPBlocks[pl].UpdateData();
    }


}

function IMAPBlock(IMAPAsset, Data) {

    this.IMAPAsset = IMAPAsset;
    this.Data = Data;
    this.container = html.createLayer(IMAPAsset.IMAPBlockContainer, null);

    html.addEditElement(this.container, this);
    this.EditParent = IMAPAsset;
    this.EditIsActive = function (Activate) {
        return this.EditParent.EditIsActive(Activate);
    }
    this.FindPage = function () {
        return this.EditParent.FindPage();
    }
    this.EditTryInsert = function (Type, EmptyObject, Offset, Editor) {
        return this.EditInsert(Type, EmptyObject, Offset, Editor);
    }
    this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
        return false;
    }





    if (!ie7) {
        this.labelcontainer = html.createLayer(this.container, null);
        this.bodycontainer = html.createLayer(this.container, null);
    }
    else {
        var table = html.createElement(this.container, "TABLE");
        var row = table.insertRow();
        var htmlc1 = row.insertCell();
        var htmlc2 = row.insertCell();
        this.labelcontainer = html.createLayer(htmlc1, null);
        this.bodycontainer = html.createLayer(htmlc2, null);
    }
    this.BlockLabel = html.createText(this.labelcontainer, null, '');
    this.BlockBody = html.createFormattedText(this.bodycontainer, null, '');
    this.BlockSource = html.prepareInterfaceImage(this.bodycontainer, null);

}

IMAPBlock.prototype.UpdateData = function () {

    this.container.style.position = 'relative';
    this.bodycontainer.style.position = 'relative';
    this.labelcontainer.style.position = 'relative';
    if (!ie7) {
        this.bodycontainer.style.display = 'table-cell';
        this.labelcontainer.style.display = 'table-cell';

        this.bodycontainer.style.verticalAlign = 'top';
        this.labelcontainer.style.verticalAlign = 'top';
    }

    this.labelcontainer.style.width = (this.container.offsetWidth / 6) + "px";
    this.bodycontainer.style.width = (this.container.offsetWidth * 5 / 6) + "px";

    var bw = system.GetDataText(this.IMAPAsset.Style, "IMAPBorderWidth", '1', true)
    var bc = system.GetDataText(this.IMAPAsset.Style, "IMAPBorderColor", 'black', true)

    this.labelcontainer.style.padding = '10px 0px 10px 0px';
    if (!this.First) {
        this.labelcontainer.style.borderWidth = '0px 0px 0px 0px';
    }
    else {
        this.labelcontainer.style.borderWidth = bw + 'px 0px 0px 0px';
    }
    this.labelcontainer.style.borderStyle = 'solid';
    this.labelcontainer.style.borderColor = 'transparent';
    this.labelcontainer.style.margin = '0px';
    this.bodycontainer.style.padding = '10px 0px 10px 0px';
    if (this.First) {
        this.bodycontainer.style.borderWidth = bw+'px 0px '+bw+'px 0px';
    }
    else {
        this.bodycontainer.style.borderWidth = '0px 0px ' + bw + 'px 0px';
    }
    this.bodycontainer.style.borderStyle = 'solid';
    this.bodycontainer.style.borderColor = bc;
    this.bodycontainer.style.margin = '0px';
    html.fillText(this.BlockLabel, this.IMAPAsset.Style.H, system.GetDataText(this.Data, "BlockLabel", '', true));
    html.fillFormattedText(this.BlockBody, this.IMAPAsset.Style, system.GetDataText(this.Data, "BlockBody", '', true));

    if (this.Data.BlockSource != null) {
        this.BlockSource.src = system.GetDataFile(this.Data, "BlockSource", '', true);
        this.BlockSource.style.display = '';
    }
    else {
        this.BlockSource.style.display = 'none';
    }
}

//
//slm_inputasset
//
//input asset

function InputAsset(Page, Data) {
    var _this = this;
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);

    this.ResultsFixed = false;
    this.ResultsChecked = false;
    this.Display = -1;



    this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
        if (Type == 1509) {
            var clone = EmptyObject;
            Editor.GenericDataEditComponent.apply();

            if (this.Data.Fields == null) this.Data.Fields = [];
            this.Data.Fields[this.Data.Fields.length] = clone;
            this.UpdateData();

            Editor.GenericDataEditComponent.WYSIWYGUpdate(this, true);

            return true;
        }
        return false;
    }




    if (this.Data["NextPage"] == null) system.saveValueData(this.Data, "NextPage", 0, null);
    if (this.Data["ChangeAnswer"] == null) system.saveValueData(this.Data, "ChangeAnswer", 1, null);
    if (this.Data["Reset"] == null) system.saveValueData(this.Data, "Reset", 0, null);


    this.Answers = [];
    this.ShowStatus = false;

    this.container = html.createLayer(this.Surface, null);
    this.Title = html.createText(this.container, null, '');
    this.SubTitle = html.createText(this.container, null, '');
    this.Question = html.createFormattedText(this.container, null, '');
    this.AnswerContainer = html.createLayer(this.container, null);
    this.FeedbackContainer = html.createLayer(this.container, null);
    this.CheckContainer = html.createLayer(this.FeedbackContainer, null);

    this.UpdateData();

    this.CalculateSuspendData = function (data) {
        var sd =  '|' + (this.ResultsChecked ? '1' : '0') + '|' + (this.ResultsFixed ? '1' : '0');

        if (_this.Data.L != null) data[_this.Data.L.toString()] = sd;
        for (var i in _this.Fields) {
            _this.Fields[i].CalculateSuspendData(data);
        }
    }
    this.ConsumeSuspendData = function (data) {
        var sd = data[_this.Data.L.toString()];
        if (sd != null) {
            if (sd == '') {
                this.ResultsChecked = false;
                this.ResultsFixed = false;
            }
            else {
                var options = sd.split('|');
                this.ResultsChecked = (options[1].toString() == '1');
                this.ResultsFixed = (options[2].toString() == '1');
            }
        }
        for (var i in _this.Fields) {
            _this.Fields[i].ConsumeSuspendData(data);
        }
        if (this.Random == 1) this.UpdateData();
        if (this.ResultsChecked) this.FireCheck(true);
    }
}

InputAsset.prototype.GetScore = function (cat, fieldtype) {
    if (fieldtype == 1 || fieldtype == 2) {
        var score = 0;
        for (var a in this.Fields) {
            var ans = this.Fields[a];
            var match = ans.MatchingAnswer();
           
            if (match != null) {
                for (var s in match.Data.Score) {
                    var sels = match.Data.Score[s];
                    if (cat == null || system.GetDataValue(sels, "Category", 0) == cat) {
                        score += system.GetDataValue(sels, "Score", 0);
                    }
                }
            }
        }
        return score;
    }
    else if (fieldtype == 3) {
        var check = system.GetDataValue(this.Data, "Check", 0);
        var ms = 0;
        for (var ans in this.Fields) {
            var selans = this.Fields[ans];

            for (var ma in selans.Answers) {
                var match = selans.Answers[ma];
                for (var s in match.Data.Score) {
                    var sels = match.Data.Score[s];
                    if (cat == null || system.GetDataValue(sels, "Category", 0) == cat) {
                        var nms = system.GetDataValue(sels, "Score", 0);
                        if (nms > ms) ms = nms;

                    }
                }
            }
        }
        return ms;
    }
    else if (fieldtype == 4) {
        var score = 0;

        var cor = true;
        for (var ans in this.Fields) {
            var selans = this.Fields[ans];
            var match = selans.MatchingAnswer();

            if (match == null) {
                cor = false;
            }
            else if (system.GetDataValue(match.Data, "Correct", 0) == 0) {
                cor = false;
            }
        }
        if (cor) score++;
        return score;
    }
    else if (fieldtype == 5) {
        return 1;
    }
}

InputAsset.prototype.UpdateData = function (recurse) {

    this.Page.PositionAsset(this);

    if (this.Data.Title != null) {
        var t = system.GetDataText(this.Data, "Title", '', true);
        html.fillText(this.Title, this.Style.Title, t);
    }

    if (this.Data.SubTitle != null) {
        var t = system.GetDataText(this.Data, "SubTitle", '', true);
        html.fillText(this.SubTitle, this.Style.SubTitle, t);
    }

    if (this.Data.Question != null) {
        var t = system.GetDataText(this.Data, "Question", '', true);
        html.fillFormattedText(this.Question, this.Style, t);
    }

    this.CheckButton = system.GetDataValue(this.Data, "CheckButton", 0);
    this.FeedbackCorrect = system.GetDataText(this.Data, "FeedbackCorrect", '', true);
    this.FeedbackWrong = system.GetDataText(this.Data, "FeedbackWrong", '', true);
    this.AllowNext = system.GetDataValue(this.Data, "AllowNext", 1);
    this.ShowCorrect = system.GetDataValue(this.Data, "ShowCorrect", 1);

    var display = system.GetDataValue(this.Data, "Display", 0);

    if (this.Data.Fields == null) this.Data.Fields = [];

    if (this.Display != display || ie7) {
        this.Fields = [];

        if (display == 0) {
            while (this.AnswerContainer.childNodes.length > 0) this.AnswerContainer.removeChild(this.AnswerContainer.firstChild);
            this.AnswerTable = html.createElement(this.AnswerContainer, "TABLE");
        }
        else {
            if (this.AnswerTable != null) {
                this.AnswerContainer.removeChild(this.AnswerTable);
                this.AnswerTable = null;
            }
        }

        this.Display = display;
    }

   

    var match = [];
    var firstMatch = null;
    for (var di = 0; di < this.Data.Fields.length; di++) {
        var pdata = this.Data.Fields[di];
        var found = false;
        match[di] = null;
        for (var pbi = 0; pbi < this.Fields.length; pbi++) {
            if (this.Fields[pbi].Data == pdata) {
                match[di] = this.Fields[pbi];
                found = true;
            }
        }
        if (!found) {
            var np = new InputAssetField(this, pdata);
            this.Fields[this.Fields.length] = np;
            match[di] = np;
        }
        if (match[di].element != null) {
            if (this.Display == 0) {
                if (!ie7) this.AnswerTable.insertBefore(match[di].element, null);
            }
            else if (this.Display == 1 || this.Display == 2) {
                this.AnswerContainer.insertBefore(match[di].element, null);
            }
            if (firstMatch == null) firstMatch = match[di].element;
        }
    }
    this.Fields = match;
    if (this.Display == 0 && !ie7) {
        while (this.AnswerTable.childNodes.length > 0 && this.AnswerTable.firstChild != firstMatch) this.AnswerTable.removeChild(this.AnswerTable.firstChild);
    }
    else if (this.Display == 1 || this.Display == 2) {
        while (this.AnswerContainer.childNodes.length > 0 && this.AnswerContainer.firstChild != firstMatch) this.AnswerContainer.removeChild(this.AnswerContainer.firstChild);
    }



    for (var pl in this.Fields) {
        this.Fields[pl].UpdateData();
    }

    if (this.Style != null && this.Style.QuestionButtons != null) html.styleElement(this.CheckContainer, this.Style.QuestionButtons.LayerButtonCheck);
    if (this.CheckButton == 1 && this.Style != null && this.Style.QuestionButtons != null) {
        if (this.BtnCheckButton == null) {
            var _this = this;
            this.BtnCheckButton = new ImageButton(this.CheckContainer, function () { _this.FireCheck(false); }, this, false, this.Style.QuestionButtons.ButtonCheckDisabled, this.Style.QuestionButtons.ButtonCheck, this.Style.QuestionButtons.ButtonCheckMouse);
        }
        else {
            this.BtnCheckButton.Change(this.Style.QuestionButtons.ButtonCheckDisabled, this.Style.QuestionButtons.ButtonCheck, this.Style.QuestionButtons.ButtonCheckMouse);
        }

    }
    else {
        if (this.BtnCheckButton != null) {
            this.CheckContainer.removeChild(this.BtnCheckButton.element);
            this.BtnCheckButton = null;
        }
    }
    if (this.FeedbackCorrect != '') {
        if (this.LayerFeedbackCorrect == null) {
            this.LayerFeedbackCorrect = html.createFormattedText(this.FeedbackContainer, null, '');
        }
        html.fillText(this.LayerFeedbackCorrect, this.Style.FeedbackCorrect.Body, this.FeedbackCorrect);
        this.LayerFeedbackCorrect.style.display = 'none';
    }
    else {
        if (this.LayerFeedbackCorrect != null) {
            this.FeedbackContainer.removeChild(this.LayerFeedbackCorrect);
            this.LayerFeedbackCorrect = null;
        }
    }
    if (this.FeedbackWrong != '') {
        if (this.LayerFeedbackWrong == null) {
            this.LayerFeedbackWrong = html.createFormattedText(this.FeedbackContainer, null, '');
        }
        html.fillText(this.LayerFeedbackWrong, this.Style.FeedbackWrong.Body, this.FeedbackWrong);
        this.LayerFeedbackWrong.style.display = 'none';
    }
    else {
        if (this.LayerFeedbackWrong != null) {
            this.FeedbackContainer.removeChild(this.LayerFeedbackWrong);
            this.LayerFeedbackWrong = null;
        }
    }
    if (this.BtnCheckButton != null) {
        if (this.FeedbackContainer.firstChild != this.CheckContainer) this.FeedbackContainer.insertBefore(this.CheckContainer, this.FeedbackContainer.firstChild);
    }

    this.UpdateButtons();


}


InputAsset.prototype.AssetEvent = function (Event, Asset, Params) {
    if (Event == "Timer") {
        this.ResultsFixed = true;
        this.FireCheck(false);
    }
    else if (Event == "TimerReset") {
        this.Reset();
    }
    else if (Event == "FixResults") {
        this.ResultsFixed = true;
        this.FireCheck(false);
    }
}

InputAsset.prototype.Enter = function () {
    this.MustSubmit = false;

    for (var i in this.Fields) {
        this.Fields[i].SynchronizeFieldAPI();
    }


    if (system.GetDataValue(this.Data, "Reset", 0) == 1 && !this.ResultsFixed) {
        this.Reset();
    }
}

InputAsset.prototype.AfterEnter = function () {

    for (var i in this.Fields) {
        this.Fields[i].Activate();
    }

}

InputAsset.prototype.Leave = function () {
    if (this.MustSubmit) this.Page.SpreadEvent("StudentResponse", this, null);
}

InputAsset.prototype.Reset = function () {

    this.Randomization = null;
    this.ResultsFixed = false;
    this.ReleaseCheck();
 

    for (var pl in this.Fields) {
        this.Fields[pl].Reset();
    }

    this.UpdateButtons();
}


InputAsset.prototype.CanChange = function () {
    if (this.ResultsFixed) return false;
    if (this.ResultsChecked && system.GetDataValue(this.Data, "ChangeAnswer", 0) == 0) return false;
    return true;
}

InputAsset.prototype.ChangeAnswer = function (InputAssetField, Silent) {

    if (!this.CanChange()) return;
    this.ReleaseCheck();
    this.UpdateButtons();
    this.MustSubmit = true;
}

InputAsset.prototype.CanNext = function () {

    if (this.AllowNext == 0) return true;
    if (this.CheckButton == 1 && !this.ResultsChecked) return false;
    if (this.AllowNext == 1) {
        if (this.ResultsChecked) return true;
        return this.Answered();
    }
    if (this.AllowNext == 2) {
        return this.GetScore(null, 4) == this.GetScore(null, 5);
    }

}


InputAsset.prototype.Answered = function () {
    var isSelected = true;
    for (var pl in this.Fields) {
        if (this.Fields[pl].Answer() == '' || this.Fields[pl].Answer() == this.Fields[pl].defaultText) isSelected = false;
        if (this.Fields[pl].selectElement != null && this.Fields[pl].Answer() == this.Fields[pl].defaultText) isSelected = false;
    }
    return isSelected;
}

InputAsset.prototype.FireCheck = function (Silent) {
    this.ResultsChecked = true;
    for (var pl in this.Fields) {
        this.Fields[pl].FireCheck();
    }
    if (!Silent) this.SubmitResult();
    this.UpdateButtons();
}
InputAsset.prototype.ReleaseCheck = function () {
    this.ResultsChecked = false;
    for (var pl in this.Fields) {
        this.Fields[pl].ReleaseCheck();
    }
    this.UpdateButtons();
}

InputAsset.prototype.UpdateButtons = function () {
    this.Page.UpdateNavigation();
    this.Page.Player.UpdateButtons();
    if (this.CheckButton == 1) {
        this.BtnCheckButton.SetEnabled(this.Answered());
    }
    var cc = this.CanChange();
    for (var pl in this.Fields) {
        if (this.Fields[pl].CanChange(cc));
    }

    var correct = this.GetScore(null, 4) == this.GetScore(null, 5);
    if (this.LayerFeedbackCorrect != null) this.LayerFeedbackCorrect.style.display = (this.ResultsChecked && correct) ? '' : 'none';
    if (this.LayerFeedbackWrong != null) this.LayerFeedbackWrong.style.display = (this.ResultsChecked && !correct) ? '' : 'none';

    if (this.ResultsChecked) {
        if (correct) this.Page.SpreadEvent("LoadFrame", this, { "Page": system.GetDataReference(this.Data, "FrameCorrect", 0) });
        else this.Page.SpreadEvent("LoadFrame", this, { "Page": system.GetDataReference(this.Data, "FrameWrong", 0) });
    }
    else {
        if (this.CheckButton == 1) this.Page.SpreadEvent("LoadFrame", this, { "Page": 0 });
    }
}

InputAsset.prototype.SubmitResult = function () {
    this.MustSubmit = false;
    this.Page.SpreadEvent("StudentResponse", this, null);
    this.Page.SpreadEvent("MCChoice", this, null);
    if (system.GetDataValue(this.Data, "NextPage", 0) == 1 && !html.editing) {
        this.Page.Player.Forward();
    }
}


InputAsset.prototype.GetResultsChecked = function () {
    return this.ResultsChecked;
}


function InputAssetField(InputAsset, Data) {

    this.InputAsset = InputAsset;
    this.Data = Data;
   
  
    if (InputAsset.Display == 0) {
        if (!ie7) {
            this.element = html.createElement(InputAsset.AnswerTable, "TR");
            var td1 = html.createElement(this.element, "TD");
            var td2 = html.createElement(this.element, "TD");
            var td3 = html.createElement(this.element, "TD");
        }
        else {
            this.element = InputAsset.AnswerTable.insertRow();
            var td1 = this.element.insertCell();
            var td2 = this.element.insertCell();
            var td3 = this.element.insertCell();
        }

        this.TextBefore = html.createElement(td1, "FONT");
        this.Container = html.createLayer(td2);
        this.TextAfter = html.createElement(td3, "FONT");

    }
    else if (InputAsset.Display == 2) {
        this.element = html.createElement(InputAsset.AnswerContainer, "FONT");
        this.TextBefore = html.createElement(this.element, "FONT");
        this.Container = html.createLayer(this.element);
        this.TextAfter = html.createElement(this.element, "FONT");
    }
    else if (InputAsset.Display == 1) {
        this.element = html.createLayer(InputAsset.AnswerContainer);
        this.TextBefore = html.createElement(this.element, "FONT");
        this.Container = html.createLayer(this.element);
        this.TextAfter = html.createElement(this.element, "FONT");
    }
    this.Container.style.padding = '2px';
    this.Container.style.margin = '2px';


    html.addEditElement(this.element, this);
    this.EditParent = InputAsset;
    this.EditIsActive = function (Activate) {
        return this.EditParent.EditIsActive(Activate);
    }
    this.FindPage = function () {
        return this.EditParent.FindPage();
    }
    this.EditTryInsert = function (Type, EmptyObject, Offset, Editor) {
        return this.EditInsert(Type, EmptyObject, Offset, Editor);
    }
    this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
        if (Type == 1510) {
            var clone = EmptyObject;
            Editor.GenericDataEditComponent.apply();

            if (this.Data.Answers == null) this.Data.Answers = [];
            this.Data.Answers[this.Data.Answers.length] = clone;
            this.UpdateData();

            Editor.GenericDataEditComponent.WYSIWYGUpdate(this, true);

            return true;
        }
        return false;
    }

    this.showanswers = false;
    this.answer = '';


    var _this = this;
    this.updateSrc = function () {

        if (this.InputAsset.Display != 0) {
            this.Container.style.display = 'inline';
            this.Container.style.whiteSpace = 'nowrap';
        }


        if (_this.showanswers && _this.InputAsset.ShowCorrect == 1) {
            var ans = this.MatchingAnswer();
            var correct = (ans != null && system.GetDataValue(ans.Data, "Correct", 0) == 1);

            if (this.CorrectAnswer == null) {
                this.CorrectAnswer = html.createElement(this.Container, "FONT");
                this.CorrectAnswer.style.position = 'relative';
            }

            if (!correct) {


                for (var pbi = 0; pbi < this.Answers.length; pbi++) {
                    if (system.GetDataValue(this.Answers[pbi].Data, "Correct", 0) == 1) {
                        this.CorrectAnswer.innerHTML = '(' + this.Answers[pbi].Answer + ')';
                    }

                }

                html.styleFormattedElement(_this.Container, this.InputAsset.Style.Wrong);
                _this.Container.style.backgroundColor = safeColor(system.GetDataText(this.InputAsset.Style.Wrong, "BackgroundColor", null, false));



           
            }
            else {

                this.CorrectAnswer.innerHTML = '&nbsp;';

                html.styleFormattedElement(_this.Container, this.InputAsset.Style.Correct);
                _this.Container.style.backgroundColor = safeColor(system.GetDataText(this.InputAsset.Style.Correct, "BackgroundColor", null, false));


                
            }

            if (this.selectElement != null) {
                this.selectElement.focus();
                this.selectElement.blur();
                
            }


        }
        else {
            
                html.styleFormattedElement(_this.Container, this.InputAsset.Style.NotSelected);
                _this.Container.style.backgroundColor = safeColor(system.GetDataText(this.InputAsset.Style.NotSelected, "BackgroundColor", null, false));
                if (this.CorrectAnswer != null) {
                    this.Container.removeChild(this.CorrectAnswer);
                    this.CorrectAnswer = null;
                }
        }

        if (this.InputAsset.Display != 0) {
            this.Container.style.display = 'inline';
            this.Container.style.whiteSpace = 'nowrap';
        }
    }

    this.Activate = function () {
        if (system.GetDataValue(this.Data, "Activate", 0) == 1) {
            if (this.inputElement != null) {
                this.inputElement.focus();
            }
            if (this.textAreaElement != null) {
                this.textAreaElement.focus();
            }
            if (this.selectElement != null) {
                this.selectElement.focus();
            }
        }
    }

    this.SynchronizeFieldAPI = function (sd) {


        if (_this.FieldVariable != '') {


            var re = null;
            var dore = false;
            //if (sd == null) {
                if (this.inputElement != null) {
                    re = this.inputElement.value.replace(/{field:([^}]*)}/gi,
                        function test(x, p1) {
                            var rep = GetFieldAPIFieldByVar(p1);
                            if (rep != null) dore = true;
                            return (rep == null) ? "" : rep;
                        });
                }

                if (this.textAreaElement != null) {
                    re = this.textAreaElement.value.replace(/{field:([^}]*)}/gi,
                        function test(x, p1) {
                            var rep = GetFieldAPIFieldByVar(p1);
                            if (rep != null) dore = true;
                            return (rep == null) ? "" : rep;
                        });
                }
                if (dore) sd = re;
            //}

                var sdf = GetFieldAPIFieldByVar(_this.FieldVariable);
                if (sdf != null) sd = sdf;
        }

        if (sd != null) {
            if (this.inputElement != null) {
                this.answer = sd;
                this.inputElement.value = sd;
            }
            if (this.textAreaElement != null) {
                this.answer = sd;
                this.textAreaElement.value = sd;
            }
            if (this.selectElement != null) {

                for (var pbi = 0; pbi < this.Answers.length; pbi++) {
                    if (sd == this.Answers[pbi].Answer) {
                        this.answer = sd;

                        this.selectElement.selectedIndex = pbi + this.selectElement.options.length-this.Answers.length;
                    }
                }
            }
        }




        return sd;

    }


    this.CalculateSuspendData = function (data) {
        if (_this.Data.L != null) data[_this.Data.L.toString()] = this.Answer();
    }

    this.ConsumeSuspendData = function (data) {
        var sd = data[_this.Data.L.toString()];
        if (sd == null) sd = this.Answer();
        sd = _this.SynchronizeFieldAPI(sd);


        if (this.FieldVariable != '') {
            if (_this.selectElement != null) {
                StoreFieldAPIField(this.Data.L, this.FieldVariable, this.FieldName, this.Answer(), false);
            }
            else {
                StoreFieldAPIField(this.Data.L, this.FieldVariable, this.FieldName, sd, false);
            }
        }

    }

}



InputAssetField.prototype.FireCheck = function () {
    this.showanswers = true;
    this.updateSrc();
}
InputAssetField.prototype.ReleaseCheck = function () {
    this.showanswers = false;
    this.updateSrc();
}

InputAssetField.prototype.Reset = function () {
    if (this.selectElement != null) {
        if (this.Answers.length>0)this.selectElement.selectedIndex = 0;
    }
    else if (this.inputElement != null) {
        this.inputElement.value = '';
    }
    else if (this.textAreaElement != null) {
        this.textAreaElement.value = '';
    }
    this.answer = "";
}

InputAssetField.prototype.Answer = function () {
    if (this.selectElement != null) {
        if (this.selectElement.selectedIndex == -1) return '';
        return this.selectElement.options[this.selectElement.selectedIndex].text;
    }
    else if (this.inputElement != null) {
        return this.inputElement.value;
    }
    else if (this.textAreaElement != null) {
        return this.textAreaElement.value;
    }
    return '';
}

InputAssetField.prototype.CanChange = function (Allowed) {
    if (this.selectElement != null) {
        this.selectElement.disabled = !Allowed;
    }
    else if (this.inputElement != null) {
        this.inputElement.readOnly = !Allowed;
    }
    else if (this.textAreaElement != null) {
        this.textAreaElement.readOnly = !Allowed;
    }
}

InputAssetField.prototype.MatchingAnswer = function () {
    var ans = this.Answer().trim();

    for (var pbi = 0; pbi < this.Answers.length; pbi++) {
        if (this.Answers[pbi].Match(ans)) {
            return this.Answers[pbi];
        }
        
    }
    return null;
}

InputAssetField.prototype.CheckChanged = function () {
    var ans = this.Answer();

    if (this.FieldVariable != '') StoreFieldAPIField(this.Data.L, this.FieldVariable, this.FieldName, ans, true);

    if (ans != this.answer) {
        this.answer = ans;
        this.InputAsset.ChangeAnswer(this, false);
       
    }

    var ma = this.MatchingAnswer();
    if (ma != null) {
        var juid = system.GetDataReference(ma.Data, "Jump", 0);
        if (juid != 0) {
            this.InputAsset.Page.Player.Block.SpreadEvent("LoadPage", this, { "Page": juid, "Found": false, "ActivatePage": null });
        }
    }

}

InputAssetField.prototype.Clicked = function (LB) {
    var juid = system.GetDataReference(this.Data, "Jump", 0);
    if (juid != 0) {
        this.InputAsset.Page.Player.Block.SpreadEvent("LoadPage", this, { "Page": juid, "Found": false, "ActivatePage": null });
    }
}


InputAssetField.prototype.UpdateData = function () {

    if (this.Data.Answers == null) this.Data.Answers = [];
    this.defaultText = system.GetDataText(this.Data, "DefaultText", '', true);
   

    var InputType = system.GetDataValue(this.Data, "InputType", 0);
    var Width = system.GetDataValue(this.Data, "Width", 0);
    var Rows = system.GetDataValue(this.Data, "Rows", 1);
    var _this = this;
    if (InputType == 0 || InputType == 2 || InputType ==3) {
        if (Rows == 1) {
            if (this.inputElement == null) {
                this.inputElement = html.createElement(this.Container, "INPUT");
                if (InputType == 3) this.inputElement.type = "password";
                this.inputElement.onfocus = function () {

                    if (_this.inputElement.value == this.defaultText) {
                        setTimeout((function (self) {
                            return function () {
                                self.inputElement.select();
                               
                            }
                        })(_this),100);
                    }
                    _this.checker = setInterval((function (self) {
                        return function () { self.CheckChanged(); }
                    })(_this), 100);

                    _this.Clicked();
                    
                }
                this.inputElement.onblur = function () {
                    clearInterval(_this.checker);
                    if (InputType == 2) {
                        _this.inputElement.value = ExtractNumber(_this.inputElement.value);
                    }
                    _this.CheckChanged();
                }

                


                html.styleElement(this.inputElement, this.InputAsset.Style.InputField);
                this.inputElement.style.position = 'relative';

            }

            if (InputType == 2) {
                this.inputElement.onkeypress = function (evt) {
                    var charCode = (evt.which) ? evt.which : event.keyCode
                    if (charCode > 31 && (charCode < 48 || charCode > 57))
                        return false;
                    return true;
                }
            }
            else {
                this.inputElement.onkeypress = null;
            }
            if (this.selectElement != null) {
                this.Container.removeChild(this.selectElement);
                this.selectElement = null;

            }
            if (this.textAreaElement != null) {
                this.Container.removeChild(this.textAreaElement);
                this.textAreaElement = null;
            }
            if (this.CorrectAnswer != null) {
                this.Container.insertBefore(this.CorrectAnswer, null);
            }
            this.inputElement.style.width = (Width == 0) ? 'auto' : (Width + 'px');
            if (this.inputElement.value == '') {
                this.inputElement.value = this.defaultText;
                this.answer = this.inputElement.value;
            }
        }
        else {
            if (this.textAreaElement == null) {
                this.textAreaElement = html.createElement(this.Container, "TEXTAREA");

                this.textAreaElement.onfocus = function () {

                    if (_this.textAreaElement.value == this.defaultText) {
                        setTimeout((function (self) {
                            return function () {
                                self.textAreaElement.select();
                             
                            }
                        })(_this), 100);
                    }
                    _this.checker = setInterval((function (self) {
                        return function () {
                            self.CheckChanged();
                        }
                    })(_this), 100);

                    _this.Clicked();

                }
                this.textAreaElement.onblur = function () {
                    clearInterval(_this.checker);
                    _this.CheckChanged();
                }

                html.styleElement(this.textAreaElement, this.InputAsset.Style.InputField);
                this.textAreaElement.style.position = 'relative';
                this.textAreaElement.style.whiteSpace = 'pre-line';
                this.textAreaElement.style.overflowX = 'hidden';

            }
            if (this.selectElement != null) {
                this.Container.removeChild(this.selectElement);
                this.selectElement = null;

            }
            if (this.inputElement != null) {
                this.Container.removeChild(this.inputElement);
                this.inputElement = null;
            }
            if (this.CorrectAnswer != null) {
                this.Container.insertBefore(this.CorrectAnswer, null);
            }
            this.textAreaElement.style.width = (Width == 0) ? 'auto' : (Width + 'px');
            this.textAreaElement.rows = Rows;

            if (this.textAreaElement.value == '') {
                this.textAreaElement.value = this.defaultText;
                this.answer = this.textAreaElement.value;
            }
        }

    }
    else if (InputType == 1) {
        if (this.selectElement == null) {
            this.selectElement = html.createElement(this.Container, "SELECT");
            this.selectElement.onchange = function () { _this.CheckChanged() }
            this.selectElement.onfocus = function () {
                _this.Clicked();
            }
        }
        if (this.inputElement != null) {
            this.Container.removeChild(this.inputElement);
            this.inputElement = null;
        }
        if (this.textAreaElement != null) {
            this.Container.removeChild(this.textAreaElement);
            this.textAreaElement = null;
        }
        
        this.selectElement.size = Rows;
        html.styleElement(this.selectElement, this.InputAsset.Style.InputField);
        this.selectElement.style.position = 'relative';
        this.selectElement.style.width = (Width == 0) ? 'auto' : (Width + 'px');
    }

    this.Container.style.display = 'inline-block';
    var tb = system.GetDataText(this.Data, "TextBefore", '', true);
    this.FieldVariable = system.GetDataText(this.Data, "FieldVariable", '', true);
    this.FieldName = tb;
    var ta = system.GetDataText(this.Data, "TextAfter", '', true)+'&nbsp;';
    html.fillText(this.TextBefore, this.InputAsset.Style.NotSelected.Body, tb);
    this.TextBefore.style.position = 'relative';
    html.fillText(this.TextAfter, this.InputAsset.Style.NotSelected.Body, ta);
    this.TextAfter.style.position = 'relative';


    if (this.Answers == null) this.Answers = [];
    var match = [];
    var firstMatch = null;
    for (var di = 0; di < this.Data.Answers.length; di++) {
        var pdata = this.Data.Answers[di];
        var found = false;
        match[di] = null;
        for (var pbi = 0; pbi < this.Answers.length; pbi++) {
            if (this.Answers[pbi].Data == pdata) {
                match[di] = this.Answers[pbi];
                found = true;
            }
        }
        if (!found) {
            var np = new InputAssetFieldAnswer(this, pdata);
            match[di] = np;
        }

    }
    this.Answers = match;

    if (this.selectElement != null) {

        var current = this.Answer();

        while (this.selectElement.childNodes.length > 0) this.selectElement.removeChild(this.selectElement.firstChild);


        
        if (this.defaultText != '') {
            var option = html.createElement(this.selectElement, "OPTION");
            option.value = pbi;
            option.text = this.defaultText;
            if (this.defaultText == current) this.selectElement.selectedIndex = pbi;
        }

        for (var pbi = 0; pbi < this.Answers.length; pbi++) {
            if (this.Answers[pbi].Answer == '' || this.Answers[pbi].Answer != this.defaultText) {
                var option = html.createElement(this.selectElement, "OPTION");
                option.value = pbi;
                option.text = this.Answers[pbi].Answer;
                if (this.Answers[pbi].Answer == current) this.selectElement.selectedIndex = pbi;
            }
        }


        if (current == null && this.Answers.length > 0) {
            this.selectElement.selectedIndex = 0;
        }
        if (system.GetDataValue(this.Data, "Alpha", 0) == 1) {

            sortSelect(this.selectElement);
        }
    }



    this.updateSrc();
}

function sortSelect(elem) {
    var tmpAry = [];
    var selectedValue = "";
    if (elem.selectedIndex > -1) {
        selectedValue = elem[elem.selectedIndex].value;
    }
    for (var i = 0; i < elem.options.length; i++) tmpAry.push(elem.options[i]);
    tmpAry.sort(function (a, b) { return (a.text.toLowerCase() < b.text.toLowerCase()) ? -1 : 1; });
    while (elem.options.length > 0) elem.options[0] = null;
    var newSelectedIndex = 0;
    for (var i = 0; i < tmpAry.length; i++) {
        elem.options[i] = tmpAry[i];
        if (elem.options[i].value == selectedValue) newSelectedIndex = i;
    }
    elem.selectedIndex = newSelectedIndex;
    return;
}


function InputAssetFieldAnswer(InputAssetField, Data) {

    this.InputAssetField = InputAssetField;
    this.Data = Data;


    this.UpdateData();
}

InputAssetFieldAnswer.prototype.Match = function (m) {
    if (this.Regex) {
        return this.r.test(m);
    }
    else {
        if (this.Case) {
            return this.Answer == m;
        }
        else {
            return this.Answer.toLowerCase() == m.toLowerCase();
        }
    }
}

InputAssetFieldAnswer.prototype.UpdateData = function () {
    this.Answer = system.GetDataText(this.Data, "Answer", '', true).trim();
    this.Case = system.GetDataValue(this.Data, "Case", 0) == 1;
    this.Regex = system.GetDataValue(this.Data, "Regex", 0) == 1;
    if (this.Regex) {
        this.r = new RegExp(this.Answer, this.Case ? "" : "i");
    }
}



//
//slm_matchasset
//
//match asset

function MatchAsset(Page, Data) {
    var _this = this;
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);

    this.ResultsFixed = false;
    this.ResultsChecked = false;

    this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
        if (Type == 1370) {
            var clone = EmptyObject;
            Editor.GenericDataEditComponent.apply();

            if (this.Data.Pairs == null) this.Data.Pairs = [];
            this.Data.Pairs[this.Data.Pairs.length] = clone;
            this.UpdateData();

            Editor.GenericDataEditComponent.WYSIWYGUpdate(this, true);

            return true;
        }
        return false;
    }




    if (this.Data["NextPage"] == null) system.saveValueData(this.Data, "NextPage", 0, null);
    if (this.Data["ChangeAnswer"] == null) system.saveValueData(this.Data, "ChangeAnswer", 1, null);
    if (this.Data["Reset"] == null) system.saveValueData(this.Data, "Reset", 0, null);

    this.Pairs = [];

    this.container = html.createLayer(this.Surface, null);
    this.Title = html.createText(this.container, null, '');
    this.SubTitle = html.createText(this.container, null, '');
    this.Question = html.createFormattedText(this.container, null, '');
    this.AnswerContainer = html.createLayer(this.container, null);
    this.AnswerContainer.style.position = 'relative';
    this.FeedbackContainer = html.createLayer(this.container, null);
    this.CheckContainer = html.createLayer(this.FeedbackContainer, null);
    this.LastZIndex = 0;

    this.UpdateData();

    this.CalculateSuspendData = function (data) {
        var sd = '';
        if (this.Randomization != null) {
            for (var i = 0; i < this.Randomization.length; i++) {
                if (sd != '') sd += ',';
                sd += this.Randomization[i];
            }
        }
        sd += '|';
        var first = true;
        if (this.ItemRandomization != null) {
            for (var i = 0; i < this.ItemRandomization.length; i++) {
                if (first) {
                    first = false;
                }
                else{
                    sd += ',';
                }
                sd += this.ItemRandomization[i];
            }
        }
        sd += '|' + (this.ResultsChecked ? '1' : '0') + '|' + (this.ResultsFixed ? '1' : '0');

        if (_this.Data.L != null) data[_this.Data.L.toString()] = sd;
        for (var i in _this.Pairs) {
            _this.Pairs[i].CalculateSuspendData(data);
        }
    }
    this.ConsumeSuspendData = function (data) {
        var sd = data[_this.Data.L.toString()];
        if (sd != null) {
            if (sd == '') {
                this.Randomization = null;
                this.ItemRandomization = null;
                this.ResultsChecked = false;
                this.ResultsFixed = false;
            }
            else {
                var options = sd.split('|');
                if (options[0] == '') {
                    this.Randomization = null;
                }
                else {
                    var sds = options[0].split(',');
                    this.Randomization = [];
                    for (var i = 0; i < sds.length; i++) {
                        this.Randomization[i] = parseInt(sds[i]);
                    }
                }
                if (options[1] == '') {
                    this.ItemRandomization = null;
                }
                else {
                    var sds = options[1].split(',');
                    this.ItemRandomization = [];
                    for (var i = 0; i < sds.length; i++) {
                        this.ItemRandomization[i] = parseInt(sds[i]);
                    }
                }
                this.ResultsChecked = (options[2].toString() == '1');
                this.ResultsFixed = (options[3].toString() == '1');
            }
        }
        for (var i in _this.Pairs) {
            _this.Pairs[i].ConsumeSuspendData(data);
        }
        if (this.Random == 1) this.UpdateData();
        else this.UpdatePositions();

        if (this.ResultsChecked) this.FireCheck(true);
    }
}

MatchAsset.prototype.GetScore = function (cat, fieldtype) {
    if (fieldtype == 1 || fieldtype == 2) {
        var score = 0;
        for (var a in this.Pairs) {
            var ans = this.Pairs[a];
            if (ans.MatchingItem == ans) {
                for (var s in ans.Data.Score) {
                    var sels = ans.Data.Score[s];
                    if (cat == null || system.GetDataValue(sels, "Category", 0) == cat) {
                        score += system.GetDataValue(sels, "Score", 0);
                    }
                }
            }
        }
        return score;
    }
    else if (fieldtype == 3) {

        var ms = 0;
        for (var ans in this.Pairs) {
            var selans = this.Pairs[ans];
            for (var s in selans.Data.Score) {
                var sels = selans.Data.Score[s];
                if (cat == null || system.GetDataValue(sels, "Category", 0) == cat) {
                    var nms = system.GetDataValue(sels, "Score", 0);

                        ms += nms;

                }
            }
        }
        return ms;
    }
    else if (fieldtype == 4) {
        var score = 0;

        var cor = true;
        for (var ans in this.Pairs) {
            var selans = this.Pairs[ans];
            if (selans.MatchingItem != selans) {
                cor = false;
            }
        }
        if (cor) score++;
        return score;
    }
    else if (fieldtype == 5) {
        return 1;
    }
}

MatchAsset.prototype.UpdateData = function (recurse) {

    this.Page.PositionAsset(this);

    if (this.Data.Title != null) {
        var t = system.GetDataText(this.Data, "Title", '', true);
        html.fillText(this.Title, this.Style.Title, t);
    }

    if (this.Data.SubTitle != null) {
        var t = system.GetDataText(this.Data, "SubTitle", '', true);
        html.fillText(this.SubTitle, this.Style.SubTitle, t);
    }

    if (this.Data.Question != null) {
        var t = system.GetDataText(this.Data, "Question", '', true);
        html.fillFormattedText(this.Question, this.Style, t);
    }

    this.Random = system.GetDataValue(this.Data, "Random", 0);
    this.CheckButton = system.GetDataValue(this.Data, "CheckButton", 0);
    this.FeedbackCorrect = system.GetDataText(this.Data, "FeedbackCorrect", '', true);
    this.FeedbackWrong = system.GetDataText(this.Data, "FeedbackWrong", '', true);
    this.AllowNext = system.GetDataValue(this.Data, "AllowNext", 1);
    this.ShowCorrect = system.GetDataValue(this.Data, "ShowCorrect", 1);

    this.TargetWidth = system.GetDataValue(this.Data, "TargetWidth", 200);
    this.ItemWidth = system.GetDataValue(this.Data, "ItemWidth", 100);
    this.RowHeight = system.GetDataValue(this.Data, "RowHeight", 50);
    this.Spacing = system.GetDataValue(this.Data, "Spacing", 10);
    this.Orientation = system.GetDataValue(this.Data, "Orientation", 0);



    if (this.Data.Pairs == null) this.Data.Pairs = [];

    var totalWidth = this.Spacing * 2 + this.TargetWidth + 2 * this.ItemWidth;
    var totalHeight = this.Data.Pairs.length * this.RowHeight + (this.Data.Pairs.length - 1) * this.Spacing;
    if (totalHeight < 0) totalHeight = 0;
    this.AnswerContainer.style.width = totalWidth + 'px';
    this.AnswerContainer.style.height = totalHeight + 'px';
    this.TW = totalWidth;
    this.TH = totalHeight;


    if (this.Randomization == null || this.Randomization.length != this.Data.Pairs.length) {
        this.Randomization = GetRandomization(this.Data.Pairs.length)
    }
    if (this.ItemRandomization == null || this.ItemRandomization.length != this.Data.Pairs.length) {
        this.ItemRandomization = GetRandomization(this.Data.Pairs.length)
    }

    var data = [];
    if (this.Random == 0) {
        for (var i = 0; i < this.Data.Pairs.length; i++) data[i] = this.Data.Pairs[i];
    }
    else {
        for (var i = 0; i < this.Data.Pairs.length; i++) data[i] = this.Data.Pairs[this.Randomization[i]];
    }
   

    var match = [];
    var firstMatch = null;
   

    for (var di = 0; di < data.length; di++) {
        var pdata = data[di];
        var found = false;
        match[di] = null;
        for (var pbi = 0; pbi < this.Pairs.length; pbi++) {
            if (this.Pairs[pbi].Data == pdata) {
                match[di] = this.Pairs[pbi];
                found = true;
            }
        }
        if (!found) {
            var np = new MatchAssetPair(this, pdata);
            this.Pairs[this.Pairs.length] = np;
            match[di] = np;
        }
        if (match[di].element != null) {

            match[di].Index = di;
            
            
            if (firstMatch == null) firstMatch = match[di].element;
        }
    }
    this.Pairs = match;
    this.UpdatePositions();


    
    

    while (this.AnswerContainer.childNodes.length > 0 && this.AnswerContainer.firstChild != firstMatch) this.AnswerContainer.removeChild(this.AnswerContainer.firstChild);

    for (var pl in this.Pairs) {
        this.Pairs[pl].UpdateData();
    }

    if (this.Style != null && this.Style.QuestionButtons != null) html.styleElement(this.CheckContainer, this.Style.QuestionButtons.LayerButtonCheck);
    if (this.CheckButton == 1 && this.Style != null && this.Style.QuestionButtons != null) {
        if (this.BtnCheckButton == null) {
            var _this = this;
            this.BtnCheckButton = new ImageButton(this.CheckContainer, function () { _this.FireCheck(false); }, this, false, this.Style.QuestionButtons.ButtonCheckDisabled, this.Style.QuestionButtons.ButtonCheck, this.Style.QuestionButtons.ButtonCheckMouse);
        }
        else {
            this.BtnCheckButton.Change(this.Style.QuestionButtons.ButtonCheckDisabled, this.Style.QuestionButtons.ButtonCheck, this.Style.QuestionButtons.ButtonCheckMouse);
        }

    }
    else {
        if (this.BtnCheckButton != null) {
            this.CheckContainer.removeChild(this.BtnCheckButton.element);
            this.BtnCheckButton = null;
        }
    }
    if (this.FeedbackCorrect != '') {
        if (this.LayerFeedbackCorrect == null) {
            this.LayerFeedbackCorrect = html.createFormattedText(this.FeedbackContainer, null, '');
        }
        html.fillText(this.LayerFeedbackCorrect, this.Style.FeedbackCorrect.Body, this.FeedbackCorrect);
        this.LayerFeedbackCorrect.style.display = 'none';
    }
    else {
        if (this.LayerFeedbackCorrect != null) {
            this.FeedbackContainer.removeChild(this.LayerFeedbackCorrect);
            this.LayerFeedbackCorrect = null;
        }
    }
    if (this.FeedbackWrong != '') {
        if (this.LayerFeedbackWrong == null) {
            this.LayerFeedbackWrong = html.createFormattedText(this.FeedbackContainer, null, '');
        }
        html.fillText(this.LayerFeedbackWrong, this.Style.FeedbackWrong.Body, this.FeedbackWrong);
        this.LayerFeedbackWrong.style.display = 'none';
    }
    else {
        if (this.LayerFeedbackWrong != null) {
            this.FeedbackContainer.removeChild(this.LayerFeedbackWrong);
            this.LayerFeedbackWrong = null;
        }
    }
    if (this.BtnCheckButton != null) {
        if (this.FeedbackContainer.firstChild != this.CheckContainer) this.FeedbackContainer.insertBefore(this.CheckContainer, this.FeedbackContainer.firstChild);
    }

    this.UpdateButtons();


}
MatchAsset.prototype.UpdatePositions = function () {


    var y = 0;
    for (var pbi = 0; pbi < this.Pairs.length; pbi++) {
        var Pair = this.Pairs[pbi];
        Pair.TargetElement.Position(0, y, this.LastZIndex);
        Pair.TargetArea.Position(this.TargetWidth + this.Spacing, y, this.LastZIndex);
        Pair.PreviewElement.Position(this.TargetWidth + this.ItemWidth + 2 * this.Spacing, y, this.LastZIndex);
        y += this.RowHeight + this.Spacing;
    }
    for (var pbi = 0; pbi < this.Pairs.length; pbi++) {
        var Pair = this.Pairs[pbi];
        if (Pair.MatchingTarget == null) {
            Pair.ItemElement.Position(this.TargetWidth + this.ItemWidth + 2 * this.Spacing, this.Pairs[this.ItemRandomization[pbi]].TargetArea.Y, this.LastZIndex + 1);
        }
        else {
            Pair.ItemElement.Position(this.TargetWidth + this.Spacing, Pair.MatchingTarget.TargetArea.Y, this.LastZIndex + 1);
        }
    }
    this.LastZIndex = this.LastZIndex + 1;
}

MatchAsset.prototype.AssetEvent = function (Event, Asset, Params) {
    if (Event == "Timer") {
        this.ResultsFixed = true;
        this.FireCheck(false);
    }
    else if (Event == "TimerReset") {
        this.Reset();
    }
    else if (Event == "FixResults") {
        this.ResultsFixed = true;
        this.FireCheck(false);
    }
}

MatchAsset.prototype.Enter = function () {
    this.MustSubmit = false;
    if (system.GetDataValue(this.Data, "Reset", 0) == 1 && !this.ResultsFixed) {
        this.Reset();
    }
}

MatchAsset.prototype.Leave = function () {
    if (this.MustSubmit) this.Page.SpreadEvent("StudentResponse", this, null);
}

MatchAsset.prototype.Reset = function () {

    this.Randomization = null;
    this.ItemRandomization = null;
    this.ResultsFixed = false;
    this.ReleaseCheck();

    for (var pl in this.Pairs) {
        if (this.Pairs[pl].selected) {
            this.Pairs[pl].MatchingItem = null;
            this.Pairs[pl].MatchingTarget = null;
        }
    }

    if (this.Random == 1) this.UpdateData();
    this.UpdateButtons();
}


MatchAsset.prototype.CanChange = function () {
    if (this.ResultsFixed) return false;
    if (this.ResultsChecked && system.GetDataValue(this.Data, "ChangeAnswer", 0) == 0) return false;
    return true;
}

MatchAsset.prototype.SelectAnswer = function (MatchAssetPair, Silent) {

    if (!this.CanChange()) return;
    this.ReleaseCheck();



    this.UpdateButtons();
    this.MustSubmit = true;

    if (MatchAssetPair != null && !Silent && this.CheckButton == 0) {
        var isSelected = true;
        for (var pl in this.Pairs) {
            if (this.Pairs[pl].MatchingItem == null) isSelected = true;
        }
        if (isSelected) this.SubmitResult();
    }
}

MatchAsset.prototype.CanNext = function () {

    if (this.AllowNext == 0) return true;
    if (this.CheckButton == 1 && !this.ResultsChecked) return false;
    if (this.AllowNext == 1) {
        if (this.ResultsChecked) return true;
        return this.Answered();
    }
    if (this.AllowNext == 2) {
        return this.GetScore(null, 4) == this.GetScore(null, 5);
    }

}

MatchAsset.prototype.Answered = function () {
    var isSelected = true;
    for (var pl in this.Pairs) {
        if (this.Pairs[pl].MatchingItem == null) isSelected = false;
    }
    return isSelected;
}


MatchAsset.prototype.FireCheck = function (Silent) {
    this.ResultsChecked = true;
    for (var pl in this.Pairs) {
        this.Pairs[pl].FireCheck();
    }
    if (!Silent) this.SubmitResult();
    this.UpdateButtons();
}
MatchAsset.prototype.ReleaseCheck = function () {
    this.ResultsChecked = false;
    for (var pl in this.Pairs) {
        this.Pairs[pl].ReleaseCheck();
    }
    this.UpdateButtons();
}

MatchAsset.prototype.UpdateButtons = function () {
    this.Page.UpdateNavigation();
    this.Page.Player.UpdateButtons();
    if (this.CheckButton == 1) {
        var isSelected = true;
        for (var pl in this.Pairs) {
            if (this.Pairs[pl].MatchingItem == null) isSelected = false;
        }
        this.BtnCheckButton.SetEnabled(isSelected);
    }
    var cc = this.CanChange();
    for (var pl in this.Pairs) {
        if (this.Pairs[pl].CanChange(cc));
    }

    var correct = this.GetScore(null, 4) == this.GetScore(null, 5);
    if (this.LayerFeedbackCorrect != null) this.LayerFeedbackCorrect.style.display = (this.ResultsChecked && correct) ? '' : 'none';
    if (this.LayerFeedbackWrong != null) this.LayerFeedbackWrong.style.display = (this.ResultsChecked && !correct) ? '' : 'none';

    if (this.ResultsChecked) {
        if (correct) this.Page.SpreadEvent("LoadFrame", this, { "Page": system.GetDataReference(this.Data, "FrameCorrect", 0) });
        else this.Page.SpreadEvent("LoadFrame", this, { "Page": system.GetDataReference(this.Data, "FrameWrong", 0) });
    }
    else {
        this.Page.SpreadEvent("LoadFrame", this, { "Page": 0 });
    }
}

MatchAsset.prototype.SubmitResult = function () {
    this.MustSubmit = false;
    this.Page.SpreadEvent("StudentResponse", this, null);
    this.Page.SpreadEvent("MCChoice", this, null);
    if (system.GetDataValue(this.Data, "NextPage", 0) == 1 && !html.editing) {
        this.Page.Player.Forward();
    }
}


MatchAsset.prototype.GetResultsChecked = function () {
    return this.ResultsChecked;
}


function MatchAssetPair(MatchAsset, Data) {

    this.MatchAsset = MatchAsset;
    this.Data = Data;

    this.TargetElement = new MatchAssetObject(this, "NotSelected", true, false);
    this.TargetArea = new MatchAssetObject(this, "Hover", true, false);
    this.ItemElement = new MatchAssetObject(this, "Selected", true, true);
    this.PreviewElement = new MatchAssetObject(this, "Preview", false, false);

    this.element = this.TargetElement.element;
    html.addEditElement(this.element, this);
    this.EditParent = MatchAsset;
    this.EditIsActive = function (Activate) {
        return this.EditParent.EditIsActive(Activate);
    }
    this.FindPage = function () {
        return this.EditParent.FindPage();
    }
    this.EditTryInsert = function (Type, EmptyObject, Offset, Editor) {
        return this.EditInsert(Type, EmptyObject, Offset, Editor);
    }
    this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
        return false;
    }

    this.showanswers = false;

    this.mouseIn = false;
    this.mouseDown = false;
    var _this = this;
    this.updateSrc = function () {
        if (_this.showanswers && _this.MatchAsset.ShowCorrect == 1) {
            _this.PreviewElement.SetDisplay(true);
            if (_this.MatchingItem == _this) {
                _this.ItemElement.SetStylePart("Correct");
            }
            else {
                _this.ItemElement.SetStylePart("Wrong");
            }
        }
        else {
            _this.ItemElement.SetStylePart("Selected");
            _this.PreviewElement.SetDisplay(false);
        }

    }

    if (supportsTouch) {
        _this.element.ontouchstart = function (e) {
            e.preventDefault();
            if (e.touches.length == 1) {
                if (!_this.MatchAsset.Page.Player.Block.menuUp) {
                    if (e.stopPropagation) e.stopPropagation();
                    _this.MatchAsset.SelectAnswer(_this, false);
                }
            }
        };
    }
    //else {

        _this.element.onmouseover = function () {
            if (!_this.MatchAsset.Page.Player.Block.menuUp) {
                _this.mouseIn = true;
                _this.updateSrc();
            }
        };
        _this.element.onmouseout = function () {
            _this.mouseIn = false;
            _this.updateSrc();
        };
        _this.element.onmousedown = function (e) {
            if (e == null)
                e = window.event;

            if (!_this.MatchAsset.Page.Player.Block.menuUp && !html.editing) {
                if (e.stopPropagation) e.stopPropagation();
                _this.mouseDown = true;


                return false;
            }

        };
        _this.element.onmouseup = function () {
            _this.mouseDown = false;
            if (_this.mouseIn) _this.MatchAsset.SelectAnswer(_this, false);
        };
    //}

    this.CalculateSuspendData = function (data) {
        var sd = '';
        sd += ((this.MatchingItem == null) ? '-1' : this.MatchingItem.Data.L);
        if (_this.Data.L != null) data[_this.Data.L.toString()] = sd;
    }
    this.ConsumeSuspendData = function (data) {
        var sd = data[_this.Data.L.toString()];
        if (sd != null) {
            var i = ExtractNumber(sd);
            if (i > -1) {
                for (var p = 0 ; p<this.MatchAsset.Pairs.length;p++){
                    var Pair = this.MatchAsset.Pairs[p];
                    if (Pair.Data.L == i) {
                        this.MatchingItem = Pair;
                        Pair.MatchingTarget = this;
                    }
                }
            }

        }
    }

}

MatchAssetPair.prototype.CanChange = function (cc) {
    this.canChange = cc;
    this.ItemElement.element.style.cursor = cc ? 'move' : 'default';
}

MatchAssetPair.prototype.FireCheck = function () {
    this.showanswers = true;
    this.updateSrc();
}
MatchAssetPair.prototype.ReleaseCheck = function () {
    this.showanswers = false;
    this.updateSrc();
}

MatchAssetPair.prototype.UpdateData = function () {
    var TargetImage = system.GetDataFile(this.Data, "TargetImage", "", true);
    var DragImage = system.GetDataFile(this.Data, "DragImage", "", true);
    var TargetText = system.GetDataText(this.Data, "TargetText", '', true)
    var DragText = system.GetDataText(this.Data, "DragText", '', true)

    this.TargetElement.UpdateData(this.MatchAsset.TargetWidth, this.MatchAsset.RowHeight, TargetText, TargetImage, this.MatchAsset.Style);
    this.TargetArea.UpdateData(this.MatchAsset.ItemWidth, this.MatchAsset.RowHeight, '', '', this.MatchAsset.Style);
    this.ItemElement.UpdateData(this.MatchAsset.ItemWidth, this.MatchAsset.RowHeight, DragText, DragImage, this.MatchAsset.Style);
    this.PreviewElement.UpdateData(this.MatchAsset.ItemWidth, this.MatchAsset.RowHeight, DragText, DragImage, this.MatchAsset.Style);

    this.updateSrc();
}

MatchAssetPair.prototype.Match = function (Item) {
    if (this.MatchingItem != null) {
        if (Item.MatchingTarget == null) {
            this.MatchingItem.MatchingTarget = null;
            this.MatchingItem.ItemElement.Position(Item.ItemElement.X, Item.ItemElement.Y);
            this.MatchingItem = null;
        }
        else {
            Item.MatchingTarget.MatchingItem = this.MatchingItem;
            this.MatchingItem.MatchingTarget = Item.MatchingTarget;
            this.MatchingItem.ItemElement.Position(Item.MatchingTarget.TargetArea.X, Item.MatchingTarget.TargetArea.Y);
        }
    }
    Item.ItemElement.Position(this.TargetArea.X, this.TargetArea.Y);
    this.MatchingItem = Item;
    Item.MatchingTarget = this;

    this.MatchAsset.SelectAnswer(this, false);
}

function MatchAssetObject(Pair, StylePart, Display, Draggable) {
    this.Pair = Pair;
    this.element = html.createLayer(Pair.MatchAsset.AnswerContainer, null);
    this.element.style.position = 'absolute';
    this.orientation = -1;
    this.text = '';
    this.image = '';
    this.stylePart = StylePart;
    this.SetDisplay(Display);


    if (Draggable) {
        var _this = this;
        html.addDragElement(this.element, this);
        this.DragDelta = function (x, y) {
            if (!this.Pair.canChange) return;
            if (!this.Pair.MatchAsset.Page.Player.Block.menuUp) {

                var nx = this.X + x;
                var ny = this.Y + y;
                if (nx < 0) nx = 0;
                if (ny < 0) ny = 0;
                if (nx > _this.Pair.MatchAsset.TW - this.W) nx= _this.Pair.MatchAsset.TW - this.W;
                if (ny > _this.Pair.MatchAsset.TH - this.H) ny = _this.Pair.MatchAsset.TH - this.H;
          
                this.element.style.left = nx + 'px';
                this.element.style.top = ny + 'px';
            }
        }
        this.DragStart = function () {
            if (!this.Pair.canChange) return;
            if (!this.Pair.MatchAsset.Page.Player.Block.menuUp) {
                this.Pair.MatchAsset.LastZIndex++;
                this.element.style.zIndex = this.Pair.MatchAsset.LastZIndex;
               
            }

        }
        this.DragStop = function (x, y) {
            if (!this.Pair.canChange) return;
            if (!this.Pair.MatchAsset.Page.Player.Block.menuUp) {
                var nx = this.X + x;
                var ny = this.Y + y;
                var bestMatch = null;
                var bestArea = 0;
                for (var i = 0; i < this.Pair.MatchAsset.Pairs.length; i++) {
                    var area = this.Pair.MatchAsset.Pairs[i].TargetArea;
                    var olw = (nx < area.X) ? (nx + this.W - area.X) : (area.X + area.W - nx);
                    var olh = (ny < area.Y) ? (ny + this.H - area.Y) : (area.Y + area.H - ny);
                    if (olw < 0) olw = 0;
                    if (olh < 0) olh = 0;
                    var m = olw * olh;
                    if (m > bestArea) {
                        bestMatch = area;
                        bestArea = m;
                    }
                }
                if (bestMatch != null) {
                    bestMatch.Pair.Match(this.Pair);
                }
                else {
                    this.element.style.left = this.X + 'px';
                    this.element.style.top = this.Y + 'px';
                }
           
            }
        }
    }

}

MatchAssetObject.prototype.Position = function (X, Y, Z) {
    this.Pair.MatchAsset.AnswerContainer.insertBefore(this.element, null);
    this.element.style.left = X + 'px';
    this.element.style.top = Y + 'px';
    this.X = X;
    this.Y = Y;
    this.Z = Z;
    if (Z!= null) this.element.style.zIndex = Z;
}

MatchAssetObject.prototype.SetDisplay = function (Display) {
    this.element.style.display = Display ? '' : 'none';
}

MatchAssetObject.prototype.SetStylePart = function (StylePart) {
    this.stylePart = StylePart;
    this.SetStyle();
}

MatchAssetObject.prototype.SetStyle = function () {

    var Style = this.style[this.stylePart];
    this.table.cellPadding = system.GetDataValue(Style, "CellPadding", 0);
    this.table.style.width = '100%';
    this.table.style.height = '100%';
    this.table.style.borderSpacing = '0px';


    if (this.td1) {
        this.td1.style.textAlign = system.GetDataText(Style, "HorizontalAlign", 'left', false);
        this.td1.style.verticalAlign = system.GetDataText(Style, "VerticalAlign", 'top', false);
    }
    if (this.td2) {
        this.td2.style.textAlign = system.GetDataText(Style, "HorizontalAlign", 'left', false);
        this.td2.style.verticalAlign = system.GetDataText(Style, "VerticalAlign", 'top', false);
    }

    if (this.text != '') {
        html.fillText(this.textLayer, Style.Body, this.text);
    }

    try {
        this.element.style.backgroundColor = safeColor(system.GetDataText(Style, "BackgroundColor", null, false));
    }
    catch (e) {

    }
    try {
        var b = system.GetDataText(Style, "Border/Border", null, false);
        if (b == null) b = "";
        this.element.style.borderLeft = system.GetDataText(Style, "Border/BorderLeft", b, false);
        this.element.style.borderRight = system.GetDataText(Style, "Border/BorderRight", b, false);
        this.element.style.borderTop = system.GetDataText(Style, "Border/BorderTop", b, false);
        this.element.style.borderBottom = system.GetDataText(Style, "Border/BorderBottom", b, false);
        this.element.style.padding = system.GetDataText(Style, "Padding", null, false);

    }
    catch (e) {

    }
}

MatchAssetObject.prototype.UpdateData = function(Width, Height, Text, Image, Style){
    this.element.style.width = Width + 'px';
    this.element.style.height = Height + 'px';
    this.W = Width;
    this.H = Height;
    var Orientation = this.Pair.MatchAsset.Orientation;
    if (Orientation != this.orientation || Text != this.text || Image != this.image) {
        if (this.table != null) this.element.removeChild(this.table);
        this.table = html.createElement(this.element, "TABLE");
        
        if (!ie7) {
            var tr1 = html.createElement(this.table, "TR");
            var td1 = html.createElement(tr1, "TD");
        }
        else {
            var tr1 = this.table.insertRow();
            var td1 = tr1.insertCell();
        }
        this.td1 = td1;
        if (Text != '') {
            this.textLayer = html.createElement(td1, "FONT");
            if (Image != '') {
                if (Orientation == 0) {
                    if (!ie7) {
                        var td2 = html.createElement(tr1, "TD");
                    }
                    else {
                        var td2 = tr1.insertCell();
                    }
                    this.td2 = td2;
                }
                else if (Orientation == 1) {
                    if (!ie7) {
                        var tr2 = html.createElement(this.table, "TR");
                        var td2 = html.createElement(tr2, "TD");
                    }
                    else {
                        var tr2 = this.table.insertRow();
                        var td2 = tr2.insertCell();
                    }
                    this.td2 = td2;
                }
                this.imageLayer = html.createElement(td2, "IMG");
            }
        }
        else if (Image != ''){
            this.imageLayer = html.createElement(td1, "IMG");
        }
    }
    if (Image != '') {
        this.imageLayer.src = Image;
    }


    
    this.orientation = Orientation;
    this.text = Text;
    this.image = Image;
    this.style = Style;

    this.SetStyle();
}



//
//slm_mcasset
//
//mc asset

function MCAsset(Page, Data) {
    var _this = this;
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);

    this.ResultsFixed = false;
    this.ResultsChecked = false;

    this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
        if (Editor.selectedControl != this) return false;
        if (Type == 411) {
            var clone = EmptyObject;
            Editor.GenericDataEditComponent.apply();

            if (this.Data.Answers == null) this.Data.Answers = [];
            this.Data.Answers[this.Data.Answers.length] = clone;
            this.UpdateData();

            Editor.GenericDataEditComponent.WYSIWYGUpdate(this, true);

            return true;
        }
        return false;
    }




    if (this.Data["NextPage"] == null) system.saveValueData(this.Data, "NextPage", 0, null);
    if (this.Data["ChangeAnswer"] == null) system.saveValueData(this.Data, "ChangeAnswer", 1, null);
    if (this.Data["Reset"] == null) system.saveValueData(this.Data, "Reset", 0, null);
    if (this.Data["Check"] == null) system.saveValueData(this.Data, "Check", 0, null);


    this.Answers = [];
    this.ShowStatus = false;

    this.container = html.createLayer(this.Surface, null);
    this.Title = html.createText(this.container, null, '');
    this.SubTitle = html.createText(this.container, null, '');
    this.Question = html.createFormattedText(this.container, null, '');
    this.AnswerContainer = html.createLayer(this.container, null);
    this.FeedbackContainer = html.createLayer(this.container, null);
    this.CheckContainer = html.createLayer(this.FeedbackContainer, null);

    this.UpdateData();

    this.CalculateSuspendData = function (data) {
        var sd = '';
        if (this.Randomization != null) {
            for (var i = 0; i < this.Randomization.length; i++) {
                if (sd != '') sd += ',';
                sd += this.Randomization[i];
            }
        }
        sd += '|'+(this.ResultsChecked ? '1' : '0') + '|' + (this.ResultsFixed ? '1' : '0');

        if (_this.Data.L != null) data[_this.Data.L.toString()] = sd;
        for (var i in _this.Answers) {
            _this.Answers[i].CalculateSuspendData(data);
        }
    }
    this.ConsumeSuspendData = function (data) {
        var sd = data[_this.Data.L.toString()];
        if (sd != null) {
            if (sd == '') {
                this.Randomization = null;
                this.ResultsChecked = false;
                this.ResultsFixed = false;
            }
            else {
                var options = sd.split('|');
                if (options[0] == '') {
                    this.Randomization = null;
                }
                else {
                    var sds = options[0].split(',');
                    this.Randomization = [];
                    for (var i = 0; i < sds.length; i++) {
                        this.Randomization[i] = parseInt(sds[i]);
                    }
                }
                this.ResultsChecked = (options[1].toString() == '1');
                this.ResultsFixed = (options[2].toString() == '1');
            }
        }

        if (_this.FieldVariable != '') {
            var sdf = GetFieldAPIFieldByVar(_this.FieldVariable);
            if (sdf != null) sdf = sdf.split('\n');
        }
        for (var i in _this.Answers) {
            _this.Answers[i].ConsumeSuspendData(data);

            if (sdf != null && sdf.indexOf(system.GetDataText(_this.Answers[i].Data, "Answer", '', true)) > -1) {
                _this.SelectAnswer(_this.Answers[i], true);
            }
        }


        if (this.Random == 1) this.UpdateData();
        if (this.ResultsChecked) this.FireCheck(true);
    }

    this.KeyHandler = function (keyCode) {
        var i = -1;
        if (keyCode > 48 && keyCode < 58) i = keyCode - 49;
        if (keyCode > 64 && keyCode < 74) i = keyCode - 65;
        if (i > -1 && i < _this.Answers.length) {
            _this.SelectAnswer(_this.Answers[i], false);
        }
    }
}

MCAsset.prototype.AfterEnter = function () {
    if (!this.Page.BlockKeyboard()) {
        this.kh = html.regKeyHandler(this.KeyHandler);
    }
}



MCAsset.prototype.GetScore = function (cat, fieldtype) {
    if (fieldtype == 1 || fieldtype == 2) {
        var score = 0;
        for (var a in this.Answers) {
            var ans = this.Answers[a];
            if (ans.selected) {
                for (var s in ans.Data.Score) {
                    var sels = ans.Data.Score[s];
                    if (cat == null || system.GetDataValue(sels, "Category", 0) == cat) {
                        score += system.GetDataValue(sels, "Score", 0);
                    }
                }
            }
        }
        return score;
    }
    else if (fieldtype == 3) {
        var check = system.GetDataValue(this.Data, "Check", 0);
        var ms = 0;
        for (var ans in this.Answers) {
            var selans = this.Answers[ans];
            for (var s in selans.Data.Score) {
                var sels = selans.Data.Score[s];
                if (cat == null || system.GetDataValue(sels, "Category", 0) == cat) {
                    var nms = system.GetDataValue(sels, "Score", 0);
                    if (check == 1) {
                        ms += nms;
                    }
                    else {
                        if (nms > ms) ms = nms;
                    }
                }
            }
        }
        return ms;
    }
    else if (fieldtype == 4) {
        var score = 0;

        var cor = true;
        for (var ans in this.Answers) {
            var selans = this.Answers[ans];
            if (system.GetDataValue(selans.Data, "Correct", 0) != (selans.selected ? 1 : 0)) {
                cor = false;
            }
        }
        if (cor) score++;
        return score;
    }
    else if (fieldtype == 5) {
        return 1;
    }
    else if (fieldtype == 11) {
        var score = [];
        for (var a in this.Answers) {
            var ans = this.Answers[a];
            if (ans.selected) {
                for (var s in ans.Data.Score) {
                    var sels = ans.Data.Score[s];
                    if (cat == null || system.GetDataValue(sels, "Category", 0) == cat) {
                        if (system.GetDataValue(sels, "Score", 0) > 0) {
                            score[score.length] = system.GetDataText(ans.Data, "Answer", '-', true)
                        }
                    }
                }
            }
        }
        return score;
    }
}

MCAsset.prototype.UpdateData = function (recurse) {

    this.Page.PositionAsset(this);

    var t = system.GetDataText(this.Data, "Title", '', true);
    if (t != '') {
        this.Title.style.display = '';

        html.fillText(this.Title, (this.Style == null) ? null : this.Style.Title, t);
    }
    else {
        this.Title.style.display = 'none';
    }

    var t = system.GetDataText(this.Data, "SubTitle", '', true);
    if (t != '') {
        this.SubTitle.style.display = '';

        html.fillText(this.SubTitle, (this.Style == null) ? null : this.Style.SubTitle, t);
    }
    else {
        this.SubTitle.style.display = 'none';
    }

    var t = system.GetDataText(this.Data, "Question", '', true);
    if (t != '') {
        this.Question.style.display = '';

        html.fillFormattedText(this.Question, this.Style, t);
    }
    else {
        this.Question.style.display = 'none';
    }


    this.FieldVariable = system.GetDataText(this.Data, "FieldVariable", '', true);
    this.FieldName = "";

    this.Random = system.GetDataValue(this.Data, "Random", 0);
    this.CheckButton = system.GetDataValue(this.Data, "CheckButton", 0);
    this.FeedbackCorrect = system.GetDataText(this.Data, "FeedbackCorrect", '', true);
    this.FeedbackWrong = system.GetDataText(this.Data, "FeedbackWrong", '', true);
    this.AllowNext = system.GetDataValue(this.Data, "AllowNext", 1);
    this.ShowCorrect = system.GetDataValue(this.Data, "ShowCorrect", 1);

    if (this.Data.Answers == null) this.Data.Answers = [];


    var showStatus = (this.Style != null && this.Style.QuestionButtons != null && system.GetDataFile(this.Style.QuestionButtons, "Option", null, false) != null);
    if (showStatus != this.ShowStatus) {
        this.Answers = [];
        this.ShowStatus = showStatus;
    }

    if (this.Randomization == null || this.Randomization.length != this.Data.Answers.length) {
        this.Randomization = GetRandomization(this.Data.Answers.length)
    }

    var data = [];
    if (this.Random == 0) {
        for (var i = 0; i < this.Data.Answers.length; i++) data[i] = this.Data.Answers[i];
    }
    else {
        for (var i = 0; i < this.Data.Answers.length; i++) data[i] = this.Data.Answers[this.Randomization[i]];
    }

    var match = [];
    var firstMatch = null;
    for (var di = 0; di <data.length; di++) {
        var pdata = data[di];
        var found = false;
        match[di] = null;
        for (var pbi = 0; pbi < this.Answers.length; pbi++) {
            if (this.Answers[pbi].Data == pdata) {
                match[di] = this.Answers[pbi];
                found = true;
            }
        }
        if (!found) {
            var np = new MCAnswer(this, pdata);
            this.Answers[this.Answers.length] = np;
            match[di] = np;
        }
        if (match[di].element != null) {
            this.AnswerContainer.insertBefore(match[di].element, null);
            if (firstMatch == null) firstMatch = match[di].element;
        }
    }
    this.Answers = match;

    while (this.AnswerContainer.childNodes.length > 0 && this.AnswerContainer.firstChild != firstMatch) this.AnswerContainer.removeChild(this.AnswerContainer.firstChild);

    for (var pl in this.Answers) {
        this.Answers[pl].UpdateData();
    }
   
    if (this.Style != null && this.Style.QuestionButtons != null) html.styleElement(this.CheckContainer, this.Style.QuestionButtons.LayerButtonCheck);
    if (this.CheckButton == 1 && this.Style != null && this.Style.QuestionButtons != null) {
        if (this.BtnCheckButton == null) {
            var _this = this;
            this.BtnCheckButton = new ImageButton(this.CheckContainer, function () { _this.FireCheck(false); }, this, false, this.Style.QuestionButtons.ButtonCheckDisabled, this.Style.QuestionButtons.ButtonCheck, this.Style.QuestionButtons.ButtonCheckMouse);
        }
        else {
            this.BtnCheckButton.Change(this.Style.QuestionButtons.ButtonCheckDisabled, this.Style.QuestionButtons.ButtonCheck, this.Style.QuestionButtons.ButtonCheckMouse);
        }

    }
    else {
        if (this.BtnCheckButton != null) {
            this.CheckContainer.removeChild(this.BtnCheckButton.element);
            this.BtnCheckButton = null;
        }
    }
    if (this.FeedbackCorrect != '') {
        if (this.LayerFeedbackCorrect == null) {
            this.LayerFeedbackCorrect = html.createFormattedText(this.FeedbackContainer, null, '');
        }
        html.fillFormattedText(this.LayerFeedbackCorrect, this.Style.FeedbackCorrect, this.FeedbackCorrect);
        this.LayerFeedbackCorrect.style.display = 'none';
    }
    else {
        if (this.LayerFeedbackCorrect != null) {
            this.FeedbackContainer.removeChild(this.LayerFeedbackCorrect);
            this.LayerFeedbackCorrect = null;

        }
    }
    //if (this.FeedbackWrong != '') {
        if (this.LayerFeedbackWrong == null) {
            this.LayerFeedbackWrong = html.createFormattedText(this.FeedbackContainer, null, '');
        }
        
        this.LayerFeedbackWrong.style.display = 'none';
    //}
    //else {
    //    if (this.LayerFeedbackWrong != null) {
    //        this.FeedbackContainer.removeChild(this.LayerFeedbackWrong);
    //        this.LayerFeedbackWrong = null;
    //    }
    //}
    if (this.BtnCheckButton != null) {
        if (this.FeedbackContainer.firstChild != this.CheckContainer) this.FeedbackContainer.insertBefore(this.CheckContainer, this.FeedbackContainer.firstChild);
    }

    this.UpdateButtons();
   

}


MCAsset.prototype.AssetEvent = function (Event, Asset, Params) {
    if (Event == "Timer") {
        this.ResultsFixed = true;
        this.FireCheck(false);
    }
    else if (Event == "TimerReset") {
        this.Reset();
    }
    else if (Event == "FixResults") {
        this.ResultsFixed = true;
        this.FireCheck(false);
    }
}

MCAsset.prototype.Enter = function () {
    this.MustSubmit = false;
    if (system.GetDataValue(this.Data, "Reset", 0) == 1 && !this.ResultsFixed) {
        this.Reset();
    }
}

MCAsset.prototype.Leave = function () {
    if (this.kh != null) {
        html.unregKeyHandler(this.kh);
        this.kh = null;
    }
    if (this.MustSubmit) this.Page.SpreadEvent("StudentResponse", this, this.XAPI());
}

MCAsset.prototype.Reset = function () {

    this.Randomization = null;
    this.ResultsFixed = false;


    for (var pl in this.Answers) {
        //WHY? if (this.Answers[pl] == MCAnswer && MCAnswer.selected) return;
        if (this.Answers[pl].selected) this.Answers[pl].UpdateSelected(false);
    }
    this.ReleaseCheck();

    if (this.Random == 1) this.UpdateData();
    this.UpdateButtons();
}


MCAsset.prototype.CanChange = function () {
    if (this.ResultsFixed) return false;
    if (this.ResultsChecked && system.GetDataValue(this.Data, "ChangeAnswer", 0) == 0) return false;
    return true;
}

MCAsset.prototype.SelectAnswer = function (MCAnswer, Silent) {

    if (!Silent && !this.CanChange()) return;
    if (!Silent) this.ReleaseCheck();
    var check = system.GetDataValue(this.Data, "Check", 0);

    if (check == 0) {
        for (var pl in this.Answers) {
            if (this.Answers[pl] == MCAnswer && MCAnswer.selected) return;
            if (this.Answers[pl].selected) this.Answers[pl].UpdateSelected(false);
        }
    }


    if (MCAnswer != null) {
        MCAnswer.UpdateSelected(MCAnswer.selected ? false : true);
    }

    if (this.FieldVariable != '') {
        if (this.FieldVariable.indexOf('#') > -1) {
            var parts = this.FieldVariable.split('#');
            if (parts[1].substr(0, 5) == "score") {
                var cat = parseInt(parts[1].substr(5));
                var score = this.GetScore(cat, 2)
                StoreFieldAPIField(this.Data.L, parts[0], this.FieldName, score.toString(), true);
            }

        }
        else {
            var ans = "";
            for (var pl in this.Answers) {
                if (this.Answers[pl].selected) ans += system.GetDataText(this.Answers[pl].Data, "Answer", '', true) + "\n";
            }
            StoreFieldAPIField(this.Data.L, this.FieldVariable, this.FieldName, ans, true);
        }
    }

    this.UpdateButtons();
    this.MustSubmit = true;
    
    if (MCAnswer != null && !Silent) {
        if (check == 0 && this.CheckButton == 0) this.SubmitResult();
    }
}

MCAsset.prototype.CanNext = function () {

    if (this.AllowNext == 0) return true;
    if (this.CheckButton == 1 && !this.ResultsChecked) return false;
    if (this.AllowNext == 1) {
        return this.Answered();
    }
    if (this.AllowNext == 2) {
        return this.GetScore(null, 4) == this.GetScore(null, 5);
    } 
}

MCAsset.prototype.Answered = function () {
    if (this.ResultsChecked) return true;
    var isSelected = false;
    for (var pl in this.Answers) {
        if (this.Answers[pl].selected) isSelected = true;
    }
    return isSelected;
}

MCAsset.prototype.FireCheck = function (Silent) {
    this.ResultsChecked = true;
    for (var pl in this.Answers) {
        this.Answers[pl].FireCheck();
    }
    if (!Silent) this.SubmitResult();
    this.UpdateButtons();
}
MCAsset.prototype.ReleaseCheck = function () {
    this.ResultsChecked = false;
    for (var pl in this.Answers) {
        this.Answers[pl].ReleaseCheck();
    }
    this.UpdateButtons();
}

MCAsset.prototype.UpdateButtons = function () {
    this.Page.UpdateNavigation();
    if(this.Page.Player.UpdateButtons) this.Page.Player.UpdateButtons();
    var isSelected = false;

    var fbText = '';
    var fbFrame = 0;

    for (var pl in this.Answers) {
        if (this.Answers[pl].selected) isSelected = true;
        
        if (this.Answers[pl].selected != (system.GetDataValue(this.Answers[pl].Data, "Correct", 0) == 1)) {
            if (fbText == '' && this.Answers[pl].Feedback != '') {
                fbText = this.Answers[pl].Feedback;
            }
            if (fbFrame == 0 && this.Answers[pl].FeedbackFrame != 0) {
                fbFrame = this.Answers[pl].FeedbackFrame;
            }
        }
    }
    if (fbText == '') fbText = this.FeedbackWrong;
    if (fbFrame == 0) fbFrame = system.GetDataReference(this.Data, "FrameWrong", 0);


    if (this.CheckButton == 1) {

        this.BtnCheckButton.SetEnabled(isSelected);
    }
    var correct = this.GetScore(null, 4) == this.GetScore(null, 5);
    var ifbck = system.GetDataValue(this.Data, "ImmediateFeedback", 0);
    var showFeedback = this.ResultsChecked || (ifbck && isSelected);
    if (ifbck && isSelected && !this.ResultsChecked) this.FireCheck();

    if (this.LayerFeedbackCorrect != null) {
        this.LayerFeedbackCorrect.style.display = (showFeedback && correct) ? '' : 'none';
    }

    if (this.LayerFeedbackWrong != null) {
        if (this.Style != null) {
            html.fillFormattedText(this.LayerFeedbackWrong, this.Style.FeedbackWrong, fbText);
        }
        this.LayerFeedbackWrong.style.display = (showFeedback && !correct && fbText != '') ? '' : 'none';
    }

    if (showFeedback) {
        if (correct) this.Page.SpreadEvent("LoadFrame", this, { "Page": system.GetDataReference(this.Data, "FrameCorrect", 0) });
        else this.Page.SpreadEvent("LoadFrame", this, { "Page": fbFrame });
    }
    else {
        this.Page.SpreadEvent("LoadFrame", this, { "Page": 0 });
    }
}

MCAsset.prototype.SubmitResult = function () {
    this.MustSubmit = false;
    this.Page.SpreadEvent("StudentResponse", this, this.XAPI());
    this.Page.SpreadEvent("MCChoice", this, null);
    if (system.GetDataValue(this.Data, "NextPage", 0) == 1 && !html.editing) {
        this.Page.Player.Forward();
    }
}


MCAsset.prototype.GetResultsChecked = function () {
    return this.ResultsChecked;
}

MCAsset.prototype.XAPI = function () {

    var result = {
        xapiid: this.Data.L,
        xapiresponse: "",
        xapidefinition: {
            name: system.GetDataLanguageTag(this.Data, "AssetName"),
            description: system.GetDataLanguageTag(this.Data, "Question"),
            type: "http://adlnet.gov/expapi/activities/cmi.interaction",
            interactionType: "choice",
            correctResponsesPattern: [],
            choices: [

            ]
        }
    }

    var response = "";
    var correct = "";
    for (var pl in this.Answers) {
        var l = this.Answers[pl].Data.L;
        if (l != null) {
            if (this.Answers[pl].selected) {
                if (response != "") response = response + "[,]";
                response = response + l.toString();
            }
            if (system.GetDataValue(this.Answers[pl].Data, "Correct", 0) == 1) {
                if (correct != "") correct = correct + "[,]";
                correct = correct + l.toString();
            }
            var answer = {
                id: l.toString(),
                description: system.GetDataLanguageTag(this.Answers[pl].Data, "Answer")

            }
        }
        result.xapidefinition.choices.push(answer);
    }
    result.xapiresponse = response;
    result.xapidefinition.correctResponsesPattern.push(correct);

    return result;
}


function MCAnswer(MCAsset, Data) {

    this.MCAsset = MCAsset;
    this.Data = Data;
    this.td1 = null;
    this.td2 = null;

    if (this.MCAsset.ShowStatus) {
        this.element = html.createLayer(MCAsset.AnswerContainer);
        this.element.style.cursor = 'pointer';
        var tab = html.createElement(this.element, 'table');
        if (!ie7) {
            var row = html.createElement(tab, 'tr');
            var td1 = html.createElement(row, 'td');
            var td2 = html.createElement(row, 'td');
        }
        else {
            var row = tab.insertRow();
            var td1 = row.insertCell();
            var td2 = row.insertCell();
        }
        this.td1 = td1;
        this.td2 = td2;
        this.statusicon = html.prepareInterfaceImage(td1, null);
        this.textelement = html.createFormattedText(td2, null, '');
        this.textelement.style.cursor = 'pointer';
       

    } else {
        this.element = html.createFormattedText(MCAsset.AnswerContainer, null, '');
        this.element.style.cursor = 'pointer';
        this.textelement = this.element;
    }

    html.addEditElement(this.element, this);
    this.EditParent = MCAsset;
    this.EditIsActive = function (Activate) {
        return this.EditParent.EditIsActive(Activate);
    }
    this.FindPage = function () {
        return this.EditParent.FindPage();
    }
    this.EditTryInsert = function (Type, EmptyObject, Offset, Editor) {
        return this.EditInsert(Type, EmptyObject, Offset, Editor);
    }
    this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
        return false;
    }

    this.showanswers = false;
    this.selected = false;
    this.UpdateSelected = function (Selected) {
        this.selected = Selected;
        this.updateSrc();
    }
    this.mouseIn = false;
    this.mouseDown = false;
    var _this = this;
    this.updateSrc = function () {
        if (this.MCAsset.Style == null) return;
        var align = (system.GetDataValue(this.MCAsset.Style, "MCAnswerAlign", 1)==1)?'middle':'top';
        if (this.td1 != null) {
            this.td1.style.verticalAlign = align;
        }
        if (this.td2 != null) {
            this.td2.style.verticalAlign = align;
        }

        if (_this.showanswers && _this.MCAsset.ShowCorrect == 1) {
            if (system.GetDataValue(this.Data, "Correct", 0) == 0) {
                html.styleFormattedElement(_this.element, this.MCAsset.Style.Wrong);
                _this.element.style.backgroundColor = safeColor(system.GetDataText(this.MCAsset.Style.Wrong, "BackgroundColor", null, false));
            }
            else {
                html.styleFormattedElement(_this.element, this.MCAsset.Style.Correct);
                _this.element.style.backgroundColor = safeColor(system.GetDataText(this.MCAsset.Style.Correct, "BackgroundColor", null, false));
            }
        }
        else {
            if (_this.selected) {
                html.styleFormattedElement(_this.element, this.MCAsset.Style.Selected);
                _this.element.style.backgroundColor = safeColor(system.GetDataText(this.MCAsset.Style.Selected, "BackgroundColor", null, false));
            }
            else if (_this.mouseIn && _this.MCAsset.CanChange()) {
                html.styleFormattedElement(_this.element, this.MCAsset.Style.Hover);
                _this.element.style.backgroundColor = safeColor(system.GetDataText(this.MCAsset.Style.Hover, "BackgroundColor", null, false));
            }
            else {
                html.styleFormattedElement(_this.element, this.MCAsset.Style.NotSelected);
                _this.element.style.backgroundColor = safeColor(system.GetDataText(this.MCAsset.Style.NotSelected, "BackgroundColor", null, false));
            }
        }

        if (this.statusicon != null) {
            var multi = system.GetDataValue(this.MCAsset.Data, "Check", 0);
            if (_this.selected) {
                if (_this.mouseIn && _this.MCAsset.CanChange()) {
                    this.statusicon.src = system.GetDataFile(this.MCAsset.Style.QuestionButtons, multi ? "CheckFilledMouse" : "OptionFilledMouse", "", false);
                }
                else {
                    this.statusicon.src = system.GetDataFile(this.MCAsset.Style.QuestionButtons, multi ? "CheckFilled" : "OptionFilled", "", false);
                }
            }
            else {
                if (_this.mouseIn && _this.MCAsset.CanChange()) {
                    this.statusicon.src = system.GetDataFile(this.MCAsset.Style.QuestionButtons, multi ? "CheckMouse" : "OptionMouse", "", false);
                }
                else {
                    this.statusicon.src = system.GetDataFile(this.MCAsset.Style.QuestionButtons, multi ? "Check" : "Option", "", false);
                }
            }
        }
    }

    if (supportsTouch) {
        _this.element.ontouchstart = function (e) {
            e.preventDefault();
            if (e.touches.length == 1) {
                if (!_this.MCAsset.Page.Player.Block.menuUp) {
                    if (e.stopPropagation) e.stopPropagation();
                    _this.MCAsset.SelectAnswer(_this, false);
                }
            }
        };
    }
    //else {

        _this.element.onmouseover = function () {
            if (!_this.MCAsset.Page.Player.Block.menuUp) {
                _this.mouseIn = true;
                _this.updateSrc();
            }
        };
        _this.element.onmouseout = function () {
            _this.mouseIn = false;
            _this.updateSrc();
        };
        _this.element.onmousedown = function (e) {
            if (e == null)
                e = window.event;

            if (!_this.MCAsset.Page.Player.Block.menuUp && !html.editing) {
                if (e.stopPropagation) e.stopPropagation();
                _this.mouseDown = true;


                return false;
            }

        };
        _this.element.onmouseup = function () {
            _this.mouseDown = false;
            if (_this.mouseIn) _this.MCAsset.SelectAnswer(_this, false);
        };
    //}

    this.CalculateSuspendData = function (data) {
        var sd = '';
        sd += (_this.selected ? '1' : '0');
        if (_this.Data.L != null) data[_this.Data.L.toString()] = sd;
    }
    this.ConsumeSuspendData = function (data) {
        var sd = data[_this.Data.L.toString()];
        if (sd != null) {
            var sds = sd.split(',');
            if (sds.length >= 1 && sds[0] == '1') {
                _this.MCAsset.SelectAnswer(_this, true);
            }
        }
    }

}

MCAnswer.prototype.FireCheck = function () {
    this.showanswers = true;
    this.updateSrc();
}
MCAnswer.prototype.ReleaseCheck = function () {
    this.showanswers = false;
    this.updateSrc();
}

MCAnswer.prototype.UpdateData = function () {

    html.fillFormattedText(this.textelement, this.Style, system.GetDataText(this.Data, "Answer", '-', true));
    this.Feedback = system.GetDataText(this.Data, "Feedback", '', true);
    this.FeedbackFrame = system.GetDataReference(this.Data, "FeedbackFrame", 0);

    this.updateSrc();
}




//
//slm_page
//
//PAGES

function Page(Player, Owner, Data, Cols, Rows) {
    var _this = this;
    this.Seen = false;
    this.RequiredCols = Cols;
    this.RequiredRows = Rows;
    this.Mark = 0;
    this.MCChoice = false;

    this.Player = Player;
    this.Data = Data;
    this.Assets = new Array();

    this.HasScore = false;

    this.NavigationButton = new NavigationButton(this.Player.navigationButtonContainer, null, this, this.Player.Block, true);


    this.Owner = Owner;

    this.Grid = html.createLayer(Owner, this.Player.Block.skinRapidElearning.GridStyle);
    this.container = this.Grid;
    this.Surface = this.Grid;

    html.addEditElement(this.Grid, this);
    this.EditParent = Player;

    this.EditViewing = function (list) {
        if (this.Data.P != null) list[this.Data.P.toString()] = true;
        //TODO! : ADD ALL SUBITEMS
        for (var i in this.Assets) {
            this.Assets[i].EditViewing(list);
        }
    }

    this.EditTryInsert = function (Type, EmptyObject, Offset, Editor) {
        
        for (var i in this.Assets) {
            if (this.Assets[i].EditTryInsert(Type, EmptyObject, Offset, Editor)) return true;
        }
        if (this.EditInsert(Type, EmptyObject, Offset, Editor)) return true;
        return false;
    }
    this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
        for (var i in this.Assets) {
            if (this.Assets[i].EditInsert(Type, EmptyObject, Offset, Editor)) return true;
        }
        if (system.GetDataNode(system.GetKnownNodeData(Type), "Extends", 0) == 400) {
            var clone = EmptyObject;

            if (Offset != null) {
                var ga = system.GetDataValue(clone, "GridAlign", 1);
                var col = Math.floor(Offset[0] / (ga?this.ColWidth:1));
                var row = Math.floor(Offset[1] / (ga?this.RowHeight:1));

                system.saveValueData(clone, "Left", col, null);
                system.saveValueData(clone, "Top", row, null);
            }


            if (clone.AssetStyle == null) {

                var Def = system.GetPropertyType(EmptyObject.P).AssetStyle;
                var contpath = system.GetDataText(Def, "ContainerPath", "", false);
                var proppath = system.GetDataText(Def, "PropertyPath", "", false);
                //var colorpath = system.GetDataText(Def, "ColorPath", "", false);

                var cont = system.GetDataNode(this.Player.Block.Data, contpath, null);
                if (cont != null) {
                    system.RequireNodeID(cont, this, function (sender, node) {

                        var prop = system.GetDataKey(node.data, proppath.split('/'), null);
                        if (prop != null) {
                            for (var i in prop) {
                                if (prop[i].PreferredAssetTypes != null) {
                                    for (var j in prop[i].PreferredAssetTypes) {
                                        if (system.GetDataNode(prop[i].PreferredAssetTypes[j], "PreferredAssetType") == EmptyObject.P) {
                                            system.saveValueData(clone, "AssetStyle", system.GetDataValue(prop[i], "Key", 0), null);
                                        }
                                    }
                                }
                            }
                        }
                    }, 2, false, 0);
                }
            }

            Editor.GenericDataEditComponent.apply();

            if (this.Data.Assets == null) this.Data.Assets = [];
            this.Data.Assets[this.Data.Assets.length] = clone;
            this.UpdateData();
            Editor.GenericDataEditComponent.WYSIWYGUpdate(this, true);

            var asset = this.Assets[this.Assets.length - 1];

            Editor.selectElement(asset.Surface, asset);
            return true;
        }
        return false;

    }
    this.EditIsActive = function (Activate) {
        if (Activate) {
            this.Player.EditIsActive(Activate);
            if (this.Player.CurrentPage != this) {
                this.Player.ActivatePage(this);
            }
        }
        return this.Player.CurrentPage == this && this.Player.EditIsActive();
    }

   
    this.UpdateData();


    this.CalculateSuspendData = function (data) {
        var sd = '';
        sd += (_this.Seen ? '1' : '0');
        sd += ',' + _this.Mark;
        sd += ',' + (_this.MCChoice ? '1' : '0');
        if (_this.Data.L != null) {
            data[_this.Data.L.toString()] = sd;

            for (var i in _this.Assets) {
                if (_this.Assets[i].CalculateSuspendData) _this.Assets[i].CalculateSuspendData(data);
            }
        }
    }
    this.ConsumeSuspendData = function (data) {
        var sd = data[_this.Data.L.toString()];
        if (sd != null) {
            var sds = sd.split(',');
            if (sds.Length >= 3) _this.MCChoice = ExtractNumber(sds[2])==1;
            if (sds.Length >= 2) _this.Mark = ExtractNumber(sds[1]);
            if (sds.length >= 1 && sds[0] == '1') {
                _this.Seen = true;
                _this.UpdateNavigation();
            }
        }
        for (var i in _this.Assets) {
            if (_this.Assets[i].ConsumeSuspendData) _this.Assets[i].ConsumeSuspendData(data);
        }
    }
}

Page.prototype.PageType = function () {
    return system.GetDataValue(this.Data, "PageType", 0);
}

Page.prototype.GetScore = function (cat, fieldtype) {

    if (fieldtype == 11) {
        var score = [];
    }
    else {
        var score = 0;
    }

    if (system.GetDataValue(this.Data, "PageType", 0) != 0 && system.GetDataValue(this.Data, "PageType", 0) != 4) return score;


    var correct = 1;
    var found = 0;
    for (var p in this.Assets) {
        var selp = this.Assets[p];
        if (selp.GetScore) {

            if (fieldtype == 11) {
                score = score.concat(selp.GetScore(cat, fieldtype));
            }
            else {



                var s = selp.GetScore(cat, fieldtype);
                correct *= s;
                score += s;
                found++;
            }
        }
        else if (selp.GetScoreGhost) {
            var s = selp.GetScoreGhost(cat, fieldtype);
            if (s != null) {
                var f = selp.GetScoreGhost(cat, 5);
                if (f > 0) {
                    correct *= s;
                    score += s;
                    found += f;
                }
            }
        }
    }

    if (fieldtype == 4) {
        return (found > 0 && correct > 0) ? 1 : 0;
    }
    else if (fieldtype == 5) {
        return (found > 0) ? 1 : 0;
    }
    else {
        return score;
    }

}

Page.prototype.CreateAsset = function (Data) {
    if (Data.P == null) {
        Data.P = 1;
    }
    if (Data.P == 401) {
        return new TextAsset(this, Data);
    }
    else if (Data.P == 402) {

        return new ImageAsset(this, Data);
    }
    else if (Data.P == 403) {

        return new VideoAsset(this, Data);
    }
    else if (Data.P == 404) {

        return new MCAsset(this, Data);
    }
    else if (Data.P == 405) {

        return new ResultAsset(this, Data);
    }
    else if (Data.P == 406) {

        return new ExternAsset(this, Data);
    }
    else if (Data.P == 407) {

        return new IMAPAsset(this, Data);
    }
    else if (Data.P == 408) {

        return new TimerAsset(this, Data);
    }
    else if (Data.P == 409) {

        return new ButtonAsset(this, Data);
    }
    else if (Data.P == 410) {

        return new PDFAsset(this, Data);
    }
    else if (Data.P == 593) {

        return new YouTubeAsset(this, Data);
    }
    else if (Data.P == 757) {

        return new FrameAsset(this, Data);
    }
    else if (Data.P == 758) {

        return new AreaAsset(this, Data);
    }
    else if (Data.P == 1506) {

        return new HotspotAsset(this, Data);
    }
    else if (Data.P == 1508) {

        return new InputAsset(this, Data);
    }
    else if (Data.P == 1369) {
        return new MatchAsset(this, Data);
    }
    else if (Data.P == 3580) {
        return new UploadAsset(this, Data);
    }
    else if (Data.P == 3818) {
        return new RectangleAsset(this, Data);
    }
    else if (Data.P == 3853) {
        return new SimulationAsset(this, Data);
    }
    else if (Data.P == 3942) {
        return new SocialAsset(this, Data);
    }
    else if (Data.P == 8899) {
        return new HarmonicaAsset(this, Data);
    }
    else if (Data.P == 8903) {
        return new FrameNavAsset(this, Data);
    }

}


Page.prototype.FindPage = function () {
    return this;
}

Page.prototype.BlockKeyboard = function () {
    var block = false;
    for (var p in this.Assets) {
        var selp = this.Assets[p];
        if (selp.Data.P == 1508) {
            block = true;
        }
    }
    return block;
}

Page.prototype.SpreadEvent = function (Event, Asset, Params) {
    if (Event == "StudentResponse") {
        var response = {};
        var result = 100;
        this.CalculateSuspendData(response);
       
        if (this.Player.ScoreMethod == 4) {
            var t = this.GetScore(null, 3);
            var n = this.GetScore(null, 2);
            if (t > 0) result = Math.round(n * 100 / t);
        }
        else {
            var t = this.GetScore(null, 5);
            var n = this.GetScore(null, 4);
            if (t > 0) result = Math.round(n * 100 / t);
        }
        var xapidefinition = null
        var xapiid =  null;
        var xapiresponse = null;
        if (Params != null) {
            xapidefinition = Params.xapidefinition;
            xapiid = Params.xapiid;
            xapiresponse = Params.xapiresponse;
        }
        SetInteraction(this.Data.L, JSON.stringify(response), result, xapidefinition, xapiid, xapiresponse);
    }
    if (Event == "LoadPage") {
        if (Params.Page == this.Data.L) {
            Params.Found = true;
            return;
        }
    }
    if (Event == "FixResults") {
        this.SetMark(2);
    }
    if (Event == "Toggle") {
        this.CheckToggle();
    }
    if (Event == "MCChoice" || Event == "Timer") {
        if (Params != null && Params.Check == 1) {
            this.MCChoice = true;
            this.UpdateNavigation();
        }
    }

    for (var a in this.Assets) {
        var ass = this.Assets[a];
        if (ass.AssetEvent) ass.AssetEvent(Event,Asset, Params);
    }
}

Page.prototype.CheckToggle = function () {
    var done = true;
    for (var a in this.Assets) {
        var ass = this.Assets[a];

        if (ass.IsDone && ass.ConditionalShow) {
            done = done && ass.IsDone();
        }
    }
    if (done) {
        var juid = system.GetDataReference(this.Data, "JumpDone", 0);
        if (juid != 0 && Consuming == false) {
            this.Player.Block.SpreadEvent("LoadPage", this, { "Page": juid, "Found": false, "ActivatePage": null });
        }
    }
}

Page.prototype.SetMark = function (mark) {
    if (mark == 2) {
        this.Mark = 2;
    }
    else {
        if (this.Mark != 2) {
            this.Mark = mark;
        }
    }
    this.UpdateNavigation();
}

Page.prototype.AddAsset = function (Asset) {

    Asset.Surface = html.createLayer(this.Grid, null);
    Asset.Surface.style.position = 'absolute';
    Asset.GridAlign = system.GetDataValue(Asset.Data, "GridAlign", 1)==1;
    html.addEditElement(Asset.Surface, Asset);
    Asset.EditParent = this;
    var _this = this;
    Asset.EditIsActive = function (Activate) {

        return _this.EditIsActive(Activate);
    }

    Asset.FindPage = function () {
        return _this;
    }
    if (!Asset.EditTryInsert) {
        Asset.EditTryInsert = function (Type, EmptyObject, Offset, Editor) {
            return this.EditInsert(Type, EmptyObject, Offset, Editor);
        }
    }
    if (!Asset.EditViewing) {
        Asset.EditViewing = function (list) {
            list[this.Data.P.toString()] = true;
            //TODO! : ADD ALL SUBITEMS
        }
    }
    if (!Asset.EditInsert) {
        Asset.EditInsert = function (Type, EmptyObject, Offset, Editor) {
            return false;
        }
    }

    Asset.MoveDelta = function (x, y) {
        var newLeft = Math.round(x / (Asset.GridAlign ? Asset.Page.ColWidth : 1)) + Asset.start[0];
        var newTop = Math.round(y / (Asset.GridAlign ? Asset.Page.RowHeight : 1)) + Asset.start[1];
        var newWidth = Asset.start[2];
        var newHeight = Asset.start[3];

        var mw =  Asset.GridAlign ? Asset.Page.Cols : Asset.Page.Player.GetWidth();
        var mh = Asset.GridAlign ? Asset.Page.Rows : Asset.Page.Player.GetHeight();

        if (newLeft >= mw) newLeft = mw - 1;
        if (newLeft < 0) newLeft = 0;
        if (newLeft + newWidth > mw) newWidth = mw - newLeft;
        if (newTop >= mh) newTop = mh - 1;
        if (newTop < 0) newTop = 0;
        if (newTop + newHeight > mh) newHeight = mh - newTop;

        var a = Asset.Data;
        if (system.GetDataValue(a, "Left", 0) != newLeft ||
        system.GetDataValue(a, "Top", 0) != newTop ||
        system.GetDataValue(a, "Width", 0) != newWidth ||
        system.GetDataValue(a, "Height", 0) != newHeight) {

            system.saveValueData(a, "Left", newLeft, null);
            system.saveValueData(a, "Top", newTop, null);
            system.saveValueData(a, "Width", newWidth, null);
            system.saveValueData(a, "Height", newHeight, null);


            Asset.Page.PositionAsset(Asset);
            Asset.UpdateData();
            return true;
        }
        else return false;
    }

    Asset.SizeDelta = function (x, y) {
        var newLeft = Asset.start[0];
        var newTop = Asset.start[1];
        var newWidth = Math.round(x / (Asset.GridAlign?Asset.Page.ColWidth:1)) + Asset.start[2];
        var newHeight = Math.round(y / (Asset.GridAlign?Asset.Page.RowHeight:1)) + Asset.start[3];

        var mw = Asset.GridAlign ? Asset.Page.Cols : Asset.Page.Player.GetWidth();
        var mh = Asset.GridAlign ? Asset.Page.Rows : Asset.Page.Player.GetHeight();
        if (newWidth < 1) newWidth = 1;
        if (newWidth + newLeft > mw) newWidth = mw - newLeft;
        if (newHeight < 1) newHeight = 1;
        if (newHeight + newTop > mh) newHeight = mh - newTop;

        var a = Asset.Data;
        if (system.GetDataValue(a, "Left", 0) != newLeft ||
        system.GetDataValue(a, "Top", 0) != newTop ||
        system.GetDataValue(a, "Width", 0) != newWidth ||
        system.GetDataValue(a, "Height", 0) != newHeight) {

            system.saveValueData(a, "Left", newLeft, null);
            system.saveValueData(a, "Top", newTop, null);
            system.saveValueData(a, "Width", newWidth, null);
            system.saveValueData(a, "Height", newHeight, null);

            Asset.Page.PositionAsset(Asset);
            Asset.UpdateData();
            return true;
        }
        else return false;
    }

    Asset.ResetDelta = function (x, y) {
        //copy changes to image asset!!!
        Asset.start = [
        system.GetDataValue(Asset.Data, "Left", 0),
        system.GetDataValue(Asset.Data, "Top", 0),
        system.GetDataValue(Asset.Data, "Width", 1),
        system.GetDataValue(Asset.Data, "Height", 1)

        ];
    }

    Asset.Delete = function () {
        var i = arrayIndexOf(Asset.Page.Data.Assets,Asset.Data);
        if (i > -1) {
            Asset.Page.Data.Assets.splice(i, 1);
            Asset.Page.UpdateData();
            return true;
        }
    }
    Asset.Front = function () {
        var i = arrayIndexOf(Asset.Page.Data.Assets,Asset.Data);
        if (i > -1) {
            Asset.Page.Data.Assets.splice(i, 1);
            Asset.Page.Data.Assets[Asset.Page.Data.Assets.length] = Asset.Data;
            Asset.Page.UpdateData();
            return true;
        }
    }
}

Page.prototype.PositionAsset = function (Asset) {
    var a = Asset.Data;

    if (a.AssetStyle == null) system.saveValueData(a, "AssetStyle", 0, null);
    if (a.Left == null) system.saveValueData(a, "Left", 0, null);
    if (a.Top == null) system.saveValueData(a, "Top", 0, null);
    if (a.Width == null) system.saveValueData(a, "Width", 1, null);
    if (a.Height == null) system.saveValueData(a, "Height", 1, null);

    var AssetStyle = this.Player.Block.GetAssetStyle(system.GetDataValue(a, "AssetStyle", 0));
    Asset.Style = AssetStyle;

    var AssetSurface = Asset.Surface;

    html.styleElement(AssetSurface, AssetStyle);

    var marWidth = ExtractNumber(AssetSurface.style.marginLeft) + ExtractNumber(AssetSurface.style.marginRight);
    var divWidth = ExtractNumber(AssetSurface.style.paddingLeft) + ExtractNumber(AssetSurface.style.paddingRight) + ExtractNumber(AssetSurface.style.borderLeft) + ExtractNumber(AssetSurface.style.borderRight);
    var marHeight = ExtractNumber(AssetSurface.style.marginTop) + ExtractNumber(AssetSurface.style.marginBottom);
    var divHeight = ExtractNumber(AssetSurface.style.paddingTop) + ExtractNumber(AssetSurface.style.paddingBottom) + ExtractNumber(AssetSurface.style.borderTop) + ExtractNumber(AssetSurface.style.borderBottom);

    var nga = system.GetDataValue(a, "GridAlign", 1)==1;
    if (nga != Asset.GridAlign) {
        if (nga) {
            system.saveValueData(a, "Left", Math.round(system.GetDataValue(a, "Left", 0)/this.ColWidth), null);
            system.saveValueData(a, "Top", Math.round(system.GetDataValue(a, "Top", 0) / this.RowHeight), null);
            system.saveValueData(a, "Width", Math.round(system.GetDataValue(a, "Width", 1) / this.ColWidth), null);
            system.saveValueData(a, "Height", Math.round(system.GetDataValue(a, "Height", 1) / this.RowHeight), null);
        }
        else {
            system.saveValueData(a, "Left", Math.round(system.GetDataValue(a, "Left", 0) * this.ColWidth), null);
            system.saveValueData(a, "Top", Math.round(system.GetDataValue(a, "Top", 0) * this.RowHeight), null);
            system.saveValueData(a, "Width", Math.round(system.GetDataValue(a, "Width", 1) * this.ColWidth), null);
            system.saveValueData(a, "Height", Math.round(system.GetDataValue(a, "Height", 1) * this.RowHeight), null);
        }
        Asset.GridAlign = nga;
    }

    AssetSurface.style.left = Math.round((nga ? this.ColWidth : 1) * system.GetDataValue(a, "Left", 0)) + 'px';
    AssetSurface.style.top = Math.round((nga ? this.RowHeight : 1) * system.GetDataValue(a, "Top", 0)) + 'px';
    var w = Math.round((nga?this.ColWidth:1) * system.GetDataValue(a, "Width", 1) - divWidth - marWidth);
    if (w < 0) w = 0;
    AssetSurface.style.width =w + 'px';
   
    var h = Math.round((nga ? this.RowHeight : 1) * system.GetDataValue(a, "Height", 1) - divHeight - marHeight);
    if (h < 0) {
        h = 0;
    }
    AssetSurface.style.height = h + 'px';
    AssetSurface.style.overflow = 'hidden';
}


Page.prototype.CheckResultConditions = function (Conditions) {
    if (Conditions != null) {
        var positiveConditions = false;
        var onepositive = false;

        var negativeConditions = false;
        var allnegative = true;
        for (var ci = 0; ci < Conditions.length; ci++) {
            var c = Conditions[ci];
            if (c.P == 3261) {

                var level = system.GetDataValue(c, "Level", 0);
                if (level == 0) {
                    target = this.Player;
                }
                else if (level == 2) {
                    target = this;
                }
                else {
                    target = this.Player.Block;
                }


                var vv = system.GetDataValue(c, "Category", 0);
                if (vv > -1) {
                    var f = system.GetDataValue(c, "Function", 0);
                    var v = system.GetDataValue(c, "Category", 0);


                    var s = target.GetScore(v, 2);

                    var val = system.GetDataText(c, "Value", 0, false);
                    if (f == 0) {
                        positiveConditions = true;
                        if (s == val) onepositive = true;
                    }
                    else {
                        negativeConditions = true;
                        if (f == 1) {

                            if (s == val) allnegative = false;
                        }
                        else if (f == 2) {
                            if (s >= val) allnegative = false;
                        }
                        else if (f == 3) {
                            if (s <= val) allnegative = false;
                        }
                    }
                }
            }

        }
        if (((positiveConditions && onepositive) || !positiveConditions) && allnegative) {
            return true;
        }
        return false;
    }
    else {
        return true;
    }
}

Page.prototype.AddScroll = function() {
    if (!this.scroller){

        this.scroller = new Scroller(this);
        

        html.addDragElement(this.container, this);
        this.DragDelta = function (x, y) {
            var target = (y + this.startPos[1]);
            if (target > 0) target = 0;
            var h = this.Surface.offsetHeight - ExtractNumber(this.Surface.style.paddingTop) - ExtractNumber(this.Surface.style.paddingBottom);
            if (target < (h - this.GetContentHeight())) target = (h - this.GetContentHeight());
            this.container.style.top = target + 'px';
            if (this.scroller) {
                this.scroller.UpdateScroll();
            }

        }
        this.DragStart = function (x, y) {
            y = ExtractNumber(this.container.style.top);
            this.startPos = [x, y];
           

        }
        this.DragStop = function (x, y, target, offset) {
            if (x > -10 && x < 10 && y > -10 && y < 10 && this.Clicked) {
                this.Clicked();
            }
            return false;
        }
        
        var _this = this;
        var ff = (/Firefox/i.test(navigator.userAgent));
        this.Surface[ff? "onwheel" : "onmousewheel"] = function (e) {
            var evt = window.event || e;
            var delta = ff ? (evt.deltaY * -40) : (evt.detail ? (evt.detail * -120) : evt.wheelDelta);
            _this.ScrollDelta(delta);
            evt.cancelBubble = true;
            if (evt.stopPropagation) evt.stopPropagation();

        }
        
        

    }
    this.scroller.UpdateScroll();
}


Page.prototype.UpdateData = function (recurse) {
    this.PixelWidth = this.Player.GetWidth();
    this.PixelHeight = this.Player.GetHeight();
    this.Style = this.Player.Style?this.Player.Style:this.Player.PlayerStyle;

    var dc = system.GetDataValue(this.Data, "Cols", 0);
    var dr = system.GetDataValue(this.Data, "Rows", 0);
    var scroll = system.GetDataValue(this.Data, "Scroll", 0);

    var forceRecurse = false;

    var oc = this.Cols;
    var or = this.Rows;
    var ocw = this.ColWidth;
    var orh = this.RowHeight;

    this.Cols = ((dc == 0) ? this.RequiredCols : dc);
    this.ColWidth = this.PixelWidth / this.Cols;

    if (scroll && dr>0) {
        if (this.Surface == this.container) {
            this.Surface = document.createElement("DIV");
            this.Owner.insertBefore(this.Surface, this.Grid);
            this.Surface.appendChild(this.Grid);
            this.Surface.style.position = 'absolute';
            this.Surface.style.display = this.Grid.style.display;
            this.Grid.style.display = 'inline';
            this.Surface.style.left = this.Grid.style.left;
            this.Surface.style.top = this.Grid.style.top;
        }

        this.Surface.style.width = this.PixelWidth + 'px';
        this.Surface.style.height = this.PixelHeight + 'px';
        this.Surface.style.overflow = 'hidden';

        this.Rows = dr;
        this.RowHeight = this.PixelHeight / this.RequiredRows;
        this.PixelHeight = this.Rows * this.RowHeight;



        this.AddScroll();
    }
    else {
        this.Rows = ((dr == 0) ? this.RequiredRows : dr);
        this.RowHeight = this.PixelHeight / this.Rows;
        if (this.scroller) this.scroller.UpdateScroll();
    }


    this.Grid.style.width = this.PixelWidth + 'px';
    this.Grid.style.height = this.PixelHeight + 'px';

    if (oc != this.Cols || or != this.Rows || ocw != this.ColWidth || orh != this.RowHeight) forceRecurse = true;

    if (this.Data.Assets == null) this.Data.Assets = [];


    var OrderedAssets = [];//this.Data.Pages;
    for (var i = 0; i < this.Data.Assets.length; i++) {
        var p = this.Data.Assets[i];
        var include = this.Player.Block.CanEdit;
        if (!include) include = CheckConditions(p.Conditions);
        if (include) {
            OrderedAssets[OrderedAssets.length] = p;
        }
    }

    var match = [];
    var firstMatch = null;
    this.HasScore = false;
    for (var di = 0; di < OrderedAssets.length; di++) {
        var pdata = OrderedAssets[di];
        var found = false;
        match[di] = null;
        for (var pbi = 0; pbi < this.Assets.length; pbi++) {
            if (this.Assets[pbi].Data == pdata) {
                match[di] = this.Assets[pbi];
                found = true;
                this.HasScore |= (match[di].GetScore != null);
            }
        }
        if (!found) {
            var np = this.CreateAsset(pdata);
            np.ConditionalShow = true;
            this.Assets[this.Assets.length] = np;
            match[di] = np;
            this.HasScore |= (np.GetScore != null);
        }
        if (match[di].Surface != null) {
            this.Grid.insertBefore(match[di].Surface, null);
            if (firstMatch == null) firstMatch = match[di].Surface;
        }
    }
    this.Assets = match;

    while (this.Grid.childNodes.length > 0 && this.Grid.firstChild != firstMatch) {
        stopVideos(this.Grid.firstChild);
        this.Grid.removeChild(this.Grid.firstChild);
    }

    if (recurse || forceRecurse) {
        for (var pl in this.Assets) {
            this.Assets[pl].UpdateData(recurse);
        }
    }

    if (this.scroller) {
        this.scroller.UpdateScroll();
    }
}

Page.prototype.Reset = function () {
    this.Mark = 0;
    this.Seen = false;
    this.MCChoice = false;
    for (var i in this.Assets) {
        var a = this.Assets[i];
        if (a.Reset) a.Reset();
    }
    this.UpdateNavigation();
    
}

Page.prototype.Leave = function () {
    for (var i in this.Assets) {
        var a = this.Assets[i];
        if (a.Leave) a.Leave();
    }
}


Page.prototype.SuspendBeforePopup = function () {
    for (var i in this.Assets) {
        var a = this.Assets[i];
        if (a.SuspendBeforePopup) a.SuspendBeforePopup();
    }
}

Page.prototype.ResumeAfterPopup = function () {
    for (var i in this.Assets) {
        var a = this.Assets[i];
        if (a.ResumeAfterPopup) a.ResumeAfterPopup();
    }
}

Page.prototype.UpdateResultConditions = function () {
    for (var i in this.Assets) {
        var a = this.Assets[i];
        if (a.Data && a.Data.Conditions) {
            if (a.Data.Conditions.length > 0) {
                a.ConditionalShow = this.CheckResultConditions(a.Data.Conditions) || html.editing;
                a.Surface.style.display = a.ConditionalShow ? '' : 'none';
            }
        }
    }
}

Page.prototype.AfterEnter = function () {
    for (var i in this.Assets) {

        var a = this.Assets[i];
        if (a.AfterEnter) a.AfterEnter();
    }

    if (this.scroller) {
        this.scroller.UpdateScroll();
    }
}


Page.prototype.Enter = function () {
    for (var i in this.Assets) {
   
        var a = this.Assets[i];
        if (a.Enter) a.Enter();
    }
    this.Seen = true;
    this.UpdateResultConditions();
    this.UpdateNavigation();

    if (this.HasScore) {
        PrepareInteraction(this.Data.L, 'performance', 1);
    }
    this.CheckToggle();

    if (!html5 && !ie8) {
        //fix for ie7 redraw issue
        try {
            this.Surface.parentNode.style.cssText += "";
            this.Surface.parentNode.style.zoom = 1;
            this.Surface.style.cssText += "";
            this.Surface.style.zoom = 1;
            this.Grid.style.cssText += "";
            this.Grid.style.zoom = 1;
        } catch (ex) { }
    }

    var juid = system.GetDataReference(this.Data, "JumpDirect", 0);
    if (juid != 0 && Consuming == false && juid != this.Data.L) {
        this.Player.Block.SpreadEvent("LoadPage", this, { "Page": juid, "Found": false, "ActivatePage": null });
    }
    var v = system.GetDataFile(this.Data.Voice, null, '', true)
    this.Player.Block.Voice(v);
}

Page.prototype.CanNext = function () {
    var result = true;

    for (var i in this.Assets) {
        var a = this.Assets[i];
        if (a.CanNext) result &= a.CanNext();
    }
    return result;
}


Page.prototype.Answered = function () {
    var result = true;
    for (var i in this.Assets) {
        var a = this.Assets[i];
        if (a.Answered) if (!a.Answered()) result = false;
    }
    return result;
}

Page.prototype.UpdateNavigation = function () {
    var allresultschecked = true;
    var noresults = true;
    for (var i in this.Assets) {
        var a = this.Assets[i];
        if (a.GetResultsChecked) {
            noresults = false;
            allresultschecked &= a.GetResultsChecked();
        }
    }

    if (this.MCChoice) {
        var c = this.GetScore(null, 4);
        var t = this.GetScore(null, 5);
        if (t > 0) {
            this.NavigationButton.changeCorrect(c == t, this.Seen, this.Mark);
            return;
        }
    }

    if (!allresultschecked || noresults) this.NavigationButton.changeCorrect(null, this.Seen, this.Mark);
    else {
        var c = this.GetScore(null, 4);
        var t = this.GetScore(null, 5);
        this.NavigationButton.changeCorrect(c==t, this.Seen, this.Mark);
    }
    
}

Page.prototype.ScrollDelta = function (delta) {
    var target = ExtractNumber(this.container.style.top) + delta / 5;
    if (target > 0) target = 0;
    var h = this.GetSurfaceHeight();
    if (target < (h - this.GetContentHeight())) target = (h - this.GetContentHeight());
    this.container.style.top = target + 'px';
    if (this.scroller) {
        this.scroller.UpdateScroll();
    }
}

Page.prototype.GetSurfaceHeight = function () {
    return this.Player.GetHeight();
}

Page.prototype.GetPlainSurfaceHeight = function () {
    return this.Player.GetHeight();
}

Page.prototype.GetContentHeight = function () {
    return this.PixelHeight;
}


Page.prototype.AfterUpdateScroll = function () {
    if (this.Player.Block.Editor != null) this.Player.Block.Editor.updateEditRectPosition();
}

//
//slm_pdfasset
//
//PDF

function PDFAsset(Page, Data) {
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);



    this.embed = null;
    this.href = null;

    this.ConsumeSuspendData = function (data) {
        if (system.GetDataValue(this.Data, "UseFieldAPI", 0) == 1) {
            this.UpdateData();
        }
    }

    this.UpdateData();
}

PDFAsset.prototype.UpdateData = function () {
    this.Page.PositionAsset(this);

    var showDocument = system.GetDataValue(this.Data, "ShowDocument", 0);
    var showMailButton = system.GetDataValue(this.Data, "Email", 0);
    var showDownload = system.GetDataValue(this.Data, "Download", 1);
    var _this = this;


    if (showDocument) {
        if (this.href != null) {
            this.Surface.removeChild(this.href);
            this.href = null;
        }

        if (this.frame == null) {
            this.frame = html.createElement(this.Surface, "iframe");
            this.frame.style.border = '0px';
           
        }
        this.frame.style.position = 'absolute';
        this.frame.style.width = this.Surface.style.width;
        this.frame.style.height = this.Surface.style.height;

        if (system.GetDataValue(this.Data, "UseFieldAPI", 0) == 1) {
            if (FieldAPIData != null) {
                this.frame.src = GetFieldAPIUrl( "/Document.aspx?Token=" + FieldAPIData.Token + "&Student=" + FieldAPIStudent + "&Template=" + FileObjectByFileResourceID(system.GetDataFileID(this.Data, "PDF", '', true)).GUID);
            }
        }
        else {

            this.frame.src = system.GetDataFile(this.Data, "PDF", '', true);
        }

    }
    else {
        if (this.frame != null) {
            this.Surface.removeChild(this.frame);
            this.frame = null;
        }

        if (showDownload) {
            var linktext = system.GetDataText(this.Data, "LinkText", '', true);
            
            if (this.href == null) {
                this.href = html.createElement(this.Surface, "a");
                this.href.style.textDecoration = 'none';
                var handler1= function (e) {
                    if (e == null) e = window.event;
                    if (e.preventDefault) e.preventDefault();
                    else e.returnValue = false;
                    return false;
                }
                if (supportsTouch) {
                    this.href['ontouchstart'] = handler1;
                }
                this.href['onmousedown'] = handler1;

                this.href['onclick'] = function (e) {
                    if (e == null) e = window.event;
                    if (e.preventDefault) e.preventDefault();
                    else e.returnValue = false;
                    return false;
                }


                var handler2 = function (e) {
                    if (e == null) e = window.event;
                    if (e.preventDefault) e.preventDefault();
                    else e.returnValue = false;
                    window.open(_this.href.href, _this.href.target);
                    return false;
                }
                if (supportsTouch) {
                    this.href['ontouchend'] = handler2;
                }
                this.href['onmouseup'] = handler2;

                this.hrefimg = html.createElement(this.href, "img");
                this.hrefimg.border = '0';
                if (supportsTouch) {
                    this.hrefimg['ontouchstart'] = function (e) {
                        return true;
                    }
                }
                this.hrefimg['onmousedown'] = function (e) {
                    return true;
                }

                var _this = this;
                if (this.Style != null) {
                    this.hrefimg.onmouseover = function () {
                        if (!_this.Page.Player.Block.menuUp) {
                            var h = system.GetDataFile(_this.Style, "DownloadSourceHover", '', true);
                            if (h != '') _this.hrefimg.src = h;

                        }
                    };
                    this.hrefimg.onmouseout = function () {
                        _this.hrefimg.src = system.GetDataFile(_this.Style, "DownloadSource", '', true);
                    };
                }


                this.hreftext = html.createElement(this.href, "span");
                this.href.style.cursor = 'pointer';
                if (supportsTouch) {
                    this.hreftext['ontouchstart'] = function (e) {
                        return true;
                    }
                }
                this.hreftext[ 'onmousedown'] = function (e) {
                    return true;
                }

                this.hreftext.style.zoom = 1;
            }

            if (this.Style != null) {
                if (this.Style.DownloadSource != null) this.hrefimg.src = system.GetDataFile(this.Style, "DownloadSource", '', true);
                if (this.Style.DownloadLink != null) html.fillText(this.hreftext, this.Style.DownloadLink, linktext);
            }

            if (system.GetDataValue(this.Data, "UseFieldAPI", 0) == 1) {
                if (FieldAPIData != null) {
                    if (FileObjectByFileResourceID(system.GetDataFileID(this.Data, "PDF", '', true)) != null) {
                        this.href.href = GetFieldAPIUrl("/Document.aspx?Token=" + FieldAPIData.Token + "&Student=" + FieldAPIStudent + "&Template=" + FileObjectByFileResourceID(system.GetDataFileID(this.Data, "PDF", '', true)).GUID);
                    }
                }
            }
            else {

                this.href.href = system.GetDataFile(this.Data, "PDF", '', true);
            }
            this.href.target = '_blank';
            this.hreftext.innerHTML = linktext;
        }
        else {
            if (this.href != null) {
                this.Surface.removeChild(this.href);
                this.href = null;
            }
        }
    }
    if (showMailButton && this.Style.MailButton) {
        if (this.mailLayer == null) {
            this.mailLayer = html.createElement(this.Surface, "div");
            this.mailHeader = html.createText(this.mailLayer, null, '');
           

            this.mailButton = new ImageButton(this.mailLayer, function () { _this.FireMail(false); }, this, false, this.Style.MailButton.EmailDisabledSource, this.Style.MailButton.EmailSource, this.Style.MailButton.EmailHoverSource);
            this.mailStatus = html.createText(this.mailLayer, null, '');
        }
        else {
            this.mailButton.Change(this.Style.MailButton.EmailDisabledSource, this.Style.MailButton.EmailSource, this.Style.MailButton.EmailHoverSource);
        }
        this.mailButton.element.style.position = 'relative';
        var t = system.GetDataText(this.Data, "EmailHeader", '', true);
        this.txtEmailSuccess = system.GetDataText(this.Data, "TxtEmailSuccess", '', true);
        this.txtEmailFailed = system.GetDataText(this.Data, "TxtEmailFailed", '', true);
        this.emailSubject = system.GetDataText(this.Data, "EmailSubject", '', true);
        this.emailBody = system.GetDataText(this.Data, "EmailBody", '', true);
        if (FieldAPIData != null) {
            this.mailUrl = GetFieldAPIUrl("/Document.aspx?Token=" + FieldAPIData.Token + "&Student=" + FieldAPIStudent + "&Template=" + FileObjectByFileResourceID(system.GetDataFileID(this.Data, "PDF", '', true)).GUID + "&MailTo=1&MailSubject=" + encodeURIComponent(this.emailSubject) + "&MailBody=" + encodeURIComponent(this.emailBody));
        }
        html.fillFormattedText(this.mailHeader, this.Style, t);
    }
    else {
        if (this.mailLayer != null) {
            this.Surface.removeChild(this.mailLayer);
            this.mailLayer = null;
        }
    }
}

PDFAsset.prototype.CheckChanged = function () {

}


PDFAsset.prototype.FireMail = function () {
    this.mailButton.SetEnabled(false);
    var _this = this;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var result = xmlhttp.responseText;
            if (result == "1") {
                html.fillFormattedText(_this.mailStatus, _this.Style, _this.txtEmailSuccess);
                _this.mailButton.SetEnabled(true);
            }
            else {
                html.fillFormattedText(_this.mailStatus, _this.Style, _this.txtEmailFailed);
                _this.mailButton.SetEnabled(true);
            }
        }
    }
    xmlhttp.open("GET", this.mailUrl, true);
    xmlhttp.send();

}

PDFAsset.prototype.Enter = function () {
    try{
        if (this.hreftext != null) this.hreftext.style.width = this.Surface.offsetWidth - this.hrefimg.offsetWidth - parseInt(this.Surface.style.paddingLeft) - parseInt(this.Surface.style.paddingRight) + 'px';
    }
    catch (e) {

    }



    //alert(this.hrefimg.offsetWidth + ' - ' + parseInt(this.Surface.style.paddingLeft));
}


//
//slm_player
//
//PLAYERS

function Player(Block, Owner, Data, IsLightBox) {
    this.Block = Block;
    this.Data = Data;
    this.IsLightBox = IsLightBox;
    this.Seen = false;
    this.Exam = (Data.P == 1579);

    if (this.Data.AllowBack == null) system.saveValueData( this.Data, "AllowBack", 1, null);
    if (this.Data.Resume == null) system.saveValueData(this.Data, "Resume", 1, null);

    this.Pages = [];

    var _this = this;
    this.PlayerStyle = null;

    this.playerArea = html.createLayer(Owner, null);
    html.addEditElement(this.playerArea, this);
    this.EditParent = Block;
    if (this.IsLightBox) {
        this.OpenButtons = {};
    }

    this.EditViewing = function (list) {
        if (this.Data.P != null) {
            list[this.Data.P.toString()] = true;
        }
        if (this.CurrentPage != null) {
            this.CurrentPage.EditViewing(list);
        }
    }
    this.EditTryInsert = function (Type, EmptyObject, Offset, Editor) {
        if (this.EditInsert(Type, EmptyObject, Offset, Editor)) return true;
        if (this.CurrentPage != null) {
            return this.CurrentPage.EditTryInsert(Type, EmptyObject, Offset, Editor);
        }
        return false;
    }

    this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
        if (Editor.GenericDataEditComponent.SelectedNode != null) {
            var p = Editor.GenericDataEditComponent.SelectedNode;
            while (p.Parent != null) {
                if (p.Data != null && p.Data.P != null && p.Data.P == 757) {
                    if (p.editControl != null) {
                        if (p.editControl.EditInsert(Type, EmptyObject, "Insert", Editor)) return true;
                    }
                }
                p = p.Parent;
            }
        }
        if (Type == 399) {
            var clone = EmptyObject;
            Editor.GenericDataEditComponent.apply();

            if (this.Data.Pages == null) this.Data.Pages = [];
            this.Data.Pages[this.Data.Pages.length] = clone;
            this.UpdateData();

            Editor.GenericDataEditComponent.WYSIWYGUpdate(this, true);

            var page = this.Pages[this.Pages.length - 1];
            this.ActivatePage(page);
            return true;
        }
        return false;

    }
    this.EditIsActive = function (Activate) {
        if (this.IsLightBox) {
            if (Activate) {
                if (this.Status != "Show") {
                    this.Block.ShowLightBox(this);
                }
            }
            if (this.Status == "Show") return true;
        }
        else {
            if (Activate) {
                if (this.Block.OpenLightBox() != null) this.Block.HideLightBoxes();
                if (this.Block.ActivePlayer != this) this.Block.ActivatePlayer(this);
            }

            if (this.Block.OpenLightBox() == null) {
                return this.Block.ActivePlayer == this;
            }
          
        }
        return false;
    }

    this.Hide();

    this.pageArea = html.createLayer(this.playerArea, null);
    this.scrollArea = html.createLayer(this.pageArea, null);
    this.scrollArea.style.position = 'absolute';

    if (system.GetDataValue(this.Block.Data, "Swipe", 1) == 1) {

        html.addDragElement(this.scrollArea, this);
        this.DragDelta = function (x, y) {

            if (!_this.Block.menuUp) {

                if (this.SwipeDirection == 0) {

                    var target = _this.StartX + x;

                    var max = (_this.Pages[_this.Pages.length - 1].Index - _this.CurrentPage.Index) * _this.CurrentPage.Surface.offsetWidth;
                    var min = -_this.CurrentPage.Index * _this.CurrentPage.Surface.offsetWidth;

                    if (max > _this.CurrentPage.Surface.offsetWidth) max = _this.CurrentPage.Surface.offsetWidth;
                    if (min < -_this.CurrentPage.Surface.offsetWidth) min = -_this.CurrentPage.Surface.offsetWidth;


                    if (-target > max) target = -max;
                    if (-target < min) target = -min;

                    if (target < 0) {
                        _this.Pages[_this.CurrentPage.Index + 1].Surface.style.display = '';
                        _this.Pages[_this.CurrentPage.Index + 1].Surface.style.left = _this.CurrentPage.Surface.offsetWidth + 'px';

                    } else if (target > 0) {
                        _this.Pages[_this.CurrentPage.Index - 1].Surface.style.display = '';
                        _this.Pages[_this.CurrentPage.Index - 1].Surface.style.left = '-' + _this.CurrentPage.Surface.offsetWidth + 'px';
                    }
                    _this.scrollArea.style.left = target + 'px';
                }
                else if (this.SwipeDirection == 1) {
                    var target = _this.StartX + y;

                    var max = (_this.Pages[_this.Pages.length - 1].Index - _this.CurrentPage.Index) * _this.CurrentPage.Surface.offsetHeight;
                    var min = -_this.CurrentPage.Index * _this.CurrentPage.Surface.offsetHeight;

                    if (max > _this.CurrentPage.Surface.offsetHeight) max = _this.CurrentPage.Surface.offsetHeight;
                    if (min < -_this.CurrentPage.Surface.offsetHeight) min = -_this.CurrentPage.Surface.offsetHeight;


                    if (-target > max) target = -max;
                    if (-target < min) target = -min;

                    if (target < 0) {
                        _this.Pages[_this.CurrentPage.Index + 1].Surface.style.display = '';
                        _this.Pages[_this.CurrentPage.Index + 1].Surface.style.top = _this.CurrentPage.Surface.offsetHeight + 'px';

                    } else if (target > 0) {
                        _this.Pages[_this.CurrentPage.Index - 1].Surface.style.display = '';
                        _this.Pages[_this.CurrentPage.Index - 1].Surface.style.top = '-' + _this.CurrentPage.Surface.offsetHeight + 'px';
                    }
                    _this.scrollArea.style.top = target + 'px';
                }

                this.current = target;
            }
        }
        this.DragStart = function () {
            if (!_this.Block.menuUp) {
                _this.StartDate = (new Date()).getTime();
                _this.StopSlide();
            }

        }
        this.DragStop = function (x, y) {

            if (!_this.Block.menuUp) {
                if (this.SwipeDirection == 0) {
                    var ms = 100 * x / ((new Date()).getTime() - _this.StartDate);
                    if (x > 10 || x < -10) {
                        if (x > _this.CurrentPage.Surface.offsetWidth / 5 || ms > 20) {
                            if (_this.Back()) return;
                        }
                        else if (x < -_this.CurrentPage.Surface.offsetWidth / 5 || ms < -20) {
                            if (_this.Forward()) return;
                        }
                    }
                }
                else if (this.SwipeDirection == 1) {
                    var ms = 100 * y / ((new Date()).getTime() - _this.StartDate);
                    if (y > 10 || y < -10) {
                        if (y > _this.CurrentPage.Surface.offsetHeight / 5 || ms > 20) {
                            if (_this.Back()) return;
                        }
                        else if (y < -_this.CurrentPage.Surface.offsetHeight / 5 || ms < -20) {
                            if (_this.Forward()) return;
                        }
                    }
                }


                _this.Slide(_this.StartX, false);
            }
        }
    }



    this.CurrentPage = null;
    this.NavigationArea = html.createLayer(this.playerArea, null);

    this.navigationButtonContainer = html.createLayer(this.NavigationArea, "DIV");
    this.ButtonBack = new Button(this.NavigationArea, null, function () { _this.Back(); }, _this.Block, true);
    this.ButtonForward = new Button(this.NavigationArea, null, function () { _this.Forward(); }, _this.Block, true);


    if (this.Exam) {
        this.ButtonMark = new Button(this.NavigationArea, null, function () { _this.Mark(true); }, _this.Block, true);
        this.ButtonUnMark = new Button(this.NavigationArea, null, function () { _this.Mark(false); }, _this.Block, true);
    }



    
    /*
    if (Data.Pages != null)
    for (var pi in Data.Pages) {
        this.Pages[this.Pages.length] = new Page(this, this.scrollArea, Data.Pages[pi], 12, 12);
    }*/
    
    if (this.IsLightBox) {
        this.CloseButton = new Button(this.playerArea, null, function () {
            _this.Hide();
        }, _this.Block, true
        );
        this.CloseButton.element.style.display = 'none';
    }
    else {
        this.CloseButton = null;
    }

    this.CalculateSuspendData = function (data) {
        var sd = '';
        sd += (_this.Seen ? '1' : '0') + ',' + scormdata.objectiveById(_this.Data.L).index;
        var rand = '';
        if (this.Randomization != null) {
            rand = JSON.stringify(this.Randomization).replace(/,/g, ';');
            sd += ',' + rand;
        }
        
    
        data[_this.Data.L.toString()] = sd;
        
        if (_this.ScoreMethod != 10) {
            for (var i in _this.Pages) {
                _this.Pages[i].CalculateSuspendData(data);
            }
        }
    }
    this.ConsumeSuspendData = function (data) {
        var sd = data[_this.Data.L.toString()];
        if (sd != null) {
            var sds = sd.split(',');
            if (sds.length > 0 && sds[0] == '1') {
                _this.Seen = true;
            }
            if (sds.length > 1) {
                var n = parseInt(sds[1]);
                if (scormdata != null) scormdata.objectives[n] = { id: _this.Data.L, index:n }
            }
            if (sds.length > 2) {
                if (this.Reset == 0) {
                    var rand = sds[2].replace(/;/g, ',');
                    this.Randomization = JSON.parse(rand);
                }
            }
        }

        if (_this.Exam && this.Reset == 0) {
            var r = false;
            if (_this.Data.Clusters == null) _this.Data.Clusters = [];
            for (var i in _this.Data.Clusters) {
                if (system.GetDataValue(_this.Data.Clusters[i], "Random", 0) == 1) r = true;
            }
            if (r) _this.UpdateData();
        }
        if (this.Reset == 0) {
            if (_this.ScoreMethod != 10) {
                for (var i in _this.Pages) {
                    _this.Pages[i].ConsumeSuspendData(data);
                }
            }
        }
    }

    this.UpdateData();
}

Player.prototype.FindPage = function () {
    if (this.CurrentPage != null) return this.CurrentPage;
    return null;
}

Player.prototype.GetScore = function (cat, fieldtype) {
    if (fieldtype == 11) {
        var score = [];
    }
    else {
        var score = 0;
    }

    if (system.GetDataValue(this.Data, "ScoreCat", -1) ==cat) {
        if (fieldtype == 3) {
            for (var p in this.Pages) {
                score += 1;
            }
        }
        if (fieldtype == 2) {
            for (var p in this.Pages) {
                score += this.Pages[p].Seen ? 1 : 0;
            }
        }
    }


    for (var p in this.Pages) {
        var selp = this.Pages[p];
        if (fieldtype == 11) {
            score = score.concat(selp.GetScore(cat, fieldtype));
        }
        else {
            score += selp.GetScore(cat, fieldtype);
        }
    }
    return score;
}

Player.prototype.Mark = function (marked) {
    if (this.CurrentPage != null) {
        this.CurrentPage.SetMark(marked ? 1 : 0);
        this.UpdateButtons();
    }
}

Player.prototype.UpdateData = function (recurse) {

    this.Reset = system.GetDataValue(this.Data, "Reset", 0);
    this.SwipeDirection = system.GetDataValue(this.Data, "SwipeDirection", 0);

    if (this.Data.Pages == null) this.Data.Pages = [];
    
    var OrderedPages = [];//this.Data.Pages;
    for (var i = 0; i < this.Data.Pages.length;i++){
        var p = this.Data.Pages[i];
        var include = this.Block.CanEdit;
        if (!include) include = CheckConditions(p.Conditions);
        if (include){
            OrderedPages[OrderedPages.length]=p;
        }
    }

    if (this.Exam && !this.Block.CanEdit) {
        if (this.Data.Clusters == null) this.Data.Clusters = [];
        var sorting = { "Intro": [], "Clusters": [], "Endings": [], "Results": [] };
        for (var i = 0; i < OrderedPages.length; i++) {
            var p = OrderedPages[i];
            var cluster = system.GetDataText(p, "ClusterID", "", false);
            var pt = system.GetDataValue(p, "PageType", 0);
            if (pt == 3) {
                sorting["Results"][sorting["Results"].length] = p;
            }
            else if (cluster == "" && (pt == 1 || pt == 2)) {
                if (pt == 1) {
                    sorting["Intro"][sorting["Intro"].length] = p;
                }
                else {
                    sorting["Endings"][sorting["Endings"].length] = p;
                }
            }
            else {
                if (cluster == "") cluster = "Default"; else cluster = "c_" + cluster;
                if (sorting["Clusters"][cluster] == null) sorting["Clusters"][cluster] = { "Intro": [], "Pages": [], "Endings": [] };
                if (pt == 0 || pt ==4) {
                    sorting["Clusters"][cluster]["Pages"][sorting["Clusters"][cluster]["Pages"].length] = p;
                }
                else if (pt == 1) {
                    sorting["Clusters"][cluster]["Intro"][sorting["Clusters"][cluster]["Intro"].length] = p;
                }
                else if (pt == 2) {
                    sorting["Clusters"][cluster]["Endings"][sorting["Clusters"][cluster]["Endings"].length] = p;
                }
            }
        }
        var NewOrder = [];
        for (i = 0; i < sorting.Intro.length; i++) {
            NewOrder[NewOrder.length] = sorting.Intro[i];
        }
        if (this.Data.Clusters == null || this.Data.Clusters.length == 0) {
            if (sorting.Clusters["Default"] != null) {
                for (i = 0; i < sorting.Clusters["Default"].Pages.length; i++) {
                    NewOrder[NewOrder.length] = sorting.Clusters["Default"].Pages[i];
                }
            }
        }
        else {
            for (var c = 0; c < this.Data.Clusters.length; c++) {
                var clusterdata = this.Data.Clusters[c];
                var clusterid = system.GetDataText(clusterdata, "ClusterID", "", false);
                if (clusterid == "") clusterid = "Default"; else clusterid = "c_"+clusterid;
                var random = system.GetDataValue(clusterdata, "Random", 0);
                var number = system.GetDataValue(clusterdata, "Number", 0);
                
                if (sorting.Clusters[clusterid] != null) {
                    var ccluster = sorting.Clusters[clusterid];
                    for (i = 0; i < ccluster.Intro.length; i++) {
                        NewOrder[NewOrder.length] = ccluster.Intro[i];
                    }

                    if (random == 0) {
                        for (i = 0; i < ccluster.Pages.length; i++) {
                            NewOrder[NewOrder.length] = ccluster.Pages[i];
                        }
                    }
                    else {
                        if (number < 1 || number > ccluster.Pages.length) number = ccluster.Pages.length;
                        if (this.Randomization == null) this.Randomization = {};
                        if (this.Randomization[clusterid] == null) this.Randomization[clusterid] = [];
                        if (this.Randomization[clusterid].length != ccluster.Pages.length) {
                            this.Randomization[clusterid] = GetRandomization(ccluster.Pages.length)
                        }
                        for (i = 0; i < number; i++) {
                            NewOrder[NewOrder.length] = ccluster.Pages[this.Randomization[clusterid][i]];
                        }
                    }

                    for (i = 0; i < ccluster.Endings.length; i++) {
                        NewOrder[NewOrder.length] = ccluster.Endings[i];
                    }

                }
            }
        }

        for (i = 0; i < sorting.Endings.length; i++) {
            NewOrder[NewOrder.length] = sorting.Endings[i];
        }

        for (i = 0; i < sorting.Results.length; i++) {
            NewOrder[NewOrder.length] = sorting.Results[i];
        }

        OrderedPages = NewOrder;
    }


    this.PlayerStyle = null;
    if (this.IsLightBox) {
        if (this.Data.LightBoxType == null) system.saveValueData(this.Data, "LightBoxType", 0, null); ;
        var ps = system.GetDataValue(this.Data, "LightBoxType", 0);
        this.PlayerStyle = this.Block.GetLightBoxStyle(ps);
    }
    else {
        if (this.Data.PlayerType == null) system.saveValueData(this.Data, "PlayerType", 0, null);
        var ps = system.GetDataValue(this.Data, "PlayerType", 0);
        this.PlayerStyle = this.Block.GetPlayerStyle(ps);
    }


    if (this.PlayerStyle != null) {
        html.styleElement(this.playerArea, this.PlayerStyle.Area);
        if (system.GetDataText(this.PlayerStyle.PageAreaStyle, "Width", '', false) != '') {
            html.styleElement(this.pageArea, this.PlayerStyle.PageAreaStyle);

        }
        else {
            html.styleElement(this.pageArea, this.Block.skinRapidElearning.PageAreaStyle);
        }
        this.pageArea.style.overflow = 'hidden';
    }



    var skip = 0;
    var match = [];
    var firstMatch = null;
    for (var di = 0; di < OrderedPages.length; di++) {
        var pdata = OrderedPages[di];
        var found = false;
        match[di] = null;
        for (var pbi = 0; pbi < this.Pages.length; pbi++) {
            if (this.Pages[pbi].Data == pdata) {
                match[di] = this.Pages[pbi];
                found = true;
            }
        }
        if (!found) {
            var np = new Page(this, this.scrollArea, pdata, 12, 12);
            this.Pages[this.Pages.length] = np;
            match[di] = np;
        }
        if (match[di].NavigationButton != null) {
            this.navigationButtonContainer.insertBefore(match[di].NavigationButton.element, null);
            if (firstMatch == null) firstMatch = match[di].NavigationButton.element;
        }
    }
    this.Pages = match;


    while (this.navigationButtonContainer.childNodes.length > 0 && this.navigationButtonContainer.firstChild != firstMatch) {
        stopVideos(this.navigationButtonContainer.firstChild);
        this.navigationButtonContainer.removeChild(this.navigationButtonContainer.firstChild);
    }

    this.navigationButtonContainer.style.position = 'relative';
    this.navigationButtonContainer.style.zoom = '1';
    if (this.SwipeDirection == 0) {
        this.navigationButtonContainer.style.display = 'inline-block';
        if (!html5) {
            
            this.navigationButtonContainer.style.display = 'block';
            this.NavigationArea.style.textAlign = 'center';
        }
        
    }
    else {
        this.navigationButtonContainer.style.display = 'table-cell';
        this.navigationButtonContainer.style.verticalAlign = 'middle';
        this.navigationButtonContainer.style.height = '100%';
    }


    if (this.PlayerStyle != null) {



        html.styleElement(this.NavigationArea, this.PlayerStyle.Navigation.Area);
        this.ButtonBack.ChangeStyle(this.PlayerStyle.Navigation.ButtonBack);
        this.ButtonForward.ChangeStyle(this.PlayerStyle.Navigation.ButtonForward);

        if (this.ButtonMark != null && this.PlayerStyle.Navigation.ButtonMark != null && this.PlayerStyle.Navigation.ButtonUnMark != null) {
            this.ButtonMark.ChangeStyle(this.PlayerStyle.Navigation.ButtonMark);
            this.ButtonUnMark.ChangeStyle(this.PlayerStyle.Navigation.ButtonUnMark);
        }

        for (var p in this.Pages) {
            var page = this.Pages[p];
            page.NavigationButton.ChangeStyle(this.PlayerStyle.Navigation.ButtonNav);
        }
        if (this.CloseButton != null) {
            this.CloseButton.ChangeStyle(this.PlayerStyle.CloseLightBoxButtonStyle);
            for (var ob in this.OpenButtons) {
                this.OpenButtons[ob].ChangeStyle(this.PlayerStyle.OpenLightBoxButtonStyle);
            }
        }
    }

    if (!this.IsLightBox) {
        if (system.GetDataValue(this.PlayerStyle, "ShowButton", 0) == 1) {
            if (this.Block.Intro == null) this.Block.Intro = this;
            if (this.PlayerButton == null) this.PlayerButton = new PlayerButton(this);

        }
        else {
            this.PlayerButton = null;
            this.Block.Intro = this;
        }
    }

    //update index and scroll area
    this.Width = 0;
    this.Height = 0;
    var i = 0;
    for (var p in this.Pages) {
        var page = this.Pages[p];
        page.Index = i;
        page.Surface.style.display = (page == this.CurrentPage) ? '' : 'none';
        if (page.Surface.offsetHeight > this.Height) this.Height = page.Surface.offsetHeight;
        if (page.Surface.offsetWidth > this.Width) this.Width = page.Surface.offsetWidth;
        i++;
    }
    this.scrollArea.style.width = this.Width + 'px';
    this.scrollArea.style.height = this.Height + 'px';

    if (this.Pages.length < 2) this.NavigationArea.style.display = 'none';
    else {
        if (this.SwipeDirection == 0) {
            this.NavigationArea.style.display = '';

        }
        else {
            this.NavigationArea.style.display = 'table';
        }


    }


    if (this.PlayerButton != null) {
        this.PlayerButton.UpdateData();
    }


    this.ScoreMethod = system.GetDataValue(this.Data, "ScoreMethod", (this.IsLightBox ? 0 : 2));
    this.ScoreThreshold = system.GetDataValue(this.Data, "ScoreThreshold", 100);
    this.Weighting = system.GetDataValue(this.Data, "Weighting", 0);
    this.Ignore = system.GetDataValue(this.Data, "Ignore", 0);

    if (recurse) {
        for (var p in this.Pages) {
            var page = this.Pages[p];
            page.UpdateData(recurse);
        }
    }

    this.playerArea.style.zIndex = (system.GetDataValue(this.Data, "OnTop", 0) == 1) ? '2' : '1';
}

Player.prototype.GetWidth = function () {
    return  ExtractNumber(this.pageArea.style.width);
}

Player.prototype.GetHeight = function () {
    return ExtractNumber(this.pageArea.style.height);
}

Player.prototype.ActivatePage = function (Page) {
    if (this.CurrentPage == Page) return false;

    if (Page != null && !html.editing && Page.Index > 0) {
        if (this.CurrentPage != null && this.CurrentPage.Index < Page.Index) {
            for (var p = this.CurrentPage.Index ; p < Page.Index ; p++) {
                if (!this.Pages[p].CanNext()) {
                    return false;
                }
            }
        }
    }

    if (!this.EditIsActive(false)) return false;
    if (Page != null && this.CurrentPage != null && !html.editing && system.GetDataValue(this.Data, "AllowBack", 0) == 0 && Page.Index < this.CurrentPage.Index) return false;


    var ci = 0;
    if (this.CurrentPage != null) {

        ci = this.CurrentPage.Index;
        if (this.CurrentPage.Leave) this.CurrentPage.Leave();

        var answered = true;
        if (system.GetDataValue(this.Data, "MarkNotAnswered", 0)) {
            answered = this.CurrentPage.Answered();
        }

        this.CurrentPage.NavigationButton.changeActive(false, answered);
    }
    var lp = this.CurrentPage;
    this.CurrentPage = Page;

    if (this.CurrentPage != null) {


        if (this.CurrentPage.Enter) this.CurrentPage.Enter();
        this.CurrentPage.NavigationButton.changeActive(true);

        if (system.GetDataValue(this.CurrentPage.Data,"PageType",0) == 3) {
            //FixResults

            for (var pindex in this.Pages) {
                this.Pages[pindex].SpreadEvent("FixResults", this, null);
            }

            //Results page -> Log score
            LMSCommit();

        }
  
        
        var ni = this.CurrentPage.Index;
        this.CurrentPage.Surface.style.display = '';
        
        if (this.SwipeDirection == 0) {
            this.CurrentPage.Surface.style.left = '0px';
        }
        else if (this.SwipeDirection == 1) {
            this.CurrentPage.Surface.style.top = '0px';
        }

        if (this.CurrentPage.AfterEnter) this.CurrentPage.AfterEnter();

        if (lp != null && this.current == 0 && html5 && mobile) {
            this.delay = true;
            this.CurrentPage.Surface.style.opacity = 0;
            for (ms = 1; ms <= 5; ms++) {
                setTimeout(function (args) { args[0].style.opacity = args[1]; }, ms * 50, [this.CurrentPage.Surface, ms / 5]);
                setTimeout(function (args) { args[0].style.opacity = args[1]; }, (ms + 2) * 50, [lp.Surface, (4 - ms) / 5]);
            }

            if (this.SwipeDirection == 0) {
                setTimeout(function (args) {
                    args[1].delay = false;
                    args[0].style.left = '-' + args[0].offsetWidth + 'px';
                    args[0].style.opacity = 1;
                    args[1].StopSlide();
                }, 400, [lp.Surface, this]);
            }
            else if (this.SwipeDirection == 1) {
                setTimeout(function (args) {
                    args[1].delay = false;
                    args[0].style.top = '-' + args[0].offsetHeight + 'px';
                    args[0].style.opacity = 1;
                    args[1].StopSlide();
                }, 400, [lp.Surface, this]);
            }
        }
        else {
            this.delay = false;
            this.StopSlide();

            if (this.SwipeDirection == 0) {
                if (ci < ni && lp != null) {
                    lp.Surface.style.display = '';
                    lp.Surface.style.left = '-' + lp.Surface.offsetWidth + 'px';
                    this.current = lp.Surface.offsetWidth + this.current;
                    this.scrollArea.style.left = this.current + "px";
                    this.Slide(0, false);
                }
                else if (ci > ni && lp != null) {
                    lp.Surface.style.display = '';
                    lp.Surface.style.left = lp.Surface.offsetWidth + 'px';
                    this.current = -lp.Surface.offsetWidth + this.current;
                    this.scrollArea.style.left = this.current + "px";
                    this.Slide(0, false);
                }
                else {
                    this.Slide(0, true);
                }
            }
            else if (this.SwipeDirection == 1) {
                if (ci < ni && lp != null) {
                    lp.Surface.style.display = '';
                    lp.Surface.style.top = '-' + lp.Surface.offsetHeight + 'px';
                    this.current = lp.Surface.offsetHeight + this.current;
                    this.scrollArea.style.top = this.current + "px";
                    this.Slide(0, false);
                }
                else if (ci > ni && lp != null) {
                    lp.Surface.style.display = '';
                    lp.Surface.style.top = lp.Surface.offsetHeight + 'px';
                    this.current = -lp.Surface.offsetHeight + this.current;
                    this.scrollArea.style.top = this.current + "px";
                    this.Slide(0, false);
                }
                else {
                    this.Slide(0, true);
                }
            }
        }

        if (this.SwipeDirection == 0) {
            this.StartX = -ExtractNumber(Page.Surface.style.left);
        }
        else if (this.SwipeDirection == 1) {
            this.StartX = -ExtractNumber(Page.Surface.style.top);
        }
        
        
        this.Slide(this.StartX, false);
    }

    if (this.Block.Editor != null) this.Block.Editor.selectElement(null, null);
    this.UpdateButtons();

    if (!this.IsLightBox && Page != null) {
        if (scormdata != null) scormdata.lesson_location[1] = Page.Data.L;
    }

    if (AlwaysLog || this.Block.MenuType == 3) {
        SetScore(false);
        if (AlwaysLog) {
            SaveState();
        }
    }

    return true;
}

Player.prototype.Slide = function (target, immediate) {
    this.slideTarget = target;
    if (mobile || (system.GetDataValue(this.Block.Data, "Swipe", 1) == 0)) {
        immediate = true;
    }
    if (immediate) {
        this.current = this.slideTarget;
    }
    else {
        if (!this.current) this.current = 0;
    }
    this.lastSlide = new Date();
    this.SlideHelper();
}

Player.prototype.SlideHelper = function () {
    var currentTime = new Date();
    if (Math.abs(this.slideTarget - this.current) < 1) {
        this.current = this.slideTarget;
        this.StopSlide();
        if (this.SwipeDirection == 0) {
            this.CurrentPage.Surface.style.left = '0px';
            this.scrollArea.style.left = '0px';
        }
        else if (this.SwipeDirection == 1) {
            this.CurrentPage.Surface.style.top = '0px';
            this.scrollArea.style.top = '0px';
        }
        return;
    }
    else {
        var dt = currentTime.getTime() - this.lastSlide.getTime();
        this.lastSlide = currentTime;
        if (dt > 250) dt = 250;
        this.current = (this.current * (250-dt) + this.slideTarget * dt) / 250;
    }
    if (this.SwipeDirection == 0) {
        this.scrollArea.style.left = this.current + "px";
    }
    else if (this.SwipeDirection == 1) {
        this.scrollArea.style.top = this.current + "px";
    }
    var _this = this;
    if (this.current != this.slideTarget) _this.sliderTimeout = setTimeout(
    (function (self) { return function () { self.SlideHelper(); } })(_this)
    , 10);
}

Player.prototype.StopSlide = function () {
    clearTimeout(this.sliderTimeout);
    if (!this.delay) {
        for (var p in this.Pages) {
            var page = this.Pages[p];
            page.Surface.style.display = (this.CurrentPage == page) ? '' : 'none';
        }
    }
    
}

Player.prototype.UpdateButtons = function () {
    var allownext = false;
    if (this.CurrentPage != null) {
        allownext = this.CurrentPage.Index < this.Pages.length - 1 && this.CurrentPage.CanNext();


    }


    if (this.CloseButton != null) {
        if (system.GetDataValue(this.Data, "CloseLast", 0) == 1) {
            this.CloseButton.element.style.visibility = (this.CurrentPage != null && this.CurrentPage.Index == this.Pages.length - 1) ? 'visible' : 'hidden';
        }
        else {
            this.CloseButton.element.style.visibility = 'visible'
        }
    }


    this.ButtonBack.element.style.visibility = (this.CurrentPage != null && this.CurrentPage.Index > 0 && system.GetDataValue(this.Data,"AllowBack", 0) == 1) ? 'visible' : 'hidden';
    this.ButtonForward.element.style.visibility = allownext ? 'visible' : 'hidden';
    if (this.ButtonMark != null) {
        if (system.GetDataValue(this.Data, "Mark", 0) == 0) {
            this.ButtonMark.element.style.display = 'none';
            this.ButtonUnMark.element.style.display = 'none';
        }
        else {
            this.ButtonMark.element.style.display = '';
            this.ButtonUnMark.element.style.display = '';
        }
        if (this.CurrentPage == null || system.GetDataValue(this.Data, "Mark", 0) == 0 ||  (system.GetDataValue(this.CurrentPage.Data, "PageType", 0) != 0 ||  system.GetDataValue(this.CurrentPage.Data, "PageType", 0) != 4)) {
            this.ButtonMark.element.style.visibility = 'hidden';
            this.ButtonUnMark.element.style.visibility = 'hidden';
        }
        else {
            this.ButtonMark.element.style.visibility = (this.CurrentPage.Mark==0)?'visible':'hidden';
            this.ButtonUnMark.element.style.visibility = (this.CurrentPage.Mark==1)?'visible':'hidden';
        }

    }
}

Player.prototype.Back = function () {
    if (this.CurrentPage.Index > 0) {
        return this.ActivatePage(this.Pages[this.CurrentPage.Index - 1]);
    }
    return false;
};

Player.prototype.Forward = function () {
    if (this.CurrentPage.Index < this.Pages.length - 1) {
        return this.ActivatePage(this.Pages[this.CurrentPage.Index + 1]);
    }
    return false;
}

Player.prototype.Up = function () {
    var ce = html.getCenterElement(this.playerArea);

    if (this.Block.Editor != null) this.Block.Editor.selectElement(null, null);

    if (this.CurrentPage && this.CurrentPage.Leave) this.CurrentPage.Leave();
    if (this.PlayerButton && this.Block.MenuType == 0) {
        if (ce != null) {

            ce.Offset[1] = -parseInt(this.Block.playerMenuArea.style.height);
            html.centerElement(ce);
        }

        //html.applyElementTransform(this.playerArea, system.GetDataText(this.Block.skinRapidElearning, "MenuAnimation/TransformUp", '', false));
        if (html5) setOpacity(this.playerArea, system.GetDataText(this.Block.skinRapidElearning, "MenuAnimation/OpacityUp", '', false));
    }
    else {
        if (ce != null) {
            ce.Offset[1] = 0;
            html.centerElement(ce);
        }

        //html.applyElementTransform(this.playerArea, system.GetDataText(this.Block.skinRapidElearning, "MenuAnimation/TransformShown", '', false));
        if (html5) setOpacity(this.playerArea, system.GetDataText(this.Block.skinRapidElearning, "MenuAnimation/OpacityShown", '', false));
    }
    this.Status = 'Up';
    this.playerArea.style.visibility = 'visible';
}

Player.prototype.Hide = function () {
    var ce = html.getCenterElement(this.playerArea);

    if (this.Block.Editor != null) this.Block.Editor.selectElement(null, null);

    if (this.CurrentPage && this.CurrentPage.Leave) this.CurrentPage.Leave();
    if (ce != null) {
        ce.Offset[1] = 0;
        html.centerElement(ce);
    }
    //html.applyElementTransform(this.playerArea, system.GetDataText(this.Block.skinRapidElearning, "MenuAnimation/TransformHidden", '', false));
    if (html5) setOpacity(this.playerArea, system.GetDataText(this.Block.skinRapidElearning, "MenuAnimation/OpacityHidden", '', false));
    this.playerArea.style.visibility = 'hidden';


    if (this.ButtonBack) {
        this.ButtonBack.element.style.display = 'none';
        this.ButtonForward.element.style.display = 'none';
    }
    if (this.CloseButton) {
        this.CloseButton.element.style.display = 'none';
    }


    this.Status = 'Hide';

    if (this.IsLightBox) {
        this.Block.HideLightBox();
    }
}

Player.prototype.Show = function (Silent) {



    var ce = html.getCenterElement(this.playerArea);
    this.Status = 'Show';
    this.playerArea.style.visibility = 'visible';
    this.Seen = true;

    if (this.Block.Editor != null) this.Block.Editor.selectElement(null, null);


    if (!Silent && this.Reset == 1) {
        if (this.Exam) {
            this.Randomization = null;
            this.UpdateData();
        }
        this.ActivatePage(null);
        for (var p in this.Pages) {
            var selp = this.Pages[p];
            selp.Reset();
        }
    
        
    }
    var justEntered = false;
    if (this.CurrentPage == null || !Silent) {
        if (this.Pages.length > 0 && (this.CurrentPage == null || system.GetDataValue(this.Data, "Resume", 0) == 0)) {
            this.ActivatePage(null);
            this.ActivatePage(this.Pages[0]);
            justEntered = true;
        }
    }


    if (!justEntered && this.CurrentPage && this.CurrentPage.Enter) this.CurrentPage.Enter();
    //html.applyElementTransition(this.playerArea, system.GetDataText(this.Block.skinRapidElearning, "MenuAnimation/Transition", '', false));
    //html.applyElementTransform(this.playerArea, system.GetDataText(this.Block.skinRapidElearning, "MenuAnimation/TransformShown", '', false));
    if (html5) setOpacity(this.playerArea, system.GetDataText(this.Block.skinRapidElearning, "MenuAnimation/OpacityShown", '', false));
    if (ce != null) {
        ce.Offset[1] = 0;
        html.centerElement(ce);
    }

    if (this.ButtonBack) {
        this.ButtonBack.element.style.display = '';
        this.ButtonForward.element.style.display = '';
    }
    if (this.CloseButton) {
        this.CloseButton.element.style.display = '';
    }
}

Player.prototype.UpdateScore = function () {

    if (this.ScoreMethod != null && this.ScoreMethod != 0 && this.ScoreMethod != 10) {
        var score = 0;
        var completion = 0;
        var result = 'not attempted';
        var n = 0;
        var t = 0;
        //score
        if (this.ScoreMethod == 1) {
            //opened
            t = 1;
            if (this.Seen) {
                score = 100;
                completion = 100;
                result = 'completed';
                n = 1;
            }
        }
        else if (this.ScoreMethod == 2) {
            //seen
            for (var p in this.Pages) {
                t++;
                if (this.Pages[p].Seen) n++;
            }
            if (t == 0) {
                score = 100;
                completion = 100;
                result = 'completed';
            }
            else {
                score = n * 100 / t;
                if (score >= this.ScoreThreshold) {
                    result = 'completed';
                }
                else {
                    result = 'incomplete';
                }
                completion = score;
            }
        }
        else if (this.ScoreMethod == 3) {
            //passed (answers)
            var fail = false;
            for (var p in this.Pages) {
                var c1 = this.Pages[p].GetScore(null, 5);
                var c2 = this.Pages[p].GetScore(null, 4);
                t += c1;
                n += c2;

                if (this.Pages[p].PageType() == 4 && c1 != c2) fail = true;
            }
            if (t == 0) {
                score = 100;
                result = 'passed';
            }
            else {
                score = n * 100 / t;
                if (score >= this.ScoreThreshold && !fail) {
                    result = 'passed';
                }
                else {
                    result = 'failed';
                }
            }
        }
        else if (this.ScoreMethod == 4) {
            //passed (score)
            var fail = false;
            for (var p in this.Pages) {
                var c1 =  this.Pages[p].GetScore(null, 3);
                var c2 =  this.Pages[p].GetScore(null, 2);
                t +=c1;
                n += c2;
                if (this.Pages[p].PageType() == 4 && c1 != c2) fail = true;
            }
            if (t == 0) {
                score = 100;
                result = 'passed';
            }
            else {
                score = n * 100 / t;
                if (score >= this.ScoreThreshold && !fail) {
                    result = 'passed';
                }
                else {
                    result = 'failed';
                }
            }
        }

        if (this.ScormResult != result) {
            this.ScormResult = result;
            if (this.PlayerButton != null) this.PlayerButton.updateSrc();
        }
        this.ScormScore = score;
        this.ScormWeighting = (this.Ignore == 1) ? 0 : ( (this.Weighting == 0) ? t : this.Weighting );
        this.CompletionWeighting = ((this.Weighting == 0) ? t : this.Weighting);
        if (this.Data.L) SetObjective(this.Data.L.toString(), Math.round(score), result);


        if (this.ScoreMethod == 3 || this.ScoreMethod == 4) {
            n = 0;
            t = 0;
            for (var p in this.Pages) {
                t++;
                if (this.Pages[p].Seen) n++;
            }
            if (t == 0) {
                completion = 100;
            }
            else {
                completion = n * 100 / t;
            }
        }
        this.ScormCompletion = completion;
    }
    else {
        var result = 'completed';
        if (this.ScormResult != result) {
            this.ScormResult = result;
            if (this.PlayerButton != null) this.PlayerButton.updateSrc();
        }
        this.ScormScore = 0;
        this.ScormWeighting = 0;
        this.ScormCompletion = 0;
        this.CompletionWeighting = 0;
    }
}

Player.prototype.MustPass = function () {
    return system.GetDataValue(this.Data, "MustPass", 0);
}

Player.prototype.SpreadEvent = function (Event, Asset, Params) {
    for (var a in this.Pages) {
        var ass = this.Pages[a];
        if (ass.SpreadEvent) ass.SpreadEvent(Event, Asset, Params);
        if (Event == "LoadPage" && Params.Found) {
            Params.ActivatePage = ass;
            return;
        }
    }
}

//
//slm_rectangleasset
//
///rectangle asset
function RectangleAsset(Page, Data) {
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);

    this.UpdateData();
}

RectangleAsset.prototype.UpdateData = function () {
    this.Page.PositionAsset(this);

    if (this.Data.BackgroundColor != null) {
        var v = system.GetDataValue(this.Data, "BackgroundColor", null);
        if (v != null) {
            var color = system.GetDataText(this.Page.Player.Block.GetColorStyle(v), "Color", this.Surface.style.backgroundColor, false);
            color = safeColor(color);
            this.Surface.style.backgroundColor = color;
        }
    }
}




//
//slm_resultasset
//
function ResultAsset(Page, Data) {
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);



    this.container = html.createLayer(this.Surface, null);
    this.Title = html.createText(this.container, null, '');
    this.SubTitle = html.createText(this.container, null, '');
    this.Body = html.createFormattedText(this.container, null, '');

    Page.PositionAsset(this);

    var t = system.GetDataText(this.Data, "Title", '', true);
    if (t != '') {
        html.fillText(this.Title, this.Style.Title, t);
        this.Title.style.display = '';
    }
    else {
        this.Title.style.display = 'none';
    }
    var t = system.GetDataText(this.Data, "SubTitle", '', true);
    if (t != '') {
        html.fillText(this.SubTitle, this.Style.SubTitle, t);
        this.SubTitle.style.display = '';
    }
    else {
        this.SubTitle.style.display = 'none';
    }
    var t = system.GetDataText(this.Data, "Body", '', true);
    if (t != '') {
        html.fillFormattedText(this.Body, this.Style, t);
        this.Body.style.display = '';
    }
    else {
        this.Body.style.display = 'none';
    }




}

ResultAsset.prototype.UpdateData = function () {

    this.Page.PositionAsset(this);

    this.Enter();


}

ResultAsset.prototype.Enter = function () {

    var ResultRep = [];
    var CalculatedResults = [];
    var target = null;

    var level = system.GetDataValue(this.Data, "Level", 0);
    if (level == 0) {
        target = this.Page.Player;
    }
    else {
        target = this.Page.Player.Block;
    }

    for (var f in this.Data.Fields) {
        var Field = this.Data.Fields[f];
        var FieldID = system.GetDataValue(Field, "FieldID", 0);
        var cat = system.GetDataValue(Field, "Category", 0);
        var ft = system.GetDataValue(Field, "FieldType", 2);

        if (cat == -1) cat = null;

        ResultRep[f] = '{' + FieldID.toString() + '}';
        CalculatedResults[f] = '';

        if (ft == 1) {
            //verdict

            var score =target.GetScore(cat, 1);
            for (var v in Field.Verdicts) {
                var verdict = Field.Verdicts[v];
                var sc = system.GetDataValue(verdict, "Score", 0);
                if (score >= sc) {
                    CalculatedResults[f] = system.GetDataText(verdict, "Text", '',true);
                }
            }

        }
        else if (ft == 7) {
            //verdict (percentage)

            var s = target.GetScore(null, 4);
            var t = target.GetScore(null, 5);
            var score = Math.round(s * 100 / t);
            for (var v in Field.Verdicts) {
                var verdict = Field.Verdicts[v];
                var sc = system.GetDataValue(verdict, "Score", 0);
                if (score >= sc) {
                    CalculatedResults[f] = system.GetDataText(verdict, "Text", '', true);
                }
            }

        }
        else if (ft == 2) {
            //score

            var score = target.GetScore(cat, 2);
            CalculatedResults[f] = score.toString();
        }
        else if (ft == 3) {
            //maxscore

            var score = target.GetScore(cat, 3);
            CalculatedResults[f] = score.toString();
        }
        else if (ft == 4) {
            //correct

            var score = target.GetScore(null, 4);
            CalculatedResults[f] = score.toString();
        }
        else if (ft == 5) {
            //total

            var score = target.GetScore(null, 5);
            CalculatedResults[f] = score.toString();
        }
        else if (ft == 6) {
            //perc

            var s = target.GetScore(null, 4);
            var t = target.GetScore(null, 5);
            if (t == 0) CalculatedResults[f] = '';
            else {
                CalculatedResults[f] = (Math.round(s * 1000 / t)/10).toLocaleString();
            }
        }
        else if (ft == 8) {
            //Field API
            var v = system.GetDataText(Field, "Variable", '', true);
            if (v != '') {
                var t = null;

                if (FieldAPIStore != null) {
                    for (var i in FieldAPIStore.Module.Fields) {
                        if (FieldAPIStore.Module.Fields[i].FieldVariable == v) t = FieldAPIStore.Module.Fields[i].FieldData;
                    }
                }

                if (t == null) CalculatedResults[f] = '';
                else CalculatedResults[f] = t;
            }

        }
        else if (ft == 10) {
            //perc

            var s = target.GetScore(cat, 2);
            var t = target.GetScore(cat, 3);
            if (t == 0) CalculatedResults[f] = '';
            else {
                CalculatedResults[f] = (Math.round(s * 1000 / t) / 10).toLocaleString();
            }
        }
        else if (ft == 11) {
            //answer texts

            var s = target.GetScore(cat, 11);
            var t = '';
            for (var i in s) {
                t = t + '<li>' + s[i] + '</li>';
            }
            if (t != '') t = '<ul>' + t + '</ul>';
            CalculatedResults[f] = t;
            
        }


    }

    var t = system.GetDataText(this.Data, "Title", '', true);
    if (t != '') {

        for (var r in ResultRep) {
            t = t.replace(ResultRep[r], CalculatedResults[r]);
        }

        html.fillText(this.Title, this.Style.Title, t);
        this.Title.style.display = '';
    }
    else {
        this.Title.style.display = 'none';
    }
    var t = system.GetDataText(this.Data, "SubTitle", '', true);
    if (t != '') {
        for (var r in ResultRep) {
            t = t.replace(ResultRep[r], CalculatedResults[r]);
        }
        html.fillText(this.SubTitle, this.Style.SubTitle, t);
        this.SubTitle.style.display = '';
    }
    else {
        this.SubTitle.style.display = 'none';
    }
    var t = system.GetDataText(this.Data, "Body", '', true);
    if (t != '') {
        for (var r in ResultRep) {
            t = t.replace(ResultRep[r], CalculatedResults[r]);
        }
        html.fillFormattedText(this.Body, this.Style, t);
        this.Body.style.display = '';
    }
    else {
        this.Body.style.display = 'none';

    }

    if (this.Data.BackgroundColor != null) {
        var v = system.GetDataValue(this.Data, "BackgroundColor", null);
        if (v != null) {
            this.Surface.style.backgroundColor = safeColor(system.GetDataText(this.Page.Player.Block.GetColorStyle(v), "Color", this.Surface.style.backgroundColor, false));
        }
    }
    if (this.Data.ForegroundColor != null) {
        var v = system.GetDataValue(this.Data, "ForegroundColor", null);
        if (v != null) {
            var t = safeColor(system.GetDataText(this.Page.Player.Block.GetColorStyle(v), "Color", null, false));

            this.Title.style.color = (t == null) ? this.Title.style.color : t;
            this.SubTitle.style.color = (t == null) ? this.SubTitle.style.color : t;
            this.Body.style.color = (t == null) ? this.Body.style.color : t;

            for (var i in this.Body.childNodes) {
                var elt = this.Body.childNodes[i];
                if (elt.nodeName == 'FONT') {
                    elt.style.color = (t == null) ? elt.style.color : t;
                }
                else if (elt.nodeName == 'SPAN') {
                    elt.style.color = (t == null) ? elt.style.color : t;
                }
            }


        }
    }
}

//
//slm_simulation
//
//simulation asset

function SimulationCoach(owner) {
    this.owner = owner;
    this.AssignmentLayer = html.createLayer(owner.container, null);
    this.AssignmentText = html.createText(this.AssignmentLayer, null, '');
    this.AssignmentLayer.style.display = 'none';
}

SimulationCoach.prototype.Style = function (s) {

    this.style = s;
    if (s != null) {
        html.styleElement(this.AssignmentText, s.Text);
        html.styleElement(this.AssignmentLayer, s.Layer);
    }

}

SimulationCoach.prototype.ShowText = function (t) {
    this.AssignmentLayer.style.display = '';
    this.AssignmentLayer.style.zIndex = '1';
    if (this.style != null) {
        html.fillFormattedText(this.AssignmentText, this.style.AssignmentText, t);
    }
}

SimulationCoach.prototype.Hide = function () {
    this.AssignmentLayer.style.display = 'none';
    this.AssignmentLayer.style.zIndex = '0';
}

function SimulationStepButton(Owner, Name, Screen, Style) {
    this.Owner = Owner;
    this.Name = Name;
    this.Screen = Screen;
    this.Style = Style;

    this.Layer = html.createLayer(this.Owner.StepButtonsLayer, null);
    this.Layer.style.boxSizing = 'border-box';
    this.Text = html.createText(this.Layer, null, Name);
    var _this = this;

    var handler1= function (e) {
        if (e == null) e = window.event;
        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;
        return false;
    }
    if (supportsTouch) { this.Layer['ontouchstart'] = handler1; }
    this.Layer['onmousedown'] = handler1;

    this.Layer['onclick'] = function (e) {
        if (e == null) e = window.event;
        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;
        return false;
    }
    
    var handler2 = function (e) {
        if (e == null) e = window.event;
        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;
        _this.Owner.Activate(_this.Screen);
        return false;
    }
    if (supportsTouch) this.Layer['ontouchend'] = handler2;
    this.Layer['onmouseup'] = handler2;
}

SimulationStepButton.prototype.UpdateState = function (Left, Width, Seen, Active, Last){
    if (Active) {
        html.styleElement(this.Text, this.Style.Simulation.StepActiveText);
        html.styleElement(this.Layer, this.Style.Simulation.StepActiveLayer);
    }
    else {
        if (Seen) {
            html.styleElement(this.Text, this.Style.Simulation.StepDoneText);
            html.styleElement(this.Layer, this.Style.Simulation.StepDoneLayer);
        }
        else {
            html.styleElement(this.Text, this.Style.Simulation.StepText);
            html.styleElement(this.Layer, this.Style.Simulation.StepLayer);
        }
    }
    this.Layer.style.left = Left + 'px';
    this.Layer.style.width = Width + 'px';
    this.Layer.firstChild.style.display = Last ? 'none' : '';
}

function SimulationAsset(Page, Data) {
    var _this = this;
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);

    this.ResultsFixed = false;
    this.ResultsChecked = false;
    this.CurrentScreen = null;


    this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
        if (Type == 3854) {
            var clone = EmptyObject;
            Editor.GenericDataEditComponent.apply();

            if (this.Data.Answers == null) this.Data.Answers = [];
            this.Data.Answers[this.Data.Answers.length] = clone;
            this.UpdateData();

            Editor.GenericDataEditComponent.WYSIWYGUpdate(this, true);

            return true;
        }
        return false;
    }

    this.EditViewing = function (list) {
        list[this.Data.P.toString()] = true;
        list["3854"] = true;
        list["3855"] = true;
    }

    if (this.Data["NextPage"] == null) system.saveValueData(this.Data, "NextPage", 0, null);
    if (this.Data["Reset"] == null) system.saveValueData(this.Data, "Reset", 0, null);

    this.Screens = [];
    this.Coaches = [];



    this.container = html.createLayer(this.Surface, null);
    this.container.oncontextmenu = function () { return false; }
    this.AnswerContainer = html.createLayer(this.container, null);
    this.AnswerContainer.style.position = 'absolute';

    for (var i = 0 ; i < 8; i++) {
        this.Coaches[i] = new SimulationCoach(this);
    }

    this.FeedbackLayer = html.createLayer(this.container, null);
    this.FeedbackLayer.style.boxSizing = 'border-box';
    this.FeedbackText = html.createText(this.FeedbackLayer, null, '');
    this.FeedbackSpikeTopLeft = html.prepareInterfaceImage(this.container, null);
    this.FeedbackSpikeTopRight = html.prepareInterfaceImage(this.container, null);
    this.FeedbackSpikeBottomLeft = html.prepareInterfaceImage(this.container, null);
    this.FeedbackSpikeBottomRight = html.prepareInterfaceImage(this.container, null);

    this.StepButtons = [];
    this.StepButtonsLayer = html.createLayer(this.container, null);


    this.GeneralFeedbackLayer = html.createLayer(this.container, null);
    this.GeneralFeedbackLayer.style.position = 'absolute';
    this.GeneralFeedbackLayer.style.left = '0px';
    this.GeneralFeedbackLayer.style.top = '0px';
    this.GeneralFeedbackLayer.style.width = '100%';
    this.GeneralFeedbackLayer.style.height = '100%';
    this.GeneralFeedbackLayer.style.display = 'table';
    this.GeneralFeedbackContainer = html.createLayer(this.GeneralFeedbackLayer, null);
    this.GeneralFeedbackContainer.style.display = 'table-cell'
    this.GeneralFeedbackContainer.style.textAlign = 'center';
    this.GeneralFeedbackContainer.style.verticalAlign = 'middle';
    this.GeneralFeedbackTextContainer = html.createLayer(this.GeneralFeedbackContainer, null);
    this.GeneralFeedbackTextContainer.style.textAlign = 'left';
    this.GeneralFeedbackTextContainer.style.display = 'inline-block';
    this.GeneralFeedbackTextContainer.style.width = '40%';
    this.GeneralFeedbackClose = html.createElement(this.GeneralFeedbackTextContainer, "img");
    this.GeneralFeedbackClose.style.display = 'inline-block'
    this.GeneralFeedbackClose.style.float = 'right';
    this.GeneralFeedbackText = html.createLayer(this.GeneralFeedbackTextContainer, null);
    this.GeneralFeedbackText.style.clear = 'both';
    this.GeneralFeedbackClose["onclick"] = function () {
        _this.GeneralFeedbackLayer.style.display = 'none';
    }
    this.GeneralFeedbackLayer.style.display= 'none';
    this.UpdateData();

    this.CalculateSuspendData = function (data) {
        var sd = '|' + (this.ResultsChecked ? '1' : '0') + '|' + (this.ResultsFixed ? '1' : '0') + '|';
        if (this.DummyHotspot != null) {
            sd += (this.DummyHotspot.selected ? '1' : '0');
            if (this.DummyHotspot.iconPosition != null) sd += ',' + this.DummyHotspot.iconPosition[0].toString() + ',' + this.DummyHotspot.iconPosition[1].toString();
        }

        if (_this.Data.L != null) data[_this.Data.L.toString()] = sd;
        for (var i in _this.Hotspots) {
            _this.Hotspots[i].CalculateSuspendData(data);
        }
    }
    this.ConsumeSuspendData = function (data) {
        var sd = data[_this.Data.L.toString()];
        if (sd != null) {
            if (sd == '') {
                this.ResultsChecked = false;
                this.ResultsFixed = false;
            }
            else {
                var options = sd.split('|');
                this.ResultsChecked = (options[1].toString() == '1');
                this.ResultsFixed = (options[2].toString() == '1');
                if (options.length > 3 && this.DummyHotspot != null) {
                    var sds = options[3].split(',');
                    if (sds.length >= 3) {
                        this.DummyHotspot.iconPosition = [ExtractNumber(sds[1]), ExtractNumber(sds[2])];
                    }
                    if (sds.length >= 1 && sds[0] == '1') {
                        this.DummyHotspot.HotspotAsset.SelectAnswer(this.DummyHotspot, true);
                    }
                }
            }

        }
        for (var i in _this.Hotspots) {
            _this.Hotspots[i].ConsumeSuspendData(data);
        }
        if (this.ResultsChecked) this.FireCheck(true);
    }

    this.KeyHandler = function (keyCode) {
        if (_this.CurrentScreen != null) {
            var sc = system.GetDataValue(_this.CurrentScreen.Data, "Shortcut", 0);
            if (sc != 0) {
                _this.CurrentScreen.SelectAnswer(null, false, keyCode);
                return true;
            }

        }
    }
}

SimulationAsset.prototype.GetScore = function (cat, fieldtype) {
    if (fieldtype == 1 || fieldtype == 2) {
        var score = 0;
        return score;
    }
    else if (fieldtype == 3) {
        var ms = 0;
        return ms;
    }
    else if (fieldtype == 4) {
        var score = 0;
        var cor = true;
        for (var ans in this.Screens) {
            if (!this.Screens[ans].Answered()) {
                cor = false;
            }
        }
        if (cor) score++;
        return score;
    }
    else if (fieldtype == 5) {
        return 1;
    }
}

SimulationAsset.prototype.UpdateData = function (recurse) {
    this.Page.PositionAsset(this);
    this.AllowNext = system.GetDataValue(this.Data, "AllowNext", 1);
    if (this.Data.Screens == null) this.Data.Screens = [];
    var match = [];
    this.StepButtons = [];
    var firstMatch = null;
    var lastStepName = '';

    html.fillFormattedText(this.GeneralFeedbackText, this.Style.Simulation.FeedbackText, system.GetDataText(this.Data, "GeneralFeedback", '', true));
    this.GeneralFeedbackLayer.style.backgroundColor = system.GetDataText(this.Style.Simulation, "ColorFeedbackOverlay", 'transparent');
    html.styleElement(this.GeneralFeedbackTextContainer, this.Style.Simulation.FeedbackLayer);
    html.styleElement(this.GeneralFeedbackText, this.Style.Simulation.FeedbackText);
    this.GeneralFeedbackTextContainer.style.borderRadius = system.GetDataValue(this.Style.Simulation, "FeedbackCornerRadius", 0) + "px";
    this.GeneralFeedbackTextContainer.style.position = 'relative';
    this.GeneralFeedbackText.style.width = 'auto';
    this.GeneralFeedbackClose.src = system.GetDataFile(this.Style.Simulation, "FeedbackCloseSource", '', true);

    while (this.StepButtonsLayer.childNodes.length > 0) this.StepButtonsLayer.removeChild(this.StepButtonsLayer.firstChild);

    for (var di = 0; di < this.Data.Screens.length; di++) {
        var pdata = this.Data.Screens[di];
        var found = false;
        match[di] = null;
        for (var pbi = 0; pbi < this.Screens.length; pbi++) {
            if (this.Screens[pbi].Data == pdata) {
                match[di] = this.Screens[pbi];
                found = true;
            }
        }
        if (!found) {
            var np = new SimulationAssetScreen(this, pdata, false);
            this.Screens[this.Screens.length] = np;
            match[di] = np;
        }
        if (match[di].AnswerContainer != null) {
            this.AnswerContainer.insertBefore(match[di].AnswerContainer, null);
            if (firstMatch == null) firstMatch = match[di].AnswerContainer;
        }
        var stepName = system.GetDataText(pdata, "StepName", '', true).trim();
        if (stepName != '' && stepName != lastStepName) {
            lastStepName = stepName;
            this.StepButtons[this.StepButtons.length] = new SimulationStepButton(this, stepName, match[di], this.Style);
        }
    }
    this.Screens = match;

    while (this.AnswerContainer.childNodes.length > 0 && this.AnswerContainer.firstChild != firstMatch) this.AnswerContainer.removeChild(this.AnswerContainer.firstChild);

    for (var i = 0 ; i < 8; i++) {
        this.Coaches[i].Style(this.Style.Simulation["Coach" + (i+1)]);
    }

    for (var pl in this.Screens) {
        this.Screens[pl].UpdateData();
        if (this.CurrentScreen == null) this.Activate(this.Screens[pl]);
    }
   
    html.styleElement(this.FeedbackText, this.Style.Simulation.FeedbackText);
    html.styleElement(this.FeedbackLayer, this.Style.Simulation.FeedbackLayer);

    this.FeedbackSpikeTopLeft.src = system.GetDataFile(this.Style.Simulation, "FeedbackSpikeTopLeft", "", true);
    this.FeedbackSpikeTopRight.src = system.GetDataFile(this.Style.Simulation, "FeedbackSpikeTopRight", "", true);
    this.FeedbackSpikeBottomLeft.src = system.GetDataFile(this.Style.Simulation, "FeedbackSpikeBottomLeft", "", true);
    this.FeedbackSpikeBottomRight.src = system.GetDataFile(this.Style.Simulation, "FeedbackSpikeBottomRight", "", true);

    this.FeedbackLayer.style.borderRadius = system.GetDataValue(this.Style.Simulation, "FeedbackCornerRadius", 0) + "px";

    this.UpdateButtons();

    html.styleElement(this.StepButtonsLayer, this.Style.Simulation.StepContainerLayer);
}

SimulationAsset.prototype.ShowFeedback = function (Feedback, Rect, Hover, Wrong) {




    var show = Feedback != '' && Feedback != null;

    if (!show && Hover && this.fixed) {
        
        return;
    }
    if (!Hover) {
        this.fixed = show;
    }

    if (!show) {
        this.ShowGeneral = false;

    }
    else {
        if (!this.ShowGeneral && system.GetDataText(this.Data, "GeneralFeedback", '', true) != '') {
            this.GeneralFeedbackLayer.style.display = 'table';
            this.ShowGeneral = true;
            return;
        }
    }

    this.FeedbackSpikeTopLeft.style.display = 'none';
    this.FeedbackSpikeTopRight.style.display = 'none';
    this.FeedbackSpikeBottomLeft.style.display = 'none';
    this.FeedbackSpikeBottomRight.style.display = 'none';

    if (show) {
        this.FeedbackLayer.style.display = '';
        html.fillFormattedText(this.FeedbackText, this.Style.Simulation.FeedbackText, Feedback);

        var cx = Rect[0] + Rect[2] / 2;
        var cy = Rect[1] + Rect[3] / 2;

        var offset = system.GetDataValue(this.Style.Simulation, "FeedbackSpikeEdgeOffset", 50);
        var inset = system.GetDataValue(this.Style.Simulation, "FeedbackSpikeInset", 2);
        var width = system.GetDataValue(this.Style.Simulation, "FeedbackSpikeWidth", 50);
        var height = system.GetDataValue(this.Style.Simulation, "FeedbackSpikeHeight", 50);

        var tp = system.GetDataValue(this.CurrentScreen.Data, "TipPosition", 0);

        if (((tp == 0||tp==5) && cx < this.Surface.offsetWidth / 2) || tp == 2 || tp == 4) {
            this.FeedbackLayer.style.left = (cx - offset)+'px';
            if (((tp == 0 || tp == 5) && cy < this.Surface.offsetHeight / 2) || tp == 4) {
                this.FeedbackSpikeTopLeft.style.display = '';
                this.FeedbackSpikeTopLeft.style.position = 'absolute';
                this.FeedbackSpikeTopLeft.style.left = Math.round(cx - width / 2) + 'px';

                if (tp == 5) {
                    this.FeedbackLayer.style.top = (cy + height) + 'px';
                    this.FeedbackSpikeTopLeft.style.top = (cy + inset) + 'px';
                }
                else {
                    this.FeedbackLayer.style.top = (Rect[1] + Rect[3] + height) + 'px';
                    this.FeedbackSpikeTopLeft.style.top = (Rect[1] + Rect[3] + inset) + 'px';
                }
            }
            else {
                this.FeedbackSpikeBottomLeft.style.display = '';
                this.FeedbackSpikeBottomLeft.style.position = 'absolute';
                this.FeedbackSpikeBottomLeft.style.left = Math.round(cx - width / 2) + 'px';

                if (tp == 5) {
                    this.FeedbackLayer.style.top = (cy - height - this.FeedbackLayer.offsetHeight) + 'px';
                    this.FeedbackSpikeBottomLeft.style.top = (cy - height - inset) + 'px';
                }
                else{
                    this.FeedbackLayer.style.top = (Rect[1] - height - this.FeedbackLayer.offsetHeight) + 'px';
                    this.FeedbackSpikeBottomLeft.style.top = (Rect[1] - height - inset) + 'px';
                }

            }
        }
        else {
            this.FeedbackLayer.style.left = (cx +offset-this.FeedbackLayer.offsetWidth) + 'px';
            if (((tp == 0 || tp == 5) && cy < this.Surface.offsetHeight / 2) || tp == 3) {
                this.FeedbackSpikeTopRight.style.display = '';
                this.FeedbackSpikeTopRight.style.position = 'absolute';
                this.FeedbackSpikeTopRight.style.left = Math.round(cx - width / 2) + 'px';

                if (tp == 5) {
                    this.FeedbackLayer.style.top = (cy + height) + 'px';
                    this.FeedbackSpikeTopRight.style.top = (cy + inset) + 'px';
                }
                else {
                    this.FeedbackLayer.style.top = (Rect[1] + Rect[3] + height) + 'px';
                    this.FeedbackSpikeTopRight.style.top = (Rect[1] + Rect[3] + inset) + 'px';
                }
            }
            else {
                this.FeedbackSpikeBottomRight.style.display = '';
                this.FeedbackSpikeBottomRight.style.position = 'absolute';
                this.FeedbackSpikeBottomRight.style.left = Math.round(cx - width / 2) + 'px';

                if (tp == 5) {
                    this.FeedbackLayer.style.top = (cy - height - this.FeedbackLayer.offsetHeight) + 'px';
                    this.FeedbackSpikeBottomRight.style.top = (cy - height - inset) + 'px';
                }
                else {
                    this.FeedbackLayer.style.top = (Rect[1] - height - this.FeedbackLayer.offsetHeight) + 'px';
                    this.FeedbackSpikeBottomRight.style.top = (Rect[1] - height - inset) + 'px';
                }
            }
        }

        
    }
    else {
        this.FeedbackLayer.style.display = 'none';

    }
}

SimulationAsset.prototype.Activate = function (SimulationAssetScreen) {


    if (this.AllowNext == 1) {

        for (var pl in this.Screens) {
            if (this.Screens[pl] == SimulationAssetScreen) break;

            if (!this.Screens[pl].Answered()) return;
        }
    }

    SimulationAssetScreen.Reset();

    this.CurrentScreen = SimulationAssetScreen;
    this.ShowFeedback('', null, false, false);
    for (var pl in this.Screens) {
        if (this.Screens[pl] == this.CurrentScreen) {
            this.Screens[pl].AnswerContainer.style.display = '';
            this.Screens[pl].AnswerContainer.style.zIndex = '1';
            this.UpdateCoach();
            break;
        }
    }
    var _this = this;
    this.HideInactive = function (SimulationAssetScreen) {
        for (var pl in _this.Screens) {
            if (_this.Screens[pl] != _this.CurrentScreen) {
                _this.Screens[pl].AnswerContainer.style.display = 'none';
                _this.Screens[pl].AnswerContainer.style.zIndex = '0';
            }
        }
    }

    setTimeout(this.HideInactive, 100);

    this.UpdateButtons();
}
SimulationAsset.prototype.UpdateCoach = function () {
    var t = '';
    var c = 0;
    if (this.CurrentScreen != null) {
        t = system.GetDataText(this.CurrentScreen.Data, "Assignment", '', true);
        c = system.GetDataValue(this.CurrentScreen.Data, "Coach", 0);
    }

    for (var i = 0; i < 8; i++) {
        if (c == i && t != '') this.Coaches[i].ShowText(t);
        else this.Coaches[i].Hide();
    }
}


SimulationAsset.prototype.AssetEvent = function (Event, Asset, Params) {
    if (Event == "Timer") {
        this.ResultsFixed = true;
        this.FireCheck(false);
    }
    else if (Event == "TimerReset") {
        this.Reset();
    }
    else if (Event == "FixResults") {
        this.ResultsFixed = true;
        this.FireCheck(false);
    }
}

SimulationAsset.prototype.Enter = function () {
    this.MustSubmit = false;
    if (system.GetDataValue(this.Data, "Reset", 0) == 1 && !this.ResultsFixed) {
        this.Reset();
    }
}

SimulationAsset.prototype.AfterEnter = function () {
    this.kh = html.regKeyHandler(this.KeyHandler);
    this.UpdateButtons();
}

SimulationAsset.prototype.Leave = function () {
    if (this.kh != null) {
        html.unregKeyHandler(this.kh);
        this.kh = null;
    }
    if (this.MustSubmit) this.Page.SpreadEvent("StudentResponse", this, null);
}



SimulationAsset.prototype.Reset = function () {
    var first = true;
    for (var pl in this.Screens) {
        this.Screens[pl].Reset();
        if (first) {
            first = false;
            this.Activate(this.Screens[pl]);
        }
    }
    this.UpdateButtons();
}

SimulationAsset.prototype.CanChange = function () {
    return true;
}

SimulationAsset.prototype.CanNext = function () {
    if (this.AllowNext == 0) return true;
    if (this.AllowNext == 1) {
        return this.Answered();
    }
}

SimulationAsset.prototype.Answered = function () {
    var isSelected = true;
    for (var s in this.Screens) {
        if (!this.Screens[s].Answered()) isSelected = false;
    }
    return isSelected;
}


SimulationAsset.prototype.UpdateButtons = function () {
    this.Page.UpdateNavigation();
    this.Page.Player.UpdateButtons();

    
    if (this.StepButtons.length > 0) {
        var seekStep = 0;
        var currentStep = -1;
        var activeStep = -1;
        for (var pl in this.Screens) {
            if (seekStep < this.StepButtons.length) if (this.StepButtons[seekStep].Screen == this.Screens[pl]) {
                currentStep = seekStep;
                seekStep++;
            }
            if (this.CurrentScreen == this.Screens[pl]) {
                activeStep = currentStep;
            }
        }
        var w = this.StepButtonsLayer.offsetWidth / this.StepButtons.length;
        var l = 0;
        var lastL = -w;
        if (w>0)for (var i = 0; i < this.StepButtons.length; i++) {
            lastL = l;
            l += w;
            
            if (i == activeStep) {
                this.StepButtons[i].UpdateState(Math.round(lastL), Math.round(l)-Math.round(lastL), true, true, i == this.StepButtons.length-1);

            }
            else if (i < activeStep) {
                this.StepButtons[i].UpdateState(Math.round(lastL), Math.round(l) - Math.round(lastL), false, false, i == this.StepButtons.length - 1);
            }
            else {
                this.StepButtons[i].UpdateState(Math.round(lastL), Math.round(l) - Math.round(lastL), true, false, i == this.StepButtons.length - 1);
            }
        }
    }
}

SimulationAsset.prototype.SubmitResult = function () {
    this.MustSubmit = false;
    this.Page.SpreadEvent("StudentResponse", this, null);
    this.Page.SpreadEvent("MCChoice", this, null);
    if (system.GetDataValue(this.Data, "NextPage", 0) == 1 && !html.editing) {
        this.Page.Player.Forward();
    }
}


SimulationAsset.prototype.GetResultsChecked = function () {
    return this.ResultsChecked;
}


SimulationAsset.prototype.NextScreen = function () {
    var found = false;
    var next = false;
    for (var pl in this.Screens) {
        if (found && !next) {
            next = true;
            this.Activate(this.Screens[pl]);
        }
        if (this.Screens[pl] == this.CurrentScreen) {
            found = true;
        }
    }
    if (!next) {
        if (system.GetDataValue(this.Data, "NextPage", 0) == 1 && !html.editing) {
            this.Page.Player.Forward();
        }
        else {
            this.UpdateButtons();
        }
    }
}

//-----



function SimulationAssetScreen(SimulationAsset, Data) {
    var _this = this;
    this.SimulationAsset = SimulationAsset;
    this.Data = Data;

    this.Hotspots = [];
    this.KC = 0;
    this.DummyHotspot = null;


    this.AnswerContainer = html.createLayer(SimulationAsset.AnswerContainer, null);
    this.AnswerContainer.style.left = '0px';
    this.AnswerContainer.style.top = '0px';
    this.AnswerContainer.style.position = 'absolute';
    this.HSImage = html.createElement(this.AnswerContainer, "IMG");



    this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
        if (Type == 3855) {
            var clone = EmptyObject;

            if (Offset != null) {
                var x = Math.floor(Offset[0] - this.HSImage.offsetParent.offsetLeft) - 25;
                var y = Math.floor(Offset[1] - this.HSImage.offsetParent.offsetTop) - 25;
                if (x < 0) x = 0;
                if (y < 0) y = 0;


                system.saveValueData(clone, "Left", x, null);
                system.saveValueData(clone, "Top", y, null);
            }


            Editor.GenericDataEditComponent.apply();

            if (this.Data.Hotspots == null) this.Data.Hotspots = [];
            this.Data.Hotspots[this.Data.Hotspots.length] = clone;
            this.UpdateData();

            Editor.GenericDataEditComponent.WYSIWYGUpdate(this, true);

            return true;
        }
        return false;
    }

    html.addEditElement(this.AnswerContainer, this);
    this.EditParent = this.SimulationAsset;
    this.EditIsActive = function (Activate) {
        if (Activate) {
            this.SimulationAsset.Activate(this);
        }
        return this.EditParent.EditIsActive(Activate);
    }

    this.FindPage = function () {
        return this.EditParent.FindPage();
    }
    this.EditTryInsert = function (Type, EmptyObject, Offset, Editor) {
        return this.EditInsert(Type, EmptyObject, Offset, Editor);
    }


    this.ToggleEdit = function (editing) {
        if (_this.DummyHotspot != null) _this.DummyHotspot.ToggleEdit(editing);
        for (var h in _this.Hotspots) _this.Hotspots[h].ToggleEdit(editing);
    }
    html.addEditObserver(this.ToggleEdit);

}


SimulationAssetScreen.prototype.Answered = function () {
    var sc = system.GetDataValue(this.Data, "Shortcut", 0);
    if ((this.KC == sc) || (this.KC>0 && sc==-1)) if (this.KC!=0) return true;
    var isSelected = sc == 0;

    for (var pl in this.Hotspots) {
        if (this.Hotspots[pl].ClickType != 3 && this.Hotspots[pl].ClickType != 5) isSelected = false;
        if (this.Hotspots[pl].Correct()) return true;
    }

    return isSelected;
}


SimulationAssetScreen.prototype.UpdateData = function (recurse) {


    this.HSImage.src = system.GetDataFile(this.Data, "Image", "", true);

    if (this.Data.Hotspots == null) this.Data.Hotspots = [];



    var match = [];
    this.AnswerContainer.insertBefore(this.HSImage, null);
    var firstMatch = this.HSImage;

        if (this.DummyHotspot == null) {
            this.DummyHotspot = new SimulationAssetHotspot(this, null, true);
        }
        this.AnswerContainer.insertBefore(this.DummyHotspot.element, null);


    for (var di = 0; di < this.Data.Hotspots.length; di++) {
        var pdata = this.Data.Hotspots[di];
        var found = false;
        match[di] = null;
        for (var pbi = 0; pbi < this.Hotspots.length; pbi++) {
            if (this.Hotspots[pbi].Data == pdata) {
                match[di] = this.Hotspots[pbi];
                found = true;
            }
        }
        if (!found) {
            var np = new SimulationAssetHotspot(this, pdata, false);
            this.Hotspots[this.Hotspots.length] = np;
            match[di] = np;
        }
        if (match[di].element != null) {
            this.AnswerContainer.insertBefore(match[di].element, null);
        }
    }
    this.Hotspots = match;

    while (this.AnswerContainer.childNodes.length > 0 && this.AnswerContainer.firstChild != firstMatch) this.AnswerContainer.removeChild(this.AnswerContainer.firstChild);

    if (this.DummyHotspot != null) this.DummyHotspot.UpdateData();
    for (var pl in this.Hotspots) {
        this.Hotspots[pl].UpdateData();
    }
    this.SimulationAsset.UpdateCoach();

}

SimulationAssetScreen.prototype.Reset = function () {
    this.SelectAnswer(null, true);
}

SimulationAssetScreen.prototype.SelectAnswer = function (Hotspot, Silent, KC) {
    this.KC = (KC == null) ? 0 : KC;



    if (this.DummyHotspot != null) {
        if (this.DummyHotspot.selected) this.DummyHotspot.UpdateSelected(false);
    }
    for (var pl in this.Hotspots) {
        if (this.Hotspots[pl].selected) this.Hotspots[pl].UpdateSelected(false);
    }

    if (Hotspot != null) {
        Hotspot.UpdateSelected(Hotspot.selected ? false : true);
    }

    if (!Silent) {
        if (Hotspot != null) if (!Hotspot.Correct() && Hotspot.LastClickType != 4) {

            for (var pl in this.Hotspots) {
                if (this.Hotspots[pl].IsCorrect()) {
                    var t = system.GetDataText(this.Data, "Feedback", '', true)
                    this.SimulationAsset.ShowFeedback(t, this.Hotspots[pl].GetRect(), false, true);
                }
            }


        }
    }

    if ((Hotspot != null || KC != null) && this.Answered()) {
        this.SimulationAsset.NextScreen();
    }
}



function SimulationAssetHotspot(SimulationAssetScreen, Data, IsDummy) {
    var _this = this;
    this.SimulationAssetScreen = SimulationAssetScreen;
    this.Data = Data;
    this.IsDummy = IsDummy;
    this.element = html.createLayer(SimulationAssetScreen.AnswerContainer, null);

    if (!IsDummy) {
        html.addEditElement(this.element, this);
        this.EditParent = SimulationAssetScreen;
        this.EditIsActive = function (Activate) {
            return this.EditParent.EditIsActive(Activate);
        }
        this.FindPage = function () {
            return this.EditParent.FindPage();
        }
        this.EditTryInsert = function (Type, EmptyObject, Offset, Editor) {
            return this.EditInsert(Type, EmptyObject, Offset, Editor);
        }
        this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
            return false;
        }
    }

    this.showanswers = false;
    this.selected = false;
    this.UpdateSelected = function (Selected) {
        this.selected = Selected;
    }
    this.mouseIn = false;
    this.mouseDown = false;


    this.awaitdoubleclick = 0;
    this.LastClickType = 0;
    this.doClick = function (evt) {

        var clickType = 'LEFT';
        if (evt.which) {
            if (evt.which == 3) clickType = 'RIGHT';
        }
        else if (evt.button) {
            if (evt.button == 2) clickType = 'RIGHT';
        }

        if (clickType == 'RIGHT') {
            this.LastClickType = 1;
            this.awaitdoubleclick = 0;
            this.SimulationAssetScreen.SelectAnswer(this, false);

        }
        else {
            if (this.awaitdoubleclick == 0) {
                setTimeout(this.doReset, 333);
                this.awaitdoubleclick = 1;
            }
            else {
                this.LastClickType = 2;
                this.awaitdoubleclick = 0;
                this.SimulationAssetScreen.SelectAnswer(this, false);

            }
        }
    }
    this.doReset = function () {
        if (_this.awaitdoubleclick == 1) {
            _this.LastClickType = 0;
            _this.SimulationAssetScreen.SelectAnswer(_this, false);

        }
        _this.awaitdoubleclick = 0;
    }

    if (supportsTouch) {
        _this.element.ontouchstart = function (e) {
            e.preventDefault();
            if (e.touches.length == 1) {
                if (!_this.SimulationAssetScreen.SimulationAsset.Page.Player.Block.menuUp) {
                    if (e.stopPropagation) e.stopPropagation();

                    _this.doClick(e);

                }
            }
        };
    }
    _this.element.onmouseover = function () {
        if (!_this.SimulationAssetScreen.SimulationAsset.Page.Player.Block.menuUp && !html.editing) {
            _this.LastClickType = 4;
            (function (_self) { _self.SimulationAssetScreen.SelectAnswer(_self, false); })(_this);
        }
    };
    _this.element.onmouseout = function () {

    };
    _this.element.onmousedown = function (e) {
        if (e == null)
            e = window.event;

        if (!_this.SimulationAssetScreen.SimulationAsset.Page.Player.Block.menuUp && !html.editing) {
            if (e.stopPropagation) e.stopPropagation();
            _this.mouseDown = true;
            _this.doClick(e);
            return true;
        }

    };
    _this.element.onmouseup = function () {
        _this.mouseDown = false;
    };
    if (!IsDummy) {
        this.CalculateSuspendData = function (data) {
            var sd = '';
            sd += (_this.selected ? '1' : '0');
            if (this.iconPosition != null) sd += ',' + this.iconPosition[0].toString() + ',' + this.iconPosition[1].toString();
            if (_this.Data.L != null) data[_this.Data.L.toString()] = sd;
        }
        this.ConsumeSuspendData = function (data) {
            var sd = data[_this.Data.L.toString()];
            if (sd != null) {
                var sds = sd.split(',');
                if (sds.length >= 3) {
                    _this.iconPosition = [ExtractNumber(sds[1]), ExtractNumber(sds[2])];
                }
                if (sds.length >= 1 && sds[0] == '1') {
                    _this.SimulationAssetScreen.SelectAnswer(_this, true);
                }

            }
        }

        this.Delete = function () {
            var i = arrayIndexOf(this.SimulationAssetScreen.Data.Hotspots, this.Data);
            if (i > -1) {
                this.SimulationAssetScreen.Data.Hotspots.splice(i, 1);
                this.SimulationAssetScreen.UpdateData();
                return true;
            }
        }
        this.Front = function () {
            var i = arrayIndexOf(this.SimulationAssetScreen.Data.Hotspots, this.Data);
            if (i > -1) {
                this.SimulationAssetScreen.Data.Hotspots.splice(i, 1);
                this.SimulationAssetScreen.Data.Hotspots[this.SimulationAssetScreen.Data.Hotspots.length] = this.Data;
                this.SimulationAssetScreen.UpdateData();
                return true;
            }
        }


        this.MoveDelta = function (x, y) {
            var newLeft = x + _this.start[0];
            var newTop = y + _this.start[1];
            var newWidth = _this.start[2];
            var newHeight = _this.start[3];


            if (newLeft < 0) newLeft = 0;
            if (newTop < 0) newTop = 0;

            var a = _this.Data;
            if (system.GetDataValue(a, "Left", 0) != newLeft ||
                system.GetDataValue(a, "Top", 0) != newTop ||
                system.GetDataValue(a, "Width", 0) != newWidth ||
                system.GetDataValue(a, "Height", 0) != newHeight) {

                system.saveValueData(a, "Left", newLeft, null);
                system.saveValueData(a, "Top", newTop, null);
                system.saveValueData(a, "Width", newWidth, null);
                system.saveValueData(a, "Height", newHeight, null);

                _this.UpdateData();
                return true;
            }
            else return false;
        }

        this.SizeDelta = function (x, y) {
            var newLeft = _this.start[0];
            var newTop = _this.start[1];
            var newWidth = x + _this.start[2];
            var newHeight = y + _this.start[3];

            if (newWidth < 1) newWidth = 1;
            if (newHeight < 1) newHeight = 1;

            var a = _this.Data;
            if (system.GetDataValue(a, "Left", 0) != newLeft ||
                system.GetDataValue(a, "Top", 0) != newTop ||
                system.GetDataValue(a, "Width", 0) != newWidth ||
                system.GetDataValue(a, "Height", 0) != newHeight) {

                system.saveValueData(a, "Left", newLeft, null);
                system.saveValueData(a, "Top", newTop, null);
                system.saveValueData(a, "Width", newWidth, null);
                system.saveValueData(a, "Height", newHeight, null);

                _this.UpdateData();
                return true;
            }
            else return false;
        }

        this.ResetDelta = function (x, y) {
            _this.start = this.GetRect();
        }
    }
}

SimulationAssetHotspot.prototype.Correct = function () {
    return (system.GetDataValue(this.Data, "Correct", 0) == 1) && (this.ClickType == this.LastClickType) && this.selected;
}

SimulationAssetHotspot.prototype.IsCorrect = function () {
    return (system.GetDataValue(this.Data, "Correct", 0) == 1);
}

SimulationAssetHotspot.prototype.GetRect = function () {
    return [
            system.GetDataValue(this.Data, "Left", 0),
            system.GetDataValue(this.Data, "Top", 0),
            system.GetDataValue(this.Data, "Width", 50),
            system.GetDataValue(this.Data, "Height", 50)

    ];
}

SimulationAssetHotspot.prototype.ToggleEdit = function (editing) {
    this.element.style.border = editing?'2px solid green':'';
}

SimulationAssetHotspot.prototype.FireCheck = function () {
    this.showanswers = true;
}

SimulationAssetHotspot.prototype.ReleaseCheck = function () {
    this.showanswers = false;
}

SimulationAssetHotspot.prototype.UpdateData = function () {

    this.element.style.boxSizing = 'border-box';
    if (this.IsDummy) {
        this.element.style.left = 0 + 'px';
        this.element.style.top = 0 + 'px';
        this.element.style.right = 0 + 'px';
        this.element.style.bottom = 0 + 'px';
        this.element.style.position = 'absolute';
    }
    else {
        var x = system.GetDataValue(this.Data, "Left", 0);
        var y = system.GetDataValue(this.Data, "Top", 0);
        var w = system.GetDataValue(this.Data, "Width", 50);
        var h = system.GetDataValue(this.Data, "Height", 50);

        this.element.style.left = x + 'px';
        this.element.style.top = y + 'px';
        this.element.style.width = w + 'px';
        this.element.style.height = h + 'px';
        this.element.style.position = 'absolute';
    }
    this.ClickType = system.GetDataValue(this.Data, "ClickType", 0);

    if (this.ClickType == 3 || this.ClickType == 5) {
        var s = this.SimulationAssetScreen.SimulationAsset.Style.Simulation;
       
        if (this.ExplainLayer == null) {
            this.ExplainLayer = html.createLayer(this.element, null);
            this.ExplainLayer.style.boxSizing = 'border-box';
            var hidetext = false;
            if (this.ClickType == 3) {
                var of = system.GetDataFile(s, "ExplainOpenSource", '', true);
                var cf = system.GetDataFile(s, "ExplainCloseSource", '', true);
                if (of != '' && cf != '') {
                    var ExplainButton = html.createLayer(this.ExplainLayer);
                    ExplainButton.style.zIndex = 100000;
                    ExplainButton.style.position = 'absolute';
                    this.ExplainButtonOpen = html.createElement(ExplainButton, "img");
                    this.ExplainButtonOpen.src = of;
                    this.ExplainButtonOpen.style.display = 'block';
                    this.ExplainButtonClose = html.createElement(ExplainButton, "img");
                    this.ExplainButtonClose.src = cf;
                    this.ExplainButtonClose.style.display = 'none';
                    var _self = this;
                    hidetext = true;
                    var handler = function (e) {
                        if (e.preventDefault) e.preventDefault();
                        if (e.stopPropagation) e.stopPropagation();

                        if (_self.ExplainButtonOpen.style.display == 'block') {
                            _self.ExplainButtonOpen.style.display = 'none';
                            _self.ExplainButtonClose.style.display = 'block';
                            _self.ExplainText.style.display = 'block';
                        }
                        else {
                            _self.ExplainButtonOpen.style.display = 'block';
                            _self.ExplainButtonClose.style.display = 'none';
                            _self.ExplainText.style.display = 'none';


                        }
                        return true;
                    }
                    if (supportsTouch) {
                        ExplainButton["ontouchstart"] = handler;
                    }
                    ExplainButton["onmousedown"] = handler;

                }
            }

            this.ExplainText = html.createText(this.ExplainLayer, null, '');
            if (hidetext) {
                _self.ExplainText.style.display = 'none';
            }
        }
       
        
        if (this.ClickType == 3) {
            html.fillText(this.ExplainText, s.ExplainText, system.GetDataText(this.Data, "Feedback", '', true));
            html.styleElement(this.ExplainLayer, s.ExplainLayer);
            this.ExplainText.style.width = this.element.style.width;
            this.ExplainLayer.style.borderRadius = system.GetDataValue(s, "ExplainCornerRadius", 0) + "px";
        }
        if (this.ClickType == 5) {
            html.styleElement(this.ExplainLayer, s.HighLightLayer);
        }
    }
    else {
        if (this.ExplainLayer != null) {
            this.element.removeChild(this.ExplainLayer);
            this.ExplainLayer = null;
        }
    }

    this.ToggleEdit(html.editing);
}

//
//slm_socialasset
//

function SocialAsset(Page, Data) {

    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);


    this.UpdateData();
}


SocialAsset.prototype.UpdateData = function () {

    this.Page.PositionAsset(this);
    this.text = system.GetDataText(this.Data, "Text", '', true);
    this.url = system.GetDataText(this.Data, "URL", '', true);
    this.sum = system.GetDataText(this.Data, "Summary", '', true);
    this.st = system.GetDataValue(this.Data, "SocialType", 0, true);

    var _this = this;
    if (this.Style != null && this.Style.MailButton != null && this.st != 3) {
        if (this.link == null) {
            if (this.st == 0) {

                this.link = new ImageButton(this.Surface, function () { _this.Fire(); }, this, false, null, this.Style.MailButton.TwitterSource, this.Style.MailButton.TwitterHoverSource);
            }
            else if (this.st == 1) {
                this.link = new ImageButton(this.Surface, function () { _this.Fire(); }, this, false, null, this.Style.MailButton.FacebookSource, this.Style.MailButton.FacebookHoverSource);
            }
            else if (this.st == 2) {
                this.link = new ImageButton(this.Surface, function () { _this.Fire(); }, this, false, null, this.Style.MailButton.LinkedInSource, this.Style.MailButton.LinkedInHoverSource);
            }
        }
        else {
            if (this.st == 0) {
                this.link.Change(null, this.Style.MailButton.TwitterSource, this.Style.MailButton.TwitterHoverSource);
            }
            else if (this.st == 1) {
                this.link.Change(null, this.Style.MailButton.FacebookSource, this.Style.MailButton.FacebookHoverSource);
            }
            else if (this.st == 2) {
                this.link.Change(null, this.Style.MailButton.LinkedInSource, this.Style.MailButton.LinkedInHoverSource);
            }
        }

        if (this.caption != null) {
            this.Surface.removeChild(this.caption);
            this.caption = null;
        }
    }
    else {
        if (this.link != null) {
            this.Surface.removeChild(this.link);
            this.link = null;
        }

        if (this.st == 3) {

            if (this.caption == null) {
                this.caption = html.createElement(this.Surface, "span");
                this.caption.innerHTML = this.text;


                this.caption.style.textDecoration = 'none';
                var handler1 = function (e) {
                    if (e == null) e = window.event;
                    if (e.preventDefault) e.preventDefault();
                    else e.returnValue = false;
                    return false;
                }
                if (supportsTouch) {
                    this.Surface['ontouchstart'] = handler1;
                }
                this.Surface['onmousedown'] = handler1;

                this.Surface['onclick'] = function (e) {
                    if (e == null) e = window.event;
                    if (e.preventDefault) e.preventDefault();
                    else e.returnValue = false;
                    return false;
                }
                var _this = this;

                var handler2 = function (e) {
                    if (e == null) e = window.event;
                    if (e.preventDefault) e.preventDefault();
                    else e.returnValue = false;

                    {
                        

                        var mywindow = window.open('', 'Print', 'height=400,width=600');
                        mywindow.document.write('<html><head><title>Print</title>');
                        mywindow.document.write('</head><body >');
                        mywindow.document.write(_this.Page.Grid.innerHTML);
                        mywindow.document.write('</body></html>');

                        mywindow.document.close(); // necessary for IE >= 10
                        mywindow.focus(); // necessary for IE >= 10

                        mywindow.print();
                        mywindow.close();
                    }
                    return false;
                }
                if (supportsTouch) {
                    this.Surface['ontouchend'] = handler2;
                }
                this.Surface['onmouseup'] = handler2;


                this.Surface.style.cursor = 'pointer';
            }
            //this.Surface.style.textAlign = 'center';
            html.fillText(this.caption, this.Style.DownloadLink, this.text);
        }
    }




}

SocialAsset.prototype.Fire = function () {
    if (!html.editing) {
        if (this.st == 0) {
            window.open('https://twitter.com/share?url=' + encodeURIComponent(this.url) + '&text=' + encodeURIComponent(this.text), '_blank', 'toolbar=0,location=0,menubar=0');
        }
        else if (this.st == 1) {
            window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(this.url), '_blank', 'toolbar=0,location=0,menubar=0');
        }
        else if (this.st == 2) {
            window.open('https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(this.url) + '&title=' + encodeURIComponent(this.text) + '&summary=' + encodeURIComponent(this.sum) + '&source=', '_blank', 'toolbar=0,location=0,menubar=0');
        }
        else if (this.st == 3) {

        }
    }
    else {

    }
}


//
//slm_textasset
//
///text asset
function TextAsset(Page, Data) {
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);



    this.EditInsert = function (Type, EmptyObject, Offset, Editor) {
        if (Type == 398) {

            this.Page.Player.Block.EditInsert(Type, EmptyObject, Offset, Editor);

            system.saveReferenceData(this.Data, "LightBox", EmptyObject.L, null);
            this.UpdateData();

            Editor.GenericDataEditComponent.WYSIWYGUpdate(this, false, true);

            return true;
        }
        return false;
    }



    if (html5 || ie8) {
        this.container = html.createLayer(this.Surface, null);
        this.container.style.position = 'relative';
        this.container.style.display = 'table-cell';
    }
    else {
        this.wrapper = html.createLayer(this.Surface, null);
        this.wrapper.style.position = 'absolute';
        this.container = html.createLayer(this.wrapper, null);
        this.container.style.position = 'relative';
    }

    this.Title = html.createText(this.container, null, '');
    this.SubTitle = html.createText(this.container, null, '');
    this.Body = html.createFormattedText(this.container, null, '');



    this.UpdateData();

}



TextAsset.prototype.Enter = function () {
    if (this.scroller) {
        this.scroller.UpdateScroll();
    }
}

TextAsset.prototype.AfterEnter = function () {
    var _self = this;
    setTimeout( function () {
        if (_self.scroller) {
            _self.scroller.UpdateScroll();
    }
    },100)
}

TextAsset.prototype.GetContentHeight = function () {
    return this.container.offsetHeight + ExtractNumber(this.Body.style.marginBottom);
}
TextAsset.prototype.UpdateData = function () {

    this.Page.PositionAsset(this);

    //this.Surface.style.overflowY = (system.GetDataValue(this.Data, "ScrollBar", 0) == 0) ? 'hidden' : 'auto';

    var t = system.GetDataText(this.Data, "Title", '', true);
    if (t != '') {
        this.Title.style.display = '';

        html.fillText(this.Title, (this.Style == null) ? null : this.Style.Title, t);
    }
    else {
        this.Title.style.display = 'none';
    }

    var t = system.GetDataText(this.Data, "SubTitle", '', true);
    if (t != '') {
        this.SubTitle.style.display = '';

        html.fillText(this.SubTitle, (this.Style == null) ? null : this.Style.SubTitle, t);
    }
    else {
        this.SubTitle.style.display = 'none';
    }

    var t = system.GetDataText(this.Data, "Body", '', true);
    if (t != '') {
        this.Body.style.display = '';

        html.fillFormattedText(this.Body, this.Style, t);
    }
    else {
        this.Body.style.display = 'none';
    }

    if (this.Data.BackgroundColor != null) {
        var v = system.GetDataValue(this.Data, "BackgroundColor", null);
        if (v != null) {
            var color = system.GetDataText(this.Page.Player.Block.GetColorStyle(v), "Color", this.Surface.style.backgroundColor, false);
            color = safeColor(color);
            try{
                this.Surface.style.backgroundColor = color;
            }
            catch (e) {

            }
        }
    }
    if (this.Data.ForegroundColor != null) {
        var v = system.GetDataValue(this.Data, "ForegroundColor", null);
        if (v != null) {
            var t = system.GetDataText(this.Page.Player.Block.GetColorStyle(v), "Color", null, false);
            t = safeColor(t);
            this.Title.style.color = (t == null) ? this.Title.style.color : t;
            this.SubTitle.style.color = (t == null) ? this.SubTitle.style.color : t;
            this.Body.style.color = (t == null) ? this.Body.style.color : t;

            for (var i in this.Body.childNodes) {
                var elt = this.Body.childNodes[i];
                if (elt.nodeName == 'FONT') {
                    elt.style.color = (t == null) ? elt.style.color : t;
                }
                else if (elt.nodeName == 'SPAN') {
                    elt.style.color = (t == null) ? elt.style.color : t;
                }
            }


        }
    }

    var ha = system.GetDataValue(this.Data, "HorizontalAlignment", 0);

    if (ha == 0) {
        this.container.style.textAlign = 'left';
    }
    else if (ha == 1) {
        this.container.style.textAlign = 'center';
    }
    else if (ha == 2) {
        this.container.style.textAlign = 'right';
    }
    else if (ha == 3) {
        this.container.style.textAlign = 'justify';
    }

    var va = system.GetDataValue(this.Data, "VerticalAlignment", 0);
    this.container.style.width = this.Surface.style.width;
    if (va < 3) {
        if (html5 || ie8) {
            this.container.style.height = this.Surface.style.height;
            this.container.style.display = 'table-cell';
        }
        if (this.scroller) {
            this.scroller.Dispose();
            this.scroller = null;
        }
        html.removeDragElement(this);
    }
    else {

        this.container.style.display = 'inline-block';
        this.container.style.height = 'auto';
    }

    


    if (va == 0) {
        if (html5 || ie8) {
            this.container.style.verticalAlign = 'top';
            this.container.style.top = '';
        }
        else {
            this.wrapper.style.top = this.Surface.style.paddingTop;
            this.container.style.top = '0px';
        }
    }
    else if (va == 1) {
        if (html5 || ie8) {
            this.container.style.verticalAlign = 'middle';
            this.container.style.top = '';
        }
        else {
            this.wrapper.style.top = '50%';
            this.container.style.top = '-50%';
        }
    }
    else if (va == 2) {
        if (html5 || ie8) {
            this.container.style.verticalAlign = 'bottom';
            this.container.style.top = '';
        }
        else {
            this.wrapper.style.bottom = this.Surface.style.paddingBottom;
            this.container.style.top = '0px';
        }
    }
    else if (va == 3) {
        if (html5 || ie8) {
            this.container.style.verticalAlign = 'top';
            this.container.style.top = '0px';
        }
        else {
            this.wrapper.style.top = this.Surface.style.paddingTop;
            this.container.style.top = '0px';
        }

        if (!this.scroller) {
            this.scroller = new Scroller(this);
        }

        html.addDragElement(this.container, this);
        this.DragDelta = function (x, y) {
            var target = (y + this.startPos[1]);
            if (target > 0) target = 0;
            var h = this.Surface.offsetHeight - ExtractNumber(this.Surface.style.paddingTop) - ExtractNumber(this.Surface.style.paddingBottom);
            if (target < (h - this.GetContentHeight())) target = (h - this.GetContentHeight());
            this.container.style.top = target + 'px';
            if (this.scroller) {
                this.scroller.UpdateScroll();
            }

        }
        this.DragStart = function (x, y) {
            y = ExtractNumber(this.container.style.top);
            this.startPos = [x, y];
           

        }
        this.DragStop = function (x, y, target, offset) {
            if (x > -10 && x < 10 && y > -10 && y < 10 && this.Clicked) {
                this.Clicked();
            }
            return false;
        }
        
        var _this = this;
        var ff = (/Firefox/i.test(navigator.userAgent));
        this.Surface[ff? "onwheel" : "onmousewheel"] = function (e) {
            var evt = window.event || e;
            var delta = ff ? (evt.deltaY * -40) : (evt.detail ? (evt.detail * -120) : evt.wheelDelta);
            _this.ScrollDelta(delta);
            evt.cancelBubble = true;
            if (evt.stopPropagation) evt.stopPropagation();
            
        }


        if (this.scroller) {
            this.scroller.UpdateScroll();
        }
    }






    var lbid = system.GetDataReference(this.Data, "LightBox", 0);
    var juid = system.GetDataReference(this.Data, "Jump", 0);

    if (lbid != 0 || juid != 0) {
        var _this = this;
        this.container.style.cursor = 'pointer';


        if (va < 3) {
            this.mouseIn = false;
            this.mouseDown = false;




            if (supportsTouch) {
                this.container.ontouchstart = function (e) {
                    e.preventDefault();
                    if (html.editing) return false;
                    if (e.touches.length == 1) {
                        if (!_this.Page.Player.Block.menuUp && !html.editing) {
                            if (e.stopPropagation) e.stopPropagation();
                            _this.Clicked(false);
                        }
                    }
                };
            }
            //else {
                this.container.onmouseover = function () {
                    if (!_this.Page.Player.Block.menuUp) {
                        _this.mouseIn = true;

                    }
                };
                this.container.onmouseout = function () {
                    _this.mouseIn = false;

                };
                this.container.onmousedown = function (e) {
                    if (e == null)
                        e = window.event;

                    if (!_this.Page.Player.Block.menuUp && !html.editing) {
                        if (e.stopPropagation) e.stopPropagation();
                        _this.mouseDown = true;

                        return false;
                    }

                };
                this.container.onmouseup = function () {
                    _this.mouseDown = false;
                    if (_this.mouseIn && !html.editing) _this.Clicked(false);
                };
            //}
        }

        var style = null;
        var lid = lbid;
        var lb = null;
        if (lbid != 0) {
            if (system.GetDataValue(this.Style, "ShowLightBoxButtons", 1) == 1) {

                for (var p in this.Page.Player.Block.Data.LightBoxes) {
                    var lightbox = this.Page.Player.Block.Data.LightBoxes[p];
                    if (lightbox.L == lid) {
                        style = this.Page.Player.Block.GetLightBoxStyle(system.GetDataValue(lightbox, "LightBoxType", 0)).OpenLightBoxButtonStyle
                        lb = lightbox;
                    }
                }
            }
        }
        else if (juid != 0) {
            if (system.GetDataValue(this.Style, "ShowLinkButtons", 0) == 1) {
                lb = juid;
                style = this.Style.LinkButtonStyle;
            }
        }
        if (lb != null) {
            if (this.LBButton == null) {
                this.LBButton = new Button(this.Surface, style, function () {
                    _this.Clicked(true);
                }, this.Page.Player.Block, true);
            }
            else {
                this.LBButton.ChangeStyle(style);
            }
        }
        else {
            if (this.LBButton != null) {
                this.Surface.removeChild(this.LBButton.element);
            }
            this.LBButton = null;
        }


        this.Clicked = function (LB) {
            var lbid = system.GetDataReference(this.Data, "LightBox", 0);
            var juid = system.GetDataReference(this.Data, "Jump", 0);
            if (lbid != 0) {
                var lid = lbid;
                for (var p in this.Page.Player.Block.LightBoxes) {
                    var lightbox = this.Page.Player.Block.LightBoxes[p];
                    if (lightbox.Data.L == lid) {
                        this.Page.Player.Block.ShowLightBox(lightbox);
                    }
                }
            }
            else {
                this.Page.Player.Block.SpreadEvent("LoadPage", this, { "Page": juid, "Found": false, "ActivatePage": null });
            }
        }

    }
    else {
        this.Clicked = null;
        if (this.LBButton != null) {
            this.Surface.removeChild(this.LBButton.element);
        }
        this.LBButton = null;
        this.container.onmousedown = null;
        this.container.onmouseup = null;
        this.container.onmouseover = null;
        this.container.onmouseout = null;
        this.container.ontouchstart = null;
        this.container.style.cursor = 'default';
    }
}

TextAsset.prototype.ScrollDelta = function (delta) {
    var target = ExtractNumber(this.container.style.top) + delta / 5;
    if (target > 0) target = 0;
    var h = this.GetSurfaceHeight();
    if (target < (h - this.GetContentHeight())) target = (h - this.GetContentHeight());
    this.container.style.top = target + 'px';
    if (this.scroller) {
        this.scroller.UpdateScroll();
    }
}

TextAsset.prototype.GetSurfaceHeight = function () {
    return this.Surface.offsetHeight - ExtractNumber(this.Surface.style.paddingTop) - ExtractNumber(this.Surface.style.paddingBottom);
}
TextAsset.prototype.GetPlainSurfaceHeight = function () {
    return this.Surface.offsetHeight;
}

TextAsset.prototype.AfterUpdateScroll = function () {
  
}


function Scroller(owner) {
    this.Owner = owner;
    if (!this.scrollUp) {
        this.scrollUp = html.createElement(this.Owner.Surface, "img");
    }
    this.scrollUp.src = system.GetDataFile(this.Owner.Style, "ScrollUpSource", '', true);
    this.scrollUp.style.position = 'absolute';
    this.scrollUp.style.top = '0px';
    this.scrollUp.style.right = '0px';
    if (!this.scrollDown) {
        this.scrollDown = html.createElement(this.Owner.Surface, "img");
    }
    this.scrollDown.src = system.GetDataFile(this.Owner.Style, "ScrollDownSource", '', true);
    this.scrollDown.style.position = 'absolute';
    this.scrollDown.style.bottom = '0px';
    this.scrollDown.style.right = '0px';
    if (!this.scrollValue) {
        this.scrollValue = html.createElement(this.Owner.Surface, "img");
    }

    var _this = this;
    this.scrollDown.onmousedown = function () {
     
        _this.Owner.ScrollDelta(-200);
    }
    this.scrollUp.onmouseup = function () {

        _this.Owner.ScrollDelta(200);
    }

    

    this.scrollValue.src = system.GetDataFile(this.Owner.Style, "ScrollValueSource", '', true);
    this.scrollValue.style.position = 'absolute';
    this.scrollValue.style.right = '0px';
    this.DragStart = function (x, y) {

        _this.scrollvaluedown = true;
        _this.scrollvaluestart = ExtractNumber(_this.scrollValue.style.top) ;

    }

    this.DragStop = function (x, y) {
    }

    this.DragDelta = function (x, y) {

        var s = _this.Owner.GetPlainSurfaceHeight() - _this.scrollUp.offsetHeight - _this.scrollDown.offsetHeight - _this.scrollValue.offsetHeight;
            var h = _this.Owner.GetSurfaceHeight() - _this.Owner.GetContentHeight();
            var target = (_this.scrollvaluestart + y - _this.scrollUp.offsetHeight) * h / s;
            if (target > 0) target = 0;
            if (target < h) target = h;
            _this.Owner.container.style.top = target + 'px';
            _this.UpdateScroll();

    }

    html.addDragElement(this.scrollValue, this);
}

Scroller.prototype.Dispose = function () {
    html.removeDragElement(this);
    this.Owner.Surface.removeChild(this.scrollUp);
    this.Owner.Surface.removeChild(this.scrollDown);
    this.Owner.Surface.removeChild(this.scrollValue);
}


Scroller.prototype.UpdateScroll = function () {
    try{
        var y = ExtractNumber(this.Owner.container.style.top);

        if (y < 0) this.scrollUp.style.visibility = 'visible';
        else this.scrollUp.style.visibility = 'hidden';
        var h = this.Owner.GetSurfaceHeight() - this.Owner.GetContentHeight();
        if (y > h) this.scrollDown.style.visibility = 'visible';
        else this.scrollDown.style.visibility = 'hidden';
        if (h < 0) this.scrollValue.style.visibility = 'visible';
        else this.scrollValue.style.visibility = 'hidden';

        var s = this.Owner.GetPlainSurfaceHeight() - this.scrollUp.offsetHeight - this.scrollDown.offsetHeight - this.scrollValue.offsetHeight;
        this.scrollValue.style.top = this.scrollUp.offsetHeight + Math.round(y * s / h) + 'px';
    }
    catch (e){
        this.scrollValue.style.top = this.scrollUp.offsetHeight + 'px';

    }

    this.Owner.AfterUpdateScroll();
}


//
//slm_timerasset
//
//timer asset


function TimerAsset(Page, Data) {
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);

    this.ResultsFixed = false;
    this.Expired = false;
    this.timer = 0;


    if (this.Data["Seconds"] == null) system.saveValueData(this.Data, "Seconds", 10, null);
    if (this.Data["Start"] == null) system.saveValueData(this.Data, "Start", 1, null);
    this.steps = 40;

    this.bg = html.createElement(this.Surface, "div");
    this.bg.style.position = "absolute";
    this.bg.style.left = "0px";
    this.bg.style.top = "0px";

    this.bgimg = html.createElement(this.bg, 'IMG');
    this.bgimg.style.position = "absolute";
    this.bgimg.style.left = "0px";
    this.bgimg.style.top = "0px";
    this.fill = html.createElement(this.bg, "div");
    this.fill.style.position = "absolute";
    this.fill.style.left = "0px";
    this.fill.style.top = "0px";
    this.fill.style.overflowX = "hidden";
    this.fill.style.width = "0px";
    this.fillimg = html.createElement(this.fill, 'IMG');
    this.fillimg.style.position = "absolute";
    this.fillimg.style.left = "0px";
    this.fillimg.style.top = "0px";


    this.UpdateData();
    var _this = this;

    this.CalculateSuspendData = function (data) {
        var sd = '';
        sd += (this.ResultsFixed ? '1' : '0') + '|' + (this.first ? '1' : '0') + '|' + this.ticks.toString() + '|' + (this.Expired ? '1' : '0');

        if (_this.Data.L != null) data[_this.Data.L.toString()] = sd;
    }
    this.ConsumeSuspendData = function (data) {
        var sd = data[_this.Data.L.toString()];
        if (sd != null) {
            if (sd == '') {
                
            }
            else {
                var options = sd.split('|');
                this.ResultsFixed = (options[0].toString() == '1');
                this.first = (options[1].toString() == '1');
                this.ticks = ExtractNumber(options[2]);

                if (options.length>3) this.Expired = (options[3].toString() == '1');

                this.UpdateFiller();
            }
        }
    }
}

TimerAsset.prototype.Expire = function(){
    this.Expired = true;
}


TimerAsset.prototype.UpdateSize = function(){

    this.bg.style.width = this.Surface.offsetWidth + 'px';
    this.bg.style.height = this.Surface.offsetHeight + 'px';
    this.bgimg.style.width = this.Surface.offsetWidth + 'px';
    this.bgimg.style.height = this.Surface.offsetHeight + 'px';
    this.fill.style.height = this.Surface.offsetHeight + 'px';
    this.UpdateFiller();
    this.fillimg.style.width = this.Surface.offsetWidth + 'px';
    this.fillimg.style.height = this.Surface.offsetHeight + 'px';
}

TimerAsset.prototype.UpdateData = function () {
    this.Page.PositionAsset(this);

    this.Reset();

    if (this.Style != null && this.Style.TimerSource != null && this.Style.TimerFillerSource) {
        this.bgimg.src = system.GetDataFile(this.Style, "TimerSource", '', true);
        this.fillimg.src = system.GetDataFile(this.Style, "TimerFillerSource", '', true);
    }

    this.UpdateSize();



    var ss = 0;
    if (this.Data.Score != null) ss = this.Data.Score.length;
    if (ss > 0) {

        this.GetScore = function (cat, fieldtype) {
            if (fieldtype == 1 || fieldtype == 2) {
                var score = 0;
                if (this.Expired) {
                    for (var s in this.Data.Score) {
                        var sels = this.Data.Score[s];
                        var c = system.GetDataValue(sels, "Category", 0)
                        if (cat == null || c == cat) {
                            score += system.GetDataValue(sels, "Score", 0);
                        }
                    }
                }
                return score;
            }
            else if (fieldtype == 3) {
                var ms = 0;

                for (var s in this.Data.Score) {
                    var sels = this.Data.Score[s];
                    if (cat == null || system.GetDataValue(sels, "Category", 0) == cat) {
                        var nms = system.GetDataValue(sels, "Score", 0)
                        if (nms > ms) ms = nms;
                    }
                }
                return ms;
            }
            else if (fieldtype == 4) {
                return !this.Expired;
            }
            else if (fieldtype == 5) {
                return 1;
            }
            else if (fieldtype == 9) {
                var score = 0;
                if (this.Expired) score++;
                return score;
            }
        }
    }
    else {
        this.GetScore = null;
    }
}

TimerAsset.prototype.Reset = function () {
    this.first = true;
    this.ticks = 0;
    this.Expired = false;
    this.ResultsFixed = false;
    this.Page.SpreadEvent("TimerReset", this, null);
}

TimerAsset.prototype.AssetEvent = function (Event, Asset, Params) {
    if (Event == "MCChoice") {
        if (this.timer != 0) {
            clearInterval(this.timer);
            this.timer = 0;
        }
    }
    if (Event == "FixResults") {
        this.ResultsFixed = true;
    }
}

TimerAsset.prototype.Leave = function () {
    if (this.timer != 0) {
        clearInterval(this.timer);
        this.timer = 0;
    }

}
TimerAsset.prototype.Enter = function () {

    if (system.GetDataValue(this.Data, "Start", 0) == 1) {
        this.Reset();
    }
    if (!this.ResultsFixed) {
        if (this.first) {
            var _this = this;
            this.ticks = 0;
            if (this.timer == 0) this.timer = setInterval((function (self) {
                return function () { self.Tick(); }
            })(_this), 1000 / this.steps);

            this.first = false;
        }
    }
}

TimerAsset.prototype.AfterEnter = function () {
    this.UpdateSize();
}

TimerAsset.prototype.Tick = function () {
    this.ticks++;
    if (this.ticks >= system.GetDataValue(this.Data, "Seconds", 10) * this.steps) {
        if (this.timer != 0) {
            clearInterval(this.timer);
            this.timer = 0;
        }
        this.Page.SpreadEvent("Timer", this, { "Check": 1 });
        this.ticks = system.GetDataValue(this.Data, "Seconds", 10) * this.steps;


        var lbid = system.GetDataReference(this.Data, "LightBox", 0);
        var juid = system.GetDataReference(this.Data, "Jump", 0);
        if (lbid != 0) {
            var lid = lbid;
            for (var p in this.Page.Player.Block.LightBoxes) {
                var lightbox = this.Page.Player.Block.LightBoxes[p];
                if (lightbox.Data.L == lid) {
                    this.Page.Player.Block.ShowLightBox(lightbox);
                    this.Expire();

                }
            }
        }
        else {
            this.Expire();
            this.Page.Player.Block.SpreadEvent("LoadPage", this, { "Page": juid, "Found": false, "ActivatePage": null });
        }
        if (this.Data.Score != null && this.Data.Score.length > 0) {
            this.Page.UpdateResultConditions();
        }


    }
    this.UpdateFiller();

}

TimerAsset.prototype.UpdateFiller = function () {
    var w = this.Surface.offsetWidth;
    if (w == 0) w = ExtractNumber(this.bg.style.width);
    this.fill.style.width = Math.round(w * this.ticks / system.GetDataValue(this.Data, "Seconds", 10) / this.steps) + 'px';

}

//
//slm_uploadasset
//
//Upload

function UploadAsset(Page, Data) {
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);


    this.iframe = null;

    this.UpdateData();
}

UploadAsset.prototype.UpdateData = function () {
    this.Page.PositionAsset(this);
    this.Assignment = encodeURIComponent(system.GetDataText(this.Data, "Assignment", '', true));
    this.EmailSubject = encodeURIComponent(system.GetDataText(this.Data, "EmailSubject", '', true));
    this.EmailBody = encodeURIComponent(system.GetDataText(this.Data, "EmailBody", '', true));
    this.UploadType = system.GetDataValue(this.Data, "Type", 0);
    var _this = this;


    if (this.iframe == null) {
        this.iframe = html.createElement(this.Surface, "IFRAME");
    }

    this.iframe.style.width = this.Surface.style.width;
    this.iframe.style.height = this.Surface.style.height;
    this.iframe.style.border = '0px';

    if (this.Page.Player.CurrentPage == this.Page) this.Enter();
}


UploadAsset.prototype.Enter = function () {
    if ((this.UploadType == 0 || this.UploadType == 1) && FieldAPIData!=null) {
        var url = GetFieldAPIUrl("/Upload.aspx?T=" + FieldAPIData.Token + "&L=" + this.Data.L + "&U=" + this.UploadType + "&A=" + this.Assignment + "&S=" + this.EmailSubject + "&M=" + this.EmailBody);
        this.iframe.src = url;
    }
}

//
//slm_videoasset
//
//video asset

function VideoAsset(Page, Data) {
    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);


    this.first = true;
    this.mustplay = false;
    this.mustPause = false;
    this.citrixSafe = (!html5||isIE) && citrix;


    this.mouseInVid = false;
    this.mouseInControls = false;

    this.mouseInControl = false;
    this.mouseDownControl = false;

    this.mouseInProgress = false;
    this.mouseDownProgress = false;

    this.mouseDown = false;

    this.state = 'pause';
    this.completed = false;

    if (!this.Data.ShowControls) system.saveValueData(this.Data, "ShowControls", 1, null);
    if (!this.Data.Next) system.saveValueData(this.Data, "Next", 0, null);
    if (!this.Data.AutoStart) system.saveValueData(this.Data, "AutoStart", 1, null);
    if (!this.Data.KeepVideo) system.saveValueData(this.Data, "KeepVideo", 1, null);
    var allowseek = system.GetDataValue(this.Data, "AllowSeek", 1)==1;

    this.KeepVideo = system.GetDataValue(this.Data, "KeepVideo", 1);
    var _this = this;

    this.controlsLayer = null;
    this.vid = null;
    if (!mobile && !this.citrixSafe &&(this.KeepVideo==1)) this.createPlayer();

    if (!this.citrixSafe) {
        this.subtitleLayer = html.createLayer(this.Surface, null);
        this.controlsLayer = html.createLayer(this.Surface, null);
        this.controlsLayer.style.zIndex = '2';
        this.controlsImg = html.createElement(this.controlsLayer, "IMG");
        this.controlsImg.style.position = 'absolute';
        this.progressLayer = html.createLayer(this.controlsLayer, null);
        this.progressLayer.style.position = 'absolute';
        this.controlLayer = html.createLayer(this.controlsLayer, null);
        this.controlImg = html.createElement(this.controlLayer, "IMG");
        this.progressImg = html.createElement(this.progressLayer, "IMG");
        this.fillerLayer = html.createLayer(this.progressLayer, null);
        this.fillerLayer.style.overflow = 'hidden';
        this.progressImg.style.position = 'absolute';
        this.progressImg.style.left = '0px';
        this.progressImg.style.top = '0px';
        this.fillerLayer.style.position = 'absolute';
        this.fillerLayer.style.left = '0px';
        this.fillerLayer.style.top = '0px';


        this.subtitleButtonLayer = html.createLayer(this.controlsLayer, null);
        this.subtitleButtonImg = html.createElement(this.subtitleButtonLayer, "IMG");
        this.showSubtitles = true;
        this.mouseInSubtitleButton = false;
        this.mouseSubtitleButtonDown = false;

       // html.applyElementTransition(this.fillerLayer, "width 0.2s");

        this.fillerImg = html.createElement(this.fillerLayer, "IMG");

        this.controlsLayer.onmouseover = function () {
            _this.mouseInControls = true;
            _this.UpdateControls();
        }

        this.controlsLayer.onmouseout = function () {
            _this.mouseInControls = false;
            _this.UpdateControls();
        }
        this.subtitleLayer.onmouseover = function () {
            _this.mouseInControls = true;
            _this.UpdateControls();
        }

        this.subtitleLayer.onmouseout = function () {
            _this.mouseInControls = false;
            _this.UpdateControls();
        }

        if (supportsTouch) {
            _this.Surface.ontouchstart = function (e) {
                e.preventDefault();
                if (e.touches.length == 1) {
                    _this.Toggle();
                }
            }
        }
        //else {
        this.controlLayer.onmouseover = function () {
            _this.mouseInControl = true;
            _this.UpdateControls();
        }
        this.controlLayer.onmouseout = function () {
            _this.mouseInControl = false;
            _this.UpdateControls();
        }
        this.Surface.onmousedown = function () {
            _this.mouseDown = true;
            _this.UpdateControls();
        }
        this.Surface.onmouseup = function () {
            _this.mouseDown = false;
            _this.Toggle();
            _this.UpdateControls();
        }


        this.subtitleButtonLayer.onmouseover = function () {
            _this.mouseInSubtitleButton = true;
            _this.UpdateControls();
        }
        this.subtitleButtonLayer.onmouseout = function () {
            _this.mouseInSubtitleButton = false;
            _this.UpdateControls();
        }
        this.subtitleButtonLayer.onmousedown = function (e) {
            _this.mouseSubtitleButtonDown = true;
            _this.UpdateControls();
            e.cancelBubble = true;
        }
        this.subtitleButtonLayer.onmouseup = function (e) {
            _this.mouseSubtitleButtonDown = false;
            _this.ToggleSubtitle();
            _this.UpdateControls();
            e.cancelBubble = true;
        }
        //}



            this.DragDelta = function (x, y) {
                if (html5) {
                    var target = (_this.StartX + x) * _this.vid.duration / ExtractNumber(this.progressLayer.offsetWidth);
                    if (target != Infinity && !isNaN(target) && target != -Infinity) _this.vid.currentTime = target;
                }
                else {
                    var target = (_this.StartX + x) * _this.vid.controls.currentItem.duration / ExtractNumber(this.progressLayer.offsetWidth);
                    if (target != Infinity && !isNaN(target) && target != -Infinity) _this.vid.controls.currentPosition = target;

                }
            }

            this.DragStart = function (x, y) {
                _this.StartX = x;
                if (html5) {
                    var target = (_this.StartX) * _this.vid.duration / ExtractNumber(this.progressLayer.offsetWidth);
                    _this.paused = _this.vid.paused;
                    if (!_this.paused) {
                        _this.vid.pause();
                    }
                    if (target != Infinity) _this.vid.currentTime = target;
                }
                else {
                    var target = (_this.StartX) * _this.vid.controls.currentItem.duration / ExtractNumber(this.progressLayer.offsetWidth);
                    _this.paused = (_this.vid.playstate == 2)
                    if (!_this.paused) {
                        _this.vid.controls.pause();
                    }
                    if (target != Infinity) _this.vid.controls.currentPosition = target;
                }
                _this.UpdateControls();

            }

            this.DragStop = function (x, y) {
                if (html5) {
                    var target = (_this.StartX + x) * _this.vid.duration / ExtractNumber(this.progressLayer.offsetWidth);
                    if (target != Infinity && target != -Infinity) _this.vid.currentTime = target;
                    if (!_this.paused && _this.Page.Player.CurrentPage == _this.Page) {
                        _this.vid.play();
                    }
                }
                else {
                    var target = (_this.StartX + x) * _this.vid.controls.currentItem.duration / ExtractNumber(this.progressLayer.offsetWidth);
                    if (target != Infinity) _this.vid.controls.currentPosition = target;
                    if (!_this.paused && _this.Page.Player.CurrentPage == _this.Page) {
                        _this.vid.controls.play();
                    }
                }
                _this.UpdateControls();

            }
    }

    if (!mobile && !this.citrixSafe && (this.KeepVideo==1)) this.UpdateData();



    this.CalculateSuspendData = function (data) {
        var sd = '';
        sd += (_this.completed ? '1' : '0');
        data[_this.Data.L.toString()] = sd;
    }
    this.ConsumeSuspendData = function (data) {
        var sd = data[_this.Data.L.toString()];
        if (sd != null) {
            var sds = sd.split(',');
            if (sds.length >= 1 && sds[0] == '1') {
                _this.completed = true;
            }
        }
    }
}

VideoAsset.prototype.AudioAvailable = function () {
    return system.GetDataFile(this.Data.Mp3Source, null, '', true) != '';
}

VideoAsset.prototype.createPlayer = function () {

   
    var _this = this;
    if (_this.vid != null) {
        if (html5) stopVideos(_this.Surface);
        _this.Surface.removeChild(_this.vid);
        _this.vid = null;
    }
    _this.IsAudio = _this.AudioAvailable()
    if (_this.citrixSafe) {
        _this.vid = html.createElement(_this.Surface, "IFRAME");
        _this.vid.frameBorder = 0;
    }
    else {

        _this.vid = html.createVideo(_this.Surface, system.GetDataValue(_this.Data, "ShowControls", 0) == 1, _this.controlsLayer, _this.IsAudio);
    }
    if (html5) {
        var media_events = ["timeupdate", "play", "pause", "ended"];
        for (var k in media_events) {
            _this.vid.addEventListener(media_events[k], function (event) {

                if (event.type == 'play') {
                    _this.state = 'play';
                    if (_this.Page.Player.CurrentPage != _this.Page) _this.Pause();
                    _this.UpdateControls();
                }
                if (event.type == 'pause') {
                    _this.state = 'pause';
                    _this.UpdateControls();
                }
                if (event.type == 'ended') {
                    _this.state = 'pause';
                    _this.Pause();
                    if (!_this.PauseLast) {
                        _this.Rewind();
                        _this.Pause();
                    }
                    _this.UpdateControls();
                    _this.UpdateProgress();
                    _this.SetCompleted();

                    if (system.GetDataValue(_this.Data, "Next", 0) == 1) {
                        _this.Page.Player.Forward();    
                    }
                }
                if (event.type == 'timeupdate') {
                    _this.UpdateProgress();
                }
            }, false);
        }
    }
    else if (!this.citrixSafe) {
        addEvent(_this.vid, "playStateChange", function (newstate) {
            if (newstate == 1) {
                //stop

                if (_this.mustPause) {
                    //
                    _this.Play();
                }
            }
            if (newstate == 3) {
                //play
                _this.state = 'play';
                _this.UpdateControls();
                if (_this.mustPause) {
                    _this.mustPause = false;
                    _this.Pause();
                    _this.Rewind();
                    
                }
                if (_this.Page.Player.CurrentPage != _this.Page) _this.Pause();
            }
            if (newstate == 2) {
                //pause
                _this.state = 'pause';
                _this.UpdateControls();
            }
            if (newstate == 8) {
                //ended
                _this.state = 'pause';

                //_this.Pause();

                _this.mustPause = true;

                _this.UpdateControls();
                _this.UpdateProgress();
                _this.SetCompleted();

                if (system.GetDataValue(_this.Data, "Next", 0) == 1) {             
                    _this.Page.Player.Forward(); 
                }
            }
        });

    }

    if (!this.citrixSafe) {
        this.vid.onmouseover = function () {
            _this.mouseInVid = true;
            _this.UpdateControls();
        }

        this.vid.onmousemove = function () {
           // _this.mouseInVid = true;
            _this.UpdateControls();
        }


        this.vid.onmouseout = function () {
            _this.mouseInVid = false;
            _this.UpdateControls();
        }
    }
}

VideoAsset.prototype.Toggle = function () {
    if (this.state == 'pause') this.Play();
    else if (this.state = 'play') this.Pause();
}

VideoAsset.prototype.ToggleSubtitle = function () {
    this.showSubtitles = !this.showSubtitles;
    this.UpdateControls();
}


VideoAsset.prototype.Play = function () {
    try {
        if (html5) {
            if (this.vid.currentTime == 0) this.vid.load();
            this.vid.play();
        }
        else if (!this.citrixSafe) {
            this.vid.controls.play();
        }
        else {
            this.vid.contentWindow.Play();
        }
    }
    catch (e) {

    }
}

VideoAsset.prototype.Pause = function () {
    try {
        if (html5) {
            this.vid.pause();
        }
        else if (!this.citrixSafe) {
            this.vid.controls.pause();
        }
        else {
            this.vid.contentWindow.Pause();
        }
    }
    catch (e) {

    }
}

VideoAsset.prototype.Rewind = function () {
    try {
        if (html5) {
            this.vid.currentTime = 0;
        }
        else if (!this.citrixSafe) {
            this.vid.controls.currentPosition = 0;
        }
        else {
            this.vid.contentWindow.Rewind();
        }
    }
    catch (e) {

    }
}

VideoAsset.prototype.UpdateControls = function () {
    var hidepause = system.GetDataValue(this.Style, "Video/HidePause", 0);
    var hidecontrols = system.GetDataValue(this.Style, "Video/HideControls",1);
    if (!this.citrixSafe) {
        if (this.state == 'play') {
            if (this.mouseInControl || hidecontrols==0) {
                var src = system.GetDataFile(this.Style, "Video/PauseSource", '', true);
                if (src != '' && (hidepause == 0 || this.mouseDown == true)) {
                    this.controlImg.src = src;
                    this.controlImg.style.display = '';
                }
                else {
                    this.controlImg.style.display = 'none';
                }
            }
            else {
                var src = system.GetDataFile(this.Style, "Video/PauseHoverSource", '', true);
                if (src != '' && (hidepause == 0 || this.mouseDown == true)) {
                    this.controlImg.src = src;
                    this.controlImg.style.display = '';
                }
                else {
                    this.controlImg.style.display = 'none';
                }
            }
        }
        else if (this.state = 'pause') {
            if (this.mouseInControl || hidecontrols == 0) {
                var src = system.GetDataFile(this.Style, "Video/PlaySource", '', true);
                if (src != '') {
                    this.controlImg.src = src;
                    this.controlImg.style.display = '';
                }
                else {
                    this.controlImg.style.display = 'none';
                }
            }
            else {
                var src = system.GetDataFile(this.Style, "Video/PlayHoverSource", '', true);
                if (src != '') {
                    this.controlImg.src = src;
                    this.controlImg.style.display = '';
                }
                else {
                    this.controlImg.style.display = 'none';
                }
            }
        }

      
        if (this.subtitle == null || this.subtitle.length == 0) {
            this.subtitleButtonLayer.style.display = 'none';
            this.subtitleLayer.style.visibility = 'hidden';
        }
        else {
            this.subtitleButtonLayer.style.display = '';
            if (this.showSubtitles) {
                this.subtitleLayer.style.visibility = 'visible';
            }
            else {
                this.subtitleLayer.style.visibility = 'hidden';
            }
            if (this.showSubtitles) {
                if (this.mouseInSubtitleButton || hidecontrols == 0) {
                    var src = system.GetDataFile(this.Style, "Video/ButtonSubtitleOnSource", '', true);
                    if (src != '' && (hidepause == 0 || this.mouseSubtitleButtonDown == true)) {
                        this.subtitleButtonImg.src = src;
                        this.subtitleButtonImg.style.display = '';
                    }
                    else {
                        this.subtitleButtonImg.style.display = 'none';
                    }
                }
                else {
                    var src = system.GetDataFile(this.Style, "Video/ButtonSubtitleOnHoverSource", '', true);
                    if (src != '' && (hidepause == 0 || this.mouseSubtitleButtonDown == true)) {
                        this.subtitleButtonImg.src = src;
                        this.subtitleButtonImg.style.display = '';
                    }
                    else {
                        this.subtitleButtonImg.style.display = 'none';
                    }
                }
            }
            else {
                if (this.mouseInSubtitleButton || hidecontrols == 0) {
                    var src = system.GetDataFile(this.Style, "Video/ButtonSubtitleSource", '', true);
                    if (src != '') {
                        this.subtitleButtonImg.src = src;
                        this.subtitleButtonImg.style.display = '';
                    }
                    else {
                        this.subtitleButtonImg.style.display = 'none';
                    }
                }
                else {
                    var src = system.GetDataFile(this.Style, "Video/ButtonSubtitleHoverSource", '', true);
                    if (src != '') {
                        this.subtitleButtonImg.src = src;
                        this.subtitleButtonImg.style.display = '';
                    }
                    else {
                        this.subtitleButtonImg.style.display = 'none';
                    }
                }
            }
        }




        if (hideControlsTimeout != null) clearTimeout(hideControlsTimeout);
        if ((mobile || ((this.mouseInVid || (this.mouseInControls|| hidecontrols==0) || this.mouseInControl || this.IsAudio) && system.GetDataValue(this.Data, "ShowControls", 0) == 1))) {

            this.controlsLayer.style.display = '';

            if (hidecontrols == 1) {
                var _this = this;
                hideControlsTimeout = setTimeout((function (args) { return function () { hideControlsTimeout = null; args.controlsLayer.style.display = 'none'; } })(_this), 3000)
            }
        }
        else {
            this.controlsLayer.style.display = 'none';
        }
    }

}

var hideControlsTimeout = null;

VideoAsset.prototype.UpdateProgress = function () {
    if (!this.citrixSafe) {
        this.progressImg.style.width = this.progressLayer.offsetWidth + 'px';
        this.progressImg.style.height = this.progressLayer.offsetHeight + 'px';
        this.fillerImg.style.width = this.progressLayer.offsetWidth + 'px';
        this.fillerImg.style.height = this.progressLayer.offsetHeight + 'px';
        if (html5) {
            if (this.vid == null || isNaN(this.vid.duration)) {
                this.fillerLayer.style.width = '0px';
            }
            else {
                this.fillerLayer.style.width = Math.round(ExtractNumber(this.progressLayer.offsetWidth) * this.vid.currentTime / this.vid.duration) + 'px';
            }
            this.ShowSubtitle((this.vid == null)?0: this.vid.currentTime);
        }
        else if (!this.citrixSafe) {
            if (this.vid == null || this.vid.controls.currentItem == null || isNaN(this.vid.controls.currentItem.duration) || this.vid.controls.currentItem.duration == 0) {
                this.fillerLayer.style.width = '0px';
            }
            else {
                this.fillerLayer.style.width = Math.round(ExtractNumber(this.progressLayer.offsetWidth) * this.vid.controls.currentPosition / this.vid.controls.currentItem.duration) + 'px';
            }
        }
        
    }
}

var CitrixPlayers = {};
function CitrixPlayState(id, newstate) {
    var _this = CitrixPlayers[id];
    if (newstate == 1) {
        //stop

        if (_this.mustPause) {
            //
            _this.Play();
        }
    }
    if (newstate == 3) {
        //play
        _this.state = 'play';
        _this.UpdateControls();
        if (_this.mustPause) {
            _this.mustPause = false;

            _this.Pause();
            _this.Rewind();

        }
        if (_this.Page.Player.CurrentPage != _this.Page) _this.Pause();
    }
    if (newstate == 2) {
        //pause
        _this.state = 'pause';
        _this.UpdateControls();
    }
    if (newstate == 8) {
        //ended
        _this.state = 'pause';

        //_this.Pause();

        _this.mustPause = true;

        _this.UpdateControls();
        _this.UpdateProgress();
        _this.SetCompleted();

        if (system.GetDataValue(_this.Data, "Next", 0) == 1) {
            _this.Page.Player.Forward();
        }
    }
}

VideoAsset.prototype.SetCompleted = function () {
    this.completed = true;
    var f = system.GetDataReference(this.Data, "FrameFinish", 0);
    if (f != 0) {
        this.Page.Player.Block.SpreadEvent("LoadPage", this, { "Page": f, "Found": false, "ActivatePage": null });
    }

    this.Page.Player.UpdateButtons();

}

VideoAsset.prototype.CanNext = function () {
    if (system.GetDataValue(this.Data, "AllowNext", 0) == 0) return true;
    if (system.GetDataValue(this.Data, "AllowNext", 0) == 2 && this.completed) return true;
    return false;
}

VideoAsset.prototype.UpdateData = function () {
    this.Page.PositionAsset(this);
    this.KeepVideo = system.GetDataValue(this.Data, "KeepVideo", 1);
    this.PauseLast = system.GetDataValue(this.Data, "PauseLast", 0) == 1;
  



    if (this.vid != null) {

        if (this.IsAudio != this.AudioAvailable()) {
            this.createPlayer();
        }

        if (this.IsAudio) {
            this.vid.style.width = '0px';
            this.vid.style.height = '0px';
        }
        else {
            this.vid.style.width = this.Surface.style.width;
            this.vid.style.height = this.Surface.style.height;
        }


        if (this.citrixSafe) {
            var sc = system.GetDataValue(this.Data, "ShowControls", 0) == 1;
            var as = true;//system.GetDataValue(this.Data, "AutoStart", 1) == 1;
            var pid = "p" + this.Data.L.toString();
            CitrixPlayers[pid] = this;
            if (this.IsAudio) {
                var url = system.GetDataFile(this.Data.Mp3Source, null, '', true);

            }
            else {
                var url = system.GetDataFile(this.Data.WmvSource, null, system.GetDataFile(this.Data.Mp4Source, null, '', true), true);
            }
            url = url.replace(/=/, "_").replace(/\?/, "@").replace(/&/, "|");
            this.vid.src = "Video.htm?width=" + this.Surface.style.width + "&height=" + this.Surface.style.height + "&url=" + url + "&uiMode=" + (sc ? "full" : "none") + "&id=" + pid + "&autoStart=" + (as ? "1" : "0")
        }
        else {
            var allowseek = system.GetDataValue(this.Data, "AllowSeek", 1) == 1;
            if (html.testDragElement(this.progressLayer)) html.removeDragElement(this.progressLayer);
            if (allowseek) {

                html.addDragElement(this.progressLayer, this);

            }
            

            if (this.IsAudio) {
                html.addAudioSources(this.vid, system.GetDataFile(this.Data.Mp3Source, null, '', true));
            }
            else {
                html.addVideoSources(this.vid, system.GetDataFile(this.Data.Mp4Source, null, '', true), system.GetDataFile(this.Data.WebmSource, null, '', true), system.GetDataFile(this.Data.WmvSource, null, '', true), this, system.GetDataFile(this.Data.VttSource, null, '', true));
            }
            if (this.Data.PosterSource != null && html5) {
                this.vid.poster = system.GetDataFile(this.Data, "PosterSource", "", true);
            }
            //this.vid.load();
        }
    }
    this.UpdateSubtitles();

    this.UpdateControls();
    this.UpdateProgress();

    if (!this.citrixSafe && this.Style != null && this.Style.Video != null) {
        html.styleElement(this.controlsLayer, this.Style.Video.Controls);
        html.styleElement(this.progressLayer, this.Style.Video.Progress);
        html.styleElement(this.controlLayer, this.Style.Video.Control);
        html.styleElement(this.subtitleButtonLayer, this.Style.Video.ButtonSubtitle);
        this.controlsImg.src = system.GetDataFile(this.Style, "Video/ControlsSource", '', true);
        this.progressImg.src = system.GetDataFile(this.Style, "Video/ProgressSource", '', true);
        this.fillerImg.src = system.GetDataFile(this.Style, "Video/ProgressFillerSource", '', true);
    }
}



VideoAsset.prototype.Leave = function () {
    if (this.subtitleLayer != null) this.subtitleLayer.style.display = 'none';
    if (!html5 && !this.citrixSafe) {
        clearInterval(this.up);
    }

    if (this.vid != null) {
        this.Pause();

        if (this.citrixSafe && this.vid != null) {
            this.vid.src = 'Blank.htm';
        }
        if ((mobile || (this.KeepVideo!=1)) && this.vid != null) {
            stopVideos(this.Surface);
            try{
                this.Surface.removeChild(this.vid);
            }
            catch (e){

            }
            this.vid = null;
        }

    }

    this.mustplay = false;
}


VideoAsset.prototype.SuspendBeforePopup = function () {
    if (system.GetDataValue(this.Data, "PausePopup", 0) == 1) {
        if (this.KeepVideo == 2) {
            this.mustplay = false;
            this.Pause();
        }
        else {
            this.Leave();
        }
    }
}

VideoAsset.prototype.ResumeAfterPopup = function () {
    if (system.GetDataValue(this.Data, "PausePopup", 0) == 1) {
        if (this.KeepVideo == 2) {

        }
        else {
            this.Enter();
        }
    }
}


VideoAsset.prototype.Enter = function () {
    if (this.subtitleLayer != null) this.subtitleLayer.style.display = '';
    var _this = this;
    if (mobile || this.citrixSafe || (this.KeepVideo!=1)) {
        _this.state = 'pause';
        _this.createPlayer();
        _this.UpdateData();
    }

    if (!html5 && !this.citrixSafe) {
        
        _this.up = setInterval((function (self) {
            return function () { self.UpdateProgress(); }
        })(_this), 100);
    }
    try {

        if (this.first) {
            this.Rewind();
            this.first = false;

        }

    }
    catch (e) {

    }
    this.mustPause = false;
    try {
        if (system.GetDataValue(this.Data, "AutoStart", 1) == 1) {

            this.mustplay = true;
            this.Play();
        }
        else {
            if (!html5) {
                this.mustPause = true;
                this.Play();
            }
        }
    }
    catch (e) {

    }
}

VideoAsset.prototype.setTrack = function (Track) {
    this.Track = Track;
    this.UpdateSubtitles();
    this.UpdateControls();
}

VideoAsset.prototype.UpdateSubtitles = function(){
    if (this.subtitle != null) {
        for (var i = 0; i < this.subtitle.length; i++) this.subtitle[i].Destroy();
    }
    this.subtitle = [];

    if (this.Track == null) {

        if (this.Data.Subtitles != null) {
            for (var i in this.Data.Subtitles) {
                this.subtitle[this.subtitle.length] = new VideoAssetTrans(this.Data.Subtitles[i], this.subtitleLayer, this.Style.Video.Subtitle);
            }
            //if (this.controlsLayer != null) this.controlsLayer.parentElement.appendChild(this.controlsLayer);
        }
    }
    else {
        var lasttime = -1;
        for (var i in this.Track.cues) {
            var c = this.Track.cues[i];
            var st = c.startTime;
            var et = c.endTime;
            var text = c.text;
            if (st == null || et == null || text == null) {

            }
            else {

                if (lasttime != -1 && st != lasttime) {
                    this.subtitle[this.subtitle.length] = new VideoAssetTrans(null, this.subtitleLayer, this.Style.Video.Subtitle, { "start": lasttime, "text": "" });
                }
                if (st != lasttime) {
                    this.subtitle[this.subtitle.length] = new VideoAssetTrans(null, this.subtitleLayer, this.Style.Video.Subtitle, { "start": st, "text": text });
                }
                lasttime = et;
            }
        }
        if (lasttime != -1) {
            this.subtitle[this.subtitle.length] = new VideoAssetTrans(null, this.subtitleLayer, this.Style.Video.Subtitle, { "start": lasttime, "text": "" });
        }
    }
}
VideoAsset.prototype.ShowSubtitle = function (position) {
    if (position == null) position = 0;
    if (this.subtitle != null) {
        var found =false;
        for (var i=this.subtitle.length-1;i>=0;i--) {
            var st = this.subtitle[i];
            if (st.seconds>position) st.Show(false);
            else {
                st.Show(!found);
                found = true;
            }
        }
    }
}

function VideoAssetTrans(Data, Parent, Style, Cue) {
    if (Cue != null) {
        this.pos = 4;
        this.text = Cue.text;
        this.seconds = Cue.start;
    }
    else {
        this.pos = system.GetDataValue(Data, "Position", 4);
        var timestr = system.GetDataText(Data, "Time", '', true).split(':');
        this.text = system.GetDataText(Data, "Text", '', true);
        var s = 0;
        var mult = 1;
        for (var i = timestr.length - 1; i >= 0; i--) {
            s += mult * ExtractNumber(timestr[i]);
            mult *= 60;
        }
        this.seconds = s;
    }



    this.textLayer = html.createText(Parent, Style, this.text);
    this.textLayer.style.position = 'absolute';
    this.textLayer.style.left = '0px';
    this.textLayer.style.right = '0px';
    this.textLayer.style.zIndex = '1';
    this.Show(false);

    if (this.pos < 3) this.textLayer.style.top = '0px'; else this.textLayer.style.bottom = '0px';
    if (this.pos == 0 || this.pos == 3) this.textLayer.style.textAlign = 'left';
    if (this.pos == 1 || this.pos == 4) this.textLayer.style.textAlign = 'center';
    if (this.pos == 2 || this.pos == 5) this.textLayer.style.textAlign = 'right';
}

VideoAssetTrans.prototype.Show = function(visible){
    this.textLayer.style.display = visible ? "" : "none";
}
VideoAssetTrans.prototype.Destroy = function () {
    if (this.textLayer != null) {
        this.textLayer.parentElement.removeChild(this.textLayer);
        this.textLayer = null;
    }

}

//
//slm_youtubeasset
//
//Youtube
var ytloaded = false;
function YouTubeAsset(Page, Data) {
    if (!ytloaded) {
        ytloaded = true;

        var tag = document.createElement('script');
        if (window.location.protocol.toLowerCase() == 'https:') tag.src = "https://www.youtube.com/player_api";
        else tag.src = "http://www.youtube.com/iframe_api?enablejsapi=1&version=3";

        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    }

    this.Page = Page;
    this.Data = Data;
    Page.AddAsset(this);


    this.UpdateData();
}


YouTubeAsset.prototype.Leave = function () {
    if (this.video == null) return;
    try{
        this.player.pauseVideo();
    }
    catch (e) {
        this.Surface.innerHTML = '';
        this.video = null;
        this.player = null;
    }
}

YouTubeAsset.prototype.Enter = function () {
    if (this.video == null) this.UpdateData();
}
YouTubeAsset.prototype.UpdateData = function () {
    if (!window.YT || !window.YT.Player) {
        var _this = this;
        setTimeout((function (self) { return function () { self.UpdateData(); } })(_this), 100);
        return;
    }
    this.Page.PositionAsset(this);
    var moviecode = system.GetDataText(this.Data, "MovieCode", '', true);
    var start = system.GetDataValue(this.Data, "Start", 0, true);
    var end = system.GetDataValue(this.Data, "End", 0, true);
    if (this.video == null) {
        this.video = html.createElement(this.Surface, "DIV");
        this.video.id = 'p' + this.Data.L.toString();

        var vidobj = {
            height: ExtractNumber(this.Surface.style.height).toString(),
            width: ExtractNumber(this.Surface.style.width).toString(),
            videoId: moviecode,

            playerVars: {
                rel: 0,
                fs: 0,
                showsearch: 0,
                wmode: 'transparent',
                html5: html5?1:0
            },
            events: {

            }
        };
        if (start > 0) vidobj.playerVars["start"] = start;
        if (end > 0) vidobj.playerVars["end"] = end;

        this.player = new YT.Player(this.video.id, vidobj);
    }
    else {
        this.player.setSize(ExtractNumber(this.Surface.style.width).toString(),
           ExtractNumber(this.Surface.style.height).toString()
        );
        try{
            this.player.loadVideoById(moviecode);
        }
        catch (e){

        }
    }

}


//
//template
//
function Template(Owner, DataNode, Done, Edit) {

    var Template_Root = 158;
    var Template_SubTemplate = 187;
    var Template_Item = 188;
    system.propertytypes[Template_Item] = {
        "Content": { "NodeID": 167 }
    }
    system.propertytypes[Template_SubTemplate] =
    {
        "Name":{"NodeID":164},
        "Items": [{ "Type": { "NodeID": Template_SubTemplate }, "Default": { "Value": 1} }, { "Type": { "NodeID": Template_Item }, "Default": { "Value": 1}}]
    }
    system.propertytypes[Template_Root] =
    {
        "Name": { "NodeID": 164 },
        "LMSPopups": { "NodeID": 168 },
        "Items": [{ "Type": { "NodeID": Template_SubTemplate }, "Default": { "Value": 1}}]
    }
    new Data(Owner, DataNode, Done, Edit, system.propertytypes[Template_Root]);


}



//
//tincan-min
//
"0.33.0";var CryptoJS=CryptoJS||function(a,b){var c={},d=c.lib={},e=d.Base=function(){function a(){}return{extend:function(b){a.prototype=this;var c=new a;return b&&c.mixIn(b),c.$super=this,c},create:function(){var a=this.extend();return a.init.apply(a,arguments),a},init:function(){},mixIn:function(a){for(var b in a)a.hasOwnProperty(b)&&(this[b]=a[b]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.$super.extend(this)}}}(),f=d.WordArray=e.extend({init:function(a,c){a=this.words=a||[],this.sigBytes=c!=b?c:4*a.length},toString:function(a){return(a||h).stringify(this)},concat:function(a){var b=this.words,c=a.words,d=this.sigBytes,a=a.sigBytes;if(this.clamp(),d%4)for(var e=0;a>e;e++)b[d+e>>>2]|=(c[e>>>2]>>>24-8*(e%4)&255)<<24-8*((d+e)%4);else if(65535<c.length)for(e=0;a>e;e+=4)b[d+e>>>2]=c[e>>>2];else b.push.apply(b,c);return this.sigBytes+=a,this},clamp:function(){var b=this.words,c=this.sigBytes;b[c>>>2]&=4294967295<<32-8*(c%4),b.length=a.ceil(c/4)},clone:function(){var a=e.clone.call(this);return a.words=this.words.slice(0),a},random:function(b){for(var c=[],d=0;b>d;d+=4)c.push(4294967296*a.random()|0);return f.create(c,b)}}),g=c.enc={},h=g.Hex={stringify:function(a){for(var b=a.words,a=a.sigBytes,c=[],d=0;a>d;d++){var e=b[d>>>2]>>>24-8*(d%4)&255;c.push((e>>>4).toString(16)),c.push((15&e).toString(16))}return c.join("")},parse:function(a){for(var b=a.length,c=[],d=0;b>d;d+=2)c[d>>>3]|=parseInt(a.substr(d,2),16)<<24-4*(d%8);return f.create(c,b/2)}},i=g.Latin1={stringify:function(a){for(var b=a.words,a=a.sigBytes,c=[],d=0;a>d;d++)c.push(String.fromCharCode(b[d>>>2]>>>24-8*(d%4)&255));return c.join("")},parse:function(a){for(var b=a.length,c=[],d=0;b>d;d++)c[d>>>2]|=(255&a.charCodeAt(d))<<24-8*(d%4);return f.create(c,b)}},j=g.Utf8={stringify:function(a){try{return decodeURIComponent(escape(i.stringify(a)))}catch(b){throw Error("Malformed UTF-8 data")}},parse:function(a){return i.parse(unescape(encodeURIComponent(a)))}},k=d.BufferedBlockAlgorithm=e.extend({reset:function(){this._data=f.create(),this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=j.parse(a)),this._data.concat(a),this._nDataBytes+=a.sigBytes},_process:function(b){var c=this._data,d=c.words,e=c.sigBytes,g=this.blockSize,h=e/(4*g),h=b?a.ceil(h):a.max((0|h)-this._minBufferSize,0),b=h*g,e=a.min(4*b,e);if(b){for(var i=0;b>i;i+=g)this._doProcessBlock(d,i);i=d.splice(0,b),c.sigBytes-=e}return f.create(i,e)},clone:function(){var a=e.clone.call(this);return a._data=this._data.clone(),a},_minBufferSize:0});d.Hasher=k.extend({init:function(){this.reset()},reset:function(){k.reset.call(this),this._doReset()},update:function(a){return this._append(a),this._process(),this},finalize:function(a){return a&&this._append(a),this._doFinalize(),this._hash},clone:function(){var a=k.clone.call(this);return a._hash=this._hash.clone(),a},blockSize:16,_createHelper:function(a){return function(b,c){return a.create(c).finalize(b)}},_createHmacHelper:function(a){return function(b,c){return l.HMAC.create(a,c).finalize(b)}}});var l=c.algo={};return c}(Math);!function(){var a=CryptoJS,b=a.lib,c=b.WordArray,b=b.Hasher,d=[],e=a.algo.SHA1=b.extend({_doReset:function(){this._hash=c.create([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(a,b){for(var c=this._hash.words,e=c[0],f=c[1],g=c[2],h=c[3],i=c[4],j=0;80>j;j++){if(16>j)d[j]=0|a[b+j];else{var k=d[j-3]^d[j-8]^d[j-14]^d[j-16];d[j]=k<<1|k>>>31}k=(e<<5|e>>>27)+i+d[j],k=20>j?k+((f&g|~f&h)+1518500249):40>j?k+((f^g^h)+1859775393):60>j?k+((f&g|f&h|g&h)-1894007588):k+((f^g^h)-899497514),i=h,h=g,g=f<<30|f>>>2,f=e,e=k}c[0]=c[0]+e|0,c[1]=c[1]+f|0,c[2]=c[2]+g|0,c[3]=c[3]+h|0,c[4]=c[4]+i|0},_doFinalize:function(){var a=this._data,b=a.words,c=8*this._nDataBytes,d=8*a.sigBytes;b[d>>>5]|=128<<24-d%32,b[(d+64>>>9<<4)+15]=c,a.sigBytes=4*b.length,this._process()}});a.SHA1=b._createHelper(e),a.HmacSHA1=b._createHmacHelper(e)}(),function(){{var a=CryptoJS,b=a.lib,c=b.WordArray,d=a.enc;d.Base64={stringify:function(a){var b=a.words,c=a.sigBytes,d=this._map;a.clamp();for(var e=[],f=0;c>f;f+=3)for(var g=b[f>>>2]>>>24-f%4*8&255,h=b[f+1>>>2]>>>24-(f+1)%4*8&255,i=b[f+2>>>2]>>>24-(f+2)%4*8&255,j=g<<16|h<<8|i,k=0;4>k&&c>f+.75*k;k++)e.push(d.charAt(j>>>6*(3-k)&63));var l=d.charAt(64);if(l)for(;e.length%4;)e.push(l);return e.join("")},parse:function(a){a=a.replace(/\s/g,"");var b=a.length,d=this._map,e=d.charAt(64);if(e){var f=a.indexOf(e);-1!=f&&(b=f)}for(var g=[],h=0,i=0;b>i;i++)if(i%4){var j=d.indexOf(a.charAt(i-1))<<i%4*2,k=d.indexOf(a.charAt(i))>>>6-i%4*2;g[h>>>2]|=(j|k)<<24-h%4*8,h++}return c.create(g,h)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}}}();var TinCan;!function(){"use strict";var a={statementId:!0,voidedStatementId:!0,verb:!0,object:!0,registration:!0,context:!0,actor:!0,since:!0,until:!0,limit:!0,authoritative:!0,sparse:!0,instructor:!0,ascending:!0,continueToken:!0,agent:!0,activityId:!0,stateId:!0,profileId:!0,activity_platform:!0,grouping:!0,"Accept-Language":!0};TinCan=function(a){this.log("constructor"),this.recordStores=[],this.actor=null,this.activity=null,this.registration=null,this.context=null,this.init(a)},TinCan.prototype={LOG_SRC:"TinCan",log:function(a,b){TinCan.DEBUG&&"undefined"!=typeof console&&console.log&&(b=b||this.LOG_SRC||"TinCan",console.log("TinCan."+b+": "+a))},init:function(a){this.log("init");var b;if(a=a||{},a.hasOwnProperty("url")&&""!==a.url&&this._initFromQueryString(a.url),a.hasOwnProperty("recordStores")&&void 0!==a.recordStores)for(b=0;b<a.recordStores.length;b+=1)this.addRecordStore(a.recordStores[b]);a.hasOwnProperty("activity")&&(this.activity=a.activity instanceof TinCan.Activity?a.activity:new TinCan.Activity(a.activity)),a.hasOwnProperty("actor")&&(this.actor=a.actor instanceof TinCan.Agent?a.actor:new TinCan.Agent(a.actor)),a.hasOwnProperty("context")&&(this.context=a.context instanceof TinCan.Context?a.context:new TinCan.Context(a.context)),a.hasOwnProperty("registration")&&(this.registration=a.registration)},_initFromQueryString:function(b){this.log("_initFromQueryString");var c,d,e,f=TinCan.Utils.parseURL(b).params,g=["endpoint","auth"],h={},i=null;if(f.hasOwnProperty("actor")){this.log("_initFromQueryString - found actor: "+f.actor);try{this.actor=TinCan.Agent.fromJSON(f.actor),delete f.actor}catch(j){this.log("_initFromQueryString - failed to set actor: "+j)}}if(f.hasOwnProperty("activity_id")&&(this.activity=new TinCan.Activity({id:f.activity_id}),delete f.activity_id),(f.hasOwnProperty("activity_platform")||f.hasOwnProperty("registration")||f.hasOwnProperty("grouping"))&&(e={},f.hasOwnProperty("activity_platform")&&(e.platform=f.activity_platform,delete f.activity_platform),f.hasOwnProperty("registration")&&(e.registration=this.registration=f.registration,delete f.registration),f.hasOwnProperty("grouping")&&(e.contextActivities={},e.contextActivities.grouping=f.grouping,delete f.grouping),this.context=new TinCan.Context(e)),f.hasOwnProperty("endpoint")){for(c=0;c<g.length;c+=1)d=g[c],f.hasOwnProperty(d)&&(h[d]=f[d],delete f[d]);for(c in f)f.hasOwnProperty(c)&&(a.hasOwnProperty(c)?delete f[c]:(i=i||{},i[c]=f[c]));null!==i&&(h.extended=i),h.allowFail=!1,this.addRecordStore(h)}},addRecordStore:function(a){this.log("addRecordStore");var b;b=a instanceof TinCan.LRS?a:new TinCan.LRS(a),this.recordStores.push(b)},prepareStatement:function(a){return this.log("prepareStatement"),a instanceof TinCan.Statement||(a=new TinCan.Statement(a)),null===a.actor&&null!==this.actor&&(a.actor=this.actor),null===a.target&&null!==this.activity&&(a.target=this.activity),null!==this.context&&(null===a.context?a.context=this.context:(null===a.context.registration&&(a.context.registration=this.context.registration),null===a.context.platform&&(a.context.platform=this.context.platform),null!==this.context.contextActivities&&(null===a.context.contextActivities?a.context.contextActivities=this.context.contextActivities:(null!==this.context.contextActivities.grouping&&null===a.context.contextActivities.grouping&&(a.context.contextActivities.grouping=this.context.contextActivities.grouping),null!==this.context.contextActivities.parent&&null===a.context.contextActivities.parent&&(a.context.contextActivities.parent=this.context.contextActivities.parent),null!==this.context.contextActivities.other&&null===a.context.contextActivities.other&&(a.context.contextActivities.other=this.context.contextActivities.other))))),a},sendStatement:function(a,b){this.log("sendStatement");var c,d,e,f=this,g=this.prepareStatement(a),h=this.recordStores.length,i=[],j=[];if(h>0)for("function"==typeof b&&(e=function(a,c){var d;f.log("sendStatement - callbackWrapper: "+h),h>1?(h-=1,j.push({err:a,xhr:c})):1===h?(j.push({err:a,xhr:c}),d=[j,g],b.apply(this,d)):f.log("sendStatement - unexpected record store count: "+h)}),d=0;h>d;d+=1)c=this.recordStores[d],i.push(c.saveStatement(g,{callback:e}));else this.log("[warning] sendStatement: No LRSs added yet (statement not sent)"),"function"==typeof b&&b.apply(this,[null,g]);return{statement:g,results:i}},getStatement:function(a,b){this.log("getStatement");var c;return this.recordStores.length>0?(c=this.recordStores[0],c.retrieveStatement(a,{callback:b})):void this.log("[warning] getStatement: No LRSs added yet (statement not retrieved)")},voidStatement:function(a,b,c){this.log("voidStatement");var d,e,f,g,h,i=this,j=this.recordStores.length,k=[],l=[];if(a instanceof TinCan.Statement&&(a=a.id),"undefined"!=typeof c.actor?e=c.actor:null!==this.actor&&(e=this.actor),f=new TinCan.Statement({actor:e,verb:{id:"http://adlnet.gov/expapi/verbs/voided"},target:{objectType:"StatementRef",id:a}}),j>0)for("function"==typeof b&&(h=function(a,c){var d;i.log("voidStatement - callbackWrapper: "+j),j>1?(j-=1,l.push({err:a,xhr:c})):1===j?(l.push({err:a,xhr:c}),d=[l,f],b.apply(this,d)):i.log("voidStatement - unexpected record store count: "+j)}),g=0;j>g;g+=1)d=this.recordStores[g],k.push(d.saveStatement(f,{callback:h}));else this.log("[warning] voidStatement: No LRSs added yet (statement not sent)"),"function"==typeof b&&b.apply(this,[null,f]);return{statement:f,results:k}},getVoidedStatement:function(a,b){this.log("getVoidedStatement");var c;return this.recordStores.length>0?(c=this.recordStores[0],c.retrieveVoidedStatement(a,{callback:b})):void this.log("[warning] getVoidedStatement: No LRSs added yet (statement not retrieved)")},sendStatements:function(a,b){this.log("sendStatements");var c,d,e,f=this,g=[],h=this.recordStores.length,i=[],j=[];if(0===a.length)"function"==typeof b&&b.apply(this,[null,g]);else{for(d=0;d<a.length;d+=1)g.push(this.prepareStatement(a[d]));if(h>0)for("function"==typeof b&&(e=function(a,c){var d;f.log("sendStatements - callbackWrapper: "+h),h>1?(h-=1,j.push({err:a,xhr:c})):1===h?(j.push({err:a,xhr:c}),d=[j,g],b.apply(this,d)):f.log("sendStatements - unexpected record store count: "+h)}),d=0;h>d;d+=1)c=this.recordStores[d],i.push(c.saveStatements(g,{callback:e}));else this.log("[warning] sendStatements: No LRSs added yet (statements not sent)"),"function"==typeof b&&b.apply(this,[null,g])}return{statements:g,results:i}},getStatements:function(a){this.log("getStatements");var b,c,d={};return this.recordStores.length>0?(b=this.recordStores[0],a=a||{},c=a.params||{},a.sendActor&&null!==this.actor&&("0.9"===b.version||"0.95"===b.version?c.actor=this.actor:c.agent=this.actor),a.sendActivity&&null!==this.activity&&("0.9"===b.version||"0.95"===b.version?c.target=this.activity:c.activity=this.activity),"undefined"==typeof c.registration&&null!==this.registration&&(c.registration=this.registration),d={params:c},"undefined"!=typeof a.callback&&(d.callback=a.callback),b.queryStatements(d)):void this.log("[warning] getStatements: No LRSs added yet (statements not read)")},getState:function(a,b){this.log("getState");var c,d;return this.recordStores.length>0?(d=this.recordStores[0],b=b||{},c={agent:"undefined"!=typeof b.agent?b.agent:this.actor,activity:"undefined"!=typeof b.activity?b.activity:this.activity},"undefined"!=typeof b.registration?c.registration=b.registration:null!==this.registration&&(c.registration=this.registration),"undefined"!=typeof b.callback&&(c.callback=b.callback),d.retrieveState(a,c)):void this.log("[warning] getState: No LRSs added yet (state not retrieved)")},setState:function(a,b,c){this.log("setState");var d,e;return this.recordStores.length>0?(e=this.recordStores[0],c=c||{},d={agent:"undefined"!=typeof c.agent?c.agent:this.actor,activity:"undefined"!=typeof c.activity?c.activity:this.activity},"undefined"!=typeof c.registration?d.registration=c.registration:null!==this.registration&&(d.registration=this.registration),"undefined"!=typeof c.lastSHA1&&(d.lastSHA1=c.lastSHA1),"undefined"!=typeof c.contentType&&(d.contentType=c.contentType,"undefined"!=typeof c.overwriteJSON&&!c.overwriteJSON&&TinCan.Utils.isApplicationJSON(c.contentType)&&(d.method="POST")),"undefined"!=typeof c.callback&&(d.callback=c.callback),e.saveState(a,b,d)):void this.log("[warning] setState: No LRSs added yet (state not saved)")},deleteState:function(a,b){this.log("deleteState");var c,d;return this.recordStores.length>0?(d=this.recordStores[0],b=b||{},c={agent:"undefined"!=typeof b.agent?b.agent:this.actor,activity:"undefined"!=typeof b.activity?b.activity:this.activity},"undefined"!=typeof b.registration?c.registration=b.registration:null!==this.registration&&(c.registration=this.registration),"undefined"!=typeof b.callback&&(c.callback=b.callback),d.dropState(a,c)):void this.log("[warning] deleteState: No LRSs added yet (state not deleted)")},getActivityProfile:function(a,b){this.log("getActivityProfile");var c,d;return this.recordStores.length>0?(d=this.recordStores[0],b=b||{},c={activity:"undefined"!=typeof b.activity?b.activity:this.activity},"undefined"!=typeof b.callback&&(c.callback=b.callback),d.retrieveActivityProfile(a,c)):void this.log("[warning] getActivityProfile: No LRSs added yet (activity profile not retrieved)")},setActivityProfile:function(a,b,c){this.log("setActivityProfile");var d,e;return this.recordStores.length>0?(e=this.recordStores[0],c=c||{},d={activity:"undefined"!=typeof c.activity?c.activity:this.activity},"undefined"!=typeof c.callback&&(d.callback=c.callback),"undefined"!=typeof c.lastSHA1&&(d.lastSHA1=c.lastSHA1),"undefined"!=typeof c.contentType&&(d.contentType=c.contentType,"undefined"!=typeof c.overwriteJSON&&!c.overwriteJSON&&TinCan.Utils.isApplicationJSON(c.contentType)&&(d.method="POST")),e.saveActivityProfile(a,b,d)):void this.log("[warning] setActivityProfile: No LRSs added yet (activity profile not saved)")},deleteActivityProfile:function(a,b){this.log("deleteActivityProfile");var c,d;return this.recordStores.length>0?(d=this.recordStores[0],b=b||{},c={activity:"undefined"!=typeof b.activity?b.activity:this.activity},"undefined"!=typeof b.callback&&(c.callback=b.callback),d.dropActivityProfile(a,c)):void this.log("[warning] deleteActivityProfile: No LRSs added yet (activity profile not deleted)")},getAgentProfile:function(a,b){this.log("getAgentProfile");var c,d;return this.recordStores.length>0?(d=this.recordStores[0],b=b||{},c={agent:"undefined"!=typeof b.agent?b.agent:this.actor},"undefined"!=typeof b.callback&&(c.callback=b.callback),d.retrieveAgentProfile(a,c)):void this.log("[warning] getAgentProfile: No LRSs added yet (agent profile not retrieved)")},setAgentProfile:function(a,b,c){this.log("setAgentProfile");var d,e;return this.recordStores.length>0?(e=this.recordStores[0],c=c||{},d={agent:"undefined"!=typeof c.agent?c.agent:this.actor},"undefined"!=typeof c.callback&&(d.callback=c.callback),"undefined"!=typeof c.lastSHA1&&(d.lastSHA1=c.lastSHA1),"undefined"!=typeof c.contentType&&(d.contentType=c.contentType,"undefined"!=typeof c.overwriteJSON&&!c.overwriteJSON&&TinCan.Utils.isApplicationJSON(c.contentType)&&(d.method="POST")),e.saveAgentProfile(a,b,d)):void this.log("[warning] setAgentProfile: No LRSs added yet (agent profile not saved)")},deleteAgentProfile:function(a,b){this.log("deleteAgentProfile");var c,d;return this.recordStores.length>0?(d=this.recordStores[0],b=b||{},c={agent:"undefined"!=typeof b.agent?b.agent:this.actor},"undefined"!=typeof b.callback&&(c.callback=b.callback),d.dropAgentProfile(a,c)):void this.log("[warning] deleteAgentProfile: No LRSs added yet (agent profile not deleted)")}},TinCan.DEBUG=!1,TinCan.enableDebug=function(){TinCan.DEBUG=!0},TinCan.disableDebug=function(){TinCan.DEBUG=!1},TinCan.versions=function(){return["1.0.1","1.0.0","0.95","0.9"]},"object"==typeof module&&(module.exports=TinCan)}(),function(){"use strict";TinCan.Utils={getUUID:function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(a){var b=16*Math.random()|0,c="x"==a?b:3&b|8;return c.toString(16)})},getISODateString:function(a){function b(a,b){var c,d;for(("undefined"==typeof a||null===a)&&(a=0),("undefined"==typeof b||null===b)&&(b=2),c=Math.pow(10,b-1),d=a.toString();c>a&&c>1;)d="0"+d,c/=10;return d}return a.getUTCFullYear()+"-"+b(a.getUTCMonth()+1)+"-"+b(a.getUTCDate())+"T"+b(a.getUTCHours())+":"+b(a.getUTCMinutes())+":"+b(a.getUTCSeconds())+"."+b(a.getUTCMilliseconds(),3)+"Z"},convertISO8601DurationToMilliseconds:function(a){var b,c,d,e,f=a.indexOf("-")>=0,g=a.indexOf("T"),h=a.indexOf("H"),i=a.indexOf("M"),j=a.indexOf("S");if(-1===g||-1!==i&&g>i||-1!==a.indexOf("D")||-1!==a.indexOf("Y"))throw new Error("ISO 8601 timestamps including years, months and/or days are not currently supported");return-1===h?(h=g,b=0):b=parseInt(a.slice(g+1,h),10),-1===i?(i=g,c=0):c=parseInt(a.slice(h+1,i),10),d=parseFloat(a.slice(i+1,j)),e=parseInt(1e3*(60*(60*b+c)+d),10),isNaN(e)&&(e=0),f&&(e=-1*e),e},convertMillisecondsToISO8601Duration:function(a){var b,c,d,e=parseInt(a,10),f="",g="";return 0>e&&(f="-",e=-1*e),b=parseInt(e/36e5,10),c=parseInt(e%36e5/6e4,10),d=e%36e5%6e4/1e3,g=f+"PT",b>0&&(g+=b+"H"),c>0&&(g+=c+"M"),g+=d+"S"},getSHA1String:function(a){return CryptoJS.SHA1(a).toString(CryptoJS.enc.Hex)},getBase64String:function(a){return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Latin1.parse(a))},getLangDictionaryValue:function(a,b){var c,d=this[a];if("undefined"!=typeof b&&"undefined"!=typeof d[b])return d[b];if("undefined"!=typeof d.und)return d.und;if("undefined"!=typeof d["en-US"])return d["en-US"];for(c in d)if(d.hasOwnProperty(c))return d[c];return""},parseURL:function(a){var b,c,d,e,f=/\+/g,g=/([^&=]+)=?([^&]*)/g,h=function(a){return decodeURIComponent(a.replace(f," "))};if(b=new RegExp(["^(https?:)//","(([^:/?#]*)(?::([0-9]+))?)","(/[^?#]*)","(\\?[^#]*|)","(#.*|)$"].join("")),c=a.match(b),d={protocol:c[1],host:c[2],hostname:c[3],port:c[4],pathname:c[5],search:c[6],hash:c[7],params:{}},d.path=d.protocol+"//"+d.host+d.pathname,""!==d.search)for(;e=g.exec(d.search.substring(1));)d.params[h(e[1])]=h(e[2]);return d},getServerRoot:function(a){var b=a.split("/");return b[0]+"//"+b[2]},getContentTypeFromHeader:function(a){return String(a).split(";")[0]},isApplicationJSON:function(a){return 0===TinCan.Utils.getContentTypeFromHeader(a).toLowerCase().indexOf("application/json")}}}(),function(){"use strict";var a=TinCan.LRS=function(a){this.log("constructor"),this.endpoint=null,this.version=null,this.auth=null,this.allowFail=!0,this.extended=null,this.init(a)};a.prototype={LOG_SRC:"LRS",log:TinCan.prototype.log,init:function(a){this.log("init");var b,c=TinCan.versions(),d=!1;if(a=a||{},a.hasOwnProperty("alertOnRequestFailure")&&this.log("'alertOnRequestFailure' is deprecated (alerts have been removed) no need to set it now"),!a.hasOwnProperty("endpoint")||null===a.endpoint||""===a.endpoint)throw this.log("[error] LRS invalid: no endpoint"),{code:3,mesg:"LRS invalid: no endpoint"};if(this.endpoint=String(a.endpoint),"/"!==this.endpoint.slice(-1)&&(this.log("adding trailing slash to endpoint"),this.endpoint+="/"),a.hasOwnProperty("allowFail")&&(this.allowFail=a.allowFail),a.hasOwnProperty("auth")?this.auth=a.auth:a.hasOwnProperty("username")&&a.hasOwnProperty("password")&&(this.auth="Basic "+TinCan.Utils.getBase64String(a.username+":"+a.password)),a.hasOwnProperty("extended")&&(this.extended=a.extended),this._initByEnvironment(a),"undefined"!=typeof a.version){for(this.log("version: "+a.version),b=0;b<c.length;b+=1)if(c[b]===a.version){d=!0;break}if(!d)throw this.log("[error] LRS invalid: version not supported ("+a.version+")"),{code:5,mesg:"LRS invalid: version not supported ("+a.version+")"};this.version=a.version}else this.version=c[0]},_initByEnvironment:function(){this.log("_initByEnvironment not overloaded - no environment loaded?")},_makeRequest:function(){this.log("_makeRequest not overloaded - no environment loaded?")},_IEModeConversion:function(){this.log("_IEModeConversion not overloaded - browser environment not loaded.")},sendRequest:function(a){this.log("sendRequest");var b,c=this.endpoint+a.url,d={};if(0===a.url.indexOf("http")&&(c=a.url),null!==this.extended){a.params=a.params||{};for(b in this.extended)this.extended.hasOwnProperty(b)&&(a.params.hasOwnProperty(b)||null!==this.extended[b]&&(a.params[b]=this.extended[b]))}d.Authorization=this.auth,"0.9"!==this.version&&(d["X-Experience-API-Version"]=this.version);for(b in a.headers)a.headers.hasOwnProperty(b)&&(d[b]=a.headers[b]);return this._makeRequest(c,d,a)},about:function(a){this.log("about");var b,c,d;return a=a||{},b={url:"about",method:"GET",params:{}},"undefined"!=typeof a.callback&&(d=function(b,c){var d=c;null===b&&(d=TinCan.About.fromJSON(c.responseText)),a.callback(b,d)},b.callback=d),c=this.sendRequest(b),d?void 0:(null===c.err&&(c.xhr=TinCan.About.fromJSON(c.xhr.responseText)),c)},saveStatement:function(a,b){this.log("saveStatement");var c,d;b=b||{};try{d=a.asVersion(this.version)}catch(e){return this.allowFail?(this.log("[warning] statement could not be serialized in version ("+this.version+"): "+e),"undefined"!=typeof b.callback?void b.callback(null,null):{err:null,xhr:null}):(this.log("[error] statement could not be serialized in version ("+this.version+"): "+e),"undefined"!=typeof b.callback?void b.callback(e,null):{err:e,xhr:null})}return c={url:"statements",data:JSON.stringify(d),headers:{"Content-Type":"application/json"}},null!==a.id?(c.method="PUT",c.params={statementId:a.id}):c.method="POST","undefined"!=typeof b.callback&&(c.callback=b.callback),this.sendRequest(c)},retrieveStatement:function(a,b){this.log("retrieveStatement");var c,d,e;return b=b||{},c={url:"statements",method:"GET",params:{statementId:a}},"undefined"!=typeof b.callback&&(e=function(a,c){var d=c;null===a&&(d=TinCan.Statement.fromJSON(c.responseText)),b.callback(a,d)},c.callback=e),d=this.sendRequest(c),e||(d.statement=null,null===d.err&&(d.statement=TinCan.Statement.fromJSON(d.xhr.responseText))),d},retrieveVoidedStatement:function(a,b){this.log("retrieveVoidedStatement");var c,d,e;return b=b||{},c={url:"statements",method:"GET",params:{}},"0.9"===this.version||"0.95"===this.version?c.params.statementId=a:c.params.voidedStatementId=a,"undefined"!=typeof b.callback&&(e=function(a,c){var d=c;null===a&&(d=TinCan.Statement.fromJSON(c.responseText)),b.callback(a,d)},c.callback=e),d=this.sendRequest(c),e||(d.statement=null,null===d.err&&(d.statement=TinCan.Statement.fromJSON(d.xhr.responseText))),d},saveStatements:function(a,b){this.log("saveStatements");var c,d,e,f=[];if(b=b||{},0===a.length)return"undefined"!=typeof b.callback?void b.callback(new Error("no statements"),null):{err:new Error("no statements"),xhr:null};for(e=0;e<a.length;e+=1){try{d=a[e].asVersion(this.version)}catch(g){return this.allowFail?(this.log("[warning] statement could not be serialized in version ("+this.version+"): "+g),"undefined"!=typeof b.callback?void b.callback(null,null):{err:null,xhr:null}):(this.log("[error] statement could not be serialized in version ("+this.version+"): "+g),"undefined"!=typeof b.callback?void b.callback(g,null):{err:g,xhr:null})}f.push(d)}return c={url:"statements",method:"POST",data:JSON.stringify(f),headers:{"Content-Type":"application/json"}},"undefined"!=typeof b.callback&&(c.callback=b.callback),this.sendRequest(c)},queryStatements:function(a){this.log("queryStatements");var b,c,d;a=a||{},a.params=a.params||{};try{b=this._queryStatementsRequestCfg(a)}catch(e){return this.log("[error] Query statements failed - "+e),"undefined"!=typeof a.callback&&a.callback(e,{}),{err:e,statementsResult:null}}return"undefined"!=typeof a.callback&&(d=function(b,c){var d=c;null===b&&(d=TinCan.StatementsResult.fromJSON(c.responseText)),a.callback(b,d)},b.callback=d),c=this.sendRequest(b),c.config=b,d||(c.statementsResult=null,null===c.err&&(c.statementsResult=TinCan.StatementsResult.fromJSON(c.xhr.responseText))),c},_queryStatementsRequestCfg:function(a){this.log("_queryStatementsRequestCfg");var b,c,d={},e={url:"statements",method:"GET",params:d},f=["agent","actor","object","instructor"],g=["verb","activity"],h=["registration","context","since","until","limit","authoritative","sparse","ascending","related_activities","related_agents","format","attachments"],i={verb:!0,registration:!0,since:!0,until:!0,limit:!0,ascending:!0},j={.9:{supported:{actor:!0,instructor:!0,target:!0,object:!0,context:!0,authoritative:!0,sparse:!0}},"1.0.0":{supported:{agent:!0,activity:!0,related_activities:!0,related_agents:!0,format:!0,attachments:!0}}};j[.95]=j[.9],j["1.0.1"]=j["1.0.0"],a.params.hasOwnProperty("target")&&(a.params.object=a.params.target);for(c in a.params)if(a.params.hasOwnProperty(c)&&"undefined"==typeof i[c]&&"undefined"==typeof j[this.version].supported[c])throw"Unrecognized query parameter configured: "+c;for(b=0;b<f.length;b+=1)"undefined"!=typeof a.params[f[b]]&&(d[f[b]]=JSON.stringify(a.params[f[b]].asVersion(this.version)));for(b=0;b<g.length;b+=1)"undefined"!=typeof a.params[g[b]]&&(d[g[b]]=a.params[g[b]].id);for(b=0;b<h.length;b+=1)"undefined"!=typeof a.params[h[b]]&&(d[h[b]]=a.params[h[b]]);return e},moreStatements:function(a){this.log("moreStatements: "+a.url);var b,c,d,e,f;return a=a||{},e=TinCan.Utils.parseURL(a.url),f=TinCan.Utils.getServerRoot(this.endpoint),0===e.path.indexOf("/statements")&&(e.path=this.endpoint.replace(f,"")+e.path,this.log("converting non-standard more URL to "+e.path)),0!==e.path.indexOf("/")&&(e.path="/"+e.path),b={method:"GET",url:f+e.path,params:e.params},"undefined"!=typeof a.callback&&(d=function(b,c){var d=c;null===b&&(d=TinCan.StatementsResult.fromJSON(c.responseText)),a.callback(b,d)},b.callback=d),c=this.sendRequest(b),c.config=b,d||(c.statementsResult=null,null===c.err&&(c.statementsResult=TinCan.StatementsResult.fromJSON(c.xhr.responseText))),c},retrieveState:function(a,b){this.log("retrieveState");var c,d,e={},f={};if(e={stateId:a,activityId:b.activity.id},"0.9"===this.version?e.actor=JSON.stringify(b.agent.asVersion(this.version)):e.agent=JSON.stringify(b.agent.asVersion(this.version)),"undefined"!=typeof b.registration&&null!==b.registration&&("0.9"===this.version?e.registrationId=b.registration:e.registration=b.registration),f={url:"activities/state",method:"GET",params:e,ignore404:!0},"undefined"!=typeof b.callback&&(d=function(c,d){var e=d;if(null===c)if(404===d.status)e=null;else if(e=new TinCan.State({id:a,contents:d.responseText}),e.etag="undefined"!=typeof d.getResponseHeader&&null!==d.getResponseHeader("ETag")&&""!==d.getResponseHeader("ETag")?d.getResponseHeader("ETag"):TinCan.Utils.getSHA1String(d.responseText),"undefined"!=typeof d.contentType?e.contentType=d.contentType:"undefined"!=typeof d.getResponseHeader&&null!==d.getResponseHeader("Content-Type")&&""!==d.getResponseHeader("Content-Type")&&(e.contentType=d.getResponseHeader("Content-Type")),TinCan.Utils.isApplicationJSON(e.contentType))try{e.contents=JSON.parse(e.contents)}catch(f){this.log("retrieveState - failed to deserialize JSON: "+f)}b.callback(c,e)},f.callback=d),c=this.sendRequest(f),!d&&(c.state=null,null===c.err&&404!==c.xhr.status&&(c.state=new TinCan.State({id:a,contents:c.xhr.responseText}),c.state.etag="undefined"!=typeof c.xhr.getResponseHeader&&null!==c.xhr.getResponseHeader("ETag")&&""!==c.xhr.getResponseHeader("ETag")?c.xhr.getResponseHeader("ETag"):TinCan.Utils.getSHA1String(c.xhr.responseText),"undefined"!=typeof c.xhr.contentType?c.state.contentType=c.xhr.contentType:"undefined"!=typeof c.xhr.getResponseHeader&&null!==c.xhr.getResponseHeader("Content-Type")&&""!==c.xhr.getResponseHeader("Content-Type")&&(c.state.contentType=c.xhr.getResponseHeader("Content-Type")),TinCan.Utils.isApplicationJSON(c.state.contentType))))try{c.state.contents=JSON.parse(c.state.contents)}catch(g){this.log("retrieveState - failed to deserialize JSON: "+g)}return c},saveState:function(a,b,c){this.log("saveState");var d,e;return"undefined"==typeof c.contentType&&(c.contentType="application/octet-stream"),"object"==typeof b&&TinCan.Utils.isApplicationJSON(c.contentType)&&(b=JSON.stringify(b)),("undefined"==typeof c.method||"POST"!==c.method)&&(c.method="PUT"),d={stateId:a,activityId:c.activity.id},"0.9"===this.version?d.actor=JSON.stringify(c.agent.asVersion(this.version)):d.agent=JSON.stringify(c.agent.asVersion(this.version)),"undefined"!=typeof c.registration&&null!==c.registration&&("0.9"===this.version?d.registrationId=c.registration:d.registration=c.registration),e={url:"activities/state",method:c.method,params:d,data:b,headers:{"Content-Type":c.contentType}},"undefined"!=typeof c.callback&&(e.callback=c.callback),"undefined"!=typeof c.lastSHA1&&null!==c.lastSHA1&&(e.headers["If-Match"]=c.lastSHA1),this.sendRequest(e)},dropState:function(a,b){this.log("dropState");var c,d;return c={activityId:b.activity.id},"0.9"===this.version?c.actor=JSON.stringify(b.agent.asVersion(this.version)):c.agent=JSON.stringify(b.agent.asVersion(this.version)),null!==a&&(c.stateId=a),"undefined"!=typeof b.registration&&null!==b.registration&&("0.9"===this.version?c.registrationId=b.registration:c.registration=b.registration),d={url:"activities/state",method:"DELETE",params:c},"undefined"!=typeof b.callback&&(d.callback=b.callback),this.sendRequest(d)},retrieveActivityProfile:function(a,b){this.log("retrieveActivityProfile");var c,d,e={};if(e={url:"activities/profile",method:"GET",params:{profileId:a,activityId:b.activity.id},ignore404:!0},"undefined"!=typeof b.callback&&(d=function(c,d){var e=d;if(null===c)if(404===d.status)e=null;else if(e=new TinCan.ActivityProfile({id:a,activity:b.activity,contents:d.responseText}),e.etag="undefined"!=typeof d.getResponseHeader&&null!==d.getResponseHeader("ETag")&&""!==d.getResponseHeader("ETag")?d.getResponseHeader("ETag"):TinCan.Utils.getSHA1String(d.responseText),"undefined"!=typeof d.contentType?e.contentType=d.contentType:"undefined"!=typeof d.getResponseHeader&&null!==d.getResponseHeader("Content-Type")&&""!==d.getResponseHeader("Content-Type")&&(e.contentType=d.getResponseHeader("Content-Type")),TinCan.Utils.isApplicationJSON(e.contentType))try{e.contents=JSON.parse(e.contents)}catch(f){this.log("retrieveActivityProfile - failed to deserialize JSON: "+f)}b.callback(c,e)},e.callback=d),c=this.sendRequest(e),!d&&(c.profile=null,null===c.err&&404!==c.xhr.status&&(c.profile=new TinCan.ActivityProfile({id:a,activity:b.activity,contents:c.xhr.responseText}),c.profile.etag="undefined"!=typeof c.xhr.getResponseHeader&&null!==c.xhr.getResponseHeader("ETag")&&""!==c.xhr.getResponseHeader("ETag")?c.xhr.getResponseHeader("ETag"):TinCan.Utils.getSHA1String(c.xhr.responseText),"undefined"!=typeof c.xhr.contentType?c.profile.contentType=c.xhr.contentType:"undefined"!=typeof c.xhr.getResponseHeader&&null!==c.xhr.getResponseHeader("Content-Type")&&""!==c.xhr.getResponseHeader("Content-Type")&&(c.profile.contentType=c.xhr.getResponseHeader("Content-Type")),TinCan.Utils.isApplicationJSON(c.profile.contentType))))try{c.profile.contents=JSON.parse(c.profile.contents)}catch(f){this.log("retrieveActivityProfile - failed to deserialize JSON: "+f)}return c},saveActivityProfile:function(a,b,c){this.log("saveActivityProfile");var d;return"undefined"==typeof c.contentType&&(c.contentType="application/octet-stream"),("undefined"==typeof c.method||"POST"!==c.method)&&(c.method="PUT"),"object"==typeof b&&TinCan.Utils.isApplicationJSON(c.contentType)&&(b=JSON.stringify(b)),d={url:"activities/profile",method:c.method,params:{profileId:a,activityId:c.activity.id},data:b,headers:{"Content-Type":c.contentType}},"undefined"!=typeof c.callback&&(d.callback=c.callback),"undefined"!=typeof c.lastSHA1&&null!==c.lastSHA1?d.headers["If-Match"]=c.lastSHA1:d.headers["If-None-Match"]="*",this.sendRequest(d)
},dropActivityProfile:function(a,b){this.log("dropActivityProfile");var c,d;return c={profileId:a,activityId:b.activity.id},d={url:"activities/profile",method:"DELETE",params:c},"undefined"!=typeof b.callback&&(d.callback=b.callback),this.sendRequest(d)},retrieveAgentProfile:function(a,b){this.log("retrieveAgentProfile");var c,d,e={};if(e={method:"GET",params:{profileId:a},ignore404:!0},"0.9"===this.version?(e.url="actors/profile",e.params.actor=JSON.stringify(b.agent.asVersion(this.version))):(e.url="agents/profile",e.params.agent=JSON.stringify(b.agent.asVersion(this.version))),"undefined"!=typeof b.callback&&(d=function(c,d){var e=d;if(null===c)if(404===d.status)e=null;else if(e=new TinCan.AgentProfile({id:a,agent:b.agent,contents:d.responseText}),e.etag="undefined"!=typeof d.getResponseHeader&&null!==d.getResponseHeader("ETag")&&""!==d.getResponseHeader("ETag")?d.getResponseHeader("ETag"):TinCan.Utils.getSHA1String(d.responseText),"undefined"!=typeof d.contentType?e.contentType=d.contentType:"undefined"!=typeof d.getResponseHeader&&null!==d.getResponseHeader("Content-Type")&&""!==d.getResponseHeader("Content-Type")&&(e.contentType=d.getResponseHeader("Content-Type")),TinCan.Utils.isApplicationJSON(e.contentType))try{e.contents=JSON.parse(e.contents)}catch(f){this.log("retrieveAgentProfile - failed to deserialize JSON: "+f)}b.callback(c,e)},e.callback=d),c=this.sendRequest(e),!d&&(c.profile=null,null===c.err&&404!==c.xhr.status&&(c.profile=new TinCan.AgentProfile({id:a,agent:b.agent,contents:c.xhr.responseText}),c.profile.etag="undefined"!=typeof c.xhr.getResponseHeader&&null!==c.xhr.getResponseHeader("ETag")&&""!==c.xhr.getResponseHeader("ETag")?c.xhr.getResponseHeader("ETag"):TinCan.Utils.getSHA1String(c.xhr.responseText),"undefined"!=typeof c.xhr.contentType?c.profile.contentType=c.xhr.contentType:"undefined"!=typeof c.xhr.getResponseHeader&&null!==c.xhr.getResponseHeader("Content-Type")&&""!==c.xhr.getResponseHeader("Content-Type")&&(c.profile.contentType=c.xhr.getResponseHeader("Content-Type")),TinCan.Utils.isApplicationJSON(c.profile.contentType))))try{c.profile.contents=JSON.parse(c.profile.contents)}catch(f){this.log("retrieveAgentProfile - failed to deserialize JSON: "+f)}return c},saveAgentProfile:function(a,b,c){this.log("saveAgentProfile");var d;return"undefined"==typeof c.contentType&&(c.contentType="application/octet-stream"),("undefined"==typeof c.method||"POST"!==c.method)&&(c.method="PUT"),"object"==typeof b&&TinCan.Utils.isApplicationJSON(c.contentType)&&(b=JSON.stringify(b)),d={method:c.method,params:{profileId:a},data:b,headers:{"Content-Type":c.contentType}},"0.9"===this.version?(d.url="actors/profile",d.params.actor=JSON.stringify(c.agent.asVersion(this.version))):(d.url="agents/profile",d.params.agent=JSON.stringify(c.agent.asVersion(this.version))),"undefined"!=typeof c.callback&&(d.callback=c.callback),"undefined"!=typeof c.lastSHA1&&null!==c.lastSHA1?d.headers["If-Match"]=c.lastSHA1:d.headers["If-None-Match"]="*",this.sendRequest(d)},dropAgentProfile:function(a,b){this.log("dropAgentProfile");var c,d;return c={profileId:a},d={method:"DELETE",params:c},"0.9"===this.version?(d.url="actors/profile",c.actor=JSON.stringify(b.agent.asVersion(this.version))):(d.url="agents/profile",c.agent=JSON.stringify(b.agent.asVersion(this.version))),"undefined"!=typeof b.callback&&(d.callback=b.callback),this.sendRequest(d)}},a.syncEnabled=null}(),function(){"use strict";var a=TinCan.AgentAccount=function(a){this.log("constructor"),this.homePage=null,this.name=null,this.init(a)};a.prototype={LOG_SRC:"AgentAccount",log:TinCan.prototype.log,init:function(a){this.log("init");var b,c=["name","homePage"];for(a=a||{},"undefined"!=typeof a.accountServiceHomePage&&(a.homePage=a.accountServiceHomePage),"undefined"!=typeof a.accountName&&(a.name=a.accountName),b=0;b<c.length;b+=1)a.hasOwnProperty(c[b])&&null!==a[c[b]]&&(this[c[b]]=a[c[b]])},toString:function(){this.log("toString");var a="";return null!==this.name||null!==this.homePage?(a+=null!==this.name?this.name:"-",a+=":",a+=null!==this.homePage?this.homePage:"-"):a="AgentAccount: unidentified",a},asVersion:function(a){this.log("asVersion: "+a);var b={};return a=a||TinCan.versions()[0],"0.9"===a?(b.accountName=this.name,b.accountServiceHomePage=this.homePage):(b.name=this.name,b.homePage=this.homePage),b}},a.fromJSON=function(b){a.prototype.log("fromJSON");var c=JSON.parse(b);return new a(c)}}(),function(){"use strict";var a=TinCan.Agent=function(a){this.log("constructor"),this.name=null,this.mbox=null,this.mbox_sha1sum=null,this.openid=null,this.account=null,this.degraded=!1,this.init(a)};a.prototype={objectType:"Agent",LOG_SRC:"Agent",log:TinCan.prototype.log,init:function(a){this.log("init");var b,c,d=["name","mbox","mbox_sha1sum","openid"];for(a=a||{},"undefined"!=typeof a.lastName||"undefined"!=typeof a.firstName?(a.name="","undefined"!=typeof a.firstName&&a.firstName.length>0&&(a.name=a.firstName[0],a.firstName.length>1&&(this.degraded=!0)),""!==a.name&&(a.name+=" "),"undefined"!=typeof a.lastName&&a.lastName.length>0&&(a.name+=a.lastName[0],a.lastName.length>1&&(this.degraded=!0))):("undefined"!=typeof a.familyName||"undefined"!=typeof a.givenName)&&(a.name="","undefined"!=typeof a.givenName&&a.givenName.length>0&&(a.name=a.givenName[0],a.givenName.length>1&&(this.degraded=!0)),""!==a.name&&(a.name+=" "),"undefined"!=typeof a.familyName&&a.familyName.length>0&&(a.name+=a.familyName[0],a.familyName.length>1&&(this.degraded=!0))),"object"==typeof a.name&&null!==a.name&&(a.name.length>1&&(this.degraded=!0),a.name=a.name[0]),"object"==typeof a.mbox&&null!==a.mbox&&(a.mbox.length>1&&(this.degraded=!0),a.mbox=a.mbox[0]),"object"==typeof a.mbox_sha1sum&&null!==a.mbox_sha1sum&&(a.mbox_sha1sum.length>1&&(this.degraded=!0),a.mbox_sha1sum=a.mbox_sha1sum[0]),"object"==typeof a.openid&&null!==a.openid&&(a.openid.length>1&&(this.degraded=!0),a.openid=a.openid[0]),"object"==typeof a.account&&null!==a.account&&"undefined"==typeof a.account.homePage&&"undefined"==typeof a.account.name&&(0===a.account.length?delete a.account:(a.account.length>1&&(this.degraded=!0),a.account=a.account[0])),a.hasOwnProperty("account")&&(this.account=a.account instanceof TinCan.AgentAccount?a.account:new TinCan.AgentAccount(a.account)),b=0;b<d.length;b+=1)a.hasOwnProperty(d[b])&&null!==a[d[b]]&&(c=a[d[b]],"mbox"===d[b]&&-1===c.indexOf("mailto:")&&(c="mailto:"+c),this[d[b]]=c)},toString:function(){return this.log("toString"),null!==this.name?this.name:null!==this.mbox?this.mbox.replace("mailto:",""):null!==this.mbox_sha1sum?this.mbox_sha1sum:null!==this.openid?this.openid:null!==this.account?this.account.toString():this.objectType+": unidentified"},asVersion:function(a){this.log("asVersion: "+a);var b={objectType:this.objectType};return a=a||TinCan.versions()[0],"0.9"===a?(null!==this.mbox?b.mbox=[this.mbox]:null!==this.mbox_sha1sum?b.mbox_sha1sum=[this.mbox_sha1sum]:null!==this.openid?b.openid=[this.openid]:null!==this.account&&(b.account=[this.account.asVersion(a)]),null!==this.name&&(b.name=[this.name])):(null!==this.mbox?b.mbox=this.mbox:null!==this.mbox_sha1sum?b.mbox_sha1sum=this.mbox_sha1sum:null!==this.openid?b.openid=this.openid:null!==this.account&&(b.account=this.account.asVersion(a)),null!==this.name&&(b.name=this.name)),b}},a.fromJSON=function(b){a.prototype.log("fromJSON");var c=JSON.parse(b);return new a(c)}}(),function(){"use strict";var a=TinCan.Group=function(a){this.log("constructor"),this.name=null,this.mbox=null,this.mbox_sha1sum=null,this.openid=null,this.account=null,this.member=[],this.init(a)};a.prototype={objectType:"Group",LOG_SRC:"Group",log:TinCan.prototype.log,init:function(a){this.log("init");var b;if(a=a||{},TinCan.Agent.prototype.init.call(this,a),"undefined"!=typeof a.member)for(b=0;b<a.member.length;b+=1)this.member.push(a.member[b]instanceof TinCan.Agent?a.member[b]:new TinCan.Agent(a.member[b]))},toString:function(a){this.log("toString");var b=TinCan.Agent.prototype.toString.call(this,a);return b!==this.objectType+": unidentified"&&(b=this.objectType+": "+b),b},asVersion:function(a){this.log("asVersion: "+a);var b,c;if(a=a||TinCan.versions()[0],b=TinCan.Agent.prototype.asVersion.call(this,a),this.member.length>0)for(b.member=[],c=0;c<this.member.length;c+=1)b.member.push(this.member[c].asVersion(a));return b}},a.fromJSON=function(b){a.prototype.log("fromJSON");var c=JSON.parse(b);return new a(c)}}(),function(){"use strict";var a={"http://adlnet.gov/expapi/verbs/experienced":"experienced","http://adlnet.gov/expapi/verbs/attended":"attended","http://adlnet.gov/expapi/verbs/attempted":"attempted","http://adlnet.gov/expapi/verbs/completed":"completed","http://adlnet.gov/expapi/verbs/passed":"passed","http://adlnet.gov/expapi/verbs/failed":"failed","http://adlnet.gov/expapi/verbs/answered":"answered","http://adlnet.gov/expapi/verbs/interacted":"interacted","http://adlnet.gov/expapi/verbs/imported":"imported","http://adlnet.gov/expapi/verbs/created":"created","http://adlnet.gov/expapi/verbs/shared":"shared","http://adlnet.gov/expapi/verbs/voided":"voided"},b=TinCan.Verb=function(a){this.log("constructor"),this.id=null,this.display=null,this.init(a)};b.prototype={LOG_SRC:"Verb",log:TinCan.prototype.log,init:function(b){this.log("init");var c,d,e=["id","display"];if("string"==typeof b){this.id=b,this.display={und:this.id};for(d in a)if(a.hasOwnProperty(d)&&a[d]===b){this.id=d;break}}else{for(b=b||{},c=0;c<e.length;c+=1)b.hasOwnProperty(e[c])&&null!==b[e[c]]&&(this[e[c]]=b[e[c]]);null===this.display&&"undefined"!=typeof a[this.id]&&(this.display={und:a[this.id]})}},toString:function(a){return this.log("toString"),null!==this.display?this.getLangDictionaryValue("display",a):this.id},asVersion:function(b){this.log("asVersion");var c;return b=b||TinCan.versions()[0],"0.9"===b?c=a[this.id]:(c={id:this.id},null!==this.display&&(c.display=this.display)),c},getLangDictionaryValue:TinCan.Utils.getLangDictionaryValue},b.fromJSON=function(a){b.prototype.log("fromJSON");var c=JSON.parse(a);return new b(c)}}(),function(){"use strict";var a=TinCan.Result=function(a){this.log("constructor"),this.score=null,this.success=null,this.completion=null,this.duration=null,this.response=null,this.extensions=null,this.init(a)};a.prototype={LOG_SRC:"Result",log:TinCan.prototype.log,init:function(a){this.log("init");var b,c=["completion","duration","extensions","response","success"];for(a=a||{},a.hasOwnProperty("score")&&null!==a.score&&(this.score=a.score instanceof TinCan.Score?a.score:new TinCan.Score(a.score)),b=0;b<c.length;b+=1)a.hasOwnProperty(c[b])&&null!==a[c[b]]&&(this[c[b]]=a[c[b]]);"Completed"===this.completion&&(this.completion=!0)},asVersion:function(a){this.log("asVersion");var b,c={},d=["success","duration","response","extensions"],e=["score"];for(a=a||TinCan.versions()[0],b=0;b<d.length;b+=1)null!==this[d[b]]&&(c[d[b]]=this[d[b]]);for(b=0;b<e.length;b+=1)null!==this[e[b]]&&(c[e[b]]=this[e[b]].asVersion(a));return null!==this.completion&&("0.9"===a?this.completion&&(c.completion="Completed"):c.completion=this.completion),c}},a.fromJSON=function(b){a.prototype.log("fromJSON");var c=JSON.parse(b);return new a(c)}}(),function(){"use strict";var a=TinCan.Score=function(a){this.log("constructor"),this.scaled=null,this.raw=null,this.min=null,this.max=null,this.init(a)};a.prototype={LOG_SRC:"Score",log:TinCan.prototype.log,init:function(a){this.log("init");var b,c=["scaled","raw","min","max"];for(a=a||{},b=0;b<c.length;b+=1)a.hasOwnProperty(c[b])&&null!==a[c[b]]&&(this[c[b]]=a[c[b]])},asVersion:function(a){this.log("asVersion");var b,c={},d=["scaled","raw","min","max"];for(a=a||TinCan.versions()[0],b=0;b<d.length;b+=1)null!==this[d[b]]&&(c[d[b]]=this[d[b]]);return c}},a.fromJSON=function(b){a.prototype.log("fromJSON");var c=JSON.parse(b);return new a(c)}}(),function(){"use strict";var a=TinCan.InteractionComponent=function(a){this.log("constructor"),this.id=null,this.description=null,this.init(a)};a.prototype={LOG_SRC:"InteractionComponent",log:TinCan.prototype.log,init:function(a){this.log("init");var b,c=["id","description"];for(a=a||{},b=0;b<c.length;b+=1)a.hasOwnProperty(c[b])&&null!==a[c[b]]&&(this[c[b]]=a[c[b]])},asVersion:function(a){this.log("asVersion");var b,c,d={id:this.id},e=["description"];for(a=a||TinCan.versions()[0],b=0;b<e.length;b+=1)c=e[b],null!==this[c]&&(d[c]=this[c]);return d},getLangDictionaryValue:TinCan.Utils.getLangDictionaryValue},a.fromJSON=function(b){a.prototype.log("fromJSON");var c=JSON.parse(b);return new a(c)}}(),function(){"use strict";var a={"http://adlnet.gov/expapi/activities/course":"course","http://adlnet.gov/expapi/activities/module":"module","http://adlnet.gov/expapi/activities/meeting":"meeting","http://adlnet.gov/expapi/activities/media":"media","http://adlnet.gov/expapi/activities/performance":"performance","http://adlnet.gov/expapi/activities/simulation":"simulation","http://adlnet.gov/expapi/activities/assessment":"assessment","http://adlnet.gov/expapi/activities/interaction":"interaction","http://adlnet.gov/expapi/activities/cmi.interaction":"cmi.interaction","http://adlnet.gov/expapi/activities/question":"question","http://adlnet.gov/expapi/activities/objective":"objective","http://adlnet.gov/expapi/activities/link":"link"},b=TinCan.ActivityDefinition=function(a){this.log("constructor"),this.name=null,this.description=null,this.type=null,this.moreInfo=null,this.extensions=null,this.interactionType=null,this.correctResponsesPattern=null,this.choices=null,this.scale=null,this.source=null,this.target=null,this.steps=null,this.init(a)};b.prototype={LOG_SRC:"ActivityDefinition",log:TinCan.prototype.log,init:function(b){this.log("init");var c,d,e,f=["name","description","moreInfo","extensions","correctResponsesPattern"],g=[];if(b=b||{},b.hasOwnProperty("type")&&null!==b.type){for(e in a)a.hasOwnProperty(e)&&a[e]===b.type&&(b.type=a[e]);this.type=b.type}if(b.hasOwnProperty("interactionType")&&null!==b.interactionType&&(this.interactionType=b.interactionType,"choice"===b.interactionType||"sequencing"===b.interactionType?g.push("choices"):"likert"===b.interactionType?g.push("scale"):"matching"===b.interactionType?(g.push("source"),g.push("target")):"performance"===b.interactionType&&g.push("steps"),g.length>0))for(c=0;c<g.length;c+=1)if(e=g[c],b.hasOwnProperty(e)&&null!==b[e])for(this[e]=[],d=0;d<b[e].length;d+=1)this[e].push(b[e][d]instanceof TinCan.InteractionComponent?b[e][d]:new TinCan.InteractionComponent(b[e][d]));for(c=0;c<f.length;c+=1)b.hasOwnProperty(f[c])&&null!==b[f[c]]&&(this[f[c]]=b[f[c]])},toString:function(a){return this.log("toString"),null!==this.name?this.getLangDictionaryValue("name",a):null!==this.description?this.getLangDictionaryValue("description",a):""},asVersion:function(b){this.log("asVersion");var c,d,e,f={},g=["name","description","interactionType","correctResponsesPattern","extensions"],h=["choices","scale","source","target","steps"];for(b=b||TinCan.versions()[0],null!==this.type&&(f.type="0.9"===b?a[this.type]:this.type),c=0;c<g.length;c+=1)e=g[c],null!==this[e]&&(f[e]=this[e]);for(c=0;c<h.length;c+=1)if(e=h[c],null!==this[e])for(f[e]=[],d=0;d<this[e].length;d+=1)f[e].push(this[e][d].asVersion(b));return 0!==b.indexOf("0.9")&&null!==this.moreInfo&&(f.moreInfo=this.moreInfo),f},getLangDictionaryValue:TinCan.Utils.getLangDictionaryValue},b.fromJSON=function(a){b.prototype.log("fromJSON");var c=JSON.parse(a);return new b(c)}}(),function(){"use strict";var a=TinCan.Activity=function(a){this.log("constructor"),this.objectType="Activity",this.id=null,this.definition=null,this.init(a)};a.prototype={LOG_SRC:"Activity",log:TinCan.prototype.log,init:function(a){this.log("init");var b,c=["id"];for(a=a||{},a.hasOwnProperty("definition")&&(this.definition=a.definition instanceof TinCan.ActivityDefinition?a.definition:new TinCan.ActivityDefinition(a.definition)),b=0;b<c.length;b+=1)a.hasOwnProperty(c[b])&&null!==a[c[b]]&&(this[c[b]]=a[c[b]])},toString:function(a){this.log("toString");var b="";return null!==this.definition&&(b=this.definition.toString(a),""!==b)?b:null!==this.id?this.id:"Activity: unidentified"},asVersion:function(a){this.log("asVersion");var b={id:this.id,objectType:this.objectType};return a=a||TinCan.versions()[0],null!==this.definition&&(b.definition=this.definition.asVersion(a)),b}},a.fromJSON=function(b){a.prototype.log("fromJSON");var c=JSON.parse(b);return new a(c)}}(),function(){"use strict";var a=TinCan.ContextActivities=function(a){this.log("constructor"),this.category=null,this.parent=null,this.grouping=null,this.other=null,this.init(a)};a.prototype={LOG_SRC:"ContextActivities",log:TinCan.prototype.log,init:function(a){this.log("init");var b,c,d,e,f=["category","parent","grouping","other"];for(a=a||{},b=0;b<f.length;b+=1)if(d=f[b],a.hasOwnProperty(d)&&null!==a[d])if("[object Array]"===Object.prototype.toString.call(a[d]))for(c=0;c<a[d].length;c+=1)this.add(d,a[d][c]);else e=a[d],this.add(d,e)},add:function(a,b){return"category"===a||"parent"===a||"grouping"===a||"other"===a?(null===this[a]&&(this[a]=[]),b instanceof TinCan.Activity||(b="string"==typeof b?{id:b}:b,b=new TinCan.Activity(b)),this[a].push(b),this[a].length-1):void 0},asVersion:function(a){this.log("asVersion");var b,c,d={},e=["parent","grouping","other"];for(a=a||TinCan.versions()[0],b=0;b<e.length;b+=1)if(null!==this[e[b]]&&this[e[b]].length>0)if("0.9"===a||"0.95"===a)this[e[b]].length>1&&this.log("[warning] version does not support multiple values in: "+e[b]),d[e[b]]=this[e[b]][0].asVersion(a);else for(d[e[b]]=[],c=0;c<this[e[b]].length;c+=1)d[e[b]].push(this[e[b]][c].asVersion(a));if(null!==this.category&&this.category.length>0){if("0.9"===a||"0.95"===a)throw this.log("[error] version does not support the 'category' property: "+a),new Error(a+" does not support the 'category' property");for(d.category=[],b=0;b<this.category.length;b+=1)d.category.push(this.category[b].asVersion(a))}return d}},a.fromJSON=function(b){a.prototype.log("fromJSON");var c=JSON.parse(b);return new a(c)}}(),function(){"use strict";var a=TinCan.Context=function(a){this.log("constructor"),this.registration=null,this.instructor=null,this.team=null,this.contextActivities=null,this.revision=null,this.platform=null,this.language=null,this.statement=null,this.extensions=null,this.init(a)};a.prototype={LOG_SRC:"Context",log:TinCan.prototype.log,init:function(a){this.log("init");var b,c,d,e=["registration","revision","platform","language","extensions"],f=["instructor","team"];for(a=a||{},b=0;b<e.length;b+=1)c=e[b],a.hasOwnProperty(c)&&null!==a[c]&&(this[c]=a[c]);for(b=0;b<f.length;b+=1)c=f[b],a.hasOwnProperty(c)&&null!==a[c]&&(d=a[c],("undefined"==typeof d.objectType||"Person"===d.objectType)&&(d.objectType="Agent"),"Agent"!==d.objectType||d instanceof TinCan.Agent?"Group"!==d.objectType||d instanceof TinCan.Group||(d=new TinCan.Group(d)):d=new TinCan.Agent(d),this[c]=d);a.hasOwnProperty("contextActivities")&&null!==a.contextActivities&&(this.contextActivities=a.contextActivities instanceof TinCan.ContextActivities?a.contextActivities:new TinCan.ContextActivities(a.contextActivities)),a.hasOwnProperty("statement")&&null!==a.statement&&(a.statement instanceof TinCan.StatementRef?this.statement=a.statement:a.statement instanceof TinCan.SubStatement?this.statement=a.statement:"StatementRef"===a.statement.objectType?this.statement=new TinCan.StatementRef(a.statement):"SubStatement"===a.statement.objectType?this.statement=new TinCan.SubStatement(a.statement):this.log("Unable to parse statement.context.statement property."))},asVersion:function(a){this.log("asVersion");var b,c={},d=["registration","revision","platform","language","extensions"],e=["instructor","team","contextActivities","statement"];if(a=a||TinCan.versions()[0],this.statement instanceof TinCan.SubStatement&&"0.9"!==a&&"0.95"!==a)throw this.log("[error] version does not support SubStatements in the 'statement' property: "+a),new Error(a+" does not support SubStatements in the 'statement' property");for(b=0;b<d.length;b+=1)null!==this[d[b]]&&(c[d[b]]=this[d[b]]);for(b=0;b<e.length;b+=1)null!==this[e[b]]&&(c[e[b]]=this[e[b]].asVersion(a));return c}},a.fromJSON=function(b){a.prototype.log("fromJSON");var c=JSON.parse(b);return new a(c)}}(),function(){"use strict";var a=TinCan.StatementRef=function(a){this.log("constructor"),this.id=null,this.init(a)};a.prototype={objectType:"StatementRef",LOG_SRC:"StatementRef",log:TinCan.prototype.log,init:function(a){this.log("init");var b,c=["id"];for(a=a||{},b=0;b<c.length;b+=1)a.hasOwnProperty(c[b])&&null!==a[c[b]]&&(this[c[b]]=a[c[b]])},toString:function(){return this.log("toString"),this.id},asVersion:function(a){this.log("asVersion");var b={objectType:this.objectType,id:this.id};return"0.9"===a&&(b.objectType="Statement"),b}},a.fromJSON=function(b){a.prototype.log("fromJSON");var c=JSON.parse(b);return new a(c)}}(),function(){"use strict";var a=TinCan.SubStatement=function(a){this.log("constructor"),this.actor=null,this.verb=null,this.target=null,this.result=null,this.context=null,this.timestamp=null,this.init(a)};a.prototype={objectType:"SubStatement",LOG_SRC:"SubStatement",log:TinCan.prototype.log,init:function(a){this.log("init");var b,c=["timestamp"];for(a=a||{},a.hasOwnProperty("object")&&(a.target=a.object),a.hasOwnProperty("actor")&&(("undefined"==typeof a.actor.objectType||"Person"===a.actor.objectType)&&(a.actor.objectType="Agent"),"Agent"===a.actor.objectType?this.actor=a.actor instanceof TinCan.Agent?a.actor:new TinCan.Agent(a.actor):"Group"===a.actor.objectType&&(this.actor=a.actor instanceof TinCan.Group?a.actor:new TinCan.Group(a.actor))),a.hasOwnProperty("verb")&&(this.verb=a.verb instanceof TinCan.Verb?a.verb:new TinCan.Verb(a.verb)),a.hasOwnProperty("target")&&(a.target instanceof TinCan.Activity||a.target instanceof TinCan.Agent||a.target instanceof TinCan.Group||a.target instanceof TinCan.SubStatement||a.target instanceof TinCan.StatementRef?this.target=a.target:("undefined"==typeof a.target.objectType&&(a.target.objectType="Activity"),"Activity"===a.target.objectType?this.target=new TinCan.Activity(a.target):"Agent"===a.target.objectType?this.target=new TinCan.Agent(a.target):"Group"===a.target.objectType?this.target=new TinCan.Group(a.target):"SubStatement"===a.target.objectType?this.target=new TinCan.SubStatement(a.target):"StatementRef"===a.target.objectType?this.target=new TinCan.StatementRef(a.target):this.log("Unrecognized target type: "+a.target.objectType))),a.hasOwnProperty("result")&&(this.result=a.result instanceof TinCan.Result?a.result:new TinCan.Result(a.result)),a.hasOwnProperty("context")&&(this.context=a.context instanceof TinCan.Context?a.context:new TinCan.Context(a.context)),b=0;b<c.length;b+=1)a.hasOwnProperty(c[b])&&null!==a[c[b]]&&(this[c[b]]=a[c[b]])},toString:function(a){return this.log("toString"),(null!==this.actor?this.actor.toString(a):"")+" "+(null!==this.verb?this.verb.toString(a):"")+" "+(null!==this.target?this.target.toString(a):"")},asVersion:function(a){this.log("asVersion");var b,c,d=["timestamp"],e=["actor","verb","result","context"];for(b={objectType:this.objectType},a=a||TinCan.versions()[0],c=0;c<d.length;c+=1)null!==this[d[c]]&&(b[d[c]]=this[d[c]]);for(c=0;c<e.length;c+=1)null!==this[e[c]]&&(b[e[c]]=this[e[c]].asVersion(a));return null!==this.target&&(b.object=this.target.asVersion(a)),"0.9"===a&&(b.objectType="Statement"),b}},a.fromJSON=function(b){a.prototype.log("fromJSON");var c=JSON.parse(b);return new a(c)}}(),function(){"use strict";var a=TinCan.Statement=function(a,b){this.log("constructor"),b="number"==typeof b?{storeOriginal:b}:b||{},"undefined"==typeof b.storeOriginal&&(b.storeOriginal=null),"undefined"==typeof b.doStamp&&(b.doStamp=!0),this.id=null,this.actor=null,this.verb=null,this.target=null,this.result=null,this.context=null,this.timestamp=null,this.stored=null,this.authority=null,this.version=null,this.degraded=!1,this.voided=null,this.inProgress=null,this.originalJSON=null,this.init(a,b)};a.prototype={LOG_SRC:"Statement",log:TinCan.prototype.log,init:function(a,b){this.log("init");var c,d=["id","stored","timestamp","version","inProgress","voided"];for(a=a||{},b.storeOriginal&&(this.originalJSON=JSON.stringify(a,null,b.storeOriginal)),a.hasOwnProperty("object")&&(a.target=a.object),a.hasOwnProperty("actor")&&(("undefined"==typeof a.actor.objectType||"Person"===a.actor.objectType)&&(a.actor.objectType="Agent"),"Agent"===a.actor.objectType?this.actor=a.actor instanceof TinCan.Agent?a.actor:new TinCan.Agent(a.actor):"Group"===a.actor.objectType&&(this.actor=a.actor instanceof TinCan.Group?a.actor:new TinCan.Group(a.actor))),a.hasOwnProperty("authority")&&(("undefined"==typeof a.authority.objectType||"Person"===a.authority.objectType)&&(a.authority.objectType="Agent"),"Agent"===a.authority.objectType?this.authority=a.authority instanceof TinCan.Agent?a.authority:new TinCan.Agent(a.authority):"Group"===a.authority.objectType&&(this.authority=a.actor instanceof TinCan.Group?a.authority:new TinCan.Group(a.authority))),a.hasOwnProperty("verb")&&(this.verb=a.verb instanceof TinCan.Verb?a.verb:new TinCan.Verb(a.verb)),a.hasOwnProperty("target")&&(a.target instanceof TinCan.Activity||a.target instanceof TinCan.Agent||a.target instanceof TinCan.Group||a.target instanceof TinCan.SubStatement||a.target instanceof TinCan.StatementRef?this.target=a.target:("undefined"==typeof a.target.objectType&&(a.target.objectType="Activity"),"Activity"===a.target.objectType?this.target=new TinCan.Activity(a.target):"Agent"===a.target.objectType?this.target=new TinCan.Agent(a.target):"Group"===a.target.objectType?this.target=new TinCan.Group(a.target):"SubStatement"===a.target.objectType?this.target=new TinCan.SubStatement(a.target):"StatementRef"===a.target.objectType?this.target=new TinCan.StatementRef(a.target):this.log("Unrecognized target type: "+a.target.objectType))),a.hasOwnProperty("result")&&(this.result=a.result instanceof TinCan.Result?a.result:new TinCan.Result(a.result)),a.hasOwnProperty("context")&&(this.context=a.context instanceof TinCan.Context?a.context:new TinCan.Context(a.context)),c=0;c<d.length;c+=1)a.hasOwnProperty(d[c])&&null!==a[d[c]]&&(this[d[c]]=a[d[c]]);b.doStamp&&this.stamp()},toString:function(a){return this.log("toString"),(null!==this.actor?this.actor.toString(a):"")+" "+(null!==this.verb?this.verb.toString(a):"")+" "+(null!==this.target?this.target.toString(a):"")},asVersion:function(a){this.log("asVersion");var b,c={},d=["id","timestamp"],e=["actor","verb","result","context","authority"];for(a=a||TinCan.versions()[0],b=0;b<d.length;b+=1)null!==this[d[b]]&&(c[d[b]]=this[d[b]]);for(b=0;b<e.length;b+=1)null!==this[e[b]]&&(c[e[b]]=this[e[b]].asVersion(a));return null!==this.target&&(c.object=this.target.asVersion(a)),("0.9"===a||"0.95"===a)&&null!==this.voided&&(c.voided=this.voided),"0.9"===a&&null!==this.inProgress&&(c.inProgress=this.inProgress),c},stamp:function(){this.log("stamp"),null===this.id&&(this.id=TinCan.Utils.getUUID()),null===this.timestamp&&(this.timestamp=TinCan.Utils.getISODateString(new Date))}},a.fromJSON=function(b){a.prototype.log("fromJSON");var c=JSON.parse(b);return new a(c)}}(),function(){"use strict";var a=TinCan.StatementsResult=function(a){this.log("constructor"),this.statements=null,this.more=null,this.init(a)};a.prototype={LOG_SRC:"StatementsResult",log:TinCan.prototype.log,init:function(a){this.log("init"),a=a||{},a.hasOwnProperty("statements")&&(this.statements=a.statements),a.hasOwnProperty("more")&&(this.more=a.more)}},a.fromJSON=function(b){a.prototype.log("fromJSON");var c,d,e,f=[];try{c=JSON.parse(b)}catch(g){a.prototype.log("fromJSON - JSON.parse error: "+g)}if(c){for(e=0;e<c.statements.length;e+=1){try{d=new TinCan.Statement(c.statements[e],4)}catch(h){a.prototype.log("fromJSON - statement instantiation failed: "+h+" ("+JSON.stringify(c.statements[e])+")"),d=new TinCan.Statement({id:c.statements[e].id},4)}f.push(d)}c.statements=f}return new a(c)}}(),function(){"use strict";var a=TinCan.State=function(a){this.log("constructor"),this.id=null,this.updated=null,this.contents=null,this.etag=null,this.contentType=null,this.init(a)};a.prototype={LOG_SRC:"State",log:TinCan.prototype.log,init:function(a){this.log("init");var b,c=["id","contents","etag","contentType"];for(a=a||{},b=0;b<c.length;b+=1)a.hasOwnProperty(c[b])&&null!==a[c[b]]&&(this[c[b]]=a[c[b]]);this.updated=!1}},a.fromJSON=function(b){a.prototype.log("fromJSON");var c=JSON.parse(b);return new a(c)}}(),function(){"use strict";var a=TinCan.ActivityProfile=function(a){this.log("constructor"),this.id=null,this.activity=null,this.updated=null,this.contents=null,this.etag=null,this.contentType=null,this.init(a)};a.prototype={LOG_SRC:"ActivityProfile",log:TinCan.prototype.log,init:function(a){this.log("init");var b,c=["id","contents","etag","contentType"];for(a=a||{},a.hasOwnProperty("activity")&&(this.activity=a.activity instanceof TinCan.Activity?a.activity:new TinCan.Activity(a.activity)),b=0;b<c.length;b+=1)a.hasOwnProperty(c[b])&&null!==a[c[b]]&&(this[c[b]]=a[c[b]]);this.updated=!1}},a.fromJSON=function(b){a.prototype.log("fromJSON");var c=JSON.parse(b);return new a(c)}}(),function(){"use strict";var a=TinCan.AgentProfile=function(a){this.log("constructor"),this.id=null,this.agent=null,this.updated=null,this.contents=null,this.etag=null,this.contentType=null,this.init(a)};a.prototype={LOG_SRC:"AgentProfile",log:TinCan.prototype.log,init:function(a){this.log("init");var b,c=["id","contents","etag","contentType"];for(a=a||{},a.hasOwnProperty("agent")&&(this.agent=a.agent instanceof TinCan.Agent?a.agent:new TinCan.Agent(a.agent)),b=0;b<c.length;b+=1)a.hasOwnProperty(c[b])&&null!==a[c[b]]&&(this[c[b]]=a[c[b]]);this.updated=!1}},a.fromJSON=function(b){a.prototype.log("fromJSON");var c=JSON.parse(b);return new a(c)}}(),function(){"use strict";var a=TinCan.About=function(a){this.log("constructor"),this.version=null,this.init(a)};a.prototype={LOG_SRC:"About",log:TinCan.prototype.log,init:function(a){this.log("init");var b,c=["version"];for(a=a||{},b=0;b<c.length;b+=1)a.hasOwnProperty(c[b])&&null!==a[c[b]]&&(this[c[b]]=a[c[b]])}},a.fromJSON=function(b){a.prototype.log("fromJSON");var c=JSON.parse(b);return new a(c)}}(),function(){"use strict";var LOG_SRC="Environment.Browser",nativeRequest,xdrRequest,requestComplete,__delay,__IEModeConversion,env={},log=TinCan.prototype.log;return"undefined"==typeof window?void log("'window' not defined",LOG_SRC):(window.JSON||(window.JSON={parse:function(sJSON){return eval("("+sJSON+")")},stringify:function(a){var b,c,d="";if(a instanceof Object){if(a.constructor===Array){for(b=0;b<a.length;b+=1)d+=this.stringify(a[b])+",";return"["+d.substr(0,d.length-1)+"]"}if(a.toString!==Object.prototype.toString)return'"'+a.toString().replace(/"/g,"\\$&")+'"';for(c in a)a.hasOwnProperty(c)&&(d+='"'+c.replace(/"/g,"\\$&")+'":'+this.stringify(a[c])+",");return"{"+d.substr(0,d.length-1)+"}"}return"string"==typeof a?'"'+a.replace(/"/g,"\\$&")+'"':String(a)}}),Date.now||(Date.now=function(){return+new Date}),env.hasCORS=!1,env.useXDR=!1,"undefined"!=typeof XMLHttpRequest&&"undefined"!=typeof(new XMLHttpRequest).withCredentials?env.hasCORS=!0:"undefined"!=typeof XDomainRequest&&(env.hasCORS=!0,env.useXDR=!0),requestComplete=function(a,b,c){log("requestComplete: "+c.finished+", xhr.status: "+a.status,LOG_SRC);var d,e,f;return f="undefined"==typeof a.status?c.fakeStatus:1223===a.status?204:a.status,c.finished?d:(c.finished=!0,e=b.ignore404&&404===f,f>=200&&400>f||e?b.callback?void b.callback(null,a):d={err:null,xhr:a}:(d={err:f,xhr:a},0===f?log("[warning] There was a problem communicating with the Learning Record Store. Aborted, offline, or invalid CORS endpoint ("+f+")",LOG_SRC):log("[warning] There was a problem communicating with the Learning Record Store. ("+f+" | "+a.responseText+")",LOG_SRC),b.callback&&b.callback(f,a),d))},__IEModeConversion=function(a,b,c,d){var e;for(e in b)b.hasOwnProperty(e)&&c.push(e+"="+encodeURIComponent(b[e]));return"undefined"!=typeof d.data&&c.push("content="+encodeURIComponent(d.data)),b["Content-Type"]="application/x-www-form-urlencoded",a+="?method="+d.method,d.method="POST",d.params={},c.length>0&&(d.data=c.join("&")),a
},nativeRequest=function(a,b,c){log("sendRequest using XMLHttpRequest",LOG_SRC);var d,e,f,g,h=this,i=[],j={finished:!1,fakeStatus:null},k="undefined"!=typeof c.callback,l=a,m=2048;log("sendRequest using XMLHttpRequest - async: "+k,LOG_SRC);for(e in c.params)c.params.hasOwnProperty(e)&&i.push(e+"="+encodeURIComponent(c.params[e]));if(i.length>0&&(l+="?"+i.join("&")),l.length>=m){if("undefined"!=typeof b["Content-Type"]&&"application/json"!==b["Content-Type"])return g=new Error("Unsupported content type for IE Mode request"),"undefined"!=typeof c.callback&&c.callback(g,null),{err:g,xhr:null};if("undefined"==typeof c.method)return g=new Error("method must not be undefined for an IE Mode Request conversion"),"undefined"!=typeof c.callback&&c.callback(g,null),{err:g,xhr:null};a=__IEModeConversion(a,b,i,c)}else a=l;d="undefined"!=typeof XMLHttpRequest?new XMLHttpRequest:new ActiveXObject("Microsoft.XMLHTTP"),d.open(c.method,a,k);for(e in b)b.hasOwnProperty(e)&&d.setRequestHeader(e,b[e]);"undefined"!=typeof c.data&&(c.data+=""),f=c.data,k&&(d.onreadystatechange=function(){log("xhr.onreadystatechange - xhr.readyState: "+d.readyState,LOG_SRC),4===d.readyState&&requestComplete.call(h,d,c,j)});try{d.send(f)}catch(n){log("sendRequest caught send exception: "+n,LOG_SRC)}return k?d:requestComplete.call(this,d,c,j)},xdrRequest=function(a,b,c){log("sendRequest using XDomainRequest",LOG_SRC);var d,e,f,g,h,i=this,j=[],k={finished:!1,fakeStatus:null};if("undefined"!=typeof b["Content-Type"]&&"application/json"!==b["Content-Type"])return h=new Error("Unsupported content type for IE Mode request"),c.callback?(c.callback(h,null),null):{err:h,xhr:null};a+="?method="+c.method;for(f in c.params)c.params.hasOwnProperty(f)&&j.push(f+"="+encodeURIComponent(c.params[f]));for(f in b)b.hasOwnProperty(f)&&j.push(f+"="+encodeURIComponent(b[f]));"undefined"!=typeof c.data&&j.push("content="+encodeURIComponent(c.data)),e=j.join("&"),d=new XDomainRequest,d.open("POST",a),c.callback?(d.onload=function(){k.fakeStatus=200,requestComplete.call(i,d,c,k)},d.onerror=function(){k.fakeStatus=400,requestComplete.call(i,d,c,k)},d.ontimeout=function(){k.fakeStatus=0,requestComplete.call(i,d,c,k)}):(d.onload=function(){k.fakeStatus=200},d.onerror=function(){k.fakeStatus=400},d.ontimeout=function(){k.fakeStatus=0}),d.onprogress=function(){},d.timeout=0;try{d.send(e)}catch(l){log("sendRequest caught send exception: "+l,LOG_SRC)}if(!c.callback){for(g=1e4+Date.now(),log("sendRequest - until: "+g+", finished: "+k.finished,LOG_SRC);Date.now()<g&&null===k.fakeStatus;)__delay();return requestComplete.call(i,d,c,k)}return d},TinCan.LRS.prototype._initByEnvironment=function(a){log("_initByEnvironment",LOG_SRC);var b,c,d,e;if(a=a||{},this._makeRequest=nativeRequest,this._IEModeConversion=__IEModeConversion,b=this.endpoint.toLowerCase().match(/([A-Za-z]+:)\/\/([^:\/]+):?(\d+)?(\/.*)?$/),null===b)throw log("[error] LRS invalid: failed to divide URL parts",LOG_SRC),{code:4,mesg:"LRS invalid: failed to divide URL parts"};if(d=location.port,c=location.protocol.toLowerCase()===b[1],""===d&&(d="http:"===location.protocol.toLowerCase()?"80":"https:"===location.protocol.toLowerCase()?"443":""),e=!c||location.hostname.toLowerCase()!==b[2]||d!==(null!==b[3]&&"undefined"!=typeof b[3]&&""!==b[3]?b[3]:"http:"===b[1]?"80":"https:"===b[1]?"443":""))if(env.hasCORS){if(env.useXDR&&c)this._makeRequest=xdrRequest;else if(env.useXDR&&!c){if(!a.allowFail)throw log("[error] LRS invalid: cross domain request for differing scheme in IE with XDR",LOG_SRC),{code:2,mesg:"LRS invalid: cross domain request for differing scheme in IE with XDR"};log("[warning] LRS invalid: cross domain request for differing scheme in IE with XDR (allowed to fail)",LOG_SRC)}}else{if(!a.allowFail)throw log("[error] LRS invalid: cross domain requests not supported in this browser",LOG_SRC),{code:1,mesg:"LRS invalid: cross domain requests not supported in this browser"};log("[warning] LRS invalid: cross domain requests not supported in this browser (allowed to fail)",LOG_SRC)}},__delay=function(){var a=new XMLHttpRequest,b=window.location+"?forcenocache="+TinCan.Utils.getUUID();a.open("GET",b,!1),a.send(null)},void(TinCan.LRS.syncEnabled=!0))}();
//# sourceMappingURL=tincan-min.map

//
//translate
//
function Translate(Owner, DataNode, Done, Auth, Authorization) {
    var _this = this;
    this.Done = Done;
    this.loading = 0;
    this.Owner = Owner;
    this.DataNode = DataNode;
    this.Auth = Auth;
    if (this.Auth != null) this.Auth = this.Auth.data;
    this.Authorization = Authorization;

    this.CloseQuery = function (Done) {
        if (Done != null) Done();
    }

    this.contentLayer = Owner;
    this.contentLayer.innerHTML = '';

    var prefLang = system.GetDataNode(session.UserData, "Language", 0);
    if (prefLang == 0) prefLang = system.GetDataNode(system.CustomerData, "DefaultLanguage", prefLang);
    var languages = system.KnownNodesByType(453);



    this.title = html.createElement(this.contentLayer, "H1");
    this.title.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Title");

    //Export
    this.title1 = html.createElement(this.contentLayer, "H2");
    this.title1.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Title_Export").replace('{0}', system.GetKnownNodeName(this.DataNode));
    var l = html.createElement(this.contentLayer, "DIV");
    l.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Source");
    this.sourceLanguage = html.createElement(this.contentLayer, "SELECT");
    for (var i in languages) {
        var l = languages[i];
        var option = html.createElement(this.sourceLanguage, "OPTION");
        option.text = system.GetDataText(l.data, "FullName", l.name, false);
        option.value = l.id.toString();
    }

    var option = html.createElement(this.sourceLanguage, "OPTION");
    option.text = system.GetCustomerConfigText("UI/Portal/TXT_General_Default");
    option.value = 0;
    this.sourceLanguage.value = prefLang.toString();
    var l = html.createElement(this.contentLayer, "DIV");
    l.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Target");
    this.targetChecks = {};
    for (var i in languages) {
        var l = languages[i];
        this.targetChecks[l.id.toString()] = html.createElement(this.contentLayer, "INPUT");
        this.targetChecks[l.id.toString()].type = "checkbox";
        this.targetChecks[l.id.toString()].value = l.id.toString();
        var label = html.createElement(this.contentLayer, "SPAN");
        label.innerHTML = system.GetDataText(l.data, "FullName", l.name, false);
        html.createElement(this.contentLayer, "BR");
    }
    html.createElement(this.contentLayer, "BR");

    this.checkXLIFFFormat = html.createElement(this.contentLayer, "INPUT");
    this.checkXLIFFFormat.type = "checkbox";
    this.checkXLIFFFormat.value = "TXT";
    this.checkXLIFFFormat.checked = false;
    html.createElement(this.contentLayer, 'SPAN').innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Trans_XLIFFFormat");
    html.createElement(this.contentLayer, "BR");

    this.exportButton = html.createElement(this.contentLayer, "INPUT");
    this.exportButton.type = 'button';
    this.exportButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Export");
    this.exportButton.onclick = function () {
        var output = '';
        for (var i in _this.targetChecks) {
            if (_this.targetChecks[i].checked) {
                if (output != '') output = output + ',';
                output = output + _this.targetChecks[i].value;
            }
        }
        system.doRequest({ "RequestType": 303, "SessionGuid": session.SessionGuid, "SubjectID": _this.DataNode, "ExportType": 1, "SourceLanguage": ExtractNumber(_this.sourceLanguage.value), "TargetLanguage": output, "XLIFF": _this.checkXLIFFFormat.checked?1:0 }, function (response, completed) {
            session.Portal.Controls.ShowExports();
        });
    }


    //Import
    this.title2 = html.createElement(this.contentLayer, "H2");
    this.title2.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Title_Import");
    this.EditFileInput = html.createElement(this.contentLayer, "INPUT");
    this.EditFileInput.type = "FILE";
    this.fileHandler = function (e) {
        e.stopPropagation();
        e.preventDefault();
        if (typeof (FileReader) != "undefined") {
            var files = e.target.files || e.dataTransfer.files;
            if (files.length < 1) return;
            var reader = new FileReader();
            reader.onerror = function (event) {

            }
            reader.onload = function (event) {
                _this.data = event.target.result;

                _this.importButton.disabled = false;
            };
            _this.selFile = files[0];
            reader.readAsText(files[0]);
        }
    }
    addEvent(this.EditFileInput,"change", this.fileHandler);


    this.importButton = html.createElement(this.contentLayer, "INPUT");
    this.importButton.type = 'button';
    this.importButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Import");
    this.importButton.disabled = true;
    this.importButton.onclick = function () {
        
        if (_this.data == '') return;
        _this.importButton.disabled = true;
        var d = _this.data;
        _this.data = '';
        system.doRequest({ "RequestType": 304, "SessionGuid": session.SessionGuid, "SubjectID": _this.DataNode, "ImportType": 1, "Data": d, "Filename": _this.selFile.name }, function (response, completed) {
            alert(system.GetCustomerConfigText("UI/Portal/TXT_Trans_Done"));
            _this.importButton.disabled = false;
        });
    }

    //Remove
    this.title3 = html.createElement(this.contentLayer, "H2");
    this.title3.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Title_Remove").replace('{0}', system.GetKnownNodeName(this.DataNode));

    this.checkRMResource = html.createElement(this.contentLayer, "INPUT");
    this.checkRMResource.type = "checkbox";
    this.checkRMResource.value = "TXT";
    this.checkRMResource.checked = true;
    html.createElement(this.contentLayer, 'SPAN').innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Resources");
    html.createElement(this.contentLayer, "BR");
    this.checkRMText = html.createElement(this.contentLayer, "INPUT");
    this.checkRMText.type = "checkbox";
    this.checkRMText.value = "IMG";
    this.checkRMText.checked = true;
    html.createElement(this.contentLayer, 'SPAN').innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Text");
    html.createElement(this.contentLayer, "BR");



    var l = html.createElement(this.contentLayer, "DIV");
    l.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Language");
    this.removeChecks = {};
    for (var i in languages) {
        var l = languages[i];
        this.removeChecks[l.id.toString()] = html.createElement(this.contentLayer, "INPUT");
        this.removeChecks[l.id.toString()].type = "checkbox";
        this.removeChecks[l.id.toString()].value = l.id.toString();
        var label = html.createElement(this.contentLayer, "SPAN");
        label.innerHTML = system.GetDataText(l.data, "FullName", l.name, false);
        html.createElement(this.contentLayer, "BR");
    }
    this.removeChecks["0"] = html.createElement(this.contentLayer, "INPUT");
    this.removeChecks["0"].type = "checkbox";
    this.removeChecks["0"].value = "0";
    var label = html.createElement(this.contentLayer, "SPAN");
    label.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_General_Default");
    html.createElement(this.contentLayer, "BR");


    this.removeButton = html.createElement(this.contentLayer, "INPUT");
    this.removeButton.type = 'button';
    this.removeButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Remove");
    this.removeButton.onclick = function () {
        _this.removeButton.disabled = true;
        var output = '';
        for (var i in _this.removeChecks) {
            if (_this.removeChecks[i].checked) {
                if (output != '') output = output + ',';
                output = output + _this.removeChecks[i].value;
            }
        }
        system.doRequest({ "RequestType": 305, "SessionGuid": session.SessionGuid, "SubjectID": _this.DataNode, "LanguageType": 1, "TargetLanguage": output, "OptionResources": _this.checkRMResource.checked, "OptionText": _this.checkRMText.checked }, function (response, completed) {
            alert(system.GetCustomerConfigText("UI/Portal/TXT_Trans_Done"));
            _this.removeButton.disabled = false;
        });
    }


    //Copy
    this.title4 = html.createElement(this.contentLayer, "H2");
    this.title4.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Title_Copy").replace('{0}', system.GetKnownNodeName(this.DataNode));

    this.checkCPResource = html.createElement(this.contentLayer, "INPUT");
    this.checkCPResource.type = "checkbox";
    this.checkCPResource.value = "TXT";
    this.checkCPResource.checked = true;
    html.createElement(this.contentLayer, 'SPAN').innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Resources");
    html.createElement(this.contentLayer, "BR");
    this.checkCPText = html.createElement(this.contentLayer, "INPUT");
    this.checkCPText.type = "checkbox";
    this.checkCPText.value = "IMG";
    this.checkCPText.checked = true;
    html.createElement(this.contentLayer, 'SPAN').innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Text");
    html.createElement(this.contentLayer, "BR");
    this.checkCPOverwrite = html.createElement(this.contentLayer, "INPUT");
    this.checkCPOverwrite.type = "checkbox";
    this.checkCPOverwrite.value = "TXT";
    this.checkCPOverwrite.checked = true;
    html.createElement(this.contentLayer, 'SPAN').innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Overwrite");
    html.createElement(this.contentLayer, "BR");
    this.checkCPRemove = html.createElement(this.contentLayer, "INPUT");
    this.checkCPRemove.type = "checkbox";
    this.checkCPRemove.value = "IMG";
    this.checkCPRemove.checked = true;
    html.createElement(this.contentLayer, 'SPAN').innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Trans_RemoveSource");
    html.createElement(this.contentLayer, "BR");


    var l = html.createElement(this.contentLayer, "DIV");
    l.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Source");
    this.sourceLanguageCP = html.createElement(this.contentLayer, "SELECT");
    for (var i in languages) {
        var l = languages[i];
        var option = html.createElement(this.sourceLanguageCP, "OPTION");
        option.text = system.GetDataText(l.data, "FullName", l.name, false);
        option.value = l.id.toString();
    }
    var option = html.createElement(this.sourceLanguageCP, "OPTION");
    option.text = system.GetCustomerConfigText("UI/Portal/TXT_General_Default");
    option.value = 0;

    this.sourceLanguageCP.value = prefLang.toString();
    var l = html.createElement(this.contentLayer, "DIV");
    l.innerHTML = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Target");
    this.targetLanguageCP = html.createElement(this.contentLayer, "SELECT");
    for (var i in languages) {
        var l = languages[i];
        var option = html.createElement(this.targetLanguageCP, "OPTION");
        option.text = system.GetDataText(l.data, "FullName", l.name, false);
        option.value = l.id.toString();
    }
    var option = html.createElement(this.targetLanguageCP, "OPTION");
    option.text = system.GetCustomerConfigText("UI/Portal/TXT_General_Default");
    option.value = 0;

    this.targetLanguageCP.value = prefLang.toString();

    html.createElement(this.contentLayer, "BR");
    this.copyButton = html.createElement(this.contentLayer, "INPUT");
    this.copyButton.type = 'button';
    this.copyButton.value = system.GetCustomerConfigText("UI/Portal/TXT_Trans_Copy");
    this.copyButton.onclick = function () {
        _this.copyButton.disabled = true;

        system.doRequest({ "RequestType": 305, "SessionGuid": session.SessionGuid, "SubjectID": _this.DataNode, "LanguageType": 2, "SourceLanguage": _this.sourceLanguageCP.value, "TargetLanguage": _this.targetLanguageCP.value, "OptionResources": _this.checkCPResource.checked, "OptionText": _this.checkCPText.checked, "OptionOverwrite": _this.checkCPOverwrite.checked, "OptionRemove": _this.checkCPRemove.checked }, function (response, completed) {
            alert(system.GetCustomerConfigText("UI/Portal/TXT_Trans_Done"));
            _this.copyButton.disabled = false;
        });
    }



    this.data = '';
}

//
//user
//
function User(Owner, DataNode, Done, Edit) {

    var User_Root = 152;
    system.propertytypes[User_Root] =
    {
        "Password": { "NodeID": 164 },
        "ProfileImage": { "NodeID": 165 },
        "Skin": { "NodeID": 167 }
    }

    new Data(Owner, DataNode, Done, Edit, system.propertytypes[User_Root]);
}



lang = 457;
var datanodeid = 28797;
var langcodes={"456":"en","457":"nl","458":"fr","1044":"de","2013":"it","2014":"es","2015":"pl","2016":"cs","2017":"tr","2018":"ru","2019":"ro","2020":"pt-BR","2021":"pt","2022":"hu","10293":"gr","4478":"en-GB","6247":"fi","6248":"sv","6249":"no","6267":"pap","6730":"da","6731":"de-CH","9773":"zh","10292":"hr","10294":"ua","10295":"sk","10296":"bg","10297":"hy","10298":"lv","10299":"sl","14077":"ja","10300":"sr","10301":"mk","10302":"lt","10303":"sq","11545":"nl-BE","11546":"fr-BE","12881":"bs","12882":"et","17616":"ko","18755":"ar","19806":"th"}
var testSettings={};
