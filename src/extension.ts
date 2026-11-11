import * as vscode from 'vscode';
import { XMLParser } from 'fast-xml-parser';
import type { MavenDependency } from './models/maven';
import { isMavenDependency } from './maven/validation';

export function activate(context: vscode.ExtensionContext): void {
    console.log('Dependency Advisor is now active.');

    const outputChannel = vscode.window.createOutputChannel('Dependency Advisor');
    const xmlParser = new XMLParser({ processEntities: false, parseTagValue: false });
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

                    const pomContent = await vscode.workspace.fs.readFile(pomFile);
                    const pomText = new TextDecoder('utf-8').decode(pomContent);
                    const pomObject = xmlParser.parse(pomText);

                    const artifactId = pomObject.project.artifactId;
                    const groupId = pomObject.project.groupId;
                    const version = pomObject.project.version;

                    const rawDependencies: unknown = pomObject.project?.dependencies?.dependency;
                
                    const dependencyElements = Array.isArray(rawDependencies)
                        ? rawDependencies : rawDependencies
                        ? [rawDependencies] : [];

                    const mavenDependencies: MavenDependency[] = dependencyElements
                        .filter(isMavenDependency)
                        .map((dependency) => ({
                            groupId: dependency.groupId,
                            artifactId: dependency.artifactId,
                            version: dependency.version,
                            scope: dependency.scope
                        }));

                    outputChannel.appendLine(`Project artifactId: ${artifactId}`);
                    outputChannel.appendLine(`Project groupId: ${groupId}`);
                    outputChannel.appendLine(`Project version: ${version}`);

                    for (const dependency of mavenDependencies) {
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

    context.subscriptions.push(helloWorldCommand, inspectProjectCommand);
}

export function deactivate(): void {}