# Homebridge Harmony TV

[![npm](https://img.shields.io/npm/v/homebridge-harmony-tv-smockle-temp.svg)](https://www.npmjs.com/package/homebridge-harmony-tv-smockle-temp)
[![Build Status](https://travis-ci.com/smockle/homebridge-harmony-tv.svg?branch=master)](https://travis-ci.com/smockle/homebridge-harmony-tv)
[![Known Vulnerabilities](https://snyk.io/test/github/smockle/homebridge-harmony-tv/badge.svg?targetFile=package.json)](https://snyk.io/test/github/smockle/homebridge-harmony-tv?targetFile=package.json)
[![Greenkeeper badge](https://badges.greenkeeper.io/smockle/homebridge-harmony-tv.svg)](https://greenkeeper.io/)

Creates a HomeKit TV accessory for a Logitech Harmony-controlled TV

# Installation

Review the [Installation](https://github.com/nfarina/homebridge#installation) section of the Homebridge README.

```Bash
npm install -g homebridge-harmony-tv-smockle-temp
```

# Configuration

```JSON
{
  "bridge": {
    "name": "TV Bridge",
    "username": "CC:22:3D:E3:CE:30",
    "port": 51826,
    "pin": "031-45-154"
  },
  "description": "SmartHome with Homebridge",
  "accessories": [{
    "accessory": "HarmonyTV",
    "name": "Living Room TV",
    "host": "192.168.1.10",
    "remoteId": "22571993",
    "deviceId": "72306838"
  }],
}
```

**Notes:**

- `"platform"` must be `"HarmonyTV"`
- `"name"` values must be unique
- `"host"` should match the static IP address of your Harmony Hub
- `"remoteId"` is the unique identifier of your Harmony Hub, and can be obtained by running `node scripts/hubinfo.js 192.168.1.10` (with the IP address of your Harmony Hub)
- `"deviceId"` is the unique identifier of the Harmony Hub-connected TV you want to control, and can be obtained by running `node scripts/hubinfo.js 192.168.1.10 22571993` (with the IP address and unique identifier of your Harmony Hub)

# Useful Links

- [Harmony HTTP](https://github.com/smockle/harmony-http)
- [Node.JS HAP TV Accessory Example](https://github.com/KhaosT/HAP-NodeJS/blob/master/accessories/TV_accessory.js)
- [WIP Homebridge plug-in for Sony TVs](https://github.com/arnif/homebridge-sony-television)
