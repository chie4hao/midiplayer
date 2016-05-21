/**
 * Created by chie on 2016/4/25.
 */

var MIDISoundFont=require('../soundfont/acoustic_grand_piano-mp3.js');

var MIDIPlayer = function (midiTracks) {
    this.temporal = midiTracks.temporal;
    this.playTime = ctx.currentTime;
    this.beginTime = this.playTime;
    this.masterVolume = 127;
    this.sources = {};
    MIDIPlayer.currentPlayer.push(this);
}

MIDIPlayer.prototype.sendSignal = function (x, y) {
    y = y || 5;
    var current = this;
    for (var i = x; i < this.temporal.length && i < x + y; i++) {
        switch (this.temporal[i][0].subtype) {
            case 'noteOn':
                this.noteOn('acoustic_grand_piano', this.temporal[i][0].noteNumber, this.temporal[i][0].velocity, this.temporal[i][1])
                break;
            case 'noteOff':
                this.noteOff('acoustic_grand_piano', this.temporal[i][0].noteNumber, this.temporal[i][1]);
                break;
        }
    }

    if ((x + y) < this.temporal.length) {
        var time = (this.temporal[(x + y)][1] - ctx.currentTime + this.beginTime) * 1000 - 500;
        this.currentTimeout = setTimeout(function () {
            current.playTime = ctx.currentTime;
            current.sendSignal(x + y, y);
        }, time);
    }
}

MIDIPlayer.prototype.noteOn = function (instrument, noteId, velocity, delay) {
    var source = ctx.createBufferSource();
    source.buffer = audioBuffers[instrument + ' ' + noteId];
    var ouput = ctx.createGain();
    ouput.connect(ctx.destination);
    ouput.gain.value = Math.min(1.0, Math.max(-1.0, (velocity / 127) * (this.masterVolume / 127)));
    source.gain = ouput;
    source.connect(ouput);
    //此处可添加音频效果器
    /*
     var feedbackNode = ctx.createGain();
     feedbackNode.gain.value = 1;

     var filter = ctx.createBiquadFilter();
     filter.frequency.value = 1000;

     var delayNode = ctx.createDelay();
     delayNode.delayTime.value = 0.15;

     delayNode.connect(filter);
     filter.connect(feedbackNode)

     source.connect(delayNode);

     feedbackNode.connect(ouput);
     */
    delay = delay - ctx.currentTime + this.playTime + this.beginTime
    source.start(delay);
    this.sources[noteId] = source;
};

MIDIPlayer.prototype.noteOff = function (instrument, noteId, delay) {
    var buffer = audioBuffers[instrument + ' ' + noteId];
    if (buffer) {
        var source = this.sources[noteId];
        if (source) {
            delay = delay - ctx.currentTime + this.playTime + this.beginTime

            if (source.gain) {
                var gain = source.gain.gain;
                gain.linearRampToValueAtTime(gain.value, delay);
                gain.linearRampToValueAtTime(0, delay + 0.3);
            }
            delete this.sources[noteId];
            return source;
        }
    }
}

MIDIPlayer.prototype.stopAllNotes = function () {
    for (var a in this.sources) {
        console.log(this.sources)
        console.log(a)
        var source = this.sources[a];
        if (source && source.gain) {
            var gain = source.gain.gain;
            gain.linearRampToValueAtTime(gain.value, 0);
            gain.linearRampToValueAtTime(0, 0 + 0.3);
            delete source;
        }
    }
}

MIDIPlayer.currentPlayer = [];

MIDIPlayer.clearPlayer = function () {
    MIDIPlayer.currentPlayer.forEach(function (a) {
        clearTimeout(a.currentTimeout)
        //静音
        a.stopAllNotes();
    });
    MIDIPlayer.currentPlayer = [];
}

global.ctx = new window.AudioContext();
var soundFont;
var audioBuffers = {};
var soundFontLength, decodeLength;
var keyToNote = {}; // C8  == 108
var noteToKey = {}; // 108 ==  C8
(function () {
    var A0 = 0x15; // first note
    var C8 = 0x6C; // last note
    var number2key = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    for (var n = A0; n <= C8; n++) {
        var octave = (n - 12) / 12 >> 0;
        var name = number2key[n % 12] + octave;
        keyToNote[name] = n;
        noteToKey[n] = name;
    }
})();
MIDIPlayer.loadSondFont=function(instrument, callback) {
    decodeLength = 0;
    soundFont = MIDISoundFont[instrument]
    soundFontLength = Object.keys(soundFont).length;
    for (var index in soundFont) {
        loadAudio(instrument, index, callback);
    }
}
function loadAudio(instrument, index, callback) {
    var bstr = atob(soundFont[index].split(',')[1]), n = bstr.length, buffer = new ArrayBuffer(n), u8arr = new Uint8Array(buffer);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    ctx.decodeAudioData(buffer, function (buffer1) {
        buffer1.id = keyToNote[index]
        if (buffer1.id) {
            audioBuffers[instrument + ' ' + buffer1.id] = buffer1;
        }
        if (++decodeLength === soundFontLength) {
            console.log("finish")
            callback();
        }
    })
}

module.exports=MIDIPlayer;