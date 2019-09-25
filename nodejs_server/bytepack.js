module.exports = (function(){
    this.UnpackShort = function(bytes, low_endian = false) {
        if(low_endian) {
            return (bytes[1] << 8) | bytes[0];
        } else {
            return (bytes[0] << 8) | bytes[1];
        }
    }

    this.UnpackInt = function(bytes, low_endian) {
        if(low_endian) {
            return (bytes[3] << 24) & 0xFF00000 | (bytes[2] << 16) & 0xFF0000 | (bytes[1] << 8) & 0xFF00 | bytes[0];
        } else {
            return (bytes[0] << 24) & 0xFF00000 | (bytes[1] << 16) & 0xFF0000 | (bytes[2] << 8) & 0xFF00 | bytes[3];
        }
    }
    return this;
})();