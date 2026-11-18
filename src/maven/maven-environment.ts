import { stat } from 'node:fs/promises';
import * as path from 'node:path';

export interface MavenEnvironment {
    source: 'wrapper' | 'global';
    executable: string;
    version?: string;
}

async function isFile(filePath: string): Promise<boolean> {
    try {
        return (await stat(filePath)).isFile();
    } catch {
        return false;
    }
}

export async function findMavenWrapper(projectDirectory: string, workspaceRoot: string): Promise<MavenEnvironment | undefined> {
    const rootDirectory = path.resolve(workspaceRoot);
    let currentDirectory = path.resolve(projectDirectory);

    const relativePath = path.relative(rootDirectory, currentDirectory);

    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        return undefined;
    }

    const wrapperScript = process.platform === 'win32' ? 'mvnw.cmd' : 'mvnw';

    while (true) {
        const executable = path.join(currentDirectory, wrapperScript);
        const propertiesFile = path.join(currentDirectory, '.mvn', 'wrapper', 'maven-wrapper.properties');

        const wrapperExists = await isFile(executable);
        const propertiesExist = await isFile(propertiesFile);

        if (wrapperExists && propertiesExist) {
            return {
                source: 'wrapper',
                executable
            };
        }

        if (currentDirectory === rootDirectory) {
            break;
        }

        const parentDirectory = path.dirname(currentDirectory);

        if (parentDirectory === currentDirectory) {
            break;
        }

        currentDirectory = parentDirectory;
    }

    return undefined;
}