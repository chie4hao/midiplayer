# midiplayer

## API


```javascript
loadMidiFile(midiFile, function (midiTracks) {

  var player = new MIDIPlayer(midiTracks);
  
  player.sendSignal(0);
  
});
```
+ midiFile — the ```File``` object
