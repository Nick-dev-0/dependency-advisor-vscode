import * as assert from 'assert';
import * as vscode from 'vscode';
import { isMavenDependency, isMavenDependencyTreeNode, isMavenParent } from '../../../maven/validation';

suite('Maven Dependency Validation', () => {
    test('accepts a valid Maven dependency', () => {
        const dependency = {
            groupId: 'com.openai',
            artifactId: 'openai-java',
            version: '4.94.0',
            scope: 'compile'
        };

        assert.strictEqual(isMavenDependency(dependency), true);
    });

	test('rejects a dependency with a missing artifactId', () => {
        const dependency = {
            groupId: 'com.openai',
            version: '4.94.0',
            scope: 'compile'
        };

        assert.strictEqual(isMavenDependency(dependency), false);
    });

    test('rejects a dependency with an empty groupId', () => {
        const dependency = {
            groupId: '',
            artifactId: 'openai-java'
        };

        assert.strictEqual(isMavenDependency(dependency), false);
    });

    test('rejects a dependency with an empty artifactId', () => {
        const dependency = {
            groupId: 'com.openai',
            artifactId: ''
        };

        assert.strictEqual(isMavenDependency(dependency), false);
    });

    test('rejects a dependency with a numeric groupId', () => {
        const dependency = {
            groupId: 123,
            artifactId: 'openai-java'
        };

        assert.strictEqual(isMavenDependency(dependency), false);
    });

    test('accepts a dependency without a version', () => {
        const dependency = {
            groupId: 'com.openai',
            artifactId: 'openai-java'
        };

        assert.strictEqual(isMavenDependency(dependency), true);
    });

    test('rejects a dependency with a numeric version', () => {
        const dependency = {
            groupId: 'com.openai',
            artifactId: 'openai-java',
            version: 4.94
        };

        assert.strictEqual(isMavenDependency(dependency), false);
    });

    test('rejects a dependency with a numeric scope', () => {
        const dependency = {
            groupId: 'com.openai',
            artifactId: 'openai-java',
            scope: 123
        };

        assert.strictEqual(isMavenDependency(dependency), false);
    });

    test('rejects null input', () => {
        assert.strictEqual(isMavenDependency(null), false);
    });

    test('rejects array input', () => {
        assert.strictEqual(isMavenDependency([]), false);
    });

    test('rejects a dependency with a numeric type', () => {
        const dependency = {
            groupId: 'com.example',
            artifactId: 'example-library',
            type: 123
        };

        assert.strictEqual(isMavenDependency(dependency), false);
    });

    test('rejects a dependency with a numeric classifier', () => {
        const dependency = {
            groupId: 'com.example',
            artifactId: 'example-library',
            classifier: 123
        };

        assert.strictEqual(isMavenDependency(dependency), false);
    });
    
});


suite('Maven Dependency Tree Validation', () => {
    test('accepts a valid dependency tree leaf node', () => {
        const dependency = {
            groupId: 'org.springframework',
            artifactId: 'spring-core',
            version: '7.0.0',
            type: 'jar',
            scope: 'compile',
            classifier: '',
            optional: 'false'
        };

        assert.equal(isMavenDependencyTreeNode(dependency), true);
    });

    test('accepts nested dependency nodes at multiple levels', () => {
        const dependencyTree = {
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
                    optional: 'false',
                    children: [
                        {
                            groupId: 'org.springframework',
                            artifactId: 'spring-webmvc',
                            version: '7.0.0',
                            type: 'jar',
                            scope: 'compile',
                            classifier: '',
                            optional: 'false',
                            children: [
                                {
                                    groupId: 'org.springframework',
                                    artifactId: 'spring-core',
                                    version: '7.0.0',
                                    type: 'jar',
                                    scope: 'compile',
                                    classifier: '',
                                    optional: 'false'
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        assert.equal(isMavenDependencyTreeNode(dependencyTree), true);
    });

    test('accepts a dependency tree with an empty children array', () => {
        const dependency = {
            groupId: 'org.springframework',
            artifactId: 'spring-core',
            version: '7.0.0',
            children: []
        };

        assert.equal(isMavenDependencyTreeNode(dependency), true);
    });

    test('rejects a dependency tree with a non-array children property', () => {
        const dependency = {
            groupId: 'org.springframework',
            artifactId: 'spring-core',
            children: 'invalid'
        };

        assert.equal(isMavenDependencyTreeNode(dependency), false);
    });

    test('rejects a dependency tree containing an invalid nested dependency', () => {
        const dependencyTree = {
            groupId: 'com.example',
            artifactId: 'my-project',
            version: '1.0',
            children: [
                {
                    groupId: 'org.springframework',
                    version: '7.0.0'
                }
            ]
        };

        assert.equal(isMavenDependencyTreeNode(dependencyTree), false);
    });

    test('rejects a dependency tree with a non-string optional property', () => {
        const dependency = {
            groupId: 'org.springframework',
            artifactId: 'spring-core',
            optional: false
        };

        assert.equal(isMavenDependencyTreeNode(dependency), false);
    });

    test('rejects null input', () => {
        assert.equal(isMavenDependencyTreeNode(null), false);
    });
});
