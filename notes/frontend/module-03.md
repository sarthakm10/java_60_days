# Frontend 3 — CSS Essentials

> **CSS decides how everything looks.** The language is simple; what trips people up is *which* rule wins and how boxes take up space. Get the cascade and the box model right and most "why does it look like that?" moments disappear.

<!-- subtopic: f3_s1 -->
### Adding CSS and its syntax

A CSS rule is a **selector** (what to style) and a block of **declarations** (`property: value;`):

```css
h1 {
  color: navy;          /* property: value; */
  font-size: 2rem;
}
```

Three ways to attach CSS to a page:

```html
<!-- 1. External file (use this): cached by the browser, shared by every page -->
<link rel="stylesheet" href="styles.css">

<!-- 2. Internal: a style block in the head, for one page -->
<style>
  h1 { color: navy; }
</style>

<!-- 3. Inline: on one element; hard to maintain and hard to override -->
<h1 style="color: navy">Hello</h1>
```

Use external files (or, in React, CSS files imported by components). Inline styles are for values that JavaScript calculates, like a progress bar's width.

<details>
<summary>Why are external stylesheets preferred over inline styles?</summary>

One file styles every page and is cached after the first visit; you change a colour in one place instead of hundreds; and inline styles have very high priority, so they're hard to override later.
</details>

<!-- subtopic: f3_s2 -->
### Selectors

| Selector | Matches | Example |
|---|---|---|
| `p` | every `<p>` element | `p { line-height: 1.6; }` |
| `.card` | elements with `class="card"` | `.card { padding: 16px; }` |
| `#login` | the element with `id="login"` | avoid for styling (too strong, see the next section) |
| `a, button` | either one (a group) | `a, button { cursor: pointer; }` |
| `.card p` | a `<p>` anywhere inside a `.card` (descendant) | |
| `.menu > li` | an `<li>` directly inside `.menu` (child) | |
| `input[type="email"]` | elements with that attribute value | |
| `.btn.primary` | elements with **both** classes | |

**Pseudo-classes** match a state:

```css
a:hover { text-decoration: underline; }        /* mouse over it */
button:focus-visible { outline: 3px solid orange; }   /* reached with the keyboard */
input:invalid { border-color: crimson; }
li:nth-child(odd) { background: #f5f5f5; }     /* zebra stripes */
li:first-child, li:last-child { font-weight: bold; }
```

**Pseudo-elements** style a part of an element: `p::first-line`, `.required::after { content: " *"; }`.

Prefer **classes** for almost everything: they're reusable, and they keep the rules easy to override.

<details>
<summary>What's the difference between .card p and .card > p?</summary>

`.card p` matches every paragraph anywhere inside a card, however deep. `.card > p` matches only paragraphs that are direct children of the card.
</details>

<!-- subtopic: f3_s3 -->
### The cascade and specificity

When two rules set the same property on the same element, the browser decides in this order:

1. **Importance**: `!important` beats normal declarations.
2. **Specificity**: the more specific selector wins.
3. **Order**: if specificity is equal, the rule that comes **later** wins.

Specificity is counted as three numbers, **(ids, classes, elements)**, compared left to right:

| Selector | Specificity |
|---|---|
| `p` | (0, 0, 1) |
| `.intro` | (0, 1, 0) |
| `p.intro` | (0, 1, 1) |
| `.card .title` | (0, 2, 0) |
| `#header` | (1, 0, 0) |
| `style="…"` inline | beats all of these |

```css
#main p { color: red; }     /* (1, 0, 1) */
.text { color: blue; }      /* (0, 1, 0): loses, even though it comes later */
```

Pseudo-classes and attribute selectors count as classes; pseudo-elements count as elements.

**`!important`** jumps the queue, and then the only way to beat it is another `!important`. Treat it as a last resort (overriding a third-party library), not a fix.

Some properties are **inherited**: text ones like `color`, `font-family` and `line-height` flow down from a parent to its children. Box ones like `margin`, `border` and `background` don't.

#### 🚀 Specificity in practice

Teams avoid specificity wars by styling almost everything with **single classes** (BEM naming like `.card__title--active`, or utility classes like Tailwind), so most rules have (0, 1, 0) and order decides. Modern CSS also has `:where()` (always zero specificity, handy for resets) and **cascade layers** (`@layer base, components, utilities;`), which let you decide which group of rules wins regardless of specificity. In an interview, "keep specificity low and flat" is the answer they want.

<details>
<summary>Which wins: #nav a (1,0,1) or .menu .link.active (0,3,0)?</summary>

`#nav a`. Specificity is compared left to right, and one id beats any number of classes.
</details>

<!-- subtopic: f3_s4 -->
### The box model

Every element is a rectangular box with four layers, from the inside out:

```text
┌──────────────── margin (space outside, transparent) ────────────────┐
│  ┌──────────────── border ────────────────────────────────────────┐ │
│  │  ┌──────────── padding (space inside, has the background) ───┐ │ │
│  │  │                     content                              │ │ │
│  │  └───────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

```css
.card {
  width: 300px;
  padding: 16px;           /* all four sides */
  border: 2px solid #ddd;
  margin: 24px auto;       /* top/bottom 24px, left/right auto = centred */
}
```

By default (`box-sizing: content-box`), `width` is only the content, so this card is really 300 + 2×16 + 2×2 = **336px** wide. That surprises everyone, so almost every project starts with:

```css
*, *::before, *::after { box-sizing: border-box; }   /* width now includes padding and border */
```

Two more things to know:

- **Shorthand order** is clockwise from the top: `margin: 10px 20px 30px 40px` = top, right, bottom, left. `margin: 10px 20px` = top/bottom 10, left/right 20.
- **Vertical margins collapse**: a 20px bottom margin above a 30px top margin gives a 30px gap, not 50px. (It doesn't happen inside flex and grid layouts.)

<details>
<summary>width: 200px, padding: 10px, border: 1px, box-sizing: border-box. How wide is the box?</summary>

200px. With border-box, padding and border are inside the width, so the content area shrinks to 200 − 20 − 2 = 178px. With content-box it would be 222px.
</details>

<!-- subtopic: f3_s5 -->
### Units, colours and text

| Unit | Relative to | Use it for |
|---|---|---|
| `px` | nothing (fixed) | borders, small details |
| `%` | the parent's size | widths inside a container |
| `rem` | the root font size (usually 16px) | font sizes, spacing: scales when the user enlarges text |
| `em` | the element's own font size | padding that grows with a button's text |
| `vw` / `vh` | 1% of the viewport's width / height | full-screen sections, fluid type |

Prefer **`rem`** for font sizes: users who set a bigger default font in their browser get bigger text.

Colours: `red`, `#1e90ff` (hex), `rgb(30 144 255)`, `rgb(30 144 255 / 50%)` (with transparency), `hsl(210 100% 56%)` (hue, saturation, lightness; easy to make lighter or darker shades).

Text styling you'll use constantly:

```css
body {
  font-family: "Inter", system-ui, sans-serif;   /* fallbacks after the first choice */
  font-size: 1rem;
  line-height: 1.6;
  color: #222;
}
h1 { font-size: 2.25rem; font-weight: 800; letter-spacing: -0.02em; }
.muted { color: #666; }
.center { text-align: center; }
```

Web fonts come from a `<link>` to Google Fonts, or `@font-face` with your own files.

<details>
<summary>Why use rem instead of px for font sizes?</summary>

rem follows the root font size, which follows the user's browser setting. If someone sets a larger default font for readability, rem-based text grows with it; px text ignores their choice.
</details>

<!-- subtopic: f3_s6 -->
### display and position

**`display`** decides how a box behaves in the flow:

| Value | Behaviour |
|---|---|
| `block` | new line, full width, width/height work |
| `inline` | flows in text, width/height ignored |
| `inline-block` | flows in text, but width/height work |
| `none` | removed completely (takes no space) |
| `flex` / `grid` | lays out its children (Module 4) |

`visibility: hidden` hides an element but **keeps its space**; `display: none` removes it.

**`position`** moves a box out of the normal flow:

| Value | Positioned relative to | Stays in the flow? |
|---|---|---|
| `static` (default) | — (top/left are ignored) | yes |
| `relative` | where it would normally be | yes (its space is kept) |
| `absolute` | the nearest positioned ancestor (anything not static) | no |
| `fixed` | the viewport: it stays put when you scroll | no |
| `sticky` | normal until you scroll past a point, then sticks | yes |

The classic pattern: a badge in the corner of a card.

```css
.card { position: relative; }            /* the anchor */
.card .badge {
  position: absolute;
  top: 8px;
  right: 8px;                            /* 8px from the card's corner */
}
.site-header { position: sticky; top: 0; }   /* sticks to the top while scrolling */
```

**`z-index`** sets which positioned box is on top when they overlap (higher wins). It only works on positioned elements (and flex/grid children), and only compares elements inside the same **stacking context**, which is why `z-index: 9999` sometimes "doesn't work".

<details>
<summary>An absolutely positioned badge jumps to the corner of the whole page instead of its card. Why?</summary>

`absolute` is relative to the nearest *positioned* ancestor. The card has the default `position: static`, so the browser keeps looking up and ends at the page. Give the card `position: relative`.
</details>

## 📝 Module 3 Recap

1. Best way to attach CSS? → **an external stylesheet (or component CSS files in React)**
2. .card vs #card? → **class: reusable, low specificity; id: unique, very high specificity**
3. What decides which rule wins? → **importance, then specificity, then order (later wins)**
4. Specificity of .nav a:hover? → **(0, 2, 1)**
5. What does box-sizing: border-box do? → **makes width include padding and border**
6. margin: 10px 20px means? → **10px top and bottom, 20px left and right**
7. rem is relative to? → **the root element's font size**
8. display: none vs visibility: hidden? → **none removes the space; hidden keeps it**
9. absolute is positioned relative to? → **the nearest positioned ancestor**
10. sticky does what? → **scrolls normally until a threshold, then sticks**
