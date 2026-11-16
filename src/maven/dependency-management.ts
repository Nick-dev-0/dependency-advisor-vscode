import type { MavenDependency, MavenManagedDependency } from '../models/maven';

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
