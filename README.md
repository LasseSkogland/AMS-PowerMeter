# AMS-PowerMeter
Server scripts and firmware (esp8266) for handling MBus (HAN) data from Norwegian AMS power meters.

## Projects
 * PowerMeter_client - Client source for ESP8266 (depends on [PlatformIO](https://platformio.org/platformio-ide))
 * nodejs_server - Server source written in node.js (no dependencies, only standard library)
 * python_server - Server source written in python 3 (depends on "influxdb")
 
## Hardware used
 * ESP-01[S] (ESP8266) [AliExpress Search](https://www.aliexpress.com/af/esp%25252d01s.html?SearchText=esp%252d01s&d=y&initiative_id=SB_20190925124558&origin=n&catId=0&isViewCP=y&jump=afs&switch_new_app=y) (any esp8266 module should work)
 * M-Bus to TTL converter [AliExpress Search](https://www.aliexpress.com/af/tss721a-ttl.html?SearchText=tss721a+ttl&d=y&initiative_id=SB_20190925125227&origin=n&catId=0&isViewCP=y&jump=afs&switch_new_app=y)
 * Some kind of power source, I run both the MCU and the converter on 3.3v from a Buck-Boost converter supplied 5v.


## How-To (Hardware)
### Setup MBus Converter:
Cut a RJ-45 terminated cable (CAT 5/6 or similar) in half to expose the wires.

The signal is on pin 1 and 2 (Type-A terminated cable = Green pair, Type-B terminated cable = Orange pair).

Plug/solder Wire 1 to one of the A ports and Wire 2 to one of the B ports, polarity doesn't matter.

Hook up power(3.3v) to VIN/VDC and ground to powersupply ground. (ESP-01 and MBus should be on the same ground reference for ttl to work)

### Setup ESP-01:

Connect or solder the following wires:

ESP-01 Pins | Connect to
----------- | ----------
VCC/3.3v | Power supply 3.3v
Ground | Power supply ground
RX | MBus converter TX
CH_EN/EN | ESP-01 VCC/3.3v or Power supply 3.3v

You don't need to buy any of these items from AliExpress, they are only examples.

**Any questions? Feel free to leave an issue (Norwegian or English)**
