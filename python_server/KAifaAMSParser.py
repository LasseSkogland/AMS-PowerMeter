import struct


class KAifaAMSParser:
    Packet = {}

    NameList = {
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

    @staticmethod
    def UnpackShort(data: bytes):
        return struct.unpack(">H", data[0:2])[0]

    @staticmethod
    def UnpackInt(data: bytes):
        return struct.unpack(">I", data[0:4])[0]

    @staticmethod
    def ParseDate(data: bytes):
        year = KAifaAMSParser.UnpackShort(data[1:3])
        month = data[3]
        day = data[4]
        hour = data[6]
        minute = data[7]
        second = data[8]
        return {
            'DateTimeString': "{}.{}.{} {}:{}:{}".format(year, str(month).rjust(2, '0'), str(day).rjust(2, '0'), str(
                hour).rjust(2, '0'), str(minute).rjust(2, '0'), str(second).rjust(2, '0')),
            'Weekday': data[5],
            'Hundredths of Seconds': (0 if data[9] == 0xFF else data[9]),
            'Deviation': KAifaAMSParser.UnpackShort(data[10:12]),
            'Clock Status': data[13]
        }

    @staticmethod
    def ParseString(data: bytes):
        if data[0] == 0x09:
            length = data[1]
            return length, str(data[2: length + 2])

    @staticmethod
    def ParseList(data: bytes):
        elementList = list()
        if data[0] == 0x02:
            elements = data[1]
            names = KAifaAMSParser.NameList[elements]

            index = 2
            current = 0
            while current < elements:
                if data[index] == 0x09:
                    length, string = KAifaAMSParser.ParseString(data[index:])
                    elementList.append(
                        {'Name': names[current], 'Value': string})
                    index += length + 2
                elif data[index] == 0x06:
                    elementList.append(
                        {'Name': names[current], 'Value': KAifaAMSParser.UnpackInt(data[index + 1:])})
                    index += 5
                else:
                    print('Unknown key: ', data[index])
                    break
                current += 1
        return elementList

    def ParseHeader(self, data: bytes, index: int):
        header = {}

        header['FrameFormat'] = data[index] >> 4
        header['FrameLength'] = (
            ((data[index] << 7) & 0xF00) >> 1) + data[index + 1]
        index += 2
        checksumIndex = data.index(0x10) + 1
        header['Other'] = str(data[index:checksumIndex])
        header['Checksum'] = KAifaAMSParser.UnpackShort(
            data[checksumIndex:checksumIndex+2])
        self.Packet['Header'] = header
        return checksumIndex + 2

    def ParseBody(self, data: bytes, index: int):
        body = {
            'Destination LSAP': data[index],
            'Source LSAP': data[index + 1],
            'LLC Quality': data[index + 2],
            'LLC Service Data Unit': data[index + 3],
            'Long Invoke ID and Priority': KAifaAMSParser.UnpackInt(data[index + 4:index + 8]),
            'DateTime': KAifaAMSParser.ParseDate(data[index + 9:])
        }
        index += 22
        if(data[index] == 0x02):
            listElements = KAifaAMSParser.ParseList(data[index:])
        body['List'] = listElements
        self.Packet['Body'] = body

    def ParseFooter(self, data: bytes, index: int):
        footer = {
            'Checksum': self.UnpackShort(data.slice(index, index + 2))
        }
        index += 2
        if data[index] != 0x7E:
            # More data than expected?
            overFlowIndex = data.index(0x7E, index)
            footer['Overflow'] = str(data[index:overFlowIndex])
            index += overFlowIndex - index
        self.Packet['Footer'] = footer
        return index

    def Parse(self, data: str):
        index = 0
        if data[index] == 0x7E and data[index + 1] != 0x7E:
            index += 1
            index = self.ParseHeader(data, index)
            self.ParseBody(data, index)

        return self.Packet
