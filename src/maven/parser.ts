import { XMLParser } from 'fast-xml-parser';
import type { MavenDependency, MavenParent, MavenProject } from '../models/maven';
import { isMavenDependency, isMavenParent } from './validation';

const xmlParser = new XMLParser({ processEntities: false, parseTagValue: false });

export function parseMavenPom(pomText: string): MavenProject {
    const parsedPom = xmlParser.parse(pomText);
    const project = parsedPom.project;

    let parent: MavenParent | undefined;

    if (project.parent !== undefined) {
        if (!isMavenParent(project.parent)) {
            throw new Error('Invalid Maven parent declaration.');
        }

        parent = project.parent;
    }

    const rawDependencies: unknown = project.dependencies?.dependency;

    const dependencyElements = Array.isArray(rawDependencies)
        ? rawDependencies : rawDependencies
        ? [rawDependencies] : [];

    const dependencies: MavenDependency[] = dependencyElements
        .filter(isMavenDependency)
        .map((dependency) => ({
            groupId: dependency.groupId,
            artifactId: dependency.artifactId,
            version: dependency.version,
            scope: dependency.scope
        }));

    return {
        modelVersion: project.modelVersion,
        groupId: project.groupId,
        artifactId: project.artifactId,
        version: project.version,
        parent: parent,
        dependencies: dependencies
    };
}