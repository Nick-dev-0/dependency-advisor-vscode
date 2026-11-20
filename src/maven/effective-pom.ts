
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import type { MavenEnvironment } from './maven-environment';
import { runMavenCommand } from './maven-runner';

export interface EffectivePomResult {
    pomText: string;
    stdout: string;
    stderr: string;
}

export interface EffectivePomOptions {
    timeoutMs?: number;
}

const DEFAULT_EFFECTIVE_POM_TIMEOUT_MS = 120_000;

export async function generateEffectivePom(environment: MavenEnvironment, projectDirectory: string, options: EffectivePomOptions = {}): Promise<EffectivePomResult> {
    const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'dependency-advisor-'));
    const outputFile = path.join(temporaryDirectory, 'effective-pom.xml');

    try {
        const executionResult = await runMavenCommand(
            environment,
            ['-N', '-ntp', 'help:effective-pom', '-Dverbose', `-Doutput=${outputFile}`],
            {
                cwd: projectDirectory,
                timeoutMs: options.timeoutMs ?? DEFAULT_EFFECTIVE_POM_TIMEOUT_MS
            }
        );

        const pomText = await readFile(outputFile, 'utf8');

        if (!pomText.trim()) {
            throw new Error('Maven generated an empty Effective POM.');
        }

        return {
            pomText,
            stdout: executionResult.stdout,
            stderr: executionResult.stderr
        };
    } finally {
        await rm(temporaryDirectory, { recursive: true, force: true });
    }
}
