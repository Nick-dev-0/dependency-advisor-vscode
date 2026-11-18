import { access, constants, stat } from 'node:fs/promises';
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

async function isExecutableFile(filePath: string): Promise<boolean> {
    try {
        const fileStats = await stat(filePath);

        if (!fileStats.isFile()) {
            return false;
        }

        if (process.platform !== 'win32') {
            await access(filePath, constants.X_OK);
        }

        return true;
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

        const wrapperExists = await isExecutableFile(executable);
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

export async function findGlobalMaven(searchPath: string | undefined = process.env.PATH): Promise<MavenEnvironment | undefined> {
    if (!searchPath) {
        return undefined;
    }

    const directories = searchPath.split(path.delimiter);

    const executableNames = process.platform === 'win32'
        ? (process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';').map((extension) => `mvn${extension.toLowerCase()}`) : ['mvn'];

    for (const directoryEntry of directories) {
        const directory = directoryEntry.trim().replace(/^"(.*)"$/, '$1');

        if (!directory) {
            continue;
        }

        for (const executableName of executableNames) {
            const executable = path.join(directory, executableName);

            if (await isExecutableFile(executable)) {
                return {
                    source: 'global',
                    executable
                };
            }
        }
    }

    return undefined;
}

export async function findMavenEnvironment(projectDirectory: string, workspaceRoot: string, searchPath: string | undefined = process.env.PATH): Promise<MavenEnvironment | undefined> {
    const mavenWrapper = await findMavenWrapper(projectDirectory, workspaceRoot);

    if (mavenWrapper) {
        return mavenWrapper;
    }

    return findGlobalMaven(searchPath);
}