import * as assert from 'assert';
import { analyzeMavenDependencies, findManagedDependency, selectDependencyVersion } from '../../../maven/dependency-management';
import type { MavenDependency, MavenManagedDependency } from '../../../models/maven';

suite('Maven Dependency Management', () => {
    test('finds a matching managed dependency', () => {
        const dependency: MavenDependency = {
            groupId: 'com.example',
            artifactId: 'example-library'
        };

        const managedDependencies: MavenManagedDependency[] = [
            {
                groupId: 'com.example',
                artifactId: 'example-library',
                version: '2.3.0'
            }
        ];

        const match = findManagedDependency(dependency, managedDependencies);

        assert.deepStrictEqual(match, managedDependencies[0]);
    });

    test('does not match a dependency with a different groupId', () => {
        const dependency: MavenDependency = {
            groupId: 'com.openai',
            artifactId: 'openai-java'
        };

        const managedDependencies: MavenManagedDependency[] = [
            {
                groupId: 'com.example',
                artifactId: 'openai-java',
                version: '4.94.0'
            }
        ];

        const match = findManagedDependency(dependency, managedDependencies);

        assert.strictEqual(match, undefined);
    });

    test('does not match a dependency with a different artifactId', () => {
        const dependency: MavenDependency = {
            groupId: 'com.openai',
            artifactId: 'openai-java'
        };

        const managedDependencies: MavenManagedDependency[] = [
            {
                groupId: 'com.openai',
                artifactId: 'another-library',
                version: '4.94.0'
            }
        ];

        const match = findManagedDependency(dependency, managedDependencies);

        assert.strictEqual(match, undefined);
        });

    test('does not match a dependency with a different type', () => {
        const dependency: MavenDependency = {
            groupId: 'com.example',
            artifactId: 'example-library'
        };

        const managedDependencies: MavenManagedDependency[] = [
            {
                groupId: 'com.example',
                artifactId: 'example-library',
                version: '2.3.0',
                type: 'pom'
            }
        ];

        const match = findManagedDependency(dependency, managedDependencies);

        assert.strictEqual(match, undefined);
    });

    test('does not match a dependency with a different classifier', () => {
        const dependency: MavenDependency = {
            groupId: 'com.example',
            artifactId: 'example-library'
        };

        const managedDependencies: MavenManagedDependency[] = [
            {
                groupId: 'com.example',
                artifactId: 'example-library',
                version: '2.3.0',
                classifier: 'sources'
            }
        ];

        const match = findManagedDependency(dependency, managedDependencies);

        assert.strictEqual(match, undefined);
    });

    test('matches dependencies using Maven default type and classifier', () => {
        const dependency: MavenDependency = {
            groupId: 'com.example',
            artifactId: 'example-library'
        };

        const managedDependencies: MavenManagedDependency[] = [
            {
                groupId: 'com.example',
                artifactId: 'example-library',
                version: '2.3.0',
                type: 'jar',
                classifier: ''
            }
        ];

        const match = findManagedDependency(dependency, managedDependencies);

        assert.deepStrictEqual(match, managedDependencies[0]);
    });

    test('matches explicit Maven defaults against omitted managed values', () => {
        const dependency: MavenDependency = {
            groupId: 'com.example',
            artifactId: 'example-library',
            type: 'jar',
            classifier: ''
        };

        const managedDependencies: MavenManagedDependency[] = [
            {
                groupId: 'com.example',
                artifactId: 'example-library',
                version: '2.3.0'
            }
        ];

        const match = findManagedDependency(dependency, managedDependencies);

        assert.deepStrictEqual(match, managedDependencies[0]);
    });

    test('uses the declared version when one is provided', () => {
        const dependency: MavenDependency = {
            groupId: 'com.example',
            artifactId: 'example-library',
            version: '4.0.0'
        };

        const managedDependencies: MavenManagedDependency[] = [
            {
                groupId: 'com.example',
                artifactId: 'example-library',
                version: '5.0.0'
            }
        ];

        const selection = selectDependencyVersion(dependency, managedDependencies);

        assert.deepStrictEqual(selection, {
            version: '4.0.0',
            source: 'declared'
        });
    });
    
    test('uses the managed version when no version is declared', () => {
        const dependency: MavenDependency = {
            groupId: 'com.example',
            artifactId: 'example-library'
        };

        const managedDependencies: MavenManagedDependency[] = [
            {
                groupId: 'com.example',
                artifactId: 'example-library',
                version: '5.0.0'
            }
        ];

        const selection = selectDependencyVersion(dependency, managedDependencies);

        assert.deepStrictEqual(selection, {
            version: '5.0.0',
            source: 'managed'
        });
    });

    test('returns unresolved when no matching managed dependency exists', () => {
        const dependency: MavenDependency = {
            groupId: 'com.example',
            artifactId: 'example-library'
        };

        const selection = selectDependencyVersion(dependency, []);

        assert.deepStrictEqual(selection, {
            version: undefined,
            source: 'unresolved'
        });
    });

    test('returns unresolved when the managed dependency has no version', () => {
        const dependency: MavenDependency = {
            groupId: 'com.example',
            artifactId: 'example-library'
        };

        const managedDependencies: MavenManagedDependency[] = [
            {
                groupId: 'com.example',
                artifactId: 'example-library'
            }
        ];

        const selection = selectDependencyVersion(dependency, managedDependencies);

        assert.deepStrictEqual(selection, {
            version: undefined,
            source: 'unresolved'
        });
    });
    
    test('enriches declared dependencies with version information', () => {
        const dependencies: MavenDependency[] = [
            {
                groupId: 'com.example',
                artifactId: 'managed-library'
            },
            {
                groupId: 'com.example',
                artifactId: 'explicit-library',
                version: '1.5.0'
            },
            {
                groupId: 'com.example',
                artifactId: 'unresolved-library'
            }
        ];

        const managedDependencies: MavenManagedDependency[] = [
            {
                groupId: 'com.example',
                artifactId: 'managed-library',
                version: '2.3.0'
            },
            {
                groupId: 'com.example',
                artifactId: 'explicit-library',
                version: '3.0.0'
            }
        ];

        const analyzedDependencies = analyzeMavenDependencies(dependencies,managedDependencies);

        assert.deepStrictEqual(analyzedDependencies, [
            {
                declaredDependency: dependencies[0],
                versionSelection: {
                    version: '2.3.0',
                    source: 'managed'
                }
            },
            {
                declaredDependency: dependencies[1],
                versionSelection: {
                    version: '1.5.0',
                    source: 'declared'
                }
            },
            {
                declaredDependency: dependencies[2],
                versionSelection: {
                    version: undefined,
                    source: 'unresolved'
                }
            }
        ]);
    });

});