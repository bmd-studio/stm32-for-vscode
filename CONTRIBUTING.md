# Contributing to STM32 Development Extension

Thank you for your interest in contributing to the STM32 Development Extension for VS Code! This document provides guidelines and instructions to help you get started.

## Getting Started

### Prerequisites

- **Node.js**: Ensure you have Node.js v20 installed. We recommend using the latest major LTS version when contributing.
    * Use `nvm` (Node Version Manager) to install `npm` (Node Package Manager).
- **VS Code**: Install the latest version of VS Code, preferably the Insider version.

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bmd-studio/stm32-for-vscode
cd stm32-for-vscode
```

2. Install dependencies:
```bash
npm install
```

### Running the Extension

To run and debug the extension:

1. Open the project in VS Code.
2. Use the "Extension" debugging configuration provided in the `launch.json` file.

### Running Tests

To run all tests and compile the code:

```bash
npm run test
```

This command will compile the code and run all tests using the pretest script automatically.

To run only unit tests:

```bash
npm run test:unit
```

### Compiling
Compilation should run automatically when you execute the tests.

## Additional Notes
We appreciate your contributions and suggestions. If you have any questions or need further assistance, feel free to open an issue or contact the maintainers.

Thank you for contributing!

### Learn More

* The [VS Code "Your First Extension" guide](https://code.visualstudio.com/api/get-started/your-first-extension) is a great resource for learning how to create and contribute to VS Code extensions.
