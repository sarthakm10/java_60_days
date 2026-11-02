# Day 46 — Build Tools and Unit Testing

> Real projects use dozens of libraries and hundreds of files. Today you meet the tool that manages all of it (Maven), and you write your first automated tests.

**Today's goal:** understand what Maven does and read a `pom.xml`, run a project's lifecycle from the terminal, and write and run JUnit tests.

<!-- topic: b46_t1 -->
## 🗄️ Tools — Maven & Gradle

<!-- subtopic: b46_t1_s1 -->
### Why build tools

So far you've compiled single files with `javac` or the ▶ button. Real projects need much more:

1. **Libraries (dependencies).** A Spring Boot app uses code written by others: the Spring framework, a JSON library, a database driver. Each comes as a **JAR** file (a zip of compiled classes), and each of those needs other JARs. Downloading 150 JARs by hand, in the right versions, is impossible.
2. **Compiling many files** in the right order.
3. **Running all the tests** before shipping.
4. **Packaging** everything into one runnable JAR to deploy.
5. **Doing it the same way** on every developer's laptop and on the build server.

A **build tool** does all of that from one description of the project. In the Java world, that's **Maven** (most common, and the default for Spring Boot) or **Gradle**.

<details>
<summary>What is a dependency?</summary>

A library your project needs, usually packaged as a JAR. The build tool downloads it (and the libraries it needs) automatically.
</details>

<!-- subtopic: b46_t1_s2 -->
### A Maven project

Maven expects every project to use the same layout, so any Java developer can open any project and know where things are:

```text
my-app/
├── pom.xml                         ← the project description
├── src/
│   ├── main/
│   │   ├── java/                   ← your code (com/example/myapp/…)
│   │   └── resources/              ← config files (application.properties), templates…
│   └── test/
│       └── java/                   ← your tests, mirroring the packages in main
└── target/                         ← build output: compiled classes, the final JAR (generated; never commit it)
```

The **`pom.xml`** (Project Object Model) describes the project:

```xml
<project>
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>          <!-- your organisation, as a reversed domain -->
    <artifactId>my-app</artifactId>         <!-- the project's name -->
    <version>1.0.0</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.11.0</version>
            <scope>test</scope>              <!-- only needed for tests, not in the final app -->
        </dependency>
    </dependencies>
</project>
```

You don't need to memorise the XML. Spring Boot's project generator (Day 54) writes it for you, and IntelliJ autocompletes it. You do need to be able to **read** it: what the project is called, which Java version, and which libraries it uses.

<details>
<summary>Where do your Java source files and your tests go in a Maven project?</summary>

Source code in `src/main/java`, tests in `src/test/java`. Config files go in `src/main/resources`.
</details>

<!-- subtopic: b46_t1_s3 -->
### Dependencies and Maven Central

Every library is identified by three coordinates, often written `groupId:artifactId:version`:

```text
com.fasterxml.jackson.core : jackson-databind : 2.18.0
└──────── who ───────────┘   └──── what ────┘   └ which version ┘
```

When you add a dependency to `pom.xml`, Maven downloads it from **Maven Central** (a huge public library of JARs, search it at central.sonatype.com) into a cache on your computer (`~/.m2/repository`), so each version is downloaded only once.

**Transitive dependencies:** if you depend on library A, and A depends on B and C, Maven fetches B and C too. That's why adding one Spring Boot "starter" brings in dozens of JARs. `mvn dependency:tree` shows the whole tree when you need to know where something came from.

**Scopes** say when a dependency is needed: `compile` (the default: always), `test` (only for running tests: JUnit, Mockito), `runtime` (only when running, e.g. a database driver), `provided` (the server already has it).

<details>
<summary>What are transitive dependencies?</summary>

The dependencies of your dependencies. Maven downloads them automatically.
</details>

<!-- subtopic: b46_t1_s4 -->
### The Maven lifecycle and the wrapper

Maven builds in **phases**, always in order. Asking for a phase runs every phase before it too:

| Command | Does |
|---|---|
| `mvn clean` | deletes `target/` (start fresh) |
| `mvn compile` | compiles `src/main/java` |
| `mvn test` | compiles, then runs every test in `src/test/java` |
| `mvn package` | compiles, tests, then builds the JAR in `target/` |
| `mvn install` | packages, then copies the JAR into your local `~/.m2` cache for other projects |

The one you'll type most: `mvn clean package` (or `mvn clean test` while working). If any test fails, the build stops: broken code never gets packaged.

**The Maven wrapper.** Spring Boot projects come with `mvnw` (macOS/Linux) and `mvnw.cmd` (Windows) scripts. They download the right Maven version automatically, so you don't need to install Maven at all:

```bash
./mvnw clean test          # macOS / Linux
mvnw.cmd clean test        # Windows
```

In IntelliJ, the **Maven** tool window (right edge) lists the lifecycle phases: double-click one to run it.

<details>
<summary>What does mvn package do?</summary>

Compiles the code, runs the tests, and if they all pass, builds the JAR in the target folder.
</details>

<!-- subtopic: b46_t1_s5 -->
### Gradle in brief

**Gradle** does the same job with a shorter, script-style file instead of XML:

```groovy
// build.gradle
plugins {
    id 'java'
}

dependencies {
    implementation 'com.fasterxml.jackson.core:jackson-databind:2.18.0'
    testImplementation 'org.junit.jupiter:junit-jupiter:5.11.0'
}
```

The same coordinates, the same `src/main/java` layout, and its own wrapper (`./gradlew build`). Gradle is common for Android and large builds; Maven is more common for Spring Boot backends. Learn Maven well, and you'll be able to read Gradle files.

| | Maven | Gradle |
|---|---|---|
| File | `pom.xml` (XML) | `build.gradle` / `build.gradle.kts` (code) |
| Wrapper | `./mvnw` | `./gradlew` |
| Build & test | `./mvnw clean package` | `./gradlew build` |

<!-- topic: b46_t2 -->
## 🌿 Testing — Your First Unit Tests

<!-- subtopic: b46_t2_s1 -->
### Why automated tests

Until now you've tested by running the program and looking at the output. That works once. But every time you change the code, everything you tested before might break, and you won't re-check it all by hand.

An **automated test** is code that runs your code and checks the result:

```java
@Test
void addsTwoNumbers() {
    Calculator calc = new Calculator();
    assertEquals(5, calc.add(2, 3));     // if add(2, 3) isn't 5, this test FAILS with a clear message
}
```

A **unit test** checks one small piece (one method, one class) on its own, in milliseconds. With hundreds of them, one command (`./mvnw test`) tells you within seconds whether your last change broke anything. That confidence is why every professional team writes tests, and why interviewers ask about them.

To try it: create a Maven project in IntelliJ (*New Project* → Java → build system **Maven**), add the JUnit dependency from earlier today, put a class in `src/main/java` and its test in `src/test/java`, then click the ▶ next to the test.

<details>
<summary>What is a unit test?</summary>

Code that checks one small piece of your program (usually one method or class) on its own, automatically and quickly.
</details>

<!-- intro: d24_t1_s5 -->
**JUnit 5** is Java's standard test library. Mark a test method with `@Test`, check results with `assertEquals(expected, actual)`, `assertTrue(...)` or `assertThrows(SomeException.class, () -> ...)`, and use `@BeforeEach` for setup that runs before every test. `@ParameterizedTest` runs one test with many inputs, perfect for boundary values like the grade limits on Day 4. Read the section's examples; you'll use all of these from Day 57.

<!-- intro: d24_t1_s8 -->
Structure every test in three steps: **Arrange** (set up the objects and inputs), **Act** (call the one thing you're testing), **Assert** (check the result). Name tests so a failure explains itself: `withdraw_moreThanBalance_throwsInsufficientFunds` tells you what broke without opening the code.

<!-- topic: b46_t3 -->
## 🧮 DSA — Binary Search & Heap Revision

Revision of Day 15–16's binary search and Day 32's heaps, on harder problems. Capacity to Ship Packages is **binary search on the answer** again (try a capacity, check if it's enough, halve the range). K Closest Points is the size-K heap pattern. Median of Two Sorted Arrays is a famous hard one; it's fine to study the solution and come back to it later.

## 📝 Day 46 Recap

1. What does a build tool do? → **downloads dependencies, compiles, runs tests and packages the app**
2. Maven's project file? → **pom.xml**
3. Where do tests go in a Maven project? → **src/test/java**
4. Three coordinates of a dependency? → **groupId, artifactId, version**
5. Where does Maven download libraries from? → **Maven Central (cached in ~/.m2)**
6. Scope for JUnit? → **test**
7. Build and test from scratch? → **./mvnw clean package (or mvn clean package)**
8. Why use the Maven wrapper? → **it downloads the right Maven version, so nobody needs to install it**
9. JUnit check that two values are equal? → **assertEquals(expected, actual)**
10. Three steps of a test? → **Arrange, Act, Assert**
