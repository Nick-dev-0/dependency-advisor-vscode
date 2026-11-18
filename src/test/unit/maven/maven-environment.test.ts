import * as assert from 'assert';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { findMavenWrapper } from '../../../maven/maven-environment';

async function withTemporaryDirectory(callback: (directory: string) => Promise<void>): Promise<void> {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'dependency-advisor-'));

    try {
        await callback(directory);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
}

async function createMavenWrapper(directory: string): Promise<string> {
    const wrapperScript = process.platform === 'win32' ? 'mvnw.cmd' : 'mvnw';
    const executable = path.join(directory, wrapperScript);
    const propertiesDirectory = path.join(directory, '.mvn', 'wrapper');

    await mkdir(propertiesDirectory, { recursive: true });
    await writeFile(executable, '');
    await writeFile(path.join(propertiesDirectory, 'maven-wrapper.properties'), 'distributionUrl=https://example.invalid/apache-maven-3.9.16-bin.zip');

    return executable;
}

suite('Maven Environment', () => {

    test('finds a Maven Wrapper in the project root', async () => {
        await withTemporaryDirectory(async (directory) => {
            const executable = await createMavenWrapper(directory);

            const result = await findMavenWrapper(directory, directory);

            assert.deepStrictEqual(result, {
                source: 'wrapper',
                executable
            });
        });
    });

    test('finds a Maven Wrapper in a parent directory', async () => {
        await withTemporaryDirectory(async (rootDirectory) => {
            const moduleDirectory = path.join(rootDirectory, 'module-a');

            await mkdir(moduleDirectory);
            const executable = await createMavenWrapper(rootDirectory);

            const result = await findMavenWrapper(moduleDirectory, rootDirectory);

            assert.deepStrictEqual(result, {
                source: 'wrapper',
                executable
            });
        });
    });

    test('returns undefined when no Maven Wrapper exists', async () => {
        await withTemporaryDirectory(async (directory) => {
            const result = await findMavenWrapper(directory, directory);

            assert.strictEqual(result, undefined);
        });
    });

    test('returns undefined when the wrapper configuration is missing', async () => {
        await withTemporaryDirectory(async (directory) => {
            const wrapperScript = process.platform === 'win32' ? 'mvnw.cmd' : 'mvnw';

            await writeFile(path.join(directory, wrapperScript), '');

            const result = await findMavenWrapper(directory, directory);

            assert.strictEqual(result, undefined);
        });
    });

    test('does not search outside the workspace root', async () => {
        await withTemporaryDirectory(async (directory) => {
            const workspaceRoot = path.join(directory, 'workspace');
            const projectDirectory = path.join(directory, 'other-project');

            await mkdir(workspaceRoot);
            await mkdir(projectDirectory);

            await createMavenWrapper(directory);

            const result = await findMavenWrapper(projectDirectory, workspaceRoot);

            assert.strictEqual(result, undefined);
        });
    });

});