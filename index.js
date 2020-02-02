const stagekitApi = require('stagekit');
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform('homebridge-stagekit', 'stagekit', stagekit, true);
}

function stagekit(log, config, api) {
    this.log = log;
    this.config = config;
    this.accessory;

    if (api) {
        this.api = api;
        this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
    }
}

stagekit.prototype.didFinishLaunching = function() {
    this.addAccessory(this.config.eventfile)
}

stagekit.prototype.ledsToInt = function(leds) {
    var binary = '';
    for (var i = 0; i < leds; i++) {
        binary += '1';
    }
    if (this.config.random_leds) {
        for (var i = 0; i < 8 - leds; i++) {
            var pos = parseInt(Math.random() * binary.length);
            binary = binary.slice(0, pos) + '0' + binary.slice(pos);
        }
    }
    return parseInt(binary, 2);
}

stagekit.prototype.intToLeds = function(leds) {
    var binary = leds.toString(2);
    return (binary.match(/1/g) || []).length;
}

stagekit.prototype.panic = function(state, callback) {
    if (this.panicTimeout) {
        clearTimeout(this.panicTimeout);
        this.panicTimeout = null;
    }

    if (this.accessory.context.partyMode) {
        this.accessory.getService('Party Mode')
            .setCharacteristic(Characteristic.On, false);
    }

    stagekitApi.AllOff();

    this.accessory.getService('Fog Machine')
        .updateCharacteristic(Characteristic.On, false);
    this.accessory.getService('Strobe Light')
        .updateCharacteristic(Characteristic.On, false)
        .updateCharacteristic(Characteristic.Brightness, 100);
    this.accessory.getService('Red Lights')
        .updateCharacteristic(Characteristic.On, false)
        .updateCharacteristic(Characteristic.Brightness, 100);
    this.accessory.getService('Yellow Lights')
        .updateCharacteristic(Characteristic.On, false)
        .updateCharacteristic(Characteristic.Brightness, 100);
    this.accessory.getService('Green Lights')
        .updateCharacteristic(Characteristic.On, false)
        .updateCharacteristic(Characteristic.Brightness, 100);
    this.accessory.getService('Blue Lights')
        .updateCharacteristic(Characteristic.On, false)
        .updateCharacteristic(Characteristic.Brightness, 100);

    if (callback) {
        callback();
    }

    this.panicTimeout = setTimeout(() => {
        this.accessory.getService('Panic')
            .updateCharacteristic(Characteristic.On, false);
        this.panicTimeout = null;
    }, 1000);
}

stagekit.prototype.setFog = function(state, callback) {
    if (this.fogTimeout) {
        clearTimeout(this.fogTimeout);
        this.fogTimeout = null;
    }

    stagekitApi.SetFog(state);
    callback();

    if (state && this.config.fog_pulse_seconds) {
        this.fogTimeout = setTimeout(() => {
            this.accessory.getService('Fog Machine')
                .setCharacteristic(Characteristic.On, false);
            this.fogTimeout = null;
        }, this.config.fog_pulse_seconds * 1000);
    }
}

stagekit.prototype.setStrobe = function(state, callback) {
    if (this.strobeTimeout) {
        clearTimeout(this.strobeTimeout);
        this.strobeTimeout = null;
    }

    var strobe = Math.ceil(state / 25);
    stagekitApi.SetStrobe(strobe);

    callback();

    this.strobeTimeout = setTimeout(() => {
        this.accessory.getService('Strobe Light')
            .updateCharacteristic(Characteristic.Brightness, strobe * 25);
        this.strobeTimeout = null;
    }, 1000);
}

stagekit.prototype.setStrobeToggle = function(state, callback) {
    var strobe;
    if (state) {
        strobe = this.accessory.getService('Strobe Light').getCharacteristic(Characteristic.Brightness).value;
    } else {
        strobe = 0;
    }
    this.setStrobe(strobe, callback);
}

stagekit.prototype.setRed = function(state, callback) {
    if (this.redTimeout) {
        clearTimeout(this.redTimeout);
        this.redTimeout = null;
    }

    var red = Math.ceil(state / 12.5);
    stagekitApi.SetRed(this.ledsToInt(red));

    callback();

    this.redTimeout = setTimeout(() => {
        this.accessory.getService('Red Lights')
            .updateCharacteristic(Characteristic.Brightness, red * 12.5);
        this.redTimeout = null;
    }, 1000);
}

