export interface MavenDependency {
    groupId: string;
    artifactId: string;
    version?: string;
    scope?: string;
}