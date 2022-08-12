export const testGlobFiles = [
  '**/*/globby/mc/globface',
  'th3/gl0bst35',
  './gl0b@licious',
  'node_modules',
];

export const ignoreComments = [
  '#files that should be ignored by the STM32 For VSCode extension.',
  '#Use standard .ignore (e.g .gitignore) glob patters',
];

let testSTMIgnoreFile = '';
ignoreComments.forEach((comment) => {
  testSTMIgnoreFile += comment;
  testSTMIgnoreFile += '\r\n';
});

testGlobFiles.forEach((fileName, index) => {
  testSTMIgnoreFile += fileName;
  // for line ending testing
  if (index % 3 === 0) {
    testSTMIgnoreFile += '\r\n';
  } else {
    testSTMIgnoreFile += '\n';
  }
});


export default testSTMIgnoreFile;
