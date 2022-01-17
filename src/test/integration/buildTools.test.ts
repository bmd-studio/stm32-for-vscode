import * as Definitions from '../../Definitions';
import * as path from 'path';
import * as vscode from 'vscode';

import { afterEach, suite, test } from 'mocha';

// import { installAllTools } from '../../buildTools/installTools';

suite('build tools test', () => {
  test('install build tools', async () => {
    try {
      await vscode.extensions.getExtension('bmd.stm32-for-vscode')?.exports.installTools();
      // await installAllTools()
    } catch (error) {

    }
  }).timeout(10 * 60 * 1000);
});