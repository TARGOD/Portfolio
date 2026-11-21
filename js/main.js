/* =====================================================================
   main.js: the conductor.
   Performance rule: layout is measured once (resize / fonts / doc
   change) and cached; the per-frame loop only uses scrollY + the cache,
   so it never forces the browser to re-layout mid-frame.
   ===================================================================== */
const SiteNav = (() => {
  /* ---------- tour: invisible scroll spacers + ONE card slot ---------- */
  $("#chapters").innerHTML = `<div class="ch-spacer"></div>` + CHAPTERS.map(c => `<article class="chapter" data-k="${c.k}" id="ch-${c.k}"></article>`).join("");
  $("#chdots").innerHTML = CHAPTERS.map(c => `<button data-k="${c.k}" style="--c:${CL[c.k].color}"><span>${CL[c.k].name}</span><i></i></button>`).join("");
  const card = $("#chcard"), ci = $("#chci"), cpb = $("#cpb");
  const cardHTML = (c,i) => `
    <div class="cn"><span>02.${i+1} / 0${CHAPTERS.length}</span><i></i><span>${CL[c.k].name.toUpperCase()}</span></div>
    <h3>${c.title}</h3>
    <p>${c.body}</p>
    <div class="flow" style="--n:${c.flow.length}">${c.flow.map((f,j) => `${j?`<b style="--i:${j}"></b>`:""}<span style="--i:${j}">${f}</span>`).join("")}</div>
    <div class="cchips">${c.chips.map(id => `<button data-node="${id}"><i></i>${esc(Space.byId[id].label)}</button>`).join("")}</div>
    <div class="ev">${esc(c.ev)}</div>
    <button class="more" data-doc="${c.doc}">Read the detail with attention <span>↓</span></button>`;
  let cardK = null, swapping = null;
  function showCard(k){
    if (k === cardK) return; const prev = cardK; cardK = k;
    if (!k){ card.classList.remove("on"); return; }
    const c = CHAPTERS.find(x => x.k === k), i = CHAPTERS.indexOf(c);
    const apply = () => { card.style.setProperty("--c", CL[k].color); ci.innerHTML = cardHTML(c, i); };
    const enter = () => ci.animate([{opacity:0, transform:"translateY(14px)"},{opacity:1, transform:"none"}], {duration:REDUCED?0:300, easing:"cubic-bezier(.2,.8,.2,1)"});
    card.classList.add("on");
    if (!prev){ apply(); enter(); return; }
    if (swapping) swapping.cancel();
    swapping = ci.animate([{opacity:1, transform:"none"},{opacity:0, transform:"translateY(-10px)"}], {duration:REDUCED?0:140, easing:"ease-in", fill:"forwards"});
    swapping.onfinish = () => { swapping = null; apply(); ci.getAnimations().forEach(a => a.cancel()); enter(); };
  }

  /* ---------- links ---------- */
  ["#navMail","#cMail"].forEach(s => $(s).href = "mailto:"+LINKS.email);
  $("#bigmail").href = "mailto:"+LINKS.email; $("#bigmail").textContent = LINKS.email;
  $("#cLi").href = LINKS.linkedin; $("#cGh").href = LINKS.github; ["#cCv","#navCv"].forEach(s => $(s).href = LINKS.resume);
  $("#cPaper").href = LINKS.paper;

  /* ---------- layout cache ---------- */
  const L = {vh:innerHeight, vw:innerWidth, ch:[]};
  function measure(){
    const y = scrollY, abs = el => el.getBoundingClientRect().top + y;
    L.vh = innerHeight; L.vw = innerWidth; L.stacked = L.vw < 900;
    const wrap = $("#space-wrap"); L.wrapTop = abs(wrap); L.wrapH = wrap.offsetHeight;
    L.ch = $$(".chapter").map(el => ({k:el.dataset.k, top:abs(el), h:el.offsetHeight}));
    for (const id of ["journey","detail","contact"]){ const el = $("#"+id); L[id] = {top:abs(el), h:el.offsetHeight}; }
    L.heroRight = $("#hero .hero-col").getBoundingClientRect().right;
    const st = $("#story").getBoundingClientRect(); L.storyTop = st.top + y; L.storyRight = st.right;
    const mg = $("#contact .mega").getBoundingClientRect(); L.megaRight = mg.right; L.megaTop = mg.top + y;
    L.max = document.documentElement.scrollHeight - L.vh;
    lastSY = -1;
  }

  /* ---------- navigation ---------- */
  const smooth = REDUCED ? "auto" : "smooth";
  function go(id){ Portal.close(); const el = document.getElementById(id); if (!el) return;
    window.scrollTo({top: id === "top" ? 0 : el.getBoundingClientRect().top + scrollY - (id === "detail" ? 10 : 0), behavior: smooth}); }
  function openDetail(doc, tok){ Portal.close(); Att.open(doc, tok); setTimeout(() => go("detail"), 30); }
  document.addEventListener("click", e => {
    const d = e.target.closest("[data-doc]"); if (d && !d.closest("#doctabs") && !d.closest("#seen")){ e.preventDefault(); openDetail(d.dataset.doc, d.dataset.tok); return; }
    const n = e.target.closest(".cchips [data-node]"); if (n){ const node = Space.byId[n.dataset.node]; Space.select(node, {quiet:true}); Bot.say(`→ ${node.label}`, 1.6); Console.log(`${Console.fn("space.focus", Console.str(node.label))}`); return; }
    const k = e.target.closest("#chdots [data-k]"); if (k){ const c = L.ch.find(c => c.k === k.dataset.k); if (c) window.scrollTo({top: c.top - L.vh*.3, behavior:smooth}); }
  });

  /* ---------- console tracing hooks ---------- */
  const C = Console;
  Bot.hooks.onSay = t => C.log(`<span class="bot">unit-vb</span> ${C.str(t)}`, "say");
  Space.hooks.onQuery = (q, top) => { C.log(`${C.fn("space.search", C.str(q))} → ${top ? `top=${C.str(top.n.label)} ${top.s.toFixed(2)}` : '<span class="bad">∅ out of distribution</span>'}`);
    if (top) Bot.say(`nearest neighbour: “${top.n.label}” · ${top.s.toFixed(2)}`, 2.8); else Bot.say("Out of distribution. Try “agents”.", 2.4); };
  Space.hooks.onSelect = n => { C.log(`${C.fn("space.select", C.str(n.label))}`); if (zone.z === "hero") Bot.say(n.kind === "skill" ? `${n.label}: ${CL[n.cl].name}` : (n.full || n.label), 2.2); };
  Journey.hooks.onCheckpoint = c => { C.log(`${C.fn("trainer.save", C.str(c.file))} ${C.ok("✓ "+c.id)}`); if (zone.z === "journey" && !L.stacked) Bot.say(`${c.id}: ${c.title}`, 2.6); };
  Portal.hooks.onOpen = c => C.log(`${C.fn("portal.enter", C.str(c.id))} <span class="mu">· esc to leave · ←/→ to travel</span>`);
  Portal.hooks.onClose = () => C.log(`${C.fn("portal.exit")}`);
  Att.hooks.onDoc = d => { C.log(`${C.fn("detail.open", C.str(d.id))} <span class="mu">· ${d.name}</span>`); requestAnimationFrame(measure); };
  Att.hooks.onHead = (h, k) => C.log(`${C.fn("attention.head", k+1)} <span class="mu">· ${h.name}</span>`);

  /* ---------- input ---------- */
  const mouse = {x:-999, y:-999, in:false};
  addEventListener("pointermove", e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.in = e.pointerType === "mouse"; }, {passive:true});
  document.documentElement.addEventListener("pointerleave", () => mouse.in = false);
  addEventListener("pointerdown", e => { if (Bot.hit(e.clientX, e.clientY) && !e.target.closest("a,button,input,#portal,#console")) Bot.poke(); }, true);
  addEventListener("keydown", e => { if (e.key === "/" && zone.z === "hero" && document.activeElement.tagName !== "INPUT"){ e.preventDefault(); $("#q").focus(); } });
  const KON = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"]; let kp = 0;
  addEventListener("keydown", e => { kp = e.key === KON[kp] ? kp+1 : (e.key === KON[0] ? 1 : 0); if (kp === KON.length){ kp = 0; Console.exec("anime"); } });

  /* ---------- tour: one gesture = one card (wheel, trackpad momentum, touch) ---------- */
  let animUntil = 0, tIdx = -1, lastWheel = 0, gestureUsed = false;
  const tourStops = () => [0, ...L.ch.map(c => c.top + c.h*.5 - L.vh*.5)];
  const inTour = (sy, dir = 1) => L.ch.length && sy <= (dir < 0 && L.journey ? L.journey.top + 10 : tourStops()[L.ch.length] + 10);   // coming back up from the journey re-enters at the last card
  function stepTour(dir){
    const stops = tourStops(), sy = scrollY, now = performance.now();
    let cur = 0; if (now < animUntil && tIdx >= 0) cur = tIdx; else stops.forEach((s,i) => { if (sy >= s - 40) cur = i; });
    const go = i => { tIdx = i; animUntil = now + 700; window.scrollTo({top: stops[i], behavior: REDUCED ? "auto" : "smooth"}); return true; };
    if (dir < 0 && now >= animUntil && sy > stops[cur] + 60) return go(cur);   // snap back to the card we're on
    const next = cur + dir;
    if (next < 0 || next >= stops.length) return false;                        // leave the tour normally
    return go(next);
  }
  addEventListener("wheel", e => {
    if (Portal.isOpen || e.ctrlKey || Math.abs(e.deltaY) < 2) return;
    const now = performance.now(), fresh = now - lastWheel > 240; lastWheel = now;
    if (fresh) gestureUsed = false;
    if (gestureUsed){ e.preventDefault(); return; }               // swallow the rest of this gesture (trackpad momentum)
    if (!inTour(scrollY, e.deltaY > 0 ? 1 : -1)) return;
    if (stepTour(e.deltaY > 0 ? 1 : -1)){ e.preventDefault(); gestureUsed = true; }
  }, {passive:false});
  /* touch: a swipe moves exactly one card while inside the tour */
  let tch = null;
  const freeTouch = el => el.closest("#drawer,#console,#portal,.badges,input,textarea");
  addEventListener("touchstart", e => {
    if (Portal.isOpen || e.touches.length !== 1 || freeTouch(e.target) || !inTour(scrollY, -1)) { tch = null; return; }
    tch = {x:e.touches[0].clientX, y:e.touches[0].clientY, lock:null};
  }, {passive:true});
  addEventListener("touchmove", e => {
    if (!tch) return; const dx = e.touches[0].clientX - tch.x, dy = e.touches[0].clientY - tch.y;
    if (tch.lock === null && Math.hypot(dx, dy) > 8){ tch.lock = Math.abs(dy) > Math.abs(dx); if (tch.lock && !inTour(scrollY, dy < 0 ? 1 : -1)) { tch = null; return; } }
    if (tch.lock) e.preventDefault();
  }, {passive:false});
  addEventListener("touchend", e => {
    if (!tch || !tch.lock) { tch = null; return; }
    const dy = tch.y - e.changedTouches[0].clientY; tch = null;
    if (Math.abs(dy) < 30) return;
    const dir = dy > 0 ? 1 : -1;
    if (!stepTour(dir) && dir > 0 && L.journey) window.scrollTo({top: L.journey.top, behavior:"smooth"});   // past the last card → journey
  }, {passive:true});

  /* ---------- zones (pure arithmetic on the cache) ---------- */
  let zone = {z:"hero"}, zoneKey = "";
  function zoneAt(sy){
    const cy = sy + L.vh*.5;
    if (cy < L.wrapTop + L.wrapH){ for (const c of L.ch) if (cy >= c.top && cy < c.top + c.h) return {z:"chapter", k:c.k}; return {z:"hero"}; }
    for (const id of ["journey","detail","contact"]) if (L[id] && cy >= L[id].top && cy < L[id].top + L[id].h) return {z:id};
    return {z:"contact"};
  }
  const said = {};
  function onZone(z){
    const prev = zone; zone = z; zoneKey = z.z + (z.k||"");
    Att.setActive(z.z === "detail");
    showCard(z.z === "chapter" ? z.k : null);
    const navZ = z.z === "chapter" ? "tour" : z.z === "hero" ? "space" : z.z;
    $$("#navLinks a").forEach(a => a.classList.toggle("on", a.dataset.z === navZ));
    $$("#chdots button").forEach(b => b.classList.toggle("on", b.dataset.k === z.k));
    $("#chdots").classList.toggle("on", z.z === "chapter");
    C.log(`${C.fn("zone.enter", C.str(z.k ? "tour/"+z.k : z.z))}`, "zone");
    if (z.z === "chapter"){ const c = CHAPTERS.find(c => c.k === z.k); Space.setMode("chapter", c.k, c.focus); Bot.say(c.say, 3.2); }
    else if (z.z === "hero"){ Space.setMode("hero"); if (prev.z === "chapter") Bot.say("Back to the full map.", 1.8); }
    if (z.z === "journey" && !said.journey && !L.stacked){ said.journey = 1; Bot.say("My training run. Scroll to train, click a ◆ to step inside.", 3.6); }
    if (z.z === "detail"){ Bot.say(said.detail ? "Back to reading." : (L.stacked ? "Tap any word. You're the query now." : "Hover any word. You're the query now."), 2.8); said.detail = 1; }
    if (z.z === "contact") Bot.say("Your move. Say hi! 👋", 3.4);
  }

  /* ---------- robot choreography ---------- */
  function driveRobot(T, sy){
    const b = Bot.b, W = L.vw, H = L.vh;
    if (b.mood === "wave" && zone.z !== "contact") b.mood = "neutral";
    b.hidden = L.stacked && zone.z === "detail";
    b.quiet = L.stacked && (zone.z === "journey" || zone.z === "contact");
    switch (zone.z){
      case "hero": case "chapter": {
        const fp = Space.focusPoint();
        if (fp){ const side = fp.x > W*.7 ? -1 : 1; Bot.target(fp.x + side*80*Bot.b.s, fp.y - 88*Bot.b.s); b.look = fp; b.beam = {x:fp.x, y:fp.y, r:13, color:fp.color}; }
        else { b.beam = null; b.look = null;
          if (zone.z === "hero" && mouse.in && !L.stacked) Bot.target(mouse.x + (mouse.x > W/2 ? -92 : 92), mouse.y - 80);
          else if (L.stacked) Bot.target(W*.8 + Math.sin(T*.6)*12, H*.84 + Math.sin(T*.9)*10);
          else Bot.target(Math.min(W-90, L.heroRight + 70) + Math.sin(T*.6)*30, H*.34 + Math.sin(T*.9)*18); }
        break; }
      case "journey": {
        const jp = Journey.point();
        if (jp){ if (L.stacked) Bot.target(Math.min(W-46, jp.x + 70), Math.max(Journey.chartTop() + 48, jp.y - 70)); else Bot.target(jp.x - 8, jp.y - 100*Bot.b.s);
          b.look = jp; b.beam = {x:jp.x, y:jp.y, r:10, color:jp.color}; } else b.beam = null;
        break; }
      case "detail": {
        const qp = Att.queryPoint(), lane = Math.max(110, L.storyTop - sy - 58);
        if (qp){ Bot.target(qp.x, Math.min(lane, qp.y - 108)); b.look = qp; b.beam = {x:qp.x, y:qp.y - 16, style:"line", color:Att.color()}; }
        else { Bot.target(L.storyRight - 80, lane); b.look = null; b.beam = null; }
        break; }
      case "contact": {
        if (L.stacked) Bot.target(W*.76 + Math.sin(T*.8)*8, H*.74 + Math.sin(T*1.1)*8); else Bot.target(Math.min(L.megaRight + 90, W - 70), L.megaTop - sy + 70); b.look = null; b.beam = null;
        if (b.mood !== "happy" && b.mood !== "error"){ b.mood = "wave"; b.moodT = .5; }
        break; }
    }
  }

  /* ---------- chrome: only when the scroll position changed ---------- */
  let lastSY = -1;
  const hero = $("#hero"), legend = $("#legend"), cue = $("#scrollcue"), prog = $("#prog");
  function chrome(sy){
    if (sy === lastSY) return; lastSY = sy;
    const p = clamp(sy/(L.vh*.55), 0, 1);
    hero.style.opacity = 1-p; hero.style.transform = p ? `translateY(${-p*40}px)` : ""; hero.classList.toggle("gone", p > .5);
    legend.style.opacity = 1-p; legend.classList.toggle("gone", p > .5); cue.style.opacity = Math.max(0, 1-p*2.5);
    if (p > .3 && zone.z !== "hero") $("#drawer").classList.remove("open");
    prog.style.transform = `scaleX(${L.max > 0 ? clamp(sy/L.max, 0, 1) : 0})`;
  }

  /* ---------- loop ---------- */
  let T = 0, last = performance.now();
  function step(dt){
    T += dt; const sy = scrollY;
    const z = zoneAt(sy); if (z.z + (z.k||"") !== zoneKey) onZone(z);
    const spaceVis = sy < L.wrapTop + L.wrapH;
    if (spaceVis){ Space.setStageTop(Math.min(0, L.wrapTop + L.wrapH - L.vh - sy)); Space.step(dt); }
    if (zone.z === "chapter"){ const c = L.ch.find(c => c.k === zone.k); if (c) cpb.style.transform = `scaleX(${clamp((sy + L.vh*.5 - c.top)/c.h, 0, 1)})`; }
    Journey.update(dt); Att.update(dt);
    driveRobot(T, sy); Bot.update(dt, T, mouse);
    return spaceVis;
  }
  function render(spaceVis){ chrome(scrollY); if (spaceVis) Space.render(); Journey.render(); Att.render(); Bot.draw(T); }
  function frame(now){ const dt = Math.min(.05, (now-last)/1000); last = now; if (!Portal.isOpen) render(step(dt)); requestAnimationFrame(frame); }
  function resize(){ Bot.resize(); Space.resize(); Journey.measure(); Att.measure(); measure(); }
  let rT; addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(resize, 120); });

  /* ---------- boot ---------- */
  resize();
  if (document.fonts) document.fonts.ready.then(resize);
  addEventListener("load", resize);
  C.log(`${C.fn("boot", 'unit="vb"')} ${C.ok("✓")} <span class="mu">· type <b>help</b> or press <b>\`</b></span>`);
  setTimeout(() => { if (zone.z === "hero") Bot.say(L.stacked ? "Hi! I'm UNIT-VB. Scroll for the tour ↓" : "Hi! I'm UNIT-VB, Vijay's agent. Search the space, or scroll for the tour.", 4); }, 900);
  // deep links / test hooks: ?at=<id>&off=<px>  ?q=<query>  ?doc=<id>&tok=<word>  ?ckpt=<n>  ?console
  if (PARAMS.has("at")){ const el = document.getElementById(PARAMS.get("at")); if (el) window.scrollTo({top: el.getBoundingClientRect().top + scrollY + (+PARAMS.get("off")||0), behavior:"instant"}); }
  if (PARAMS.has("doc")) Att.open(PARAMS.get("doc"), PARAMS.get("tok"));
  if (PARAMS.has("q")){ $("#q").value = PARAMS.get("q"); $("#search").classList.add("has"); Space.runQuery(PARAMS.get("q")); }
  if (PARAMS.has("console")) Console.toggle(true);
  if (PARAMS.has("ckpt")) setTimeout(() => Portal.open(+PARAMS.get("ckpt")), 300);
  requestAnimationFrame(frame);

  return { go, openDetail, confetti: () => Bot.confetti(), measure };
})();
