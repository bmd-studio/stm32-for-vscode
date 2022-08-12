import { suite, test } from 'mocha';
import { expect } from 'chai';
import createMakefile, {
  createGCCPathOutput,
  createSingleLineStringList,
  createStringList,
} from '../../CreateMakefile';

import MakeInfo from '../../types/MakeInfo';

// TODO: add library testing in the mix.
// TODO: add a test for adding flags.
suite('CreateMakefile', () => {
  test('check for proper line endings on string list', () => {
    const testEntries = ['hi', 'hello', 'some/filename.txt'];
    const expectedResult = 'hello \\\nhi \\\nsome/filename.txt\n';
    const result = createStringList(testEntries);
    expect(result).to.equal(expectedResult);
  });

  test('single line stringlist', () => {
    const testArray = ['hello', 'beautiful', 'world'];
    const expectedResult = 'beautiful hello world ';
    const result = createSingleLineStringList(testArray);
    expect(result).to.equal(expectedResult);
  });
  test('outputs empty string on empty array', () => {
    const result = createStringList([]);
    expect(result).to.equal('');
  });
  test('if GCC Path is not added when gcc is in path', () => {
    const makeInfo = new MakeInfo();
    makeInfo.tools.armToolchainPath = '.';
    expect(createGCCPathOutput(makeInfo)).to.equal('');
  });
  test('if custom makefileRules are added', () => {
    const makeInfo = new MakeInfo();
    const customMakefileRules = [
      {
        command: 'sayhi',
        rule: 'echo sayhi',
      },
    ];
    makeInfo.customMakefileRules = customMakefileRules;
    const makefileOutput = createMakefile(makeInfo);
    expect(makefileOutput).to.contain(customMakefileRules[0].command);
    expect(makefileOutput).to.contain(customMakefileRules[0].rule);
  });
});
