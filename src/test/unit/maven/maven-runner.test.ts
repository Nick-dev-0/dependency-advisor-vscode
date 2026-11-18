
import * as assert from 'node:assert/strict';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { suite, test } from 'mocha';
import type { MavenEnvironment } from '../../../maven/maven-environment';
import { MavenExecutionError, runMavenVersion } from '../../../maven/maven-runner';

interface FakeMavenOptions {
    exitCode?: number;
    delay?: boolean;
}

async function createFakeMaven(options: FakeMavenOptions = {}): Promise<{ directory: string; executable: string }> {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'dependency-advisor-maven-'));
    const isWindows = process.platform === 'win32';
    const executable = path.join(directory, isWindows ? 'mvn.cmd' : 'mvn');

    const scriptLines = isWindows
        ? [
            '@echo off',
            'echo Apache Maven 3.9.16',
            'echo Arguments: %*',
            'echo Fake Maven diagnostic 1>&2',
           ...(options.delay ? ['ping -n 6 127.0.0.1 > nul'] : []),
            `exit /b ${options.exitCode ?? 0}`
        ]
        : [
            '#!/bin/sh',
            "printf '%s\\n' 'Apache Maven 3.9.16'",
            'printf "Arguments: %s\\n" "$*"',
            "printf '%s\\n' 'Fake Maven diagnostic' >&2",
            ...(options.delay ? ['sleep 5'] : []),
            `exit ${options.exitCode ?? 0}`
        ];

    await writeFile(executable, scriptLines.join(isWindows ? '\r\n' : '\n'), 'utf8');

    if (!isWindows) {
        await chmod(executable, 0o755);
    }

    return { directory, executable };
}

suite('Maven Runner', () => {
    test('runs Maven and captures stdout and stderr', async () => {
        const { directory, executable } = await createFakeMaven();

        try {
            const environment: MavenEnvironment = {
                source: 'global',
                executable
            };

            const result = await runMavenVersion(environment);

            assert.match(result.stdout, /Apache Maven 3\.9\.16/);
            assert.match(result.stdout, /Arguments: -version/);
            assert.match(result.stderr, /Fake Maven diagnostic/);
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });

    test('returns a MavenExecutionError when Maven exits unsuccessfully', async () => {
        const { directory, executable } = await createFakeMaven({ exitCode: 7 });

        try {
            const environment: MavenEnvironment = {
                source: 'global',
                executable
            };

            await assert.rejects(
                runMavenVersion(environment),
                (error: unknown) => {
                    assert.ok(error instanceof MavenExecutionError);
                    assert.match(error.stdout, /Apache Maven 3\.9\.16/);
                    assert.match(error.stderr, /Fake Maven diagnostic/);
                    assert.equal(error.exitCode, 7);
                    assert.equal(error.timedOut, false);

                    return true;
                }
            );
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });

    test('returns a MavenExecutionError when the executable does not exist', async () => {
        const directory = await mkdtemp(path.join(os.tmpdir(), 'dependency-advisor-maven-'));

        try {
            const executable = path.join(directory, process.platform === 'win32' ? 'missing-mvn.cmd' : 'missing-mvn');

            const environment: MavenEnvironment = {
                source: 'global',
                executable
            };

            await assert.rejects(
                runMavenVersion(environment),
                (error: unknown) => {
                    assert.ok(error instanceof MavenExecutionError);
                    assert.equal(error.timedOut, false);

                    return true;
                }
            );
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });

    test('returns a MavenExecutionError when execution times out', async () => {
        const { directory, executable } = await createFakeMaven({ delay: true });

        try {
            const environment: MavenEnvironment = {
                source: 'global',
                executable
            };

            await assert.rejects(
                runMavenVersion(environment, { timeoutMs: 500 }),
                (error: unknown) => {
                    assert.ok(error instanceof MavenExecutionError);
                    assert.equal(error.timedOut, true);

                    return true;
                }
            );
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });
});
