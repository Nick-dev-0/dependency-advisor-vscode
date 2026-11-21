import type { MavenDependencyTreeNode } from '../models/maven';
import { isMavenDependencyTreeNode } from './validation';

export function parseMavenDependencyTree(jsonText: string): MavenDependencyTreeNode {
    let parsedTree: unknown;

    try {
        parsedTree = JSON.parse(jsonText);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid Maven dependency tree JSON: ${message}`);
    }

    if (!isMavenDependencyTreeNode(parsedTree)) {
        throw new Error('Maven dependency tree JSON does not match the expected structure.');
    }

    return parsedTree;
}
