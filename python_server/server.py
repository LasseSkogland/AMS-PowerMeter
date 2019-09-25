import socket
from datetime import datetime
import KAifaAMSParser
from influxdb import InfluxDBClient
import time


ams = KAifaAMSParser.KAifaAMSParser()
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.bind(('', 5432))
sock.listen(1)
db = InfluxDBClient()
db.create_retention_policy('powerdata_1y', '365d', 3, database='powermeter', default=True)

while True:
    (client, address) = sock.accept()
    data = client.recv(256)
    parsedData = ams.Parse(data)
    curDateTime = datetime.strptime(
        parsedData['Body']['DateTime']['DateTimeString'], '%Y.%m.%d %H:%M:%S')
    fields = []
    for item in parsedData['Body']['List']:
        if not item['Name'] in ['OBILListVersionIdentifier', 'MeterID', 'MeterType', 'MeterDateTime']:
            if(item['Value'] and item['Value'] > 0):
                fields.append("{0}={1}".format(item['Name'], item['Value']))
    linedata = "PowerData {0} {1}".format(",".join(fields), int(curDateTime.timestamp() * 1000))
    print(linedata)
    db.write_points([linedata], database='powermeter', time_precision='ms', retention_policy='powerdata_1y', protocol='line')
