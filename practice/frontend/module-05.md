Your first JavaScript programs. They run in Node, so you see the result in the terminal, exactly like `java File.java`. Watch for the places where JavaScript behaves differently from Java.

<!-- exercise: f5_e1 | Easy | Report card with template literals -->
**Concepts:** `const` / `let` · numbers and strings · template literals · `toFixed` · the ternary operator

**Task.** A student's marks are in the starter. Compute the total, the average (two decimals) and whether they passed (average 40 or more), and print the report exactly as shown. Use `const` for everything that doesn't change and a template literal for every printed line.

**Starter code** · `report.mjs`

```js
const name = "Asha";
const marks = { maths: 78, science: 64, english: 81 };

// TODO: total of the three marks
let total = 0;
// TODO: the average, as a string with 2 decimals
let average = "0.00";
// TODO: "PASS" if the average is 40 or more, else "FAIL"
let result = "";

console.log("Report for ?");
console.log("Total: ?");
console.log("Average: ?");
console.log("Result: ?");
```

**Expected output**

```text
Report for Asha
Total: 223 / 300
Average: 74.33
Result: PASS
```

<!-- hints -->
- Add the three properties: `marks.maths + marks.science + marks.english`.
- `(total / 3).toFixed(2)` gives a string with two decimals.
- A template literal uses backticks and `${…}`: `` `Total: ${total} / 300` ``.
- The ternary works like Java's: `condition ? "PASS" : "FAIL"`.
<!-- solution -->
```js
const name = "Asha";
const marks = { maths: 78, science: 64, english: 81 };

const total = marks.maths + marks.science + marks.english;
const average = (total / 3).toFixed(2);
const result = Number(average) >= 40 ? "PASS" : "FAIL";

console.log(`Report for ${name}`);
console.log(`Total: ${total} / 300`);
console.log(`Average: ${average}`);
console.log(`Result: ${result}`);
```

Everything is `const` because nothing is reassigned. `toFixed` returns a **string**, so the comparison converts it back with `Number(...)` first. (Comparing the string `"74.33" >= 40` would also work through coercion, but being explicit avoids surprises.)

<!-- exercise: f5_e2 | Easy | Truthy or falsy? -->
**Concepts:** truthy and falsy values · `Boolean()` · `typeof` · `===` vs `==`

**Task.** Write `describe(value)` returning `"truthy"` or `"falsy"`, without using an `if`. Then print one line per test value in the format shown: the label, the result, and the value's `typeof`. Finally print the three comparisons at the bottom.

**Starter code** · `truthy.mjs`

```js
function describe(value) {
  return "?"; // TODO: "truthy" or "falsy", no if statement
}

const tests = [
  ["0", 0], ['"0"', "0"], ['""', ""], ["[]", []], ["{}", {}],
  ["null", null], ["undefined", undefined], ["NaN", NaN], ['"false"', "false"],
];

for (const [label, value] of tests) {
  console.log(`${label} → ?`); // TODO: describe(value) and typeof value
}

// TODO: print the results of 0 == "", 0 === "" and null == undefined
```

**Expected output**

```text
0 → falsy (number)
"0" → truthy (string)
"" → falsy (string)
[] → truthy (object)
{} → truthy (object)
null → falsy (object)
undefined → falsy (undefined)
NaN → falsy (number)
"false" → truthy (string)
0 == "" is true
0 === "" is false
null == undefined is true
```

<!-- hints -->
- `Boolean(value)` converts any value to `true` or `false` the same way an `if` would.
- Combine it with a ternary: `Boolean(value) ? "truthy" : "falsy"`.
- `typeof null` is `"object"`: a famous historical bug.
- To print a comparison, put the expression in the template literal: `` `0 == "" is ${0 == ""}` ``.
<!-- solution -->
```js
function describe(value) {
  return Boolean(value) ? "truthy" : "falsy";
}

const tests = [
  ["0", 0], ['"0"', "0"], ['""', ""], ["[]", []], ["{}", {}],
  ["null", null], ["undefined", undefined], ["NaN", NaN], ['"false"', "false"],
];

for (const [label, value] of tests) {
  console.log(`${label} → ${describe(value)} (${typeof value})`);
}

console.log(`0 == "" is ${0 == ""}`);
console.log(`0 === "" is ${0 === ""}`);
console.log(`null == undefined is ${null == undefined}`);
```

Only eight values are falsy: `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined` and `NaN`. Everything else, including `"0"`, `"false"`, `[]` and `{}`, is truthy. The loop uses destructuring (`const [label, value] of tests`) to unpack each pair, which Module 7 covers in detail.

<!-- exercise: f5_e3 | Medium | Sentence statistics -->
**Concepts:** string methods · `split` · `for...of` · building strings · `Math.max`

**Task.** For the sentence in the starter, print: the number of words, the longest word (the first one if there's a tie), the sentence in Title Case, the words in reverse order, and how many vowels it has. Ignore punctuation: the starter already removes it.

**Starter code** · `sentence.mjs`

```js
const sentence = "java and javascript are not the same language, but both are fun!";
const clean = sentence.replace(/[^a-z ]/gi, "");   // letters and spaces only

// TODO: words (split on spaces)
// TODO: the longest word
// TODO: Title Case: first letter of each word in capitals
// TODO: the words in reverse order, joined with spaces
// TODO: count the vowels (a, e, i, o, u)

console.log("Words: ?");
console.log("Longest: ?");
console.log("Title Case: ?");
console.log("Reversed: ?");
console.log("Vowels: ?");
```

**Expected output**

```text
Words: 12
Longest: javascript (10 letters)
Title Case: Java And Javascript Are Not The Same Language But Both Are Fun
Reversed: fun are both but language same the not are javascript and java
Vowels: 21
```

<!-- hints -->
- `clean.split(" ")` gives an array of words; its `length` is the word count.
- Keep the longest so far in a `let` while looping with `for (const word of words)`, and replace it only when a word is strictly longer.
- Title-case one word with `word[0].toUpperCase() + word.slice(1)`.
- Arrays have `reverse()` and `join(" ")`; for vowels, loop over the characters and check `"aeiou".includes(ch)`.
<!-- solution -->
```js
const sentence = "java and javascript are not the same language, but both are fun!";
const clean = sentence.replace(/[^a-z ]/gi, "");

const words = clean.split(" ");

let longest = "";
for (const word of words) {
  if (word.length > longest.length) longest = word;
}

let titled = [];
for (const word of words) titled.push(word[0].toUpperCase() + word.slice(1));

const reversed = [...words].reverse().join(" ");

let vowels = 0;
for (const ch of clean.toLowerCase()) {
  if ("aeiou".includes(ch)) vowels++;
}

console.log(`Words: ${words.length}`);
console.log(`Longest: ${longest} (${longest.length} letters)`);
console.log(`Title Case: ${titled.join(" ")}`);
console.log(`Reversed: ${reversed}`);
console.log(`Vowels: ${vowels}`);
```

`for...of` works on arrays **and** strings (character by character). `reverse()` changes the array in place, so the solution reverses a copy (`[...words]`) to keep `words` untouched, a habit that matters a lot in React. Module 7 shows shorter versions with `map`, `filter` and `reduce`.
