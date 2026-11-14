# Dependency Advisor

Dependency Advisor is a VS Code extension I'm building to make it easier to inspect and understand the dependencies used in a project.

The main goal is to help developers get a better understanding of their project's dependencies, including their versions, compatibility and security information. I'm starting with Maven projects and plan to add support for other package managers as the project develops.

## Current Features

The extension currently supports basic Maven project discovery and POM parsing.

1. Detects the workspace folders currently open in VS Code.
2. Searches the workspace for `pom.xml` files.
3. Reads and parses Maven POM files.
4. Extracts project information such as `groupId`, `artifactId` and `version`.
5. Extracts parent POM information.
6. Identifies declared dependencies and their versions and scopes.

## Current Limitations

This project is still under development.

Maven dependency parsing is currently focused on the information directly declared in a POM. It does not yet resolve effective dependency versions through parent POMs, dependency management, imported BOMs or Maven properties.

The extension currently focuses on Maven. Support for other ecosystems has not been implemented yet.

## Technologies

The project currently uses:

1. TypeScript
2. Node.js
3. Visual Studio Code Extension API
4. fast-xml-parser for XML parsing
5. Mocha and Node.js Assert for testing

## Getting Started

### Requirements

1. Visual Studio Code
2. Node.js
3. npm

### Clone the repository

```powershell
git clone https://github.com/Nick-dev-0/dependency-advisor-vscode.git
cd dependency-advisor-vscode
```

### Install dependencies

```powershell
npm install
```

### Open the project

```powershell
code .
```

Press `F5` in VS Code to start the Extension Development Host.

Open a project folder and use the Command Palette with `Ctrl + Shift + P`.

Search for:

`Dependency Advisor: Inspect Current Project`

The extension will inspect the open workspace and display the discovered project information in the Output panel.

## Testing

Run the unit tests with:

```powershell
npm test
```

This compiles the TypeScript code, runs ESLint and executes the unit tests.

To run the VS Code extension tests, use:

```powershell
npm run test:extension
```

## Planned Work

Some of the things I plan to work on next:

1. Resolving dependency versions through Maven parent POMs and dependency management.
2. Supporting imported BOMs and Maven properties.
3. Integrating package registry information.
4. Checking dependencies for known security vulnerabilities.
5. Providing dependency recommendations based on the current project.
6. Adding support for other ecosystems such as Gradle, and npm.

## Development

This project is being developed incrementally. I'm focusing on getting the Maven functionality working properly before expanding into other ecosystems.

Suggestions and feedback are welcome.