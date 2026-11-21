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
                scope: undefined,
                type: undefined,
                classifier: undefined
            },
            {
                groupId: 'org.springframework.boot',
                artifactId: 'spring-boot-starter-test',
                version: undefined,
                scope: 'test',
                type: undefined,
                classifier: undefined
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
                scope: undefined,
                type: undefined,
                classifier: undefined
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

    test('extracts managed dependencies separately', () => {
        const pomText = `
            <project xmlns="http://maven.apache.org/POM/4.0.0">
                <modelVersion>4.0.0</modelVersion>
                <groupId>com.example</groupId>
                <artifactId>sample-app</artifactId>
                <version>1.0.0</version>

                <dependencyManagement>
                    <dependencies>
                        <dependency>
                            <groupId>com.example</groupId>
                            <artifactId>example-library</artifactId>
                            <version>2.3.0</version>
                        </dependency>
                    </dependencies>
                </dependencyManagement>

                <dependencies>
                    <dependency>
                        <groupId>com.example</groupId>
                        <artifactId>example-library</artifactId>
                    </dependency>
                </dependencies>
            </project>
        `;

        const project = parseMavenPom(pomText);

        assert.strictEqual(project.dependencies.length, 1);
        assert.strictEqual(project.dependencies[0].version, undefined);

        assert.strictEqual(project.managedDependencies.length, 1);
        assert.strictEqual(project.managedDependencies[0].groupId, 'com.example');
        assert.strictEqual(project.managedDependencies[0].artifactId, 'example-library');
        assert.strictEqual(project.managedDependencies[0].version, '2.3.0');
    });

    test('preserves dependency type and classifier', () => {
        const pomText = `
            <project xmlns="http://maven.apache.org/POM/4.0.0">
                <modelVersion>4.0.0</modelVersion>
                <groupId>com.example</groupId>
                <artifactId>sample-app</artifactId>
                <version>1.0.0</version>

                <dependencies>
                    <dependency>
                        <groupId>com.example</groupId>
                        <artifactId>example-library</artifactId>
                        <version>2.3.0</version>
                        <type>test-jar</type>
                        <classifier>tests</classifier>
                    </dependency>
                </dependencies>
            </project>
        `;

        const project = parseMavenPom(pomText);

        assert.strictEqual(project.dependencies.length, 1);
        assert.strictEqual(project.dependencies[0].type, 'test-jar');
        assert.strictEqual(project.dependencies[0].classifier, 'tests');
    });


    test('extracts effective dependency versions from an Effective POM', () => {
        const effectivePomText = `<?xml version="1.0" encoding="UTF-8"?>
        <project xmlns="http://maven.apache.org/POM/4.0.0">
            <modelVersion>4.0.0</modelVersion>
            <groupId>com.example</groupId>
            <artifactId>dependency-advisor-demo</artifactId>
            <version>1.0-SNAPSHOT</version>

            <dependencyManagement>
                <dependencies>
                    <dependency>
                        <groupId>org.springframework.boot</groupId>
                        <artifactId>spring-boot-starter-webmvc</artifactId>
                        <version>4.1.2</version>
                    </dependency>
                    <dependency>
                        <groupId>org.apache.commons</groupId>
                        <artifactId>commons-lang3</artifactId>
                        <version>3.17.0</version>
                    </dependency>
                    <dependency>
                        <groupId>org.junit.jupiter</groupId>
                        <artifactId>junit-jupiter</artifactId>
                        <version>5.12.2</version>
                        <scope>test</scope>
                    </dependency>
                </dependencies>
            </dependencyManagement>

            <dependencies>
                <dependency>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-starter-webmvc</artifactId>
                    <version>4.1.2</version>
                </dependency>
                <dependency>
                    <groupId>org.apache.commons</groupId>
                    <artifactId>commons-lang3</artifactId>
                    <version>3.18.0</version>
                </dependency>
                <dependency>
                    <groupId>org.junit.jupiter</groupId>
                    <artifactId>junit-jupiter</artifactId>
                    <version>5.12.2</version>
                    <scope>test</scope>
                </dependency>
                <dependency>
                    <groupId>com.openai</groupId>
                    <artifactId>openai-java</artifactId>
                    <version>4.94.0</version>
                </dependency>
                <dependency>
                    <groupId>com.google.guava</groupId>
                    <artifactId>guava</artifactId>
                    <version>33.4.0-jre</version>
                    <scope>compile</scope>
                </dependency>
            </dependencies>
        </project>`;

        const project = parseMavenPom(effectivePomText);

        assert.equal(project.artifactId, 'dependency-advisor-demo');
        assert.equal(project.dependencies.length, 5);
        assert.equal(project.managedDependencies.length, 3);

        assert.equal(project.dependencies[0].artifactId, 'spring-boot-starter-webmvc');
        assert.equal(project.dependencies[0].version, '4.1.2');

        assert.equal(project.dependencies[1].artifactId, 'commons-lang3');
        assert.equal(project.dependencies[1].version, '3.18.0');

        assert.equal(project.dependencies[2].artifactId, 'junit-jupiter');
        assert.equal(project.dependencies[2].version, '5.12.2');

        assert.equal(project.dependencies[3].artifactId, 'openai-java');
        assert.equal(project.dependencies[3].version, '4.94.0');

        assert.equal(project.dependencies[4].artifactId, 'guava');
        assert.equal(project.dependencies[4].version, '33.4.0-jre');
    });
});