stagekit.prototype.setRedToggle = function(state, callback) {
    var red;
    if (state) {
        red = this.accessory.getService('Red Lights').getCharacteristic(Characteristic.Brightness).value;
    } else {
        red = 0;
    }
    this.setRed(red, callback);
}

stagekit.prototype.setYellow = function(state, callback) {
    if (this.yellowTimeout) {
        clearTimeout(this.yellowTimeout);
        this.yellowTimeout = null;
    }

    var yellow = Math.ceil(state / 12.5);
    stagekitApi.SetYellow(this.ledsToInt(yellow));

    callback();

    this.yellowTimeout = setTimeout(() => {
        this.accessory.getService('Yellow Lights')
            .updateCharacteristic(Characteristic.Brightness, yellow * 12.5);
        this.yellowTimeout = null;
    }, 1000);
}

stagekit.prototype.setYellowToggle = function(state, callback) {
    var yellow;
    if (state) {
        yellow = this.accessory.getService('Yellow Lights').getCharacteristic(Characteristic.Brightness).value;
    } else {
        yellow = 0;
    }
    this.setYellow(yellow, callback);
}

stagekit.prototype.setGreen = function(state, callback) {
    if (this.greenTimeout) {
        clearTimeout(this.greenTimeout);
        this.greenTimeout = null;
    }

    var green = Math.ceil(state / 12.5);
    stagekitApi.SetGreen(this.ledsToInt(green));

    callback();

    this.greenTimeout = setTimeout(() => {
        this.accessory.getService('Green Lights')
            .updateCharacteristic(Characteristic.Brightness, green * 12.5);
        this.greenTimeout = null;
    }, 1000);
}

stagekit.prototype.setGreenToggle = function(state, callback) {
    var green;
    if (state) {
        green = this.accessory.getService('Green Lights').getCharacteristic(Characteristic.Brightness).value;
    } else {
        green = 0;
    }
    this.setGreen(green, callback);
}

stagekit.prototype.setBlue = function(state, callback) {
    if (this.blueTimeout) {
        clearTimeout(this.blueTimeout);
        this.blueTimeout = null;
    }

    var blue = Math.ceil(state / 12.5);
    stagekitApi.SetBlue(this.ledsToInt(blue));

    callback();

    this.blueTimeout = setTimeout(() => {
        this.accessory.getService('Blue Lights')
            .updateCharacteristic(Characteristic.Brightness, blue * 12.5);
        this.blueTimeout = null;
    }, 1000);
}

stagekit.prototype.setBlueToggle = function(state, callback) {
    var blue;
    if (state) {
        blue = this.accessory.getService('Blue Lights').getCharacteristic(Characteristic.Brightness).value;
    } else {
        blue = 0;
    }
    this.setBlue(blue, callback);
}

stagekit.prototype.randomLeds = function() {
    var red = parseInt(Math.random() * 255);
    var yellow = parseInt(Math.random() * 255);
    var green = parseInt(Math.random() * 255);
    var blue = parseInt(Math.random() * 255);

    stagekitApi.SetRed(red);
    stagekitApi.SetYellow(yellow);
    stagekitApi.SetGreen(green);
    stagekitApi.SetBlue(blue);

    this.accessory.getService('Red Lights')
        .updateCharacteristic(Characteristic.On, true)
        .updateCharacteristic(Characteristic.Brightness, this.intToLeds(red) * 12.5);
    this.accessory.getService('Yellow Lights')
        .updateCharacteristic(Characteristic.On, true)
        .updateCharacteristic(Characteristic.Brightness, this.intToLeds(yellow) * 12.5);
    this.accessory.getService('Green Lights')
        .updateCharacteristic(Characteristic.On, true)
        .updateCharacteristic(Characteristic.Brightness, this.intToLeds(green) * 12.5);
    this.accessory.getService('Blue Lights')
        .updateCharacteristic(Characteristic.On, true)
        .updateCharacteristic(Characteristic.Brightness, this.intToLeds(blue) * 12.5);
}

stagekit.prototype.partyMode = function(state, callback) {
    if (state) {
        if (!this.partyInterval) {
            this.partyInterval = setInterval(this.randomLeds.bind(this), this.config.party_mode_seconds * 1000);
        }
    } else {
        if (this.partyInterval) {
            clearInterval(this.partyInterval);
            this.partyInterval = null;
        }

        stagekitApi.SetRed(0);
        stagekitApi.SetYellow(0);
        stagekitApi.SetGreen(0);
        stagekitApi.SetBlue(0);

        this.accessory.getService('Red Lights')
            .updateCharacteristic(Characteristic.On, false)
            .updateCharacteristic(Characteristic.Brightness, 100);
        this.accessory.getService('Yellow Lights')
            .updateCharacteristic(Characteristic.On, false)
            .updateCharacteristic(Characteristic.Brightness, 100);
        this.accessory.getService('Green Lights')
            .updateCharacteristic(Characteristic.On, false)
            .updateCharacteristic(Characteristic.Brightness, 100);
        this.accessory.getService('Blue Lights')
            .updateCharacteristic(Characteristic.On, false)
            .updateCharacteristic(Characteristic.Brightness, 100);
    }

    callback();
}

