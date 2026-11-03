# Java Step Visualizer

Step through **your own** Java program, one line at a time, right next to the editor, like Python Tutor but for Java and inside VS Code.

- **The editor follows along.** The line about to run is highlighted. The lines where earlier calls are waiting are marked, and what the last line changed is written at its end, for example `⟵ right 3 → 2`.
- **The panel beside it** shows the program's data the way you'd draw it on paper:
  - arrays as boxes, with your `left` / `right` / `mid` indexes underneath;
  - `HashMap`s as tables;
  - stacks standing up, and queues with front and back;
  - linked lists as boxes and arrows, and trees as trees;
  - 2D arrays as grids;
  - the call stack, so you watch recursion go down and come back;
  - everything printed so far.
- **Your changes show up.** Save the file and it records again, staying near the line you were on. Or set `javaStepVisualizer.update` to `onType` to have it record a moment after you stop typing.

It runs your real program with your JDK, under Java's own debugger interface, and records every step. Nothing is sent anywhere.

## Requirements

A **JDK 17 or newer**, not just a JRE. The extension looks for it in the `javaStepVisualizer.javaHome` setting, then `JAVA_HOME`, then `java` on the PATH. No other extensions are needed.

## Use it

1. Open a `.java` file with a `main` method.
2. Click **▶** in the editor's title bar, or right-click → **Visualize this Java file**.
3. Step with the panel's buttons or arrow keys. In the editor, use **F10** for the next step and **Alt+F10** for the previous one. Right-click a line → **Run to this line** to jump to the next time it runs.

To try it, open one of the files in `vscode-extension/examples/`:
- `Tour.java` shows everything it draws.
- `ReadNumbers.java` reads input.
- `FindTheBug.java` crashes, so you can find out why.

If the program reads input (`Scanner(System.in)`), you're asked what to type first. Separate lines with `\n`. Change it later with **Java Visualizer: Set the program's input…**.

Comment settings at the top of the file make a visualization clearer:

```java
// @start twoSum                 start recording at the first call of twoSum (skip building the input)
// @hide printTree               run these methods without recording their steps
// @pointers nums: left right    draw these int variables as arrows under the array nums
// @window nums: left right      shade nums[left..right]
// @cell grid: r c               ring grid[r][c]
// @maxSteps 2000                a higher step limit for this file
```

## Settings

| Setting | Default | |
|---|---|---|
| `javaStepVisualizer.javaHome` | empty | The JDK folder to use |
| `javaStepVisualizer.update` | `onSave` | `onSave`, `onType` (unsaved text, after a pause) or `manual` |
| `javaStepVisualizer.maxSteps` | 1000 | Stop recording after this many steps |
| `javaStepVisualizer.timeoutSeconds` | 15 | Give up on a program that doesn't finish (an endless loop, or waiting for input) |
| `javaStepVisualizer.showCodeInPanel` | off | Also show the code inside the panel |
| `javaStepVisualizer.inlineHints` | on | Write what each step changed at the end of the line |

## Good to know

- **One file at a time.** Only the file you visualize is stepped through. Classes it uses from other files in the same source folder still run, but as one step each, like a library.
- **One line is one step,** so a whole loop written on one line runs in a single step.
- Keep inputs small. Recordings stop at the step limit, and a few hundred steps is the sweet spot for watching.
- Single-threaded programs only. Other threads run but aren't recorded.

## Building and developing

The extension is plain JavaScript with no npm dependencies and no build step. It lives in the [Java Fullstack](https://github.com/sarthakm10/java_60_days) repository and shares its player (`visualizer.js`, `visualizer.css`) and recorder (`scripts/tracer/Tracer.java`) with the website.

```bash
node vscode-extension/package-vsix.js                                      # builds dist/java-step-visualizer-<version>.vsix
code --install-extension vscode-extension/dist/java-step-visualizer-0.1.0.vsix
node vscode-extension/test-runner.js                                       # records a small test project without VS Code
```

To try a change without installing, open the `vscode-extension` folder in VS Code and press **F5**. The extension then reads the player and recorder straight from the repository. `webview/preview.html` shows the panel in a browser with a sample recording.
