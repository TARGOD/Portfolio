/* =====================================================================
   console.js: the agent console. Every action on the site is traced
   here, and visitors can drive the site (and the robot) with commands.
   Toggle with ` (backtick) or by clicking the pill.
   ===================================================================== */
const Console = (() => {
  const el = $("#console"), logEl = $("#cLog"), input = $("#cIn"), last = $("#cLast");
  const lines = [], hist = []; let hi = -1, open = false, t0 = performance.now(), sudoTries = 0;
  const stamp = () => { const s = Math.floor((performance.now()-t0)/1000); return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; };

  function log(html, cls=""){
    const d = document.createElement("div"); d.className = "cl " + cls; d.innerHTML = `<span class="t">${stamp()}</span><span class="m">${html}</span>`;
    logEl.appendChild(d); while (logEl.childElementCount > 80) logEl.firstElementChild.remove();
    if (open) logEl.scrollTop = 1e9;
    if (cls !== "in") last.innerHTML = html;
  }
  function toggle(on){ open = on === undefined ? !open : on; el.classList.toggle("open", open); if (open){ setTimeout(() => { input.focus(); logEl.scrollTop = 1e9; }, 60); } else input.blur(); }

  const fn = (name, args="") => `<span class="fn">${name}</span>(${args})`;
  const ok = s => `<span class="ok">${s}</span>`, bad = s => `<span class="bad">${s}</span>`, str = s => `<span class="s">"${esc(s)}"</span>`;
  const DOCKEY = {story:"about", about:"about", paper:"paper", ieee:"paper", agents:"agentsP", orchestration:"agentsP", erp:"erp", tally:"erp", lora:"lora", llm:"lora", colligence:"coll", work:"coll", origin:"intern", intern:"intern", codeorigin:"intern"};
  const HELP = [
    ["help","this list"], ["ls","list sections"], ["goto <section>","space · tour · journey · detail · contact"],
    ["search <query>","embed a query into the latent space"], ["open <doc>","story · paper · agents · erp · lora · colligence · origin"],
    ["ckpt <0-7>","enter a journey checkpoint"], ["paper","enter the IEEE checkpoint"], ["slm","train a toy language model"],
    ["head <1-5>","switch attention head"], ["poke","bother the robot"], ["hire","you know what this does"], ["anime","???"], ["clear","clear the trace"]
  ];
  const CMDS = {
    help(){ log(HELP.map(([c,d]) => `<span class="fn">${c.padEnd(16," ")}</span> <span class="mu">${d}</span>`).join("<br/>")); },
    ls(){ log(`<span class="fn">space/  tour/  journey/  detail/  contact/</span>  <span class="s">anime.html</span>  <span class="mu">Vijay_Bhat.pdf</span>`); },
    goto(a){ const s = (a[0]||"").toLowerCase(); const map = {space:"top", home:"top", top:"top", tour:"ch-agents", skills:"ch-agents", journey:"journey", run:"journey", detail:"detail", details:"detail", contact:"contact"};
      if (!map[s]){ log(bad(`✗ unknown section ${str(s)}`) + " · try " + fn("ls")); return; }
      log(`${fn("nav.goto", str(s))} ${ok("✓")}`); SiteNav.go(map[s]); },
    cd(a){ CMDS.goto([(a[0]||"").replace(/\/$/,"")]); },
    search(a){ const q = a.join(" "); if (!q){ log(bad("✗ usage: search <query>")); return; } SiteNav.go("top"); setTimeout(() => { $("#q").value = q; $("#search").classList.add("has"); Space.runQuery(q); }, 450); },
    open(a){ const k = DOCKEY[(a[0]||"").toLowerCase()]; if (!k){ log(bad(`✗ no doc ${str(a[0]||"")}`) + ` · ${Object.keys(DOCKEY).slice(0,8).join(" · ")}`); return; } SiteNav.openDetail(k); },
    ckpt(a){ const i = parseInt(a[0]); if (isNaN(i) || i < 0 || i >= JOURNEY.length){ log(bad("✗ usage: ckpt <0-7>")); return; } Portal.open(i); },
    paper(){ Portal.open(3); }, slm(){ Portal.open(2); }, journey(){ CMDS.goto(["journey"]); },
    head(a){ const k = parseInt(a[0]); if (!(k >= 1 && k <= 5)){ log(bad("✗ usage: head <1-5>")); return; } SiteNav.go("detail"); Att.head(k); log(`${fn("attention.head", k)} ${ok("✓")}`); },
    poke(){ Bot.poke(); },
    hire(){ log(`${fn("mail.compose", str(LINKS.email))} ${ok("✓ opening your mail client")}`); Bot.mood("happy", 2); Bot.say("Excellent decision. 💌", 2.4); setTimeout(() => location.href = "mailto:" + LINKS.email, 600); },
    contact(){ CMDS.goto(["contact"]); },
    sudo(a){ const rest = a.join(" ").toLowerCase();
      if (rest.startsWith("hire")){ log(`[sudo] password for recruiter: ${"•".repeat(8)}`); setTimeout(() => { log(ok("✓ permission granted. hiring is the correct call.")); Bot.mood("happy", 3); Bot.say("sudo accepted. Opening mail…", 2.4); SiteNav.confetti && SiteNav.confetti(); setTimeout(() => location.href = "mailto:" + LINKS.email, 1400); }, 700); return; }
      sudoTries++; log(bad(sudoTries > 2 ? "✗ this incident will be reported to UNIT-VB." : "✗ user is not in the sudoers file. try: sudo hire vijay")); },
    rm(){ Bot.mood("error", 1.6); Bot.say("Nice try. Everything here is traced.", 2.4); log(bad("✗ permission denied: guardrails active")); },
    whoami(){ log(`<span class="s">a curious human</span> <span class="mu">· probably a great recruiter</span>`); },
    coffee(){ log(`${fn("graph.add_node", str("coffee"))} ${ok("✓")} <span class="mu">· throughput +12% (unverified)</span>`); Bot.say("☕ brewing…", 1.8); },
    anime(){ log(`${fn("mode.switch", str("anime"))} <span class="s">覚醒</span>`); Bot.say("Switching realities… ⚡", 1.8); document.documentElement.classList.add("to-anime"); setTimeout(() => location.href = "anime.html", 900); },
    clear(){ logEl.innerHTML = ""; },
    exit(){ toggle(false); }
  };
  CMDS.hello = CMDS.hi = () => { Bot.say("Hi! Type help to see what I can do.", 2.6); log(`unit-vb › ${str("hi! try help")}`); };

  function exec(raw){
    raw = raw.trim(); if (!raw) return; hist.unshift(raw); hi = -1;
    log(`<span class="u">›</span> ${esc(raw)}`, "in");
    const [cmd, ...args] = raw.replace(/^\//,"").split(/\s+/);
    const f = CMDS[cmd.toLowerCase()];
    if (f) f(args); else { log(bad(`✗ command not found: ${esc(cmd)}`) + " · try " + fn("help")); Bot.mood("error", 1); }
  }
  input.addEventListener("keydown", e => {
    if (e.key === "Enter"){ exec(input.value); input.value = ""; }
    else if (e.key === "ArrowUp"){ hi = Math.min(hist.length-1, hi+1); if (hist[hi]) input.value = hist[hi]; e.preventDefault(); }
    else if (e.key === "ArrowDown"){ hi = Math.max(-1, hi-1); input.value = hi >= 0 ? hist[hi] : ""; e.preventDefault(); }
    else if (e.key === "Escape") toggle(false);
    e.stopPropagation();
  });
  $("#cPill").addEventListener("click", () => toggle());
  $("#cX").addEventListener("click", () => toggle(false));
  $$("#console [data-cmd]").forEach(b => b.addEventListener("click", () => exec(b.dataset.cmd)));
  addEventListener("keydown", e => { if ((e.key === "`" || e.key === "~") && document.activeElement !== input && document.activeElement.tagName !== "INPUT"){ e.preventDefault(); toggle(); } });

  return { log, exec, toggle, fn, ok, str };
})();
