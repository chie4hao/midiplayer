/**
 * Created by chie on 2016/4/25.
 */


const Stream=require('./stream');

const MIDI = function (dataurl) {
    this.midiDataurl = dataurl;
    this.header={};
    this.tracks = [];
    this.temporal = [];
    this.beatsPerMinute = 120;
}

MIDI.prototype = {
    //转为多轨序列
    intoTracks: function () {
        if (!this.midiDataurl) {
            throw 'midiDateurl is null'
        }
        let dataurl = atob(this.midiDataurl.split(',')[1]);
        let n = dataurl.length, u8arr = [];
        while (n--) {
            u8arr[n] = dataurl.charCodeAt(n);
        }
        /*
         let n = dataurl.length;
         let array16 = [];
         while (n--) {
         array16[n] = u8arr[n].toString(16);
         }
         */
        let stream = Stream(u8arr);
        console.log(stream.readWord(4))
        let headerStream = Stream(stream.read(stream.readInt32()));
        this.header.formatType = headerStream.readInt16();
        this.header.trackCount = headerStream.readInt16();
        this.header.ticksPerBeat = headerStream.readInt16();

        //分轨
        for (let i = 0; i < this.header.trackCount; i++) {
            this.tracks[i] = [];
            console.log(stream.readWord(4))
            let trackStream = Stream(stream.read(stream.readInt32()));
            while (!trackStream.eof()) {
                let event = readEvent(trackStream);
                this.tracks[i].push(event);
            }
        }
    },
    //转为单轨序列
    intoTemporal: function () {
        let currentTime = 0;
        let currentDeltaTime = 0;
        let minTime = {
            trackId: 0,
            deltaTime: Infinity
        };
        let tracksCurrentState = []
        for (let i = 0; i < this.tracks.length; i++) {
            tracksCurrentState[i] = {
                position: 0,
                deltaTime: 0
            };
        }
        while (1) {
            minTime.deltaTime = Infinity;
            for (let i = 0; i < this.tracks.length; i++) {
                if (this.tracks[i][tracksCurrentState[i].position] && this.tracks[i][tracksCurrentState[i].position].deltaTime + tracksCurrentState[i].deltaTime < minTime.deltaTime) {
                    minTime.trackId = i;
                    minTime.deltaTime = this.tracks[i][tracksCurrentState[i].position].deltaTime + tracksCurrentState[i].deltaTime;
                }
            }
            if (minTime.deltaTime != Infinity) {
                let nextEvent = this.tracks[minTime.trackId][tracksCurrentState[minTime.trackId].position];
                this.temporal.push([nextEvent, currentTime += (minTime.deltaTime - currentDeltaTime) / this.header.ticksPerBeat / (this.beatsPerMinute / 60)]);
                tracksCurrentState[minTime.trackId].position++;
                tracksCurrentState[minTime.trackId].deltaTime = minTime.deltaTime;
                currentDeltaTime = tracksCurrentState[minTime.trackId].deltaTime;
                if (nextEvent.type == "meta" && nextEvent.subtype == "setTempo") {
                    this.beatsPerMinute = 60000000 / nextEvent.microsecondsPerBeat
                }
            } else break;
        }
    }
};


let lastEventTypeByte;

const readEvent = function (stream) {
    let event = {};
    event.deltaTime = stream.readVarInt();
    let eventTypeByte = stream.readInt8();
    if ((eventTypeByte & 0xf0) == 0xf0) {
        /* system / meta event */
        if (eventTypeByte == 0xff) {
            /* meta event */
            event.type = 'meta';
            let subtypeByte = stream.readInt8();
            let length = stream.readVarInt();
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
                    let hourByte = stream.readInt8();
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
            let length = stream.readVarInt();
            event.data = stream.read(length);
            return event;
        } else if (eventTypeByte == 0xf7) {
            event.type = 'dividedSysEx';
            let length = stream.readVarInt();
            event.data = stream.read(length);
            return event;
        } else {
            throw "Unrecognised MIDI event type byte: " + eventTypeByte;
        }
    } else {
        /* channel event */
        let param1;
        if ((eventTypeByte & 0x80) == 0) {

            param1 = eventTypeByte;
            eventTypeByte = lastEventTypeByte;
        } else {
            param1 = stream.readInt8();
            lastEventTypeByte = eventTypeByte;
        }
        let eventType = eventTypeByte >> 4;
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

module.exports=MIDI;