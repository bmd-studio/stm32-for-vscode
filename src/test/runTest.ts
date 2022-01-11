import * as cp from 'child_process';
import * as path from 'path';

import {
  downloadAndUnzipVSCode,
  resolveCliPathFromVSCodeExecutablePath,
  runTests
} from '@vscode/test-electron';

async function main(): Promise<void> {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to test runner
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    const vscodeExecutablePath = await downloadAndUnzipVSCode('stable');
    const cliPath = resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath);
    const testWorkspace = path.resolve(__dirname, '../../src/test/STM32-projects/H753ZI_fresh');
    console.log({ testWorkspace });

    cp.spawnSync(cliPath, ['--install-extension', 'marus25.cortex-debug'], {
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    // Download VS Code, unzip it and run the integration test
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        testWorkspace,
        // "-—disable-extensions",
        // "--enable-proposed-api marus25.cortex-debug",
        // 'marus25.cortex-debug',
        // testWorkspace,
        // '-n'
      ]
    });
  } catch (err) {
    // console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
