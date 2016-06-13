/**
 * Created by chie on 2016/4/25.
 */

var O2jam=function(temporal){

    this.temporal = temporal;
    this.sevenkey = [];
    this.currentSevenKeyPosition = {now: 0, badkey: [0, 0], goodkey: [0, 0], misskey: [0, 0]};
    this.grade = {great: 0, good: 0, bad: 0, miss: 0, combo: 0}
}


O2jam.prototype.toSevenkey=function(){
    var animatearray = [];
    var asdf = [0, 1, 2, 3, 4, 5, 6];
    var currentNoteTime = [-Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity];
    var badTime = 200;
    var maxTime;
    this.temporal.forEach(function (a) {
        var time = a[1] * 1000;
        if (a[0].subtype == 'noteOn') {
            animatearray.push({
                isbegin: true,
                time: time,
                note: a[0].noteNumber,
                velocity: a[0].velocity
            });
        } else if (a[0].subtype == 'noteOff') {
            animatearray.push({
                isbegin: false,
                time: time,
                note: a[0].noteNumber,
                velocity: a[0].velocity
            });
        }
    })
    var current=this;
    animatearray.forEach(function (a) {
        if (a.isbegin == true) {
            var b = Math.floor(7 * Math.random())
            if (a.time - currentNoteTime[b] >= badTime) {
                current.sevenkey.push({time: a.time, note: b, state: 6, show: true});
                currentNoteTime[b] = a.time;
            }
            else {
                maxTime = [a.time - currentNoteTime[b], b];
                asdf.sort(function (e, f) {
                    return Math.random() - 0.5;
                });
                if (asdf.every(function (c) {
                        if (c != b && a.time - currentNoteTime[c] >= badTime) {
                            current.sevenkey.push({time: a.time, note: c, state: 6, show: true})
                            currentNoteTime[c] = a.time;
                            return false;
                        } else {
                            var d = a.time - currentNoteTime[c]
                            if (d > maxTime[0]) maxTime = [a.time - currentNoteTime[c], c];
                            return true;
                        }
                    })) {
                    current.sevenkey.push({time: a.time, note: maxTime[1], state: 6, show: true})
                    currentNoteTime[maxTime[1]] = a.time;
                }
            }
        }
    })
}