function makeCmd(armPath) {
  let cmd = 'make -f stm32make';
  if (armPath) {
    cmd += ` -e GCC_PATH=${armPath}`;
  }
  return cmd;
}

module.exports = makeCmd;
