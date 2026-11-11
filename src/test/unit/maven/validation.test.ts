import * as assert from 'assert';
import * as vscode from 'vscode';
import { isMavenDependency } from '../../../maven/validation';

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

});

