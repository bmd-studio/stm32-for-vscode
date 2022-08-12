/* eslint-disable max-len */
const testsReadmeMD = `
# Tests folder
The tests folder is a folder containing al the setup for the tests, separate tests can be written here, however they can also exist in the; Core and libraries folders. A test can be indicated by naming it with test.c e.g. factorial.test.c.
## How it works
The STM32 for VSCode extension will scan the tests,Core and libraries folder for .test.c/cpp files. These test will be compiled and will run on the host machine (P.C.).
## Configuration
By default the tests will compile with the TEST flag, with debugging enabled. For additional configuration testFlags can be added in the STM32 for VSCode configuration file. Test files can be added manually by adding them to the sourceFiles.
`;

export default testsReadmeMD;
