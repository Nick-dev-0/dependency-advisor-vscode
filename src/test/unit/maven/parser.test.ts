import * as assert from 'assert';
import { parseMavenPom } from '../../../maven/parser';

suite('Maven POM Parser', () => {
    test('extracts project identifiers and version', () => {
        const pomText = `
            <project xmlns="http://maven.apache.org/POM/4.0.0">
                <modelVersion>4.0.0</modelVersion>
                <groupId>com.example</groupId>
                <artifactId>sample-app</artifactId>
                <version>1.0.0</version>
            </project>
        `;

        const project = parseMavenPom(pomText);

        assert.strictEqual(project.modelVersion, '4.0.0');
        assert.strictEqual(project.groupId, 'com.example');
        assert.strictEqual(project.artifactId, 'sample-app');
        assert.strictEqual(project.version, '1.0.0');
    });

    test('reads parent POM details', () => {
    const pomText = `
        <project xmlns="http://maven.apache.org/POM/4.0.0">
            <modelVersion>4.0.0</modelVersion>
            <parent>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-starter-parent</artifactId>
                <version>4.1.2</version>
                <relativePath/>
            </parent>
            <artifactId>sample-app</artifactId>
        </project>
    `;

    const project = parseMavenPom(pomText);

    assert.deepStrictEqual(project.parent, {
        groupId: 'org.springframework.boot',
        artifactId: 'spring-boot-starter-parent',
        version: '4.1.2',
        relativePath: ''
    });
    });

    test('extracts multiple dependencies from the POM', () => {
    const pomText = `
        <project xmlns="http://maven.apache.org/POM/4.0.0">
            <modelVersion>4.0.0</modelVersion>
            <groupId>com.example</groupId>
            <artifactId>sample-app</artifactId>
            <version>1.0.0</version>

            <dependencies>
                <dependency>
                    <groupId>com.openai</groupId>
                    <artifactId>openai-java</artifactId>
                    <version>4.94.0</version>
                </dependency>
                <dependency>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-starter-test</artifactId>
                    <scope>test</scope>
                </dependency>
            </dependencies>
        </project>
    `;

    const project = parseMavenPom(pomText);

    assert.strictEqual(project.dependencies.length, 2);

    assert.deepStrictEqual(project.dependencies, [
        {
            groupId: 'com.openai',
            artifactId: 'openai-java',
            version: '4.94.0',
            scope: undefined
        },
        {
            groupId: 'org.springframework.boot',
            artifactId: 'spring-boot-starter-test',
            version: undefined,
            scope: 'test'
        }
    ]);
});

test('extracts a single dependency from the POM', () => {
    const pomText = `
        <project xmlns="http://maven.apache.org/POM/4.0.0">
            <modelVersion>4.0.0</modelVersion>
            <groupId>com.example</groupId>
            <artifactId>sample-app</artifactId>
            <version>1.0.0</version>

            <dependencies>
                <dependency>
                    <groupId>com.openai</groupId>
                    <artifactId>openai-java</artifactId>
                    <version>4.94.0</version>
                </dependency>
            </dependencies>
        </project>
    `;

    const project = parseMavenPom(pomText);

    assert.strictEqual(project.dependencies.length, 1);

    assert.deepStrictEqual(project.dependencies, [
        {
            groupId: 'com.openai',
            artifactId: 'openai-java',
            version: '4.94.0',
            scope: undefined
        }
    ]);
});

test('returns an empty dependency array when the POM has no dependencies', () => {
    const pomText = `
        <project xmlns="http://maven.apache.org/POM/4.0.0">
            <modelVersion>4.0.0</modelVersion>
            <groupId>com.example</groupId>
            <artifactId>sample-app</artifactId>
            <version>1.0.0</version>
        </project>
    `;

    const project = parseMavenPom(pomText);

    assert.deepStrictEqual(project.dependencies, []);
});


});