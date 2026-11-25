
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import type { MavenDependencyTreeNode } from '../models/maven';
import type { MavenEnvironment } from './maven-environment';
import { parseMavenDependencyTree } from './dependency-tree-parser';
import { runMavenCommand } from './maven-runner';

export interface MavenDependencyTreeResult {
    tree: MavenDependencyTreeNode;
    stdout: string;
    stderr: string;
}

export interface MavenDependencyTreeOptions {
    timeoutMs?: number;
}

const MAVEN_DEPENDENCY_PLUGIN_VERSION = '3.11.0';
const DEFAULT_DEPENDENCY_TREE_TIMEOUT_MS = 120_000;

export async function generateMavenDependencyTree(environment: MavenEnvironment, projectDirectory: string, options: MavenDependencyTreeOptions = {}): Promise<MavenDependencyTreeResult> {
    const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'dependency-advisor-'));
    const outputFile = path.join(temporaryDirectory, 'dependency-tree.json');

    try {
        const executionResult = await runMavenCommand(
            environment,
            ['-N', '-ntp', `org.apache.maven.plugins:maven-dependency-plugin:${MAVEN_DEPENDENCY_PLUGIN_VERSION}:tree`, '-DoutputType=json', `-DoutputFile=${outputFile}`],
            {
                cwd: projectDirectory,
                timeoutMs: options.timeoutMs ?? DEFAULT_DEPENDENCY_TREE_TIMEOUT_MS
            }
        );

        const jsonText = await readFile(outputFile, 'utf8');

        if (!jsonText.trim()) {
            throw new Error('Maven generated an empty dependency tree JSON file.');
        }

        const tree = parseMavenDependencyTree(jsonText);

        return {
            tree,
            stdout: executionResult.stdout,
            stderr: executionResult.stderr
        };
    } finally {
        await rm(temporaryDirectory, { recursive: true, force: true });
    }
}
