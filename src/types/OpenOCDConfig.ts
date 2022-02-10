
export interface OpenOCDConfigurationInterface {
  interface: string;
  openocdTarget: string;
}

import { standardOpenOCDInterface } from '../Definitions';

export class OpenOCDConfiguration implements OpenOCDConfigurationInterface {
  public openocdTarget: string;
  public interface: string;
  public constructor(openocdTarget: string) {
    this.openocdTarget = openocdTarget;
    this.interface = standardOpenOCDInterface;
  }
}