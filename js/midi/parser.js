/**
 * Created by chie on 2016/2/25.
 */


var ctx = new window.AudioContext();
var soundFont;
var audioBuffers = {};
var soundFontLength, decodeLength;
MIDI.keyToNote = {}; // C8  == 108
MIDI.noteToKey = {}; // 108 ==  C8
(function () {
    var A0 = 0x15; // first note
    var C8 = 0x6C; // last note
    var number2key = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    for (var n = A0; n <= C8; n++) {
        var octave = (n - 12) / 12 >> 0;
        var name = number2key[n % 12] + octave;
        MIDI.keyToNote[name] = n;
        MIDI.noteToKey[n] = name;
    }
})();
function loadSondFont(instrument, callback) {
    decodeLength = 0;
    soundFont = MIDI.Soundfont[instrument]
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
        buffer1.id = MIDI.keyToNote[index]
        if (buffer1.id) {
            audioBuffers[instrument + ' ' + buffer1.id] = buffer1;
        }
        if (++decodeLength === soundFontLength) {
            console.log("finish")
            callback();
        }
    })
}
MIDI.sendSignal = function (x, y) {
    for (var i = x; i < MIDI.temporal.length && i < x + y; i++) {
        switch (MIDI.temporal[i][0].subtype) {
            case 'noteOn':
                MIDI.noteOn('acoustic_grand_piano', MIDI.temporal[i][0].noteNumber, MIDI.temporal[i][0].velocity, MIDI.temporal[i][1])
                break;
            case 'noteOff':
                MIDI.noteOff('acoustic_grand_piano', MIDI.temporal[i][0].noteNumber, MIDI.temporal[i][1]);
                break;
        }
    }

    if ((x + y) < MIDI.temporal.length) {
        var time = (MIDI.temporal[(x + y)][1] - ctx.currentTime + MIDI.beginTime) * 1000 - 500;
        MIDI.currentTimeout = setTimeout(function () {
            MIDI.playTime = ctx.currentTime;
            MIDI.sendSignal(x + y, y);
        }, time);
    }
}

MIDI.masterVolume = 127;
MIDI.playTime = 0;
MIDI.beginTime = 0;
MIDI.offsetTime = 0;
MIDI.sources = {};
MIDI.noteOn = function (instrument, noteId, velocity, delay) {
    var source = ctx.createBufferSource();
    source.buffer = audioBuffers[instrument + ' ' + noteId];
    var ouput = ctx.createGain();
    ouput.connect(ctx.destination);
    ouput.gain.value = Math.min(1.0, Math.max(-1.0, (velocity / 127) * (MIDI.masterVolume / 127)));
    source.gain = ouput;
    source.connect(ouput);
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
    delay = delay - ctx.currentTime + MIDI.playTime + MIDI.beginTime
    source.start(delay);
    MIDI.sources[noteId] = source;
};
MIDI.noteOff = function (instrument, noteId, delay) {
    var buffer = audioBuffers[instrument + ' ' + noteId];
    if (buffer) {
        var source = MIDI.sources[noteId];
        if (source) {
            delay = delay - ctx.currentTime + MIDI.playTime + MIDI.beginTime

            if (source.gain) {
                var gain = source.gain.gain;
                gain.linearRampToValueAtTime(gain.value, delay);
                gain.linearRampToValueAtTime(0, delay + 0.3);
            }
            delete MIDI.sources[noteId];
            return source;
        }
    }
}
MIDI.stopAllNotes = function () {
    for (var i = 0; i <= 110; i++) {
        MIDI.noteOff('acoustic_grand_piano', i, 0.3)
    }
}
