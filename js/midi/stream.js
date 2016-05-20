/**
 * Created by chie on 2016/2/25.
 */
function Stream(str) {
    var position = 0;
    
    function readWord(length) {
        
        var str1=''
        for(var i=0;i<length;i++){
            str1+=String.fromCharCode(str[position+i])
        }
        position+=length;
        return str1;
    }
    function read(length){
        position+=length;
        return str.slice(position-length,position)
    }
    //读32位，以此类推
    function readInt32() {
        var result = (
        (str[position] << 24)
        + (str[position + 1] << 16)
        + (str[position + 2] << 8)
        + str[position + 3]);
        position += 4;
        return result;
    }

    function readInt16() {
        var result = (
        (str[position] << 8)
        + str[position + 1]);
        position += 2;
        return result;
    }

    function readInt8(signed) {
        var result = str[position];
        if (signed && result > 127) result -= 256;
        position += 1;
        return result;
    }

    function eof() {
        return position >= str.length;
    }
    //读变长
    function readVarInt() {
        var result = 0;
        while (true) {
            var b = readInt8();
            if (b & 0x80) {
                result += (b & 0x7f);
                result <<= 7;
            } else {
                return result + b;
            }
        }
    }

    return {
        'eof': eof,
        'read': read,
        'readInt32': readInt32,
        'readInt16': readInt16,
        'readInt8': readInt8,
        'readVarInt': readVarInt,
        'readWord':readWord
    }
}