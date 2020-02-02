# homebridge-stagekit
Homebridge Plugin for the RockBand StageKit

### Installation
1. Install homebridge using `npm install -g homebridge`.
2. Install this plugin using `npm install -g homebridge-stagekit --unsafe-perm`.
3. Update your configuration file. See configuration sample below.

### Configuration
Edit your `config.json` accordingly. Configuration sample:
```
    "platforms": [{
        "platform": "stagekit"
    }]
```

| Fields             | Description                                                                  | Required |
|--------------------|------------------------------------------------------------------------------|----------|
| platform           | Must always be `stagekit`.                                                   | Yes      |
| eventfile          | The eventfile that represents the StageKit. If missing, it will search.      | No       |