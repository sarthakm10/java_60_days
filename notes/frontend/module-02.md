# Frontend 2 — HTML Essentials

> **HTML is small.** You need maybe 30 tags day to day, and React will write most of them for you later. What matters is choosing the *right* tag: it decides how search engines, screen readers and the browser itself understand your page.

<!-- subtopic: f2_s1 -->
### Document structure and meta tags

Every HTML page has the same skeleton:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Track your 100-day Java fullstack plan">
    <title>Java Fullstack Tracker</title>
    <link rel="icon" href="favicon.svg">
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <!-- everything the user sees goes here -->
    <script src="app.js" defer></script>
  </body>
</html>
```

| Part | Why it's there |
|---|---|
| `<!DOCTYPE html>` | tells the browser to use modern standards mode, not "quirks mode" |
| `lang="en"` | screen readers pick the right pronunciation; translators and search engines use it |
| `<head>` | information **about** the page; nothing in it is drawn |
| `charset="UTF-8"` | so `é`, `₹` and emoji show correctly |
| `viewport` | without it, phones pretend to be 980px wide and shrink your page (Module 4) |
| `<title>` | the browser tab text and the search-result headline |
| `description` | the grey text under your link in search results |
| `<body>` | everything visible |

HTML is a tree: elements **nest** inside each other, and every opening tag like `<p>` needs its closing `</p>` (a few "void" elements such as `<img>`, `<input>`, `<br>` and `<meta>` have no closing tag). Attributes go in the opening tag: `<a href="/about" target="_blank">`.

<details>
<summary>What happens if you leave out the viewport meta tag?</summary>

Mobile browsers assume the page was designed for a desktop and render it about 980px wide, then zoom out to fit the screen, so all the text is tiny. The viewport tag says "use the device's real width", which is what makes responsive CSS work.
</details>

<!-- subtopic: f2_s2 -->
### Text, links, images and lists

```html
<h1>Learn Java Fullstack</h1>              <!-- one h1 per page: the main title -->
<h2>Phase 1: Programming Basics</h2>       <!-- h2 to h6 for sub-sections, in order -->
<p>Start with <strong>variables</strong> and <em>loops</em>.</p>

<a href="https://openjdk.org">Download a JDK</a>
<a href="/notes/day-02.html">Day 2 notes</a>           <!-- a path on the same site -->
<a href="#recap">Jump to the recap</a>                  <!-- an element with id="recap" -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">Opens in a new tab</a>

<img src="duke.png" alt="Duke, the Java mascot, waving" width="120" height="120">

<ul>                       <!-- unordered: bullets -->
  <li>HTML</li>
  <li>CSS</li>
</ul>
<ol>                       <!-- ordered: numbers -->
  <li>Learn</li>
  <li>Build</li>
</ol>
```

Things people get wrong:

- **Headings are for structure, not size.** Don't pick `<h4>` because it "looks smaller"; style it with CSS instead. Screen-reader users jump through a page by its headings.
- **`alt` text describes the image's purpose.** For a purely decorative image, use an empty `alt=""` so screen readers skip it.
- **Give images a `width` and `height`.** The browser then reserves the space before the image loads, so the page doesn't jump (this is the CLS score in Module 24).
- **`target="_blank"` with `rel="noopener noreferrer"`**, so the new tab can't reach back into your page.

<details>
<summary>What should the alt text be for a company logo that links to the home page?</summary>

Describe what the link does, for example `alt="Acme home"`. The image is the only content of the link, so its alt text becomes the link's name for screen-reader users.
</details>

<!-- subtopic: f2_s3 -->
### Semantic HTML

You *could* build everything from `<div>` and `<span>`. Semantic tags say **what a part of the page is**, which helps screen readers, search engines and your teammates:

```html
<body>
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/roadmap">Roadmap</a>
    </nav>
  </header>

  <main>
    <article>
      <h1>Day 12: HashMap internals</h1>
      <section>
        <h2>How hashing works</h2>
        <p>…</p>
      </section>
    </article>
    <aside>Related: Day 13, ConcurrentHashMap</aside>
  </main>

  <footer>© 2026 Java Fullstack</footer>
</body>
```

| Tag | Meaning |
|---|---|
| `<header>` | intro area of the page or a section (logo, title, nav) |
| `<nav>` | a block of main navigation links |
| `<main>` | the main content; **one per page** |
| `<article>` | a self-contained piece that makes sense alone (a post, a product card) |
| `<section>` | a themed group of content, usually with a heading |
| `<aside>` | related but secondary content (sidebar, tips) |
| `<footer>` | closing info (copyright, links) |
| `<div>` / `<span>` | no meaning at all: a box for layout (block) or for styling a bit of text (inline) |

"Div soup" is a page made only of `div`s: it looks the same, but a screen reader can't find the navigation or the main content, and the code is harder to read.

<details>
<summary>article or section: which one for a blog post in a list of posts?</summary>

`<article>`: each post makes sense on its own and could be shared or syndicated by itself. Use `<section>` for a themed part *within* something, like "Comments" or "Related posts".
</details>

<!-- subtopic: f2_s4 -->
### Forms

Forms are how users send data. Even in React you'll use these same elements:

```html
<form action="/api/signup" method="post">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required placeholder="you@example.com">

  <label for="pw">Password</label>
  <input id="pw" name="password" type="password" minlength="8" required>

  <label for="track">Track</label>
  <select id="track" name="track">
    <option value="beginner">Beginner</option>
    <option value="interview">Interview</option>
  </select>

  <label>
    <input type="checkbox" name="terms" required> I accept the terms
  </label>

  <label for="bio">About you</label>
  <textarea id="bio" name="bio" rows="3"></textarea>

  <button type="submit">Sign up</button>