stagekit.prototype.configureAccessory = function(accessory) {
    accessory.on('identify', (paired, callback) => {
        this.log(accessory.displayName + ' identify requested!');
        callback();
    });
    accessory.getService('Panic').getCharacteristic(Characteristic.On)
        .on('set', this.panic.bind(this));
    accessory.getService('Fog Machine').getCharacteristic(Characteristic.On)
        .on('set', this.setFog.bind(this));
    accessory.getService('Strobe Light').getCharacteristic(Characteristic.Brightness)
        .on('set', this.setStrobe.bind(this));
    accessory.getService('Strobe Light').getCharacteristic(Characteristic.On)
        .on('set', this.setStrobeToggle.bind(this));
    accessory.getService('Red Lights').getCharacteristic(Characteristic.Brightness)
        .on('set', this.setRed.bind(this));
    accessory.getService('Red Lights').getCharacteristic(Characteristic.On)
        .on('set', this.setRedToggle.bind(this));
    accessory.getService('Yellow Lights').getCharacteristic(Characteristic.Brightness)
        .on('set', this.setYellow.bind(this));
    accessory.getService('Yellow Lights').getCharacteristic(Characteristic.On)
        .on('set', this.setYellowToggle.bind(this));
    accessory.getService('Green Lights').getCharacteristic(Characteristic.Brightness)
        .on('set', this.setGreen.bind(this));
    accessory.getService('Green Lights').getCharacteristic(Characteristic.On)
        .on('set', this.setGreenToggle.bind(this));
    accessory.getService('Blue Lights').getCharacteristic(Characteristic.Brightness)
        .on('set', this.setBlue.bind(this));
    accessory.getService('Blue Lights').getCharacteristic(Characteristic.On)
        .on('set', this.setBlueToggle.bind(this));

    var party = accessory.getService('Party Mode');
    if (party != undefined && !this.config.party_mode_seconds) {
        accessory.removeService(party);
        party = null;
    } else if (party == undefined && this.config.party_mode_seconds) {
        party = accessory.addService(Service.Switch, 'Party Mode', 'Party Mode');
    }
    if (party) {
        party.getCharacteristic(Characteristic.On)
            .on('set', this.partyMode.bind(this));
        accessory.context.partyMode = true;
    } else {
        accessory.context.partyMode = false;
    }

    var eventfile = stagekitApi.Open(accessory.context.eventfile);

    accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.SerialNumber, eventfile);

    this.accessory = accessory;

    this.panic();
}

stagekit.prototype.addAccessory = function(eventfile) {
    if (!this.accessory) {
        var uuid = UUIDGen.generate('RockBand StageKit');
        var accessory = new Accessory('StageKit', uuid);

        accessory.context.eventfile = eventfile;

        accessory.getService(Service.AccessoryInformation)
            .setCharacteristic(Characteristic.Manufacturer, 'PDP')
            .setCharacteristic(Characteristic.Model, 'RockBand StageKit');

        accessory.addService(Service.Switch, 'Panic', 'Panic');
        accessory.addService(Service.Switch, 'Fog Machine', 'Fog Machine');
        accessory.addService(Service.Lightbulb, 'Strobe Light', 'Strobe Light')
            .addCharacteristic(Characteristic.Brightness);
        accessory.addService(Service.Lightbulb, 'Red Lights', 'Red Lights')
            .addCharacteristic(Characteristic.Brightness);
        accessory.addService(Service.Lightbulb, 'Yellow Lights', 'Yellow Lights')
            .addCharacteristic(Characteristic.Brightness);
        accessory.addService(Service.Lightbulb, 'Green Lights', 'Green Lights')
            .addCharacteristic(Characteristic.Brightness);
        accessory.addService(Service.Lightbulb, 'Blue Lights', 'Blue Lights')
            .addCharacteristic(Characteristic.Brightness);

        this.configureAccessory(accessory);

        this.api.registerPlatformAccessories('homebridge-stagekit', 'stagekit', [accessory]);
    }
}