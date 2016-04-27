# midiplayer

## API

+ midiFile — the ```File``` object

```javascript
MIDIPlayer.clearPlayer();
loadMidiFile(midiFile, function (midiTracks) {
  var asdf = new MIDIPlayer(midiTracks);
  asdf.sendSignal(0);
});
```
