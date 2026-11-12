export interface MavenDependency {
    groupId: string;
    artifactId: string;
    version?: string;
    scope?: string;
}

export interface MavenParent {
    groupId: string;
    artifactId: string;
    version: string;
    relativePath?: string;
}

export interface MavenProject {
    modelVersion: string;
    groupId?: string;
    artifactId: string;
    version?: string;
    parent?: MavenParent;
    dependencies: MavenDependency[];
}
