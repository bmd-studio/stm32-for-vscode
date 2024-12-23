import * as vscode from "vscode";
import { forEach } from "lodash";

export interface BuildCommandDefinition {
  label: string;
  command: string;
  explanation: string;
  arguments?: string[];
}
// TODO: make a release and debug section in the menu
const buildCommand: BuildCommandDefinition = {
  label: 'Build',
  command: 'stm32-for-vscode.build',
  explanation: 'Builds the firmware for the STM32 project.',
};
const buildReleaseCommand: BuildCommandDefinition = {
  label: 'Build Release',
  command: 'stm32-for-vscode.buildRelease',
  explanation: 'Builds the firmware for the STM32 project, using the specified optimisation in the configuration file.',
};
const cleanBuildCommand: BuildCommandDefinition = {
  label: 'Clean Build',
  command: 'stm32-for-vscode.cleanBuild',
  explanation: 'Performs a clean build by removing earlier build files and building from scratch.',
};
const flashCommand: BuildCommandDefinition = {
  label: 'Flash STM32',
  command: 'stm32-for-vscode.flash',
  explanation: 'Builds and subsequently flashes the firmware to the STM32 MCU.',
};
const flashReleaseCommand: BuildCommandDefinition = {
  label: 'Flash Release STM32',
  command: 'stm32-for-vscode.flashRelease',
  explanation: 'Builds and subsequently flashes the release firmware to the STM32 MCU.',
};
const debugCommand: BuildCommandDefinition = {
  label: 'Debug STM32',
  command: 'workbench.action.debug.start',
  arguments: ['Debug STM32'],
  explanation: 'Starts a debugging session for the STM32 MCU.',
};
const changeProgrammerCommand: BuildCommandDefinition = {
  label: 'Change Programmer',
  command: 'stm32-for-vscode.setProgrammer',
  explanation: `Changes the programming interface in the openocd.cfg file. 
  Select from a list of available programmers.`,
};
const importCubeProject: BuildCommandDefinition = {
  label: "Run CubeIDE Importer",
  command: 'stm32-for-vscode.importCubeIDEProject',
  explanation: 'Imports a CubeIDE project or example project when present in the current workspace.'
};

const COMMANDS: { [key: string]: BuildCommandDefinition } = {
  buildCommand,
  buildReleaseCommand,
  cleanBuildCommand,
  flashCommand,
  flashReleaseCommand,
  debugCommand,
  changeProgrammerCommand,
  importCubeProject
};

class BuildCommand extends vscode.TreeItem {
  public constructor(
    label: string,
    explanation: string,
    command: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    args?: string[],
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}: ${explanation}`;
    this.description = '';
    this.command = {
      command,
      arguments: args,
      title: label,
    };
  }
}

export default class CommandMenuProvider implements vscode.TreeDataProvider<BuildCommand> {
  private context: vscode.ExtensionContext;
  public constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public getTreeItem(element: BuildCommand): vscode.TreeItem {
    return element;
  }
  public getChildren(): BuildCommand[] {
    const hasBuildTools = this.context.globalState.get('hasBuildTools');
    if (!hasBuildTools) {
      setTimeout(() => {
        this.refresh();
      }, 1000);
      return [];
    }

    const commands: BuildCommand[] = [];
    forEach(COMMANDS, (command: BuildCommandDefinition) => {
      commands.push(
        new BuildCommand(
          command.label,
          command.explanation,
          command.command,
          vscode.TreeItemCollapsibleState.None,
          command?.arguments
        )
      );
    });
    return commands;
  }
  // eslint-disable-next-line max-len
  private _onDidChangeTreeData: vscode.EventEmitter<BuildCommand | undefined> = new vscode.EventEmitter<BuildCommand | undefined>();
  public readonly onDidChangeTreeData: vscode.Event<BuildCommand | undefined> = this._onDidChangeTreeData.event;

  public refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }
}

