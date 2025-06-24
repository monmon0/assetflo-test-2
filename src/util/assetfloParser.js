/* eslint-disable complexity */
'use strict';

const _ = require('lodash');

class BeaconParserAssetFlo {
  constructor() {
    // Private properties
    this._ASSETFLO_TELEMETRY_SERVICE_UUID = 'D0FE';
    this._ASSETFLO_COMPANY_ID = 0xf1ff;
    this._DEFAULT_POWER = -48;
    this._DEFAULT_PRESSURE = 100100;
    this._DEFAULT_HEIGHT = 218;
  }

  /* ------------------------------------------------------------------
   * Method: parseNearable(peripheral)
   * - peripheral: `Peripheral` object of the noble
   * ---------------------------------------------------------------- */
  parseNearable(data, mac) {
    const manu = data;
    let res = {};
    /* INDEX 0 -> length  
      0x01 /* INDEX 1 -> type ,
      0x04 | 0x02 /* INDEX 2 -> Flags: LE General Discoverable Mode, BR/EDR is disabled. ,
      0x03 /* INDEX 3 -> Start of Service UUID data ,
      0x02 /* INDEX 4 -> Service UUID Length ,
      0xd0 /* INDEX 5 -> Service UUID ,
      0xfe /* INDEX 6 -> Service UUID ,
      /* Manufacturer specific data 
      23 /* INDEX 7 -> length of field,
      0xff /* INDEX 8 -> type of field ,
      /* The first two data octets shall contain a company identifier code from
       * the Assigned Numbers - Company Identifiers document 
      /* 0x004C = Apple 
      //{ UINT16_TO_BYTES(0x004C) },
      0xff /* INDEX 9 -> Company ID High Byte ,
      0xf1 /* INDEX 10 -> Company ID Low Byte ,
      0x01 /* INDEX 11 -> advertisement packet version number or Command Type , //manu[0]
      31 /* INDEX 12 -> TX power = -31 dbm (updated Jan 2021) sign handled in parser ,
      0x00 /* INDEX 13 -> connectable status ,
      03 /* INDEX 14 -> Battery level ,
      21 /* INDEX 15 -> temperature ,
      01 /* INDEX 16 -> beacon moving ,
      13 /* INDEX 17 -> Accelero X ,
      14 /* INDEX 18 -> Accelero Y ,
      15 /* INDEX 19 -> Accelero Z ,
      20 /* INDEX 20 -> Device Profile Version ,
      21 /* INDEX 21 -> FW Version ,
      22 /* INDEX 22 ->  isAnchor,
      23 /* INDEX 23 -> Compass Angle_H ,
      24 /* INDEX 24 -> Compass Angle_L ,
      25 /* INDEX 25 -> MAC 1 ,
      26 /* INDEX 26 -> MAC 2 ,
      27 /* INDEX 27 -> MAC 3 ,
      28 /* INDEX 28 -> MAC 4 ,
      29 /* INDEX 29 -> MAC 5 ,
      30; /* INDEX 30 -> MAC 6  
      */

    // Nearable Identifier
    // let nearable_id = manu.slice(15, 16).toString('hex');
    //011F000215010000000104000010AA11BB22CC33
    const manuLen = manu.length;

    if (manuLen > 0) res.version = manu[0];
    if (res.version === 0x01) {
      res = this.parseRegPacket(data, mac, manuLen);
    } else if (res.version === 0x10) {
      res = this.parseSmallPacket(data, mac, manuLen);
    }
    return res;
  }

  parseSmallPacket(manu, mac, manuLen) {
    let res = {};
    let id = manu.slice(3, 9).toString('hex');
    if (id !== mac) return null;
    res.deviceId = id;
    let telemetry = {};
    if (manuLen > 1) telemetry.batterylevel = parseInt(manu[1]);
    res.isMoving = false;
    if (manuLen > 2) telemetry.isMoving = manu[2] === 0x01 || false;
    res.telemetry = telemetry;
    return res;
  }

  parseRegPacket(manu, mac, manuLen) {
    let res = {};
    let id = manu.slice(14, 20).toString('hex');
    if (id !== mac) return null;
    res.deviceId = id;
    if (manuLen > 1) {
      const tx = manu[1];
      //tx power is advertised as a positive number
      // res.txPower = tx > 0 && tx < 100 ? -tx : this._DEFAULT_POWER; //Account for very high txPower
      res.txPower = this._DEFAULT_POWER; //Account
      // if (manuLen > 3) res.txPower = manu.readInt8(3) > -100 ? manu.readInt8(3) : -45; //Account for very high txPower
    }

    let telemetry = {};
    if (manuLen > 2) telemetry.connectable = manu[2] === 1;
    if (manuLen > 3) telemetry.batterylevel = parseInt(manu[3]);

    // Temperature Sensor Data in degree celsius
    if (manuLen > 4) telemetry.temperature = parseInt(manu[4]);

    // Motion Sensor Data
    res.isMoving = false;
    if (manuLen > 5) telemetry.isMoving = manu[5] === 0x01 || false;
    // debug('isMoving Value', manu[7]);

    // Accelerometer Sensor Data
    // let accX = manu[17].toString('hex');
    // let accY = manu.slice(7, 8).toString('hex');
    // let accZ = manu.slice(8, 9).toString('hex');

    let acceleration = {};
    if (manuLen > 6) acceleration.x = manu.readInt8(6) && manu.readInt8(6) * 0.000122;
    if (manuLen > 7) acceleration.y = manu.readInt8(7) && manu.readInt8(7) * 0.000122;
    if (manuLen > 8) acceleration.z = manu.readInt8(8) && manu.readInt8(8) * 0.000122;
    telemetry.acceleration = acceleration;
    if (manuLen > 9) res.deviceProfile = parseInt(manu[9]);
    if (manuLen > 10) res.fwVersion = parseInt(manu[10]);
    if (manuLen > 11) res.isAnchor = manu[11] === 0x01 || false;
    // Compass Data
    if (manuLen > 12) {
      telemetry.angle = parseInt(manu.slice(12, 14).toString('hex'), 16);
    }
    res.telemetry = telemetry;

    return res;
  }
}

export default new BeaconParserAssetFlo();