</form>
```

- **Every input needs a `<label>`.** Connect them with `for` = the input's `id` (or wrap the input inside the label). Clicking the label then focuses the input, and screen readers announce it.
- **Pick the right `type`**: `email`, `password`, `number`, `date`, `tel`, `url`, `checkbox`, `radio`, `file`. Phones show the matching keyboard, and the browser validates for free.
- **Built-in validation**: `required`, `minlength`, `maxlength`, `min`, `max`, `pattern="[A-Z]{3}"`. The browser blocks submit and shows a message.
- **`name` is the key** the server receives (`email=you@example.com`).
- A `<button>` inside a form submits it by default. For a button that shouldn't submit, write `type="button"`.

In a React app you usually stop the browser's own submit (`event.preventDefault()`) and send JSON with `fetch` instead (Module 10).

<details>
<summary>Is the browser's required / minlength validation enough to protect your API?</summary>

No. It only helps honest users. Anyone can remove the attributes in DevTools or call the API directly, so Spring Boot must validate again (`@Valid`, `@NotBlank`, `@Email`), as in the Spring validation day.
</details>

<!-- subtopic: f2_s5 -->
### Tables, and block vs inline

Use a table **only for tabular data** (rows and columns that belong together), never for page layout:

```html
<table>
  <caption>LeetCode progress</caption>
  <thead>
    <tr><th scope="col">Topic</th><th scope="col">Solved</th></tr>
  </thead>
  <tbody>
    <tr><td>Arrays</td><td>12</td></tr>
    <tr><td>Trees</td><td>7</td></tr>
  </tbody>
</table>
```

Every element is one of two kinds by default:

| Block elements | Inline elements |
|---|---|
| start on a new line, take the full width | sit inside a line of text, only as wide as their content |
| `div`, `p`, `h1`–`h6`, `ul`, `li`, `section`, `form`, `table` | `span`, `a`, `strong`, `em`, `img`, `code`, `label`, `input`, `button` |
| width and height apply | width and height mostly ignored (except img, input, button) |

CSS can change this with the `display` property (Module 3), so "block" and "inline" are defaults, not fixed rules.

<details>
<summary>Why shouldn't you put a div inside a p?</summary>

A paragraph may only contain inline content. The browser automatically closes the `<p>` when it meets the `<div>`, so your DOM ends up different from what you wrote, and styles break in confusing ways.
</details>

<!-- subtopic: f2_s6 -->
### Accessibility basics

About one in six people has a disability, and accessible pages also work better for everyone (keyboard users, people on a bright phone screen, search engines). The basics cost almost nothing:

1. **Use the right element.** A `<button>` is focusable, works with Enter and Space, and is announced as "button". A clickable `<div>` does none of that.
2. **Images get `alt` text**; decorative ones get `alt=""`.
3. **Every form input has a label.**
4. **Headings in order** (`h1` → `h2` → `h3`), without skipping levels for looks.
5. **Links say where they go.** "Read the Day 12 notes", not "click here".
6. **The page works with only a keyboard**: Tab moves through links, buttons and inputs, and you can always see which one has focus.
7. **Enough colour contrast**, and colour is never the only signal (an error also says "Error", not just red).

**Button or link?** A link (`<a href>`) **goes somewhere** (another page or URL). A button **does something** (submits, opens a menu, deletes).

**ARIA** attributes (`aria-label`, `role`, `aria-expanded`) add meaning that HTML can't express, like labelling an icon-only button:

```html
<button aria-label="Close dialog">✕</button>
```

The first rule of ARIA: if a real HTML element does the job, use it instead. Module 24 goes deeper.

<details>
<summary>Name three things a div with an onclick handler lacks compared to a button.</summary>

It can't be reached with Tab (no keyboard focus), it doesn't react to Enter or Space, and screen readers don't announce it as a button. You'd have to add `tabindex`, key handlers and `role="button"` to fake what `<button>` gives you for free.
</details>

## 📝 Module 2 Recap

1. What does the viewport meta tag do? → **makes phones use their real width instead of shrinking a desktop-width page**
2. How many h1 per page? → **one, for the main title; h2 to h6 follow in order**
3. What should alt text say? → **the image's purpose; empty alt for decorative images**
4. Why use semantic tags like nav and main? → **they tell screen readers, search engines and developers what each part is**
5. How do you connect a label to an input? → **label for = the input's id, or wrap the input in the label**
6. Does HTML validation protect your API? → **no, the server must validate again**
7. When is a table the right choice? → **only for tabular data, never for layout**
8. Button or link? → **a link goes somewhere; a button does something**
9. First rule of ARIA? → **use a real HTML element if one does the job**
