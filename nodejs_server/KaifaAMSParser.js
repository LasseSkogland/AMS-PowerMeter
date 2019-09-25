module.exports = (function () {
    const BytePack = require('./bytepack');

    let Packet = {}
    const NameList = {
        1: ['ActivePowerPositive'],
        9: ['OBILListVersionIdentifier', 'MeterID', 'MeterType', 'ActivePowerPositive', 'ActivePowerNegative',
            'ReactivePowerPositive', 'ReactivePowerNegative', 'IL1', 'ULN1'],
        13: ['OBILListVersionIdentifier', 'MeterID', 'MeterType', 'ActivePowerPositive', 'ActivePowerNegative',
            'ReactivePowerPositive', 'ReactivePowerNegative', 'IL1', 'IL2', 'IL3', 'ULN1', 'ULN2', 'ULN3'],
        14: ['OBILListVersionIdentifier', 'MeterID', 'MeterType', 'ActivePowerPositive', 'ActivePowerNegative', 'ReactivePowerPositive', 'ReactivePowerNegative', 'IL1', 'ULN1',
            'MeterDateTime', 'CumulativeHourlyActiveImport', 'CumulativeHourlyActiveExport', 'CumulativeHourlyReactiveImport', 'CumulativeHourlyReactiveExport'],
        18: ['OBILListVersionIdentifier', 'MeterID', 'MeterType', 'ActivePowerPositive', 'ActivePowerNegative', 'ReactivePowerPositive', 'ReactivePowerNegative', 'IL1', 'IL2', 'IL3', 'ULN1', 'ULN2',
            'ULN3', 'MeterDateTime', 'CumulativeHourlyActiveImport', 'CumulativeHourlyActiveExport', 'CumulativeHourlyReactiveImport', 'CumulativeHourlyReactiveExport']
    }

    this.ParseDate = function (bytes = []) {
        let year = BytePack.UnpackShort(bytes.slice(1, 3));
        let month = String(bytes[3]).padStart(2, '0');
        let day = String(bytes[4]).padStart(2, '0');

        let hour = String(bytes[6]).padStart(2, '0');
        let minute = String(bytes[7]).padStart(2, '0');
        let second = String(bytes[8]).padStart(2, '0');
        return {
            DateTimeString: `${year}.${month}.${day} ${hour}:${minute}:${second}`,
            Weekday: bytes[5],
            'Hundreths of Seconds': bytes[9] == 0xFF ? 0 : bytes[9],
            Deviation: BytePack.UnpackShort(bytes.slice(10, 12)),
            'Clock Status': bytes[13]
        };
    }

    this.ParseString = function (bytes = []) {
        if (bytes[0] == 0x09) {
            let length = bytes[1];
            return [length, bytes.slice(2, length + 2).map((value) => {
                return String.fromCharCode(value);
            }).join("")];
        }
    }

    this.ParseList = function (bytes = []) {
        let elementList = [];
        if (bytes[0] == 0x02) {
            let elements = bytes[1];
            let names = NameList[elements];

            let index = 2;
            let current = 0;
            while (current < elements) {
                let identifier = bytes[index];
                if (identifier == 0x09) {
                    const [length, string] = this.ParseString(bytes.slice(index));
                    elementList.push({ Name: names[current], Value: string });
                    index += length + 2
                } else if (identifier == 0x06) {
                    elementList.push({ Name: names[current], Value: BytePack.UnpackInt(bytes.slice(index + 1, index + 5)) });
                    index += 5;
                } else {
                    console.log(`Unknown key: ${identifier}`)
                }
                current++;
            }
            return [index, elementList];
        }
        return [0, elementList];
    }

    this.ParseHeader = function (bytes = [], index) {
        Packet.Header = {
            FrameFormat: bytes[index] >> 4,
            FrameLength: (((bytes[index] << 7) & 0xF00) >> 1) + bytes[index + 1],
        }
        index += 2;
        let checksumIndex = bytes.indexOf(0x10) + 1;
        Packet.Header.Other = String(bytes.slice(index, checksumIndex));
        Packet.Header.Checksum = BytePack.UnpackShort(bytes.slice(checksumIndex, checksumIndex + 2));
        return checksumIndex + 2;
    }

    this.ParseBody = function (bytes = [], index) {
        Packet.Body = {
            'Destination LSAP': bytes[index],
            'Source LSAP': bytes[index + 1],
            'LLC Quality': bytes[index + 2],
            'LLC Service Data Unit': bytes[index + 3],
            'Long Invoke ID and Priority': BytePack.UnpackInt(bytes.slice(index + 4, index + 8)),
            DateTime: this.ParseDate(bytes.slice(index + 9))
        }
        index += 22;
        if (bytes[index] == 0x02) {
            const [length, elementList] = this.ParseList(bytes.slice(index));
            Packet.Body.List = elementList;
            index += length;
        } else {
            Packet.Body.List = []
        }
        return index;
    }

    this.ParseFooter = function (bytes = [], index) {
        Packet.Footer = {
            Checksum: BytePack.UnpackShort(bytes.slice(index, index + 2))
        };
        index += 2;
        if (bytes[index] != 0x7E) {
            // More data than expected?
            Packet.Footer.Overflow = String(bytes.slice(index, bytes.indexOf(0x7E, index)));
        }
        return index;
    }

    this.Parse = function (bytes = []) {
        let index = 0;
        if (bytes[index] == 0x7E && bytes[index + 1] != 0x7E) {
            index++;
            index = this.ParseHeader(bytes, index);
            index = this.ParseBody(bytes, index);
            index = this.ParseFooter(bytes, index);
        }
        return Packet;
    }
    return this;
})();