const net = require('net');
const ams = require('./KaifaAMSParser');

const Config = {
    listenPort: 5432,
    influxHost: 'localhost',
    influxPort: 8086,
    influxDatabase: 'powermeter',
    influxPrecision: 'ms' // Internally the AMS Parser uses ms
};

const influx = require('./influx')(Config.influxHost, Config.influxPort, Config.influxDatabase, Config.influxPrecision);

const server = net.createServer(function (socket) {
    socket.on('data', (chunk) => {
        let parsedData = ams.Parse(chunk);
        let curDateTime = Date.parse(parsedData.Body.DateTime.DateTimeString);
        let lineData = influx.FromData('PowerData', {}, parsedData.Body.List, curDateTime);
        influx.Write(lineData);
    });
});

server.listen(Config.listenPort);
//*/