/**
 * Created by chie on 2016/2/26.
 */
const MIDI = require('./midi.js');
const loadMidiFile = (midiFile, callback) => {
    const readBlobAsDataURL = (file, callback) => {
        let a = new FileReader();
        a.readAsDataURL(file);
        a.onloadend = e =>callback(e.target.result);
    };
    if (midiFile.constructor.toString().indexOf('File') != -1 || midiFile.constructor.toString().indexOf('Blob') != -1) {
        readBlobAsDataURL(midiFile, dataurl => {
            loadMidiFile.midiTracks = new MIDI(dataurl);
            loadMidiFile.midiTracks.intoTracks();
            loadMidiFile.midiTracks.intoTemporal();
            //暂时只支持acoustic_grand_piano
            MIDIPlayer.loadSondFont('acoustic_grand_piano', () =>
                callback(loadMidiFile.midiTracks)
            );
        });
    }
};
loadMidiFile.midiTracks = {};

module.exports = loadMidiFile;