import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
    console.log('Dependency Advisor is now active.');

    const outputChannel = vscode.window.createOutputChannel('Dependency Advisor');
    context.subscriptions.push(outputChannel);

    const helloWorldCommand = vscode.commands.registerCommand(
        'dependency-advisor.helloWorld', () => {
            vscode.window.showInformationMessage('Hello World from Dependency Advisor!');
        }
    );

    const inspectProjectCommand = vscode.commands.registerCommand(
        'dependency-advisor.inspectCurrentProject', () => {
            const workspaceFolders = vscode.workspace.workspaceFolders;

            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showInformationMessage(
                    'No workspace folder is currently open. Open a project folder and try again.'
                );
                return;
            }

            outputChannel.clear();
            outputChannel.appendLine('Dependency Advisor - Current Workspace');
            outputChannel.appendLine(`Detected ${workspaceFolders.length} workspace folder(s).`);
            outputChannel.appendLine('');

            for (const folder of workspaceFolders) {
                outputChannel.appendLine(`Name: ${folder.name}`);
                outputChannel.appendLine(`Path: ${folder.uri.fsPath}`);
                outputChannel.appendLine('');
            }

            outputChannel.show(true);

            vscode.window.showInformationMessage(
                `Dependency Advisor found ${workspaceFolders.length} workspace folder(s).`
            );
        }
    );

    context.subscriptions.push(helloWorldCommand, inspectProjectCommand);
}

export function deactivate(): void {}