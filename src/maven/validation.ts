import type { MavenDependency } from '../models/maven';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isMavenDependency(value: unknown): value is MavenDependency {
    if (!isRecord(value)) {
        return false;
    }

    return typeof value.groupId === 'string'
        && value.groupId.trim().length > 0
        && typeof value.artifactId === 'string'
        && value.artifactId.trim().length > 0
        && (value.version === undefined || typeof value.version === 'string')
        && (value.scope === undefined || typeof value.scope === 'string');
}
