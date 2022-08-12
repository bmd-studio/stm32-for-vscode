import { standardOpenOCDInterface } from '../Definitions';

export interface OpenOCDConfigurationInterface {
  interface: string;
  targetMCU: string;
}

export class OpenOCDConfiguration implements OpenOCDConfigurationInterface {
  public targetMCU: string;

  public interface: string;

  public constructor(targetMCU: string) {
    this.targetMCU = targetMCU;
    this.interface = standardOpenOCDInterface;
  }
}
