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
        'dependency-advisor.inspectCurrentProject', async () => {
            const workspaceFolders = vscode.workspace.workspaceFolders;

            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showInformationMessage(
                    'No workspace folder is currently open. Open a project folder and try again.'
                );
                return;
            }

			const pomFiles = await vscode.workspace.findFiles("**/pom.xml");
			
            outputChannel.clear();
            outputChannel.appendLine('Dependency Advisor - Current Workspace');
            outputChannel.appendLine(`Detected ${workspaceFolders.length} workspace folder(s).`);
            outputChannel.appendLine('');

            for (const folder of workspaceFolders) {
                outputChannel.appendLine(`Name: ${folder.name}`);
                outputChannel.appendLine(`Path: ${folder.uri.fsPath}`);
                outputChannel.appendLine('');
            }

            if (pomFiles.length === 0) {
                outputChannel.appendLine('No pom.xml files found.');
            } else {
                outputChannel.appendLine(`Found ${pomFiles.length} pom.xml file(s).`);
                for (const pomFile of pomFiles) {
                    outputChannel.appendLine(`POM: ${pomFile.fsPath}`);
                }
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