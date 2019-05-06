const yargs = require('yargs');
const { init, checkForRequirements } = require('./init');
const shell = require('shelljs');

const { argv } = yargs
  .version()
  .usage('Usage: vscodeSTM <command> [options]')
  .command('build <location>', 'start the build process, this also checks and updates the makefile if needed', () => {}, (argv) => {
    buildAndUpdate(argv);
  })
  .help('h')
  .alias('h', 'help')
  .epilogue('For more information visit: https://marketplace.visualstudio.com/items?itemName=bmd.stm32-for-vscode')
  .coerce({
    JSONSpec: JSON.parse,
  });


function buildAndUpdate(args) {
  // console.log('current dir', __dirname);
  // check beforehand
  checkForRequirements(console.error);
  init(args.location).then((val) => {
    console.log('done with building, going to make');
    shell.exec('make');
  });
}
