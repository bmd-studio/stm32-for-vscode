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


    const vscodeExecutablePath = await downloadAndUnzipVSCode('stable');
    const cliPath = resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath);
    const testWorkspace = path.resolve(__dirname, '../../src/test/STM32-projects/H753ZI_fresh');
    const testExensionPath = path.resolve(__dirname, '.vscode-test/extensions');
    const testPaths = {
      all: path.resolve(__dirname, './suite/index'),
      unit: path.resolve(__dirname, './unit/index'),
      build: path.resolve(__dirname, './integration/build.test'),
      emptyWorkspace: path.resolve(__dirname, './integration/emptyBuildTask.test')
    };

    const testWorkspaces = {
      makefileH7: path.resolve(__dirname, '../../src/test/workspaces/H753ZI'),
      empty: path.resolve(__dirname, '../../src/test/workspaces/empty'),
      cubeIDEExample: path.resolve(
        __dirname,
        '../../src/test/workspaces/CubeIdeExample/Projects/NUCLEO-G071RB/Applications/FreeRTOS/FreeRTOS_Mail'
      ),
    };

    cp.spawnSync(cliPath, [
      '--extensions-dir',
      testExensionPath,
      '--install-extension',
      'marus25.cortex-debug'
    ], {
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    // default unit test, should not matter where it runs
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath: testPaths.unit,
      launchArgs: [
        testWorkspaces.empty,
        '--extensions-dir',
        testExensionPath
      ]
    });

    // Download VS Code, unzip it and run the integration test
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath: testPaths.build,
      launchArgs: [
        testWorkspaces.makefileH7,
        '--extensions-dir',
        testExensionPath
      ]
    });
    // TODO: implement import example.
    // await runTests({
    //   vscodeExecutablePath,
    //   extensionDevelopmentPath,
    //   extensionTestsPath: testPaths.build,
    //   launchArgs: [
    //     testWorkspaces.cubeIDEExample,
    //     '--extensions-dir',
    //     testExensionPath
    //     // "-—disable-extensions",
    //     // "--enable-proposed-api marus25.cortex-debug",
    //     // 'marus25.cortex-debug',
    //     // testWorkspace,
    //     // '-n'
    //   ]
    // });
  } catch (err) {
    // console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
