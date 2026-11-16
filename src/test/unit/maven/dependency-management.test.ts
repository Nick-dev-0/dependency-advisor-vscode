import * as assert from 'assert';
import { findManagedDependency } from '../../../maven/dependency-management';
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

});