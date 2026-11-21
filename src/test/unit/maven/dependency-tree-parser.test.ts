
import * as assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { parseMavenDependencyTree } from '../../../maven/dependency-tree-parser';

suite('Maven Dependency Tree Parser', () => {
    test('parses a dependency tree with direct dependencies', () => {
        const jsonText = JSON.stringify({
            groupId: 'com.example',
            artifactId: 'my-project',
            version: '1.0-SNAPSHOT',
            type: 'jar',
            scope: '',
            classifier: '',
            optional: 'false',
            children: [
                {
                    groupId: 'org.springframework.boot',
                    artifactId: 'spring-boot-starter-webmvc',
                    version: '4.1.2',
                    type: 'jar',
                    scope: 'compile',
                    classifier: '',
                    optional: 'false'
                }
            ]
        });

        const tree = parseMavenDependencyTree(jsonText);

        assert.equal(tree.groupId, 'com.example');
        assert.equal(tree.artifactId, 'my-project');
        assert.equal(tree.version, '1.0-SNAPSHOT');
        assert.equal(tree.children?.length, 1);
        assert.equal(tree.children?.[0].artifactId, 'spring-boot-starter-webmvc');
    });

    test('parses nested dependencies across multiple levels', () => {
        const jsonText = JSON.stringify({
            groupId: 'com.example',
            artifactId: 'my-project',
            version: '1.0-SNAPSHOT',
            children: [
                {
                    groupId: 'org.springframework.boot',
                    artifactId: 'spring-boot-starter-webmvc',
                    version: '4.1.2',
                    children: [
                        {
                            groupId: 'org.springframework',
                            artifactId: 'spring-webmvc',
                            version: '7.0.0',
                            children: [
                                {
                                    groupId: 'org.springframework',
                                    artifactId: 'spring-core',
                                    version: '7.0.0'
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        const tree = parseMavenDependencyTree(jsonText);

        assert.equal(tree.children?.[0].artifactId, 'spring-boot-starter-webmvc');
        assert.equal(tree.children?.[0].children?.[0].artifactId, 'spring-webmvc');
        assert.equal(tree.children?.[0].children?.[0].children?.[0].artifactId, 'spring-core');
    });

    test('parses a dependency tree without children', () => {
        const jsonText = JSON.stringify({
            groupId: 'org.springframework',
            artifactId: 'spring-core',
            version: '7.0.0'
        });

        const tree = parseMavenDependencyTree(jsonText);

        assert.equal(tree.artifactId, 'spring-core');
        assert.equal(tree.children, undefined);
    });

    test('parses a dependency tree with an empty children array', () => {
        const jsonText = JSON.stringify({
            groupId: 'org.springframework',
            artifactId: 'spring-core',
            version: '7.0.0',
            children: []
        });

        const tree = parseMavenDependencyTree(jsonText);

        assert.deepEqual(tree.children, []);
    });

    test('throws an error when the JSON is malformed', () => {
        const jsonText = '{ invalid JSON }';

        assert.throws(() => parseMavenDependencyTree(jsonText), /Invalid Maven dependency tree JSON:/);
    });

    test('throws an error when the JSON does not represent a dependency tree', () => {
        const jsonText = JSON.stringify({
            groupId: 'com.example',
            version: '1.0-SNAPSHOT'
        });

        assert.throws(() => parseMavenDependencyTree(jsonText), /Maven dependency tree JSON does not match the expected structure/);
    });

    test('throws an error when a nested dependency is invalid', () => {
        const jsonText = JSON.stringify({
            groupId: 'com.example',
            artifactId: 'my-project',
            version: '1.0-SNAPSHOT',
            children: [
                {
                    groupId: 'org.springframework',
                    version: '7.0.0'
                }
            ]
        });

        assert.throws(() => parseMavenDependencyTree(jsonText), /Maven dependency tree JSON does not match the expected structure/ );
    });
});
