# homebridge-stagekit
[![npm](https://img.shields.io/npm/v/homebridge-stagekit) ![npm](https://img.shields.io/npm/dt/homebridge-stagekit)](https://www.npmjs.com/package/homebridge-stagekit)

Homebridge Plugin for the RockBand StageKit

### Installation
1. Install Homebridge using the [official instructions](https://github.com/homebridge/homebridge/wiki).
2. Install this plugin using `sudo npm install -g homebridge-stagekit --unsafe-perm`.
3. Update your configuration file. See configuration sample below.

### Configuration
Edit your `config.json` accordingly. Configuration sample:
```
    "platforms": [{
        "platform": "stagekit",
        "fog_pulse_seconds": 1,
        "party_mode_seconds": 0.5,
        "random_leds": true
    }]
```

| Fields               | Description                                                                     | Required |
|----------------------|---------------------------------------------------------------------------------|----------|
| platform             | Must always be `stagekit`.                                                      | Yes      |
| eventfile            | The eventfile that represents the StageKit. (Default: Search for StageKit)      | No       |
| fog\_pulse\_seconds  | If set, the fog machine will only run for set number of seconds.                | No       |
| party\_mode\_seconds | If set, enables party mode switch, changing every set number of seconds.        | No       |
| random_leds          | Choose LEDs randomly instead of sequentially.                                   | No       |
