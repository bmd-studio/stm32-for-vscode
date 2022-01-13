import * as Definitions from '../../Definitions';
import * as path from 'path';
import * as vscode from 'vscode';
import { afterEach, suite, test } from 'mocha';

import { installAllTools } from '../../buildTools/installTools';

// suite('build tools test', () => {
//   test('install build tools', async () => {
//     try {
//       const currentExtensionContext: vscode.ExtensionContext = {

//       } as vscode.ExtensionContext;
//       vscode.extensions.getExtension('stm32-for-vscode')?.exports;
//       // await installAllTools()
//     } catch (error) {

//     }
//   }).timeout(10 * 60 * 1000);
// });