// The panel beside the editor: shows the recording with the website's player (visualizer.js) and tells the
// extension where each step is, so the editor can highlight it.
(function () {
  const vscode = acquireVsCodeApi();
  const root = document.getElementById("root");
  const status = document.getElementById("status");
  let player = null;
  let trace = null;

  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function setStatus(html, kind) {
    status.hidden = !html;
    status.className = kind || "";
    status.innerHTML = html || "";
    status.querySelector("[data-rerun]")?.addEventListener("click", () => vscode.postMessage({ type: "rerun" }));
    status.querySelector("[data-input]")?.addEventListener("click", () => vscode.postMessage({ type: "setInput" }));
  }

  // The editor's end-of-line note: what the line changed ("right 3 → 2"), or the call / return / exception
  function hintFor(text) {
    const ran = /^Line \d+\s+ran: (.+)$/.exec(text);
    if (ran) return ran[1];
    const event = /^(Call|Return|Exception)\s+(.+)$/.exec(text);
    return event ? `${event[1].toLowerCase()}: ${event[2].replace(/: a new frame on the call stack$/, "")}` : "";
  }

  // After a re-record, stay near where you were: the same line closest to the old step, else the same step number
  function startAt(steps, keep) {
    if (!keep || !steps.length) return 0;
    let best = -1;
    steps.forEach((s, i) => {
      if (s.line === keep.line && (best < 0 || Math.abs(i - keep.index) < Math.abs(best - keep.index))) best = i;
    });
    return best >= 0 ? best : Math.min(keep.index || 0, steps.length - 1);
  }

  function show(msg) {
    trace = msg.trace;
    if (!trace.steps.length) {
      player = null;
      root.innerHTML = `<div class="panel-empty">The program finished without running any of its own lines.</div>`;
      return;
    }
    root.innerHTML = "";
    const box = document.createElement("div");
    box.classList.toggle("no-code", !msg.showCode);
    root.append(box);
    const last = trace.steps[trace.steps.length - 1];
    player = CodeVisualizer.embed(box, trace, {
      realLines: true,
      title: `${trace.program}.java`,
      kicker: `${trace.steps.length} steps · recorded in ${(msg.ms / 1000).toFixed(1)} s`,
      onStep(step, index, text) {
        const prev = trace.steps[index - 1];
        const ran = prev && prev.frames.length === step.frames.length && prev.line !== step.line ? prev.line : null;
        vscode.postMessage({
          type: "step",
          index,
          line: step.line,
          callers: step.frames.slice(0, -1).map(f => f.line),
          ran,
          hint: hintFor(text),
        });
      },
    });
    player.go(startAt(trace.steps, msg.keep));
    const notes = [];
    if (trace.truncated) notes.push(`Stopped after ${trace.steps.length} steps (the step limit). Use a smaller input, or raise <code>javaStepVisualizer.maxSteps</code>.`);
    if (last.exception) notes.push(`The program stopped with <b>${esc(last.exception)}</b> on line ${last.line}.`);
    if (msg.hasInput) notes.push(`Reads the input you gave. <button data-input>Change input</button>`);
    setStatus(notes.join("<br>"), last.exception || trace.truncated ? "warn" : "info");
  }

  window.addEventListener("message", (e) => {
    const msg = e.data;
    if (msg.type === "status") {
      if (!player) root.innerHTML = `<div class="panel-empty">${esc(msg.text)}</div>`;
      else setStatus(`<span class="spin"></span> ${esc(msg.text)}`, "info");
    } else if (msg.type === "trace") {
      show(msg);
    } else if (msg.type === "error") {
      const box = `<b>Couldn't record this run.</b><pre>${esc(msg.text)}</pre><button data-rerun>Try again</button>`;
      if (player) setStatus(box + `<div class="hint">Showing the last run that worked.</div>`, "error");
      else { root.innerHTML = ""; setStatus(box, "error"); }
    } else if (msg.type === "act" && player) {
      player.act(msg.act);
    } else if (msg.type === "seekLine" && player) {
      if (!player.seekLine(msg.line)) vscode.postMessage({ type: "notFound", line: msg.line });
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!player || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.target.type !== "range") return;
    const acts = { ArrowRight: "next", ArrowLeft: "prev", Home: "first", End: "last", " ": "play" };
    if (acts[e.key]) { e.preventDefault(); player.act(acts[e.key]); }
  });

  vscode.postMessage({ type: "ready" });
})();
