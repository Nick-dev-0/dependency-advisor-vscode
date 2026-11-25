import * as assert from 'node:assert/strict';
import { chmod, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { MavenExecutionError } from '../../../maven/maven-runner';
import { generateMavenDependencyTree } from '../../../maven/dependency-tree';
import type { MavenEnvironment } from '../../../maven/maven-environment';

interface FakeMavenOptions {
    output?: 'valid' | 'empty' | 'missing' | 'malformed' | 'invalid';
    exitCode?: number;
}

interface FakeMavenFixture {
    projectDirectory: string;
    environment: MavenEnvironment;
    cleanup: () => Promise<void>;
}

const expectedTree = {
    groupId: 'com.example',
    artifactId: 'demo-app',
    version: '1.0.0',
    type: 'jar',
    scope: 'compile',
    children: [
        {
            groupId: 'org.slf4j',
            artifactId: 'slf4j-api',
            version: '2.0.16',
            type: 'jar',
            scope: 'compile',
            children: []
        }
    ]
};

async function createFakeMavenFixture(options: FakeMavenOptions = {}): Promise<FakeMavenFixture> {
    const projectDirectory = await mkdtemp(path.join(os.tmpdir(), 'dependency-advisor-maven-test-'));
    const isWindows = process.platform === 'win32';
    const executable = path.join(projectDirectory, isWindows ? 'mvn.cmd' : 'mvn');
    const outputMode = options.output ?? 'valid';
    const exitCode = options.exitCode ?? 0;

    let outputContent: string;

    switch (outputMode) {
        case 'valid':
            outputContent = JSON.stringify(expectedTree);
            break;
        case 'empty':
            outputContent = '';
            break;
        case 'malformed':
            outputContent = '{invalid-json';
            break;
        case 'invalid':
            outputContent = JSON.stringify({
                groupId: 'com.example',
                artifactId: 'demo-app',
                version: '1.0.0',
                children: 'not-an-array'
            });
            break;
        case 'missing':
            outputContent = '';
            break;
    }

    const windowsOutputCommands = outputMode === 'missing'
        ? []
        : outputMode === 'empty'
            ? ['type nul > "%OUTPUT_FILE%"']
            : [`> "%OUTPUT_FILE%" echo ${outputContent}`];

    const unixOutputCommands = outputMode === 'missing'
        ? []
        : outputMode === 'empty'
            ? [': > "$OUTPUT_FILE"']
            : [`printf '%s\\n' '${outputContent}' > "$OUTPUT_FILE"`];

    const script = isWindows
        ? [
            '@echo off',
            'setlocal',
            'echo Fake Maven stdout',
            'echo Fake Maven stderr 1>&2',
            'echo Arguments: %*',
            'set "OUTPUT_ARGUMENT=%~5"',
            'set "OUTPUT_FILE=%OUTPUT_ARGUMENT:~13%"',
            ...windowsOutputCommands,
            `exit /b ${exitCode}`
        ].join('\r\n')
        : [
            '#!/bin/sh',
            'echo "Fake Maven stdout"',
            'echo "Fake Maven stderr" >&2',
            'printf "Arguments:"',
            'for ARG in "$@"; do printf " [%s]" "$ARG"; done',
            'printf "\\n"',
            'OUTPUT_FILE=""',
            'for ARG in "$@"; do',
            '  case "$ARG" in',
            '    -DoutputFile=*) OUTPUT_FILE="${ARG#-DoutputFile=}" ;;',
            '  esac',
            'done',
            ...unixOutputCommands,
            `exit ${exitCode}`
        ].join('\n');

    await writeFile(executable, script, 'utf8');

    if (!isWindows) {
        await chmod(executable, 0o755);
    }

    return {
        projectDirectory,
        environment: {
            source: 'global',
            executable
        },
        cleanup: () => rm(projectDirectory, { recursive: true, force: true })
    };
}

async function getDependencyAdvisorTemporaryDirectories(): Promise<string[]> {
    const entries = await readdir(os.tmpdir(), { withFileTypes: true });

    return entries
        .filter((entry) => entry.isDirectory() && entry.name.startsWith('dependency-advisor-'))
        .map((entry) => entry.name)
        .sort();
}

suite('Maven Dependency Tree Generation', () => {
    test('generates and parses a dependency tree using Maven', async () => {
        const fixture = await createFakeMavenFixture();

        try {
            const temporaryDirectoriesBefore = await getDependencyAdvisorTemporaryDirectories();

            const result = await generateMavenDependencyTree(
                fixture.environment,
                fixture.projectDirectory
            );

            const temporaryDirectoriesAfter = await getDependencyAdvisorTemporaryDirectories();

            assert.deepEqual(result.tree, expectedTree);
            assert.match(result.stdout, /Fake Maven stdout/);
            assert.match(result.stderr, /Fake Maven stderr/);

            assert.match(result.stdout, /-N/);
            assert.match(result.stdout, /-ntp/);
            assert.match(result.stdout, /maven-dependency-plugin:3\.11\.0:tree/);
            assert.match(result.stdout, /-DoutputType=json/);
            assert.match(result.stdout, /-DoutputFile=/);

            assert.deepEqual(temporaryDirectoriesAfter, temporaryDirectoriesBefore);
        } finally {
            await fixture.cleanup();
        }
    });

    test('throws an error when Maven generates an empty output file', async () => {
        const fixture = await createFakeMavenFixture({ output: 'empty' });

        try {
            await assert.rejects(
                generateMavenDependencyTree(fixture.environment, fixture.projectDirectory),
                /Maven generated an empty dependency tree JSON file/
            );
        } finally {
            await fixture.cleanup();
        }
    });

    test('throws an error when Maven does not generate the output file', async () => {
        const fixture = await createFakeMavenFixture({ output: 'missing' });

        try {
            await assert.rejects(
                generateMavenDependencyTree(fixture.environment, fixture.projectDirectory),
                (error: unknown) => error instanceof Error
                    && (error as NodeJS.ErrnoException).code === 'ENOENT'
            );
        } finally {
            await fixture.cleanup();
        }
    });

    test('throws an error when Maven generates malformed JSON', async () => {
        const fixture = await createFakeMavenFixture({ output: 'malformed' });

        try {
            await assert.rejects(
                generateMavenDependencyTree(fixture.environment, fixture.projectDirectory),
                /Invalid Maven dependency tree JSON/
            );
        } finally {
            await fixture.cleanup();
        }
    });

    test('throws an error when the generated JSON does not match the dependency tree structure', async () => {
        const fixture = await createFakeMavenFixture({ output: 'invalid' });

        try {
            await assert.rejects(
                generateMavenDependencyTree(fixture.environment, fixture.projectDirectory),
                /Maven dependency tree JSON does not match the expected structure/
            );
        } finally {
            await fixture.cleanup();
        }
    });

    test('propagates Maven execution errors and removes its temporary directory', async () => {
        const fixture = await createFakeMavenFixture({ exitCode: 1 });

        try {
            const temporaryDirectoriesBefore = await getDependencyAdvisorTemporaryDirectories();

            await assert.rejects(
                generateMavenDependencyTree(fixture.environment, fixture.projectDirectory),
                (error: unknown) => error instanceof MavenExecutionError
                    && error.exitCode === 1
            );

            const temporaryDirectoriesAfter = await getDependencyAdvisorTemporaryDirectories();

            assert.deepEqual(temporaryDirectoriesAfter, temporaryDirectoriesBefore);
        } finally {
            await fixture.cleanup();
        }
    });
});