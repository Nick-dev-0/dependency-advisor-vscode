
import * as assert from 'node:assert/strict';
import { chmod, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { suite, test } from 'mocha';
import type { MavenEnvironment } from '../../../maven/maven-environment';
import { generateEffectivePom } from '../../../maven/effective-pom';
import { MavenExecutionError } from '../../../maven/maven-runner';

interface FakeMavenOptions {
    output?: 'valid' | 'empty' | 'missing';
    exitCode?: number;
}

const EFFECTIVE_POM = '<project><modelVersion>4.0.0</modelVersion><groupId>com.example</groupId><artifactId>effective-fixture</artifactId><version>1.0-SNAPSHOT</version></project>';

async function createFakeMaven(options: FakeMavenOptions = {}): Promise<{ directory: string; executable: string }> {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'dependency-advisor-maven-'));
    const isWindows = process.platform === 'win32';
    const executable = path.join(directory, isWindows ? 'mvn.cmd' : 'mvn');

    const outputLines = isWindows
        ? options.output === 'valid'
            ? [`> "%OUTPUT_FILE%" echo ^<project^>^<modelVersion^>4.0.0^</modelVersion^>^<groupId^>com.example^</groupId^>^<artifactId^>effective-fixture^</artifactId^>^<version^>1.0-SNAPSHOT^</version^>^</project^>`]
            : options.output === 'empty'
                ? ['type nul > "%OUTPUT_FILE%"']
                : []
        : options.output === 'valid'
            ? [`printf '%s\\n' '${EFFECTIVE_POM}' > "$OUTPUT_FILE"`]
            : options.output === 'empty'
                ? [': > "$OUTPUT_FILE"']
                : [];

    const scriptLines = isWindows
        ? [
            '@echo off',
            'setlocal',
            'set "OUTPUT_ARGUMENT=%~5"',
            'set "OUTPUT_FILE=%OUTPUT_ARGUMENT:~9%"',
            'echo Fake Maven effective POM execution',
            ...outputLines,
            `exit /b ${options.exitCode ?? 0}`
        ]
        : [
            '#!/bin/sh',
            'OUTPUT_FILE=""',
            'for ARG in "$@"; do',
            '    case "$ARG" in',
            '        -Doutput=*) OUTPUT_FILE="${ARG#-Doutput=}" ;;',
            '    esac',
            'done',
            "printf '%s\\n' 'Fake Maven effective POM execution'",
            ...outputLines,
            `exit ${options.exitCode ?? 0}`
        ];

    await writeFile(executable, scriptLines.join(isWindows ? '\r\n' : '\n'), 'utf8');

    if (!isWindows) {
        await chmod(executable, 0o755);
    }

    return { directory, executable };
}

async function getTemporaryDirectories(): Promise<string[]> {
    const entries = await readdir(os.tmpdir(), { withFileTypes: true });

    return entries
        .filter((entry) => entry.isDirectory() && entry.name.startsWith('dependency-advisor-'))
        .map((entry) => entry.name)
        .sort();
}

suite('Effective POM', () => {
    test('generates an Effective POM and returns its contents', async () => {
        const { directory, executable } = await createFakeMaven({ output: 'valid' });

        try {
            const environment: MavenEnvironment = {
                source: 'global',
                executable
            };

            const result = await generateEffectivePom(environment, directory);

            assert.equal(result.pomText.trim(), EFFECTIVE_POM);
            assert.match(result.stdout, /Fake Maven effective POM execution/);
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });

    test('throws an error when Maven does not generate an output file', async () => {
        const { directory, executable } = await createFakeMaven({ output: 'missing' });

        try {
            const environment: MavenEnvironment = {
                source: 'global',
                executable
            };

            await assert.rejects(
                generateEffectivePom(environment, directory),
                (error: unknown) => error instanceof Error
            );
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });

    test('throws an error when Maven generates an empty Effective POM', async () => {
        const { directory, executable } = await createFakeMaven({ output: 'empty' });

        try {
            const environment: MavenEnvironment = {
                source: 'global',
                executable
            };

            await assert.rejects(
                generateEffectivePom(environment, directory),
                (error: unknown) => {
                    assert.ok(error instanceof Error);
                    assert.equal(error.message, 'Maven generated an empty Effective POM.');

                    return true;
                }
            );
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });

    test('cleans up the temporary directory when Maven execution fails', async () => {
        const { directory, executable } = await createFakeMaven({ output: 'valid', exitCode: 1 });

        try {
            const environment: MavenEnvironment = {
                source: 'global',
                executable
            };

            const directoriesBefore = await getTemporaryDirectories();

            await assert.rejects(
                generateEffectivePom(environment, directory),
                (error: unknown) => error instanceof MavenExecutionError
            );

            const directoriesAfter = await getTemporaryDirectories();

            assert.deepEqual(directoriesAfter, directoriesBefore);
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });
});
