module.exports = (function (host = 'localhost', port = 8086, database, precision = 'ms') {
    const http = require('http');
    const HTTPOptions = {
        host: host,
        port: port,
        path: `/write?db=${database}&precision=${precision}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    };

    function joinArray(data, separator = ',', prefix = '', postfix = '') {
        let array = [];
        for (let value of Object.values(data)) {
            if (typeof value.Value == 'string') {
                array.push(`${value.Name}="${value.Value}"`);
            } else {
                array.push(`${value.Name}=${value.Value}`);
            }
        }
        return `${prefix}${array.join(separator)}${postfix}`;
    }

    this.FromData = function (measurement = '', tags = {}, fields = {}, timestamp = Date.now()) {
        let writeData = measurement;
        if (Object.keys(tags).length > 0) {
            writeData += joinArray(tags, ',', ',')
        }

        if (Object.keys(fields).length > 0) {
            writeData += joinArray(fields, ',', ' ')
        }
        return `${writeData} ${timestamp}`
    };

    this.Write = function (LineProtocol = '') {
        if (LineProtocol == '') return;
        const request = http.request(HTTPOptions, (res) => {
            if (res.statusCode % 200 > 99) {
                console.log(`Status: ${res.statusCode}: ${res.statusMessage}`);
                res.on('data', (chunk) => {
                    console.log(`Body: ${String(chunk)}`);
                })
            }
        });
        request.on('error', (error) => {
            console.log(`Error: ${error}`);
        });
        request.write(LineProtocol);
        request.end();
    }
    return this;
});