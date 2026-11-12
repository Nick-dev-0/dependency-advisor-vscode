import * as vscode from 'vscode';
import { parseMavenPom } from './maven/parser';

export function activate(context: vscode.ExtensionContext): void {
    console.log('Dependency Advisor is now active.');

    const outputChannel = vscode.window.createOutputChannel('Dependency Advisor');
    context.subscriptions.push(outputChannel);

    const inspectProjectCommand = vscode.commands.registerCommand(
        'dependency-advisor.inspectCurrentProject', async () => {
            const workspaceFolders = vscode.workspace.workspaceFolders;

            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showInformationMessage(
                    'No workspace folder is currently open. Open a project folder and try again.'
                );
                return;
            }

            const pomFiles = await vscode.workspace.findFiles('**/pom.xml');

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

                    const pomContent = await vscode.workspace.fs.readFile(pomFile);
                    const pomText = new TextDecoder('utf-8').decode(pomContent);
                    const mavenProject = parseMavenPom(pomText);

                    outputChannel.appendLine(`Project artifactId: ${mavenProject.artifactId}`);
                    outputChannel.appendLine(`Project groupId: ${mavenProject.groupId ?? '(not declared in this POM)'}`);
                    outputChannel.appendLine(`Project version: ${mavenProject.version ?? '(not declared in this POM)'}`);

                    if (mavenProject.parent) {
                        outputChannel.appendLine(
                            `Parent: ${mavenProject.parent.groupId}:${mavenProject.parent.artifactId}:${mavenProject.parent.version}`
                        );
                    }

                    for (const dependency of mavenProject.dependencies) {
                        outputChannel.appendLine(`${dependency.groupId}:${dependency.artifactId}`);
                        outputChannel.appendLine(`Version: ${dependency.version ?? '(not declared here)'}`);
                        outputChannel.appendLine(`Scope: ${dependency.scope ?? 'compile (Maven default)'}`);
                    }
                }
            }

            outputChannel.show(true);

            vscode.window.showInformationMessage(
                `Dependency Advisor found ${workspaceFolders.length} workspace folder(s).`
            );
        }
    );

    context.subscriptions.push(inspectProjectCommand);
}

export function deactivate(): void {}