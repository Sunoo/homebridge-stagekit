import {
  API,
  APIEvent,
  CharacteristicSetCallback,
  CharacteristicValue,
  DynamicPlatformPlugin,
  HAP,
  Logging,
  Nullable,
  PlatformAccessory,
  PlatformAccessoryEvent,
  PlatformConfig
} from 'homebridge';
import { StageKit } from 'stagekit';
import { StageKitPlatformConfig } from './configTypes';

let hap: HAP;
let Accessory: typeof PlatformAccessory;

const PLUGIN_NAME = 'homebridge-stagekit';
const PLATFORM_NAME = 'stagekit';

class StageKitPlatform implements DynamicPlatformPlugin {
  private readonly log: Logging;
  private readonly api: API;
  private readonly config: StageKitPlatformConfig;
  private readonly stageKit?: StageKit;
  private accessory?: PlatformAccessory;
  private panicTimeout?: NodeJS.Timeout;
  private fogTimeout?: NodeJS.Timeout;
  private strobeTimeout?: NodeJS.Timeout;
  private redTimeout?: NodeJS.Timeout;
  private yellowTimeout?: NodeJS.Timeout;
  private greenTimeout?: NodeJS.Timeout;
  private blueTimeout?: NodeJS.Timeout;
  private partyInterval?: NodeJS.Timeout;

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;
    this.config = config as unknown as StageKitPlatformConfig;
    this.api = api;

    try {
      this.stageKit = new StageKit();
    } catch (ex) {
      this.log.error('Error connecting to StageKit: ' + ex);
      return;
    }

    api.on(APIEvent.DID_FINISH_LAUNCHING, this.addAccessory.bind(this));
  }

  ledsToInt(leds: number): number {
    let binary = '';
    for (let i = 0; i < leds; i++) {
      binary += '1';
    }
    if (this.config.random_leds) {
      for (let i = 0; i < 8 - leds; i++) {
        const pos = Math.round(Math.random() * binary.length);
        binary = binary.slice(0, pos) + '0' + binary.slice(pos);
      }
    }
    return parseInt(binary, 2);
  }

  intToLeds(leds: number): number {
    const binary = leds.toString(2);
    return (binary.match(/1/g) || []).length;
  }

  panic(state?: CharacteristicValue, callback?: CharacteristicSetCallback): void {
    if (!this.accessory) {
      return;
    }

    if (this.panicTimeout) {
      clearTimeout(this.panicTimeout);
      this.panicTimeout = undefined;
    }

    const party = this.accessory.getService('Party Mode');
    if (party) {
      party.setCharacteristic(hap.Characteristic.On, false);
    }

    this.stageKit?.AllOff();

    const fog = this.accessory.getService('Fog Machine');
    if (fog) {
      fog.updateCharacteristic(hap.Characteristic.On, false);
    }
    const strobe = this.accessory.getService('Strobe Light');
    if (strobe) {
      strobe
        .updateCharacteristic(hap.Characteristic.On, false)
        .updateCharacteristic(hap.Characteristic.Brightness, 100);
    }
    const red = this.accessory.getService('Red Lights');
    if (red) {
      red
        .updateCharacteristic(hap.Characteristic.On, false)
        .updateCharacteristic(hap.Characteristic.Brightness, 100);
    }
    const yellow = this.accessory.getService('Yellow Lights');
    if (yellow) {
      yellow
        .updateCharacteristic(hap.Characteristic.On, false)
        .updateCharacteristic(hap.Characteristic.Brightness, 100);
    }
    const green = this.accessory.getService('Green Lights');
    if (green) {
      green
        .updateCharacteristic(hap.Characteristic.On, false)
        .updateCharacteristic(hap.Characteristic.Brightness, 100);
    }
    const blue = this.accessory.getService('Blue Lights');
    if (blue) {
      blue
        .updateCharacteristic(hap.Characteristic.On, false)
        .updateCharacteristic(hap.Characteristic.Brightness, 100);
    }

    if (callback) {
      callback();
    }

    this.panicTimeout = setTimeout(() => {
      if (this.accessory) {
        const panic = this.accessory.getService('Panic');
        if (panic) {
          panic.updateCharacteristic(hap.Characteristic.On, false);
        }
        this.panicTimeout = undefined;
      }
    }, 1000);
  }

  setFog(state: CharacteristicValue, callback: CharacteristicSetCallback): void {
    if (!this.accessory) {
      callback();
      return;
    }

    if (this.fogTimeout) {
      clearTimeout(this.fogTimeout);
      this.fogTimeout = undefined;
    }

    this.stageKit?.SetFog(state as boolean);
    callback();

    if (state && this.config.fog_pulse_seconds) {
      this.fogTimeout = setTimeout(() => {
        if (this.accessory) {
          const fog = this.accessory.getService('Fog Machine');
          if (fog) {
            fog.updateCharacteristic(hap.Characteristic.On, false);
          }
          this.fogTimeout = undefined;
        }
      }, this.config.fog_pulse_seconds * 1000);
    }
  }

  setStrobe(state: Nullable<CharacteristicValue>, callback: CharacteristicSetCallback): void {
    if (!this.accessory) {
      callback();
      return;
    }

    if (this.strobeTimeout) {
      clearTimeout(this.strobeTimeout);
      this.strobeTimeout = undefined;
    }

    const strobeVal = Math.ceil(state as number / 25);
    this.stageKit?.SetStrobe(strobeVal);

    callback();

    this.strobeTimeout = setTimeout(() => {
      if (this.accessory) {
        const strobe = this.accessory.getService('Strobe Light');
        if (strobe) {
          strobe.updateCharacteristic(hap.Characteristic.Brightness, strobeVal * 25);
        }
        this.strobeTimeout = undefined;
      }
    }, 1000);
  }

  setStrobeToggle(state: CharacteristicValue, callback: CharacteristicSetCallback): void {
    if (!this.accessory) {
      callback();
      return;
    }

    const strobe = this.accessory.getService('Strobe Light');
    if (strobe) {
      const on = strobe.getCharacteristic(hap.Characteristic.On).value;
      if (state && !on) {
        const strobeVal = strobe.getCharacteristic(hap.Characteristic.Brightness).value;
        this.setStrobe(strobeVal, callback);
      } else if (!state && on) {
        this.setStrobe(0, callback);
      } else {
        callback();
      }
    } else {
      callback();
    }
  }

  setRed(state: Nullable<CharacteristicValue>, callback: CharacteristicSetCallback): void {
    if (!this.accessory) {
      callback();
      return;
    }

    if (this.redTimeout) {
      clearTimeout(this.redTimeout);
      this.redTimeout = undefined;
    }

    const redVal = Math.ceil(state as number / 12.5);
    this.stageKit?.SetRed(this.ledsToInt(redVal));

    callback();

    this.redTimeout = setTimeout(() => {
      if (this.accessory) {
        const red = this.accessory.getService('Red Lights');
        if (red) {
          red.updateCharacteristic(hap.Characteristic.Brightness, redVal * 12.5);
        }
        this.redTimeout = undefined;
      }
    }, 1000);
  }

  setRedToggle(state: CharacteristicValue, callback: CharacteristicSetCallback): void {
    if (!this.accessory) {
      callback();
      return;
    }

    const red = this.accessory.getService('Red Lights');
    if (red) {
      const on = red.getCharacteristic(hap.Characteristic.On).value;
      if (state && !on) {
        const redVal = red.getCharacteristic(hap.Characteristic.Brightness).value;
        this.setRed(redVal, callback);
      } else if (!state && on) {
        this.setRed(0, callback);
      } else {
        callback();
      }
    } else {
      callback();
    }
  }

  setYellow(state: Nullable<CharacteristicValue>, callback: CharacteristicSetCallback): void {
    if (!this.accessory) {
      callback();
      return;
    }

    if (this.yellowTimeout) {
      clearTimeout(this.yellowTimeout);
      this.yellowTimeout = undefined;
    }

    const yellowVal = Math.ceil(state as number / 12.5);
    this.stageKit?.SetYellow(this.ledsToInt(yellowVal));

    callback();

    this.yellowTimeout = setTimeout(() => {
      if (this.accessory) {
        const yellow = this.accessory.getService('Yellow Lights');
        if (yellow) {
          yellow.updateCharacteristic(hap.Characteristic.Brightness, yellowVal * 12.5);
        }
        this.yellowTimeout = undefined;
      }
    }, 1000);
  }

  setYellowToggle(state: CharacteristicValue, callback: CharacteristicSetCallback): void {
    if (!this.accessory) {
      callback();
      return;
    }

    const yellow = this.accessory.getService('Yellow Lights');
    if (yellow) {
      const on = yellow.getCharacteristic(hap.Characteristic.On).value;
      if (state && !on) {
        const yellowVal = yellow.getCharacteristic(hap.Characteristic.Brightness).value;
        this.setYellow(yellowVal, callback);
      } else if (!state && on) {
        this.setYellow(0, callback);
      } else {
        callback();
      }
    } else {
      callback();
    }
  }

  setGreen(state: Nullable<CharacteristicValue>, callback: CharacteristicSetCallback): void {
    if (!this.accessory) {
      callback();
      return;
    }

    if (this.greenTimeout) {
      clearTimeout(this.greenTimeout);
      this.greenTimeout = undefined;
    }

    const greenVal = Math.ceil(state as number / 12.5);
    this.stageKit?.SetGreen(this.ledsToInt(greenVal));

    callback();

    this.greenTimeout = setTimeout(() => {
      if (this.accessory) {
        const green = this.accessory.getService('Green Lights');
        if (green) {
          green.updateCharacteristic(hap.Characteristic.Brightness, greenVal * 12.5);
        }
        this.greenTimeout = undefined;
      }
    }, 1000);
  }

  setGreenToggle(state: CharacteristicValue, callback: CharacteristicSetCallback): void {
    if (!this.accessory) {
      callback();
      return;
    }

    const green = this.accessory.getService('Green Lights');
    if (green) {
      const on = green.getCharacteristic(hap.Characteristic.On).value;
      if (state && !on) {
        const greenVal = green.getCharacteristic(hap.Characteristic.Brightness).value;
        this.setGreen(greenVal, callback);
      } else if (!state && on) {
        this.setGreen(0, callback);
      } else {
        callback();
      }
    } else {
      callback();
    }
  }

  setBlue(state: Nullable<CharacteristicValue>, callback: CharacteristicSetCallback): void {
    if (!this.accessory) {
      callback();
      return;
    }

    if (this.blueTimeout) {
      clearTimeout(this.blueTimeout);
      this.blueTimeout = undefined;
    }

    const blueVal = Math.ceil(state as number / 12.5);
    this.stageKit?.SetBlue(this.ledsToInt(blueVal));

    callback();

    this.blueTimeout = setTimeout(() => {
      if (this.accessory) {
        const blue = this.accessory.getService('Blue Lights');
        if (blue) {
          blue.updateCharacteristic(hap.Characteristic.Brightness, blueVal * 12.5);
        }
        this.blueTimeout = undefined;
      }
    }, 1000);
  }

  setBlueToggle(state: CharacteristicValue, callback: CharacteristicSetCallback): void {
    if (!this.accessory) {
      callback();
      return;
    }

    const blue = this.accessory.getService('Blue Lights');
    if (blue) {
      const on = blue.getCharacteristic(hap.Characteristic.On).value;
      if (state && !on) {
        const blueVal = blue.getCharacteristic(hap.Characteristic.Brightness).value;
        this.setBlue(blueVal, callback);
      } else if (!state && on) {
        this.setBlue(0, callback);
      } else {
        callback();
      }
    } else {
      callback();
    }

  }

  randomLeds(): void {
    if (!this.accessory) {
      return;
    }

    const redVal = Math.round(Math.random() * 255);
    const yellowVal = Math.round(Math.random() * 255);
    const greenVal = Math.round(Math.random() * 255);
    const blueVal = Math.round(Math.random() * 255);

    this.stageKit?.SetRed(redVal);
    this.stageKit?.SetYellow(yellowVal);
    this.stageKit?.SetGreen(greenVal);
    this.stageKit?.SetBlue(blueVal);

    const red = this.accessory.getService('Red Lights');
    if (red) {
      red
        .updateCharacteristic(hap.Characteristic.On, true)
        .updateCharacteristic(hap.Characteristic.Brightness, this.intToLeds(redVal) * 12.5);
    }
    const yellow = this.accessory.getService('Yellow Lights');
    if (yellow) {
      yellow
        .updateCharacteristic(hap.Characteristic.On, true)
        .updateCharacteristic(hap.Characteristic.Brightness, this.intToLeds(yellowVal) * 12.5);
    }
    const green = this.accessory.getService('Green Lights');
    if (green) {
      green
        .updateCharacteristic(hap.Characteristic.On, true)
        .updateCharacteristic(hap.Characteristic.Brightness, this.intToLeds(greenVal) * 12.5);
    }
    const blue = this.accessory.getService('Blue Lights');
    if (blue) {
      blue
        .updateCharacteristic(hap.Characteristic.On, true)
        .updateCharacteristic(hap.Characteristic.Brightness, this.intToLeds(blueVal) * 12.5);
    }
  }

  partyMode(state: CharacteristicValue, callback: CharacteristicSetCallback): void {
    if (!this.accessory) {
      callback();
      return;
    }

    if (state) {
      if (!this.partyInterval) {
        this.partyInterval = setInterval(this.randomLeds.bind(this), this.config.party_mode_seconds * 1000);
      }
    } else {
      if (this.partyInterval) {
        clearInterval(this.partyInterval);
        this.partyInterval = undefined;
      }

      this.stageKit?.SetRed(0);
      this.stageKit?.SetYellow(0);
      this.stageKit?.SetGreen(0);
      this.stageKit?.SetBlue(0);

      const red = this.accessory.getService('Red Lights');
      if (red) {
        red
          .updateCharacteristic(hap.Characteristic.On, false)
          .updateCharacteristic(hap.Characteristic.Brightness, 100);
      }
      const yellow = this.accessory.getService('Yellow Lights');
      if (yellow) {
        yellow
          .updateCharacteristic(hap.Characteristic.On, false)
          .updateCharacteristic(hap.Characteristic.Brightness, 100);
      }
      const green = this.accessory.getService('Green Lights');
      if (green) {
        green
          .updateCharacteristic(hap.Characteristic.On, false)
          .updateCharacteristic(hap.Characteristic.Brightness, 100);
      }
      const blue = this.accessory.getService('Blue Lights');
      if (blue) {
        blue
          .updateCharacteristic(hap.Characteristic.On, false)
          .updateCharacteristic(hap.Characteristic.Brightness, 100);
      }
    }

    callback();
  }

  configureAccessory(accessory: PlatformAccessory): void {
    accessory.on(PlatformAccessoryEvent.IDENTIFY, () => {
      this.log(accessory.displayName + ' identify requested!');
    });
    accessory.getService('Panic')?.getCharacteristic(hap.Characteristic.On)
      .on('set', this.panic.bind(this));
    accessory.getService('Fog Machine')?.getCharacteristic(hap.Characteristic.On)
      .on('set', this.setFog.bind(this));
    accessory.getService('Strobe Light')?.getCharacteristic(hap.Characteristic.Brightness)
      .on('set', this.setStrobe.bind(this));
    accessory.getService('Strobe Light')?.getCharacteristic(hap.Characteristic.On)
      .on('set', this.setStrobeToggle.bind(this));
    accessory.getService('Red Lights')?.getCharacteristic(hap.Characteristic.Brightness)
      .on('set', this.setRed.bind(this));
    accessory.getService('Red Lights')?.getCharacteristic(hap.Characteristic.On)
      .on('set', this.setRedToggle.bind(this));
    accessory.getService('Yellow Lights')?.getCharacteristic(hap.Characteristic.Brightness)
      .on('set', this.setYellow.bind(this));
    accessory.getService('Yellow Lights')?.getCharacteristic(hap.Characteristic.On)
      .on('set', this.setYellowToggle.bind(this));
    accessory.getService('Green Lights')?.getCharacteristic(hap.Characteristic.Brightness)
      .on('set', this.setGreen.bind(this));
    accessory.getService('Green Lights')?.getCharacteristic(hap.Characteristic.On)
      .on('set', this.setGreenToggle.bind(this));
    accessory.getService('Blue Lights')?.getCharacteristic(hap.Characteristic.Brightness)
      .on('set', this.setBlue.bind(this));
    accessory.getService('Blue Lights')?.getCharacteristic(hap.Characteristic.On)
      .on('set', this.setBlueToggle.bind(this));

    let party = accessory.getService('Party Mode');
    if (party && !this.config.party_mode_seconds) {
      accessory.removeService(party);
      party = undefined;
    } else if (!party && this.config.party_mode_seconds) {
      party = accessory.addService(hap.Service.Switch, 'Party Mode', 'Party Mode');
    }
    if (party) {
      party.getCharacteristic(hap.Characteristic.On)
        .on('set', this.partyMode.bind(this));
    }

    const eventfile = this.stageKit?.eventfile;
    const accInfo = accessory.getService(hap.Service.AccessoryInformation);
    if (accInfo && eventfile) {
      accInfo.setCharacteristic(hap.Characteristic.SerialNumber, eventfile);
    }

    this.accessory = accessory;

    this.panic();
  }

  addAccessory(): void {
    if (!this.accessory) {
      const uuid = hap.uuid.generate('RockBand StageKit');
      const accessory = new Accessory('StageKit', uuid);

      const accInfo = accessory.getService(hap.Service.AccessoryInformation);
      if (accInfo) {
        accInfo
          .setCharacteristic(hap.Characteristic.Manufacturer, 'PDP')
          .setCharacteristic(hap.Characteristic.Model, 'RockBand StageKit');
      }

      accessory.addService(hap.Service.Switch, 'Panic', 'Panic');
      accessory.addService(hap.Service.Switch, 'Fog Machine', 'Fog Machine');
      accessory.addService(hap.Service.Lightbulb, 'Strobe Light', 'Strobe Light')
        .addCharacteristic(hap.Characteristic.Brightness);
      accessory.addService(hap.Service.Lightbulb, 'Red Lights', 'Red Lights')
        .addCharacteristic(hap.Characteristic.Brightness);
      accessory.addService(hap.Service.Lightbulb, 'Yellow Lights', 'Yellow Lights')
        .addCharacteristic(hap.Characteristic.Brightness);
      accessory.addService(hap.Service.Lightbulb, 'Green Lights', 'Green Lights')
        .addCharacteristic(hap.Characteristic.Brightness);
      accessory.addService(hap.Service.Lightbulb, 'Blue Lights', 'Blue Lights')
        .addCharacteristic(hap.Characteristic.Brightness);

      this.configureAccessory(accessory);

      this.api.registerPlatformAccessories('homebridge-stagekit', 'stagekit', [accessory]);
    }
  }
}

export = (api: API): void => {
  hap = api.hap;
  Accessory = api.platformAccessory;

  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, StageKitPlatform);
};