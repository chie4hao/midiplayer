/**
 * Created by chie on 2016/2/26.
 */

loadMidiFile = function (midiFile, callback) {
    if(midiFile.constructor.toString().indexOf('File')!=-1||midiFile.constructor.toString().indexOf('Blob')!=-1)
    readBlobAsDataURL(midiFile, function (dataurl) {
        loadMidiFile.midiTracks = new MIDI(dataurl);
        loadMidiFile.midiTracks.intoTracks();
        loadMidiFile.midiTracks.intoTemporal();
        //暂时只支持acoustic_grand_piano
        loadSondFont('acoustic_grand_piano', function () {
            callback(loadMidiFile.midiTracks);
        });
    });

    function readBlobAsDataURL(file, callback) {
        var a = new FileReader();
        a.readAsDataURL(file);
        a.onloadend = function (e) {
            callback(e.target.result);
        };
    }
};
loadMidiFile.midiTracks={};