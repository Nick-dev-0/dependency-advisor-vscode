import type {MavenDependency, MavenManagedDependency, MavenDependencyVersionSelection, MavenDependencyAnalysis} from '../models/maven';

export function findManagedDependency(dependency: MavenDependency, managedDependencies: MavenManagedDependency[]) : MavenManagedDependency | undefined {
    const dependencyType = dependency.type ?? 'jar';
    const dependencyClassifier = dependency.classifier ?? '';

    return managedDependencies.find((managedDependency) =>
        managedDependency.groupId === dependency.groupId
        && managedDependency.artifactId === dependency.artifactId
        && (managedDependency.type ?? 'jar') === dependencyType
        && (managedDependency.classifier ?? '') === dependencyClassifier
    );
}

export function selectDependencyVersion(dependency: MavenDependency, managedDependencies: MavenManagedDependency[]): MavenDependencyVersionSelection {
    if (dependency.version !== undefined) {
        return {
            version: dependency.version,
            source: 'declared'
        };
    }

    const managedDependency = findManagedDependency(dependency, managedDependencies);

    if (managedDependency?.version !== undefined) {
        return {
            version: managedDependency.version,
            source: 'managed'
        };
    }

    return {
        version: undefined,
        source: 'unresolved'
    };
}

export function analyzeMavenDependencies(dependencies: MavenDependency[],managedDependencies: MavenManagedDependency[]): MavenDependencyAnalysis[] {
    return dependencies.map((dependency) => ({
        declaredDependency: dependency,
        versionSelection: selectDependencyVersion(dependency, managedDependencies)
    }));
}

