React with nothing to install: each exercise is one HTML file that loads React from a CDN and compiles your JSX in the browser. Save it, open it with Live Server, and edit the component inside the `text/babel` script. (Real projects use Vite, as in Module 15; this setup is just for practice.)

<!-- exercise: f15_e1 | Easy | Team cards from data -->
**Concepts:** components · props · `children` · rendering a list with `map` and `key` · conditional rendering

**Task.** Turn the `team` array into cards. Build three small components:

1. `Avatar({ name })`: a circle showing the person's initials ("Asha Rao" → "AR").
2. `MemberCard({ member })`: the avatar, the name, the role, and a green "On call" badge **only** for people who are on call. If a member has no skills, show "No skills listed", otherwise the skills joined with " · ".
3. `TeamList({ title, members, children })`: a heading with the title and the member count, the cards, and whatever `children` it's given at the bottom. If there are no members, show "Nobody here yet" instead of the cards.

Render two `TeamList`s: "Frontend" with the frontend people, and "Design" with an empty array, each with a small footer passed as children.

**Starter code** · `team.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Team</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; background: #f8fafc; margin: 32px; }
    .list { max-width: 520px; margin-bottom: 28px; }
    .card { display: flex; gap: 12px; align-items: center; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; margin: 8px 0; }
    .avatar { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: #dbeafe; color: #1e40af; font-weight: 700; }
    .badge { background: #dcfce7; color: #166534; border-radius: 999px; padding: 1px 8px; font-size: 12px; margin-left: 6px; }
    .muted { color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React from "react";
    import { createRoot } from "react-dom/client";

    const team = [
      { id: 1, name: "Asha Rao", role: "Frontend lead", onCall: true, skills: ["React", "TypeScript"] },
      { id: 2, name: "Ben Thomas", role: "Frontend developer", onCall: false, skills: [] },
      { id: 3, name: "Chen Li", role: "Frontend developer", onCall: false, skills: ["CSS", "Accessibility"] },
    ];

    // TODO: Avatar, MemberCard, TeamList

    function App() {
      return <p>TODO: render the two team lists</p>;
    }

    createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
```

**Sample output**

```text
Frontend (3)
  [AR] Asha Rao  On call       Frontend lead · React · TypeScript
  [BT] Ben Thomas              Frontend developer · No skills listed
  [CL] Chen Li                 Frontend developer · CSS · Accessibility
  Ask in #frontend for help.
Design (0)
  Nobody here yet
  We're hiring!
```

<!-- hints -->
- Initials: `name.split(" ").map(part => part[0]).join("")`.
- The badge is "something or nothing": `{member.onCall && <span className="badge">On call</span>}`.
- In `TeamList`, use an early return or a ternary for the empty case, and `members.map(m => <MemberCard key={m.id} member={m} />)` for the cards. The `key` goes on the element returned by `map`.
- `children` is just a prop: put `{children}` where the footer should appear.
<!-- solution -->
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Team</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; background: #f8fafc; margin: 32px; }
    .list { max-width: 520px; margin-bottom: 28px; }
    .card { display: flex; gap: 12px; align-items: center; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; margin: 8px 0; }
    .avatar { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: #dbeafe; color: #1e40af; font-weight: 700; }
    .badge { background: #dcfce7; color: #166534; border-radius: 999px; padding: 1px 8px; font-size: 12px; margin-left: 6px; }
    .muted { color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React from "react";
    import { createRoot } from "react-dom/client";

    const team = [
      { id: 1, name: "Asha Rao", role: "Frontend lead", onCall: true, skills: ["React", "TypeScript"] },
      { id: 2, name: "Ben Thomas", role: "Frontend developer", onCall: false, skills: [] },
      { id: 3, name: "Chen Li", role: "Frontend developer", onCall: false, skills: ["CSS", "Accessibility"] },
    ];

    function Avatar({ name }) {
      const initials = name.split(" ").map(part => part[0]).join("");
      return <div className="avatar" aria-hidden="true">{initials}</div>;
    }

    function MemberCard({ member }) {
      return (
        <article className="card">
          <Avatar name={member.name} />
          <div>
            <strong>{member.name}</strong>
            {member.onCall && <span className="badge">On call</span>}
            <div className="muted">
              {member.role} · {member.skills.length > 0 ? member.skills.join(" · ") : "No skills listed"}
            </div>
          </div>
        </article>
      );
    }

    function TeamList({ title, members, children }) {
      return (
        <section className="list">
          <h2>{title} ({members.length})</h2>
          {members.length === 0
            ? <p className="muted">Nobody here yet</p>
            : members.map(m => <MemberCard key={m.id} member={m} />)}
          {children}
        </section>
      );
    }

    function App() {
      return (
        <>
          <TeamList title="Frontend" members={team}>
            <p className="muted">Ask in #frontend for help.</p>
          </TeamList>
          <TeamList title="Design" members={[]}>
            <p className="muted">We're hiring!</p>
          </TeamList>
        </>
      );
    }

    createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
```

Each component does one thing and gets everything it needs through props, so `MemberCard` could be reused anywhere. The badge uses `&&` safely because `onCall` is a real boolean (with a number like `0`, React would render the 0, Module 15). The skills check uses `length > 0` for the same reason. `aria-hidden` on the avatar stops screen readers from reading "A R" before the name.
