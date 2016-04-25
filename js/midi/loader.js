/**
 * Created by chie on 2016/2/26.
 */
var loadMidiFile = function (midiFile, callback) {

    readBlobAsDataURL(midiFile, function (dataurl) {
        loadMidiFile.midiTracks = new MIDI(dataurl);
        loadMidiFile.midiTracks.intoTracks();
        loadMidiFile.midiTracks.intoTemporal();
        callback(loadMidiFile.midiTracks);
    });

    function readBlobAsDataURL(file, callback) {
        var a = new FileReader();
        a.readAsDataURL(file);
        a.onloadend = function (e) {
            callback(e.target.result);
        };
    }

    /*
     dataurl = atob(dataurl.split(',')[1]);
     var n = dataurl.length, buffer = new ArrayBuffer(n), u8arr = [];
     while (n--) {
     u8arr[n] = dataurl.charCodeAt(n);
     }

     var stream = Stream(u8arr);
     console.log(stream.readWord(4))
     var headerStream = Stream(stream.read(stream.readInt32()));
     var header = {}
     header.formatType = headerStream.readInt16();
     header.trackCount = headerStream.readInt16();
     header.ticksPerBeat = headerStream.readInt16();

     //分轨
     var tracks = [];
     for (var i = 0; i < header.trackCount; i++) {
     tracks[i] = [];
     console.log(stream.readWord(4))
     var trackStream = Stream(stream.read(stream.readInt32()));
     while (!trackStream.eof()) {
     var event = readEvent(trackStream);
     tracks[i].push(event);
     }
     }
     //合轨
     MIDI.temporal = [];
     var beatsPerMinute = 120;
     var currentTime = 0;
     var currentDeltaTime = 0;
     var minTime = {
     trackId: 0,
     deltaTime: Infinity
     };
     var tracksCurrentState = []
     for (var i = 0; i < tracks.length; i++) {
     tracksCurrentState[i] = {
     position: 0,
     deltaTime: 0
     };
     }
     while (1) {
     minTime.deltaTime = Infinity;
     for (var i = 0; i < tracks.length; i++) {
     if (tracks[i][tracksCurrentState[i].position] && tracks[i][tracksCurrentState[i].position].deltaTime + tracksCurrentState[i].deltaTime < minTime.deltaTime) {
     minTime.trackId = i;
     minTime.deltaTime = tracks[i][tracksCurrentState[i].position].deltaTime + tracksCurrentState[i].deltaTime;
     }
     }
     if (minTime.deltaTime != Infinity) {
     var nextEvent = tracks[minTime.trackId][tracksCurrentState[minTime.trackId].position];
     MIDI.temporal.push([nextEvent, currentTime += (minTime.deltaTime - currentDeltaTime) / header.ticksPerBeat / (beatsPerMinute / 60)]);
     tracksCurrentState[minTime.trackId].position++;
     tracksCurrentState[minTime.trackId].deltaTime = minTime.deltaTime;
     currentDeltaTime = tracksCurrentState[minTime.trackId].deltaTime;
     if (nextEvent.type == "meta" && nextEvent.subtype == "setTempo") {
     beatsPerMinute = 60000000 / nextEvent.microsecondsPerBeat
     }
     } else break;
     }
     console.log(MIDI.temporal);

     MIDI.animatearray = [];
     MIDI.sevenkey = [];
     MIDI.currentSevenKeyPosition = {now: 0, badkey: [0, 0], goodkey: [0, 0], misskey: [0, 0]};
     MIDI.grade = {great: 0, good: 0, bad: 0, miss: 0, combo: 0}
     var asdf = [0, 1, 2, 3, 4, 5, 6];
     var currentNoteTime = [-9999, -9999, -9999, -9999, -9999, -9999, -9999];
     var badTime = 200;
     var maxTime;
     MIDI.temporal.forEach(function (a) {
     var time = a[1] * 1000;
     if (a[0].subtype == 'noteOn') {
     MIDI.animatearray.push({
     isbegin: true,
     time: time,
     note: a[0].noteNumber,
     velocity: a[0].velocity
     });
     } else if (a[0].subtype == 'noteOff') {
     MIDI.animatearray.push({
     isbegin: false,
     time: time,
     note: a[0].noteNumber,
     velocity: a[0].velocity
     });
     }
     })
     MIDI.animatearray.forEach(function (a) {
     if (a.isbegin == true) {
     var b = Math.floor(7 * Math.random())
     if (a.time - currentNoteTime[b] >= badTime) {
     MIDI.sevenkey.push({time: a.time, note: b, state: 6, show: true});
     currentNoteTime[b] = a.time;
     }
     else {
     maxTime = [a.time - currentNoteTime[b], b];
     asdf.sort(function (e, f) {
     return Math.random() - 0.5;
     });
     if (asdf.every(function (c) {
     if (c != b && a.time - currentNoteTime[c] >= badTime) {
     MIDI.sevenkey.push({time: a.time, note: c, state: 6, show: true})
     currentNoteTime[c] = a.time;
     return false;
     } else {
     var d = a.time - currentNoteTime[c]
     if (d > maxTime[0]) maxTime = [a.time - currentNoteTime[c], c];
     return true;
     }
     })) {
     MIDI.sevenkey.push({time: a.time, note: maxTime[1], state: 6, show: true})
     currentNoteTime[maxTime[1]] = a.time;
     }
     }
     }
     })
     callback();

     var lastEventTypeByte;

     function readEvent(stream) {
     var event = {};
     event.deltaTime = stream.readVarInt();
     var eventTypeByte = stream.readInt8();
     if ((eventTypeByte & 0xf0) == 0xf0) {
     if (eventTypeByte == 0xff) {
     event.type = 'meta';
     var subtypeByte = stream.readInt8();
     var length = stream.readVarInt();
     switch (subtypeByte) {
     case 0x00:
     event.subtype = 'sequenceNumber';
     if (length != 2) throw "Expected length for sequenceNumber event is 2, got " + length;
     event.number = stream.readInt16();
     return event;
     case 0x01:
     event.subtype = 'text';
     event.text = stream.read(length);
     return event;
     case 0x02:
     event.subtype = 'copyrightNotice';
     event.text = stream.read(length);
     return event;
     case 0x03:
     event.subtype = 'trackName';
     event.text = stream.read(length);
     return event;
     case 0x04:
     event.subtype = 'instrumentName';
     event.text = stream.read(length);
     return event;
     case 0x05:
     event.subtype = 'lyrics';
     event.text = stream.read(length);
     return event;
     case 0x06:
     event.subtype = 'marker';
     event.text = stream.read(length);
     return event;
     case 0x07:
     event.subtype = 'cuePoint';
     event.text = stream.read(length);
     return event;
     case 0x20:
     event.subtype = 'midiChannelPrefix';
     if (length != 1) throw "Expected length for midiChannelPrefix event is 1, got " + length;
     event.channel = stream.readInt8();
     return event;
     case 0x2f:
     event.subtype = 'endOfTrack';
     if (length != 0) throw "Expected length for endOfTrack event is 0, got " + length;
     return event;
     case 0x51:
     event.subtype = 'setTempo';
     if (length != 3) throw "Expected length for setTempo event is 3, got " + length;
     event.microsecondsPerBeat = (
     (stream.readInt8() << 16)
     + (stream.readInt8() << 8)
     + stream.readInt8()
     )
     return event;
     case 0x54:
     event.subtype = 'smpteOffset';
     if (length != 5) throw "Expected length for smpteOffset event is 5, got " + length;
     var hourByte = stream.readInt8();
     event.frameRate = {
     0x00: 24, 0x20: 25, 0x40: 29, 0x60: 30
     }[hourByte & 0x60];
     event.hour = hourByte & 0x1f;
     event.min = stream.readInt8();
     event.sec = stream.readInt8();
     event.frame = stream.readInt8();
     event.subframe = stream.readInt8();
     return event;
     case 0x58:
     event.subtype = 'timeSignature';
     if (length != 4) throw "Expected length for timeSignature event is 4, got " + length;
     event.numerator = stream.readInt8();
     event.denominator = Math.pow(2, stream.readInt8());
     event.metronome = stream.readInt8();
     event.thirtyseconds = stream.readInt8();
     return event;
     case 0x59:
     event.subtype = 'keySignature';
     if (length != 2) throw "Expected length for keySignature event is 2, got " + length;
     event.key = stream.readInt8(true);
     event.scale = stream.readInt8();
     return event;
     case 0x7f:
     event.subtype = 'sequencerSpecific';
     event.data = stream.read(length);
     return event;
     default:
     // console.log("Unrecognised meta event subtype: " + subtypeByte);
     event.subtype = 'unknown'
     event.data = stream.read(length);
     return event;
     }
     event.data = stream.read(length);
     return event;
     } else if (eventTypeByte == 0xf0) {
     event.type = 'sysEx';
     var length = stream.readVarInt();
     event.data = stream.read(length);
     return event;
     } else if (eventTypeByte == 0xf7) {
     event.type = 'dividedSysEx';
     var length = stream.readVarInt();
     event.data = stream.read(length);
     return event;
     } else {
     throw "Unrecognised MIDI event type byte: " + eventTypeByte;
     }
     } else {
     var param1;
     if ((eventTypeByte & 0x80) == 0) {

     param1 = eventTypeByte;
     eventTypeByte = lastEventTypeByte;
     } else {
     param1 = stream.readInt8();
     lastEventTypeByte = eventTypeByte;
     }
     var eventType = eventTypeByte >> 4;
     event.channel = eventTypeByte & 0x0f;
     event.type = 'channel';
     switch (eventType) {
     case 0x08:
     event.subtype = 'noteOff';
     event.noteNumber = param1;
     event.velocity = stream.readInt8();
     return event;
     case 0x09:
     event.noteNumber = param1;
     event.velocity = stream.readInt8();
     if (event.velocity == 0) {
     event.subtype = 'noteOff';
     } else {
     event.subtype = 'noteOn';
     }
     return event;
     case 0x0a:
     event.subtype = 'noteAftertouch';
     event.noteNumber = param1;
     event.amount = stream.readInt8();
     return event;
     case 0x0b:
     event.subtype = 'controller';
     event.controllerType = param1;
     event.value = stream.readInt8();
     return event;
     case 0x0c:
     event.subtype = 'programChange';
     event.programNumber = param1;
     return event;
     case 0x0d:
     event.subtype = 'channelAftertouch';
     event.amount = param1;
     return event;
     case 0x0e:
     event.subtype = 'pitchBend';
     event.value = param1 + (stream.readInt8() << 7);
     return event;
     default:
     throw "Unrecognised MIDI event type: " + eventType
     }
     }
     }
     */
};

loadMidiFile.midiTracks={};