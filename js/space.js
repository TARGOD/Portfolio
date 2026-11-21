/* =====================================================================
   space.js: the latent space (hero + scroll tour backdrop)
   ===================================================================== */
const Space = (() => {
  const cv = $("#space"), ctx = cv.getContext("2d"), stage = $("#stage");
  const N = NODES, byId = Object.fromEntries(N.map(n => [n.id, n]));
  const EDGES = [], NB = Object.fromEntries(N.map(n => [n.id, new Set()]));
  for (const [a, list] of Object.entries(EDGES_OF)) for (const b of list){ EDGES.push([a,b]); NB[a].add(b); NB[b].add(a); }

  /* ---------- layout: cluster seeds + force relaxation (deterministic) ---------- */
  let seed = 7; const rnd = () => (seed = (seed*16807) % 2147483647) / 2147483647;
  const perCl = {};
  N.forEach(n => {
    if (n.fixed){ n.x = n.fixed[0]; n.y = n.fixed[1]; return; }
    const i = perCl[n.cl] = (perCl[n.cl]||0) + 1;
    const a = i*2.399963 + rnd()*.4, r = 34*Math.sqrt(i) + rnd()*10;
    n.x = CL[n.cl].c[0] + Math.cos(a)*r; n.y = CL[n.cl].c[1] + Math.sin(a)*r;
  });
  for (let it = 0; it < 260; it++){
    for (let i = 0; i < N.length; i++) for (let j = i+1; j < N.length; j++){
      const a = N[i], b = N[j]; let dx = b.x-a.x, dy = b.y-a.y; const d = Math.hypot(dx,dy) || .01;
      const min = (a.kind!=="skill" || b.kind!=="skill") ? 78 : 50;
      if (d < min){ const f = (min-d)/d*.5; dx *= f; dy *= f; if (!a.fixed){ a.x -= dx; a.y -= dy; } if (!b.fixed){ b.x += dx; b.y += dy; } }
    }
    N.forEach(n => { if (n.fixed) return; const c = CL[n.cl].c; n.x += (c[0]-n.x)*.012; n.y += (c[1]-n.y)*.012; });
  }
  for (const k in CL){ const m = N.filter(n => n.cl===k && n.kind==="skill"); if (!m.length) continue;
    CL[k].m = [m.reduce((a,n)=>a+n.x,0)/m.length, m.reduce((a,n)=>a+n.y,0)/m.length];
    CL[k].top = Math.min(...m.map(n=>n.y)); CL[k].bot = Math.max(...m.map(n=>n.y)); }
  N.forEach(n => { n.fx = n.x; n.fy = n.y; n.ph = rnd()*6.28; n.delay = Math.hypot(n.fx,n.fy)/600*700 + rnd()*350; n.appear = 0; n.sx = n.sy = 0; });

  /* ---------- search: TF-IDF cosine, runs locally ---------- */
  const STOP = new Set("a an the and or of to in on for with my your you me i is are was were be do does did can how what who which that this it as at by from about any some show tell want need".split(" "));
  const SYN = {
    agent:["agents","orchestration","tool"], agentic:["agents","orchestration","tool"], agents:["orchestration","tool"],
    llm:["llms","language","model"], model:["llms","fine","tuning"], models:["llms","fine","tuning"],
    rag:["retrieval","grounded"], search:["retrieval","semantic"], retrieve:["retrieval"], documents:["document","ingestion","rag"], document:["ingestion","rag"],
    accounting:["finance","tally","ledger","report"], finance:["accounting","tally","report"], financial:["finance","accounting","report"], erp:["tally","accounting"], books:["ledger","accounting"],
    audit:["validation","finance"], tune:["fine","tuning","lora"], finetune:["fine","tuning","lora"], train:["fine","tuning","dataset"], training:["fine","tuning","dataset"],
    backend:["api","rest","fastapi"], api:["rest","apis"], database:["sql","postgresql","mysql"], db:["sql","database"],
    deploy:["deployment","docker","inference"], production:["deployment","enterprise"], trace:["tracing","langsmith"], debug:["debugging","tracing","failure"], debugging:["tracing","failure","langsmith"],
    observability:["tracing","langsmith"], eval:["evaluation","evals","test"], evals:["evaluation","test"], test:["evaluation","eval"],
    mobile:["flutter","app"], app:["flutter","interface"], frontend:["flutter","web"], hallucinate:["grounded","hallucination"], tools:["tool","mcp","calling"],
    reliable:["reliability","structured"], enterprise:["business","enterprise"], business:["enterprise"],
    paper:["ieee","publication","research"], research:["paper","ieee","publication"], publication:["paper","ieee"], college:["svit","education","student"],
    education:["svit","student","college"], vision:["cnn","image","medical"], image:["cnn","vision","retinal"], health:["medical","cardiovascular","retinal"],
    medical:["imaging","retinal","cardiovascular"], heart:["cardiovascular"], gpt:["llms","slm","language"], slm:["small","language","model"]
  };
  const stem = w => w.length>4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0,-1) : w;
  const toks = s => s.toLowerCase().replace(/&/g," ").split(/[^a-z0-9]+/).filter(w => w && !STOP.has(w)).map(stem);
  const SD = N.map(n => { const t = toks(`${n.label} ${n.label} ${n.kw} ${CL[n.cl].name} ${n.detail||""} ${n.full||""}`); const tf = {}; t.forEach(w => tf[w]=(tf[w]||0)+1); return tf; });
  const DF = {}; SD.forEach(tf => Object.keys(tf).forEach(w => DF[w]=(DF[w]||0)+1));
  const IDF = w => Math.log(1 + N.length/((DF[w]||0)+.5));
  const VEC = SD.map(tf => { const v = {}; let nrm = 0; for (const w in tf){ v[w] = (1+Math.log(tf[w]))*IDF(w); nrm += v[w]*v[w]; } nrm = Math.sqrt(nrm); for (const w in v) v[w] /= nrm; return v; });
  function embedQuery(q){ const v = {}; toks(q).forEach(w => { v[w]=(v[w]||0)+1; (SYN[w]||[]).map(stem).forEach(s => v[s]=(v[s]||0)+.55); });
    let nrm = 0; for (const w in v){ v[w] *= IDF(w); nrm += v[w]*v[w]; } nrm = Math.sqrt(nrm)||1; for (const w in v) v[w] /= nrm; return v; }
  function search(q){ const qv = embedQuery(q);
    return N.map((n,i) => { let s = 0; for (const w in qv) if (VEC[i][w]) s += qv[w]*VEC[i][w]; return {n,s}; })
            .filter(r => r.s > .06).sort((a,b) => b.s-a.s).slice(0,7); }

  /* ---------- camera ---------- */
  let W = 0, H = 0, DPR = 1, T = 0; const cam = {x:0,y:0,z:1}; let camAnim = null;
  let mode = "hero", hover = null, selected = null, focus = new Set(), scores = new Map(), query = null, qpos = null, activeCl = null, chapterNode = null;
  const instant = PARAMS.has("sim") || REDUCED;
  const hooks = {};
  const mobile = () => W < 900;
  const drawer = $("#drawer");
  const drawerOpen = () => drawer.classList.contains("open");
  function leftEdge(){
    const el = mode === "chapter" ? $("#chcard") : $("#hero .hero-col");
    if (!el) return W*.45;
    const r = el.getBoundingClientRect(); return r.right + 36;
  }
  function region(){
    if (mobile()){
      if (mode === "chapter"){ const c = $("#chcard").getBoundingClientRect(); return {l:8, t:64, r:W-8, b:Math.max(H*.28, (c.height ? c.top : H*.55) - 10)}; }
      const h = $("#hero .hero-col").getBoundingClientRect(); return {l:8, t:Math.min(H*.66, h.bottom + 6), r:W-8, b:H-16}; }
    const d = drawerOpen() ? 392 : 0;
    return {l:leftEdge(), t:84, r:W-(mode==="chapter"?120:28)-d, b:H-(mode==="chapter"?40:84)};
  }
  const toS = (x,y) => [(x-cam.x)*cam.z + W/2, (y-cam.y)*cam.z + H/2];
  const toW = (sx,sy) => [(sx-W/2)/cam.z + cam.x, (sy-H/2)/cam.z + cam.y];
  function fit(nodes, animate=true, pad=100){
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    nodes.forEach(n => { x0=Math.min(x0,n.fx); y0=Math.min(y0,n.fy); x1=Math.max(x1,n.fx); y1=Math.max(y1,n.fy); });
    const R = region(), vw = R.r-R.l, vh = R.b-R.t;
    const z = clamp(Math.min(vw/(x1-x0+pad*2), vh/(y1-y0+pad*2)), .26, 2.1);
    const cx = (x0+x1)/2, cy = (y0+y1)/2, sx = (R.l+R.r)/2, sy = (R.t+R.b)/2;
    flyTo(cx - (sx-W/2)/z, cy - (sy-H/2)/z, z, animate);
  }
  function flyTo(x,y,z,animate=true){ if (!animate || instant){ cam.x=x; cam.y=y; cam.z=z; camAnim=null; return; } camAnim = {from:{...cam}, to:{x,y,z}, t:0}; }
  const ease = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
  function refit(a=true){
    if (mode === "chapter" && activeCl && !selected) fit(N.filter(n => n.cl===activeCl), a, 80);
    else if (selected) fit([...focus].map(id=>byId[id]), a, focus.size>3?80:200);
    else if (query && scores.size) fit([...scores.keys()].map(id=>byId[id]).concat(qpos?[{fx:qpos[0],fy:qpos[1]}]:[]), a, 100);
    else if (activeCl) fit(N.filter(n => n.cl===activeCl), a, 100);
    else fit(N, a, mobile()?16:40);
  }
  function resize(){ DPR = Math.min(innerWidth < 900 ? 1.25 : 1.5, devicePixelRatio||1); W = stage.clientWidth; H = stage.clientHeight; cv.width = W*DPR; cv.height = H*DPR; refit(false); }

  /* ---------- sprites ---------- */
  const sprites = {}, nebs = {};
  function neb(color){ if (nebs[color]) return nebs[color]; const s = document.createElement("canvas"); s.width = s.height = 128; const g = s.getContext("2d");
    const gr = g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,hexA(color,.075)); gr.addColorStop(1,hexA(color,0)); g.fillStyle = gr; g.fillRect(0,0,128,128); return nebs[color] = s; }
  let stageTop = 0;
  function sprite(color){ if (sprites[color]) return sprites[color];
    const s = document.createElement("canvas"); s.width = s.height = 96; const g = s.getContext("2d");
    const gr = g.createRadialGradient(48,48,0,48,48,48); gr.addColorStop(0,color+"cc"); gr.addColorStop(.25,color+"44"); gr.addColorStop(1,color+"00");
    g.fillStyle = gr; g.fillRect(0,0,96,96); return sprites[color] = s; }

  /* ---------- step + render ---------- */
  let lastMeta = "";
  function step(dt){
    T += dt;
    if (camAnim){ camAnim.t += dt; const p = Math.min(1, camAnim.t/.95), e = ease(p);
      cam.x = camAnim.from.x+(camAnim.to.x-camAnim.from.x)*e; cam.y = camAnim.from.y+(camAnim.to.y-camAnim.from.y)*e;
      cam.z = camAnim.from.z*Math.pow(camAnim.to.z/camAnim.from.z, e); if (p >= 1) camAnim = null; }
    const t = T*1000;
    N.forEach(n => {
      const p = instant ? 1 : clamp((t-n.delay)/1300, 0, 1), e = 1-Math.pow(1-p,3);
      n.appear = p; const dr = n.fixed ? 0 : 2.2;
      n.x = n.fx*e + Math.sin(T*.6+n.ph)*dr; n.y = n.fy*e + Math.cos(T*.5+n.ph)*dr;
      [n.sx, n.sy] = toS(n.x, n.y);
    });
    const loaded = N.filter(n => n.appear >= 1).length;
    const meta = loaded < N.length ? `projecting <b>${N.length}</b> items → 2D … <b>${loaded}</b>/${N.length}`
                                   : `<b>${N.length}</b> items · <b>6</b> clusters · TF-IDF search, runs in your browser`;
    if (meta !== lastMeta){ lastMeta = meta; $("#meta").innerHTML = meta; }
  }

  function render(){
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.fillStyle = "#06070a"; ctx.fillRect(0,0,W,H);
    // dot grid in world space
    if (48*cam.z > 10){ const [wx0,wy0] = toW(0,0); ctx.fillStyle = "rgba(255,255,255,.045)";
      const gx = Math.floor(wx0/48)*48, gy = Math.floor(wy0/48)*48;
      for (let x = gx; ; x += 48){ const [sx] = toS(x,0); if (sx > W) break; for (let y = gy; ; y += 48){ const [,sy] = toS(0,y); if (sy > H) break; ctx.fillRect(sx,sy,1,1); } } }

    ctx.globalCompositeOperation = "lighter";
    for (const k in CL){ if (k === "core") continue; const c = CL[k], [sx,sy] = toS(c.m[0],c.m[1]), r = 190*cam.z;
      ctx.globalAlpha = focus.size && activeCl !== k ? .45 : 1; ctx.drawImage(neb(c.color), sx-r, sy-r, r*2, r*2); ctx.globalAlpha = 1; }
    ctx.lineWidth = 1;
    EDGES.forEach(([a,b]) => { const A = byId[a], B = byId[b], ap = Math.min(A.appear,B.appear); if (ap <= 0) return;
      const hot = (selected && (a===selected.id || b===selected.id)) || (hover && (a===hover.id || b===hover.id));
      const inF = focus.size ? (focus.has(a) && focus.has(b)) : true;
      const al = hot ? .55 : inF ? (focus.size ? .16 : .07) : .025;
      ctx.strokeStyle = hot ? hexA(CL[B.cl].color, al*ap) : `rgba(255,255,255,${al*ap})`;
      ctx.beginPath(); ctx.moveTo(A.sx,A.sy); ctx.lineTo(B.sx,B.sy); ctx.stroke(); });
    if (qpos){ const [qx,qy] = toS(qpos[0],qpos[1]); ctx.setLineDash([3,5]);
      scores.forEach((s,id) => { const n = byId[id]; ctx.strokeStyle = `rgba(255,255,255,${.25+s*.6})`; ctx.beginPath(); ctx.moveTo(qx,qy); ctx.lineTo(n.sx,n.sy); ctx.stroke(); });
      ctx.setLineDash([]); }
    const rad = n => (n.kind==="self"?9 : n.kind==="skill"?3.2 : 6.5) * clamp(cam.z,.8,1.6) * (hover===n?1.4:1);
    N.forEach(n => { if (n.appear <= 0) return; const inF = !focus.size || focus.has(n.id);
      const r = rad(n), gs = r*(n.kind==="skill"?7:8); ctx.globalAlpha = (inF?1:.16)*n.appear;
      ctx.drawImage(sprite(CL[n.cl].color), n.sx-gs/2, n.sy-gs/2, gs, gs); ctx.globalAlpha = 1; });
    ctx.globalCompositeOperation = "source-over";
    N.forEach(n => { if (n.appear <= 0) return; const c = CL[n.cl].color, inF = !focus.size || focus.has(n.id), al = (inF?1:.2)*n.appear, r = rad(n);
      ctx.fillStyle = hexA(n.kind==="skill"?c:"#ffffff", al); ctx.beginPath(); ctx.arc(n.sx,n.sy,r*(n.kind==="skill"?1:.55),0,6.283); ctx.fill();
      if (n.kind !== "skill"){ ctx.strokeStyle = hexA(c,al*.9); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(n.sx,n.sy,r,0,6.283); ctx.stroke(); }
      if (n.kind === "self"){ const ph = (T*20)%22; ctx.strokeStyle = `rgba(244,239,228,${al*(1-ph/22)*.5})`; ctx.beginPath(); ctx.arc(n.sx,n.sy,r+6+ph,0,6.283); ctx.stroke(); }
      if (selected === n){ ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(n.sx,n.sy,r+7,0,6.283); ctx.stroke(); } });
    // cluster labels
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const k in CL){ if (k === "core") continue; const c = CL[k]; const [sx,sy] = toS(c.m[0], c.m[1]>60 ? c.bot+34 : c.top-34);
      ctx.font = `500 ${Math.round(11*clamp(cam.z,.9,1.3))}px "JetBrains Mono", monospace`;
      ctx.fillStyle = hexA(c.color, (focus.size && activeCl!==k ? .3 : .75)*clamp(T/1.6 + (instant?1:0),0,1));
      ctx.fillText(c.name.toUpperCase().split("").join(" "), sx, sy); }
    // node labels with collision avoidance
    const showAll = cam.z > 1.2, placed = [];
    const prio = n => (hover===n||selected===n)?0 : n.kind==="self"?1 : n.kind!=="skill"?2 : scores.has(n.id)?3-scores.get(n.id) : 5;
    [...N].sort((a,b) => prio(a)-prio(b)).forEach(n => {
      if (n.appear < .6) return; const inF = !focus.size || focus.has(n.id);
      if (!(n.kind!=="skill" || showAll || hover===n || selected===n || (focus.size && focus.has(n.id)))) return;
      const big = n.kind !== "skill";
      ctx.font = big ? `600 ${n.kind==="self"?15:13}px "Bricolage Grotesque", sans-serif` : `12px "JetBrains Mono", monospace`;
      let label = n.label; if (scores.has(n.id)) label += `  ${scores.get(n.id).toFixed(2)}`;
      const off = (n.kind==="self"?16:big?12:8)*clamp(cam.z,.9,1.4);
      const w = ctx.measureText(label).width, rc = [n.sx+off-3, n.sy-9, n.sx+off+w+3, n.sy+9];
      if (!(hover===n || selected===n) && placed.some(p => rc[0]<p[2] && rc[2]>p[0] && rc[1]<p[3] && rc[3]>p[1])) return;
      placed.push(rc);
      ctx.fillStyle = big ? `rgba(244,240,232,${(inF?1:.25)*.95})` : hexA(CL[n.cl].color, (inF?1:.25)*.85);
      ctx.textAlign = "left"; ctx.fillText(label, n.sx+off, n.sy);
    });
    if (qpos){ const [qx,qy] = toS(qpos[0],qpos[1]), s = 7+Math.sin(T*5)*1.5;
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(qx,qy-s); ctx.lineTo(qx+s,qy); ctx.lineTo(qx,qy+s); ctx.lineTo(qx-s,qy); ctx.closePath(); ctx.fill();
      ctx.font = '12px "JetBrains Mono", monospace'; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.fillText(`“${query.length>34 ? query.slice(0,33)+"…" : query}”`, qx, qy-s-12); }
  }

  /* ---------- drawer ---------- */
  const ctag = n => `<span class="ctag"><i style="background:${CL[n.cl].color}"></i>${n.kind==="skill"?CL[n.cl].name:n.kind==="project"?"Project":n.kind==="org"?"Experience":"About"}</span>`;
  function openPanel(title, html){ $("#dTitle").textContent = title; $("#dBody").innerHTML = html; drawer.classList.add("open"); $("#dBody").scrollTop = 0;
    $$("#dBody [data-go]").forEach(b => b.addEventListener("click", () => select(byId[b.dataset.go]))); }
  function closePanel(){ drawer.classList.remove("open"); }
  function contactHTML(){ return `<div class="dcontact"><a class="solid" href="mailto:${LINKS.email}">${LINKS.email} <span>→</span></a>
    <a href="${LINKS.linkedin}" target="_blank" rel="noopener">LinkedIn <span>↗</span></a><a href="${LINKS.github}" target="_blank" rel="noopener">GitHub <span>↗</span></a></div>`; }
  function nodeHTML(n){
    const nb = [...NB[n.id]].map(id => byId[id]), anchors = nb.filter(x => x.kind!=="skill"), skills = nb.filter(x => x.kind==="skill");
    const btn = x => `<button data-go="${x.id}"><i style="background:${CL[x.cl].color}"></i>${esc(x.label)}</button>`;
    const link = Att.findFor(n);
    return `${ctag(n)}<h2>${esc(n.full||n.label)}</h2>${n.sub?`<div class="sub">${esc(n.sub)}</div>`:""}
      ${n.detail?`<p>${esc(n.detail)}</p>`:""}
      ${n.bullets?`<ul class="b">${n.bullets.map(b=>`<li>${esc(b)}</li>`).join("")}</ul>`:""}
      ${link?`<button class="readmore" data-doc="${link.doc}" data-tok="${esc(link.tok||"")}">Read it with attention <span>↓</span></button>`:""}
      ${n.kind==="self"?contactHTML():""}
      ${anchors.length?`<h4>${n.kind==="skill"?"Used in":"Connected to"}</h4><div class="links">${anchors.map(btn).join("")}</div>`:""}
      ${skills.length?`<h4>${n.kind==="skill"?"Related":"Stack & skills"} · ${skills.length}</h4><div class="links">${skills.map(btn).join("")}</div>`:""}
      ${!nb.length?`<h4>Source</h4><p class="muted">Listed under technical skills.</p>`:""}`;
  }

  /* ---------- actions ---------- */
  function select(n, opts={}){
    if (!n) return;
    selected = n; query = null; qpos = null; scores = new Map();
    focus = new Set([n.id, ...NB[n.id]]);
    if (mode === "hero" && !opts.quiet){ activeCl = null; $$(".legend button").forEach(b => b.classList.remove("on")); openPanel(n.kind==="skill"?"skill":n.kind, nodeHTML(n)); }
    fit([...focus].map(id=>byId[id]), true, focus.size>3?80:200);
    hooks.onSelect && hooks.onSelect(n);
  }
  function runQuery(q){
    q = q.trim(); if (!q){ reset(); return; }
    const hits = search(q); query = q; selected = null; activeCl = null;
    const wantsContact = /contact|email|hire|reach|phone|linkedin|github|resume|cv/i.test(q);
    if (!hits.length && !wantsContact){
      focus = new Set(); scores = new Map(); qpos = null;
      openPanel("query", `<div class="qline">q = embed(<b>“${esc(q)}”</b>)</div><p style="margin-top:12px">Out of distribution. Nothing on this map is close to that query.</p><h4>Try</h4><div class="links">${["agents","RAG","Tally + MCP","LoRA","tracing","Flutter"].map(s=>`<button data-q="${s}">${s}</button>`).join("")}</div>`);
      $$("#dBody [data-q]").forEach(b => b.addEventListener("click", () => { $("#q").value = b.dataset.q; runQuery(b.dataset.q); }));
      hooks.onQuery && hooks.onQuery(q, null); return;
    }
    const res = hits.length ? hits : [{n:byId.vijay, s:1}];
    scores = new Map(res.map(r => [r.n.id, r.s])); focus = new Set(res.map(r => r.n.id));
    const top = res.slice(0,3), sw = top.reduce((a,r)=>a+r.s,0);
    const cx = top.reduce((a,r)=>a+r.n.fx*r.s,0)/sw, cy = top.reduce((a,r)=>a+r.n.fy*r.s,0)/sw, dl = Math.hypot(cx,cy)||1;
    qpos = [cx + cx/dl*110, cy + cy/dl*110];
    const mx = res[0].s;
    openPanel("nearest neighbours", `<div class="qline">q = embed(<b>“${esc(q)}”</b>)<br/>top_k = ${res.length} · metric = cosine</div>
      ${wantsContact ? contactHTML() : ""}
      <div class="res">${res.map(r=>`<button data-go="${r.n.id}"><i style="background:${CL[r.n.cl].color}"></i><span class="l">${esc(r.n.label)}<small>${r.n.kind==="skill"?CL[r.n.cl].name:r.n.kind}</small></span><span class="s">${r.s.toFixed(3)}<span><b style="width:${r.s/mx*100}%"></b></span></span></button>`).join("")}</div>`);
    fit([...res.map(r=>r.n), {fx:qpos[0], fy:qpos[1]}], true, 100);
    hooks.onQuery && hooks.onQuery(q, res[0]);
  }
  function focusCluster(k){
    query = null; qpos = null; scores = new Map(); selected = null; activeCl = k;
    const nodes = N.filter(n => n.cl===k); focus = new Set(nodes.map(n => n.id));
    $$(".legend button").forEach(b => b.classList.toggle("on", b.dataset.k===k));
    openPanel("cluster", `<span class="ctag"><i style="background:${CL[k].color}"></i>cluster</span><h2>${CL[k].name}</h2><div class="sub">${nodes.length} items</div>
      <div class="links">${nodes.map(x=>`<button data-go="${x.id}"><i style="background:${CL[x.cl].color}"></i>${esc(x.label)}</button>`).join("")}</div>`);
    fit(nodes, true, 100);
  }
  function reset(){ selected = null; query = null; qpos = null; scores = new Map(); focus = new Set(); activeCl = null; closePanel();
    $$(".legend button").forEach(b => b.classList.remove("on")); $("#search").classList.remove("has"); setTimeout(() => refit(true), 10); }
  function setMode(m, k, nodeId){
    if (m === "chapter"){
      mode = "chapter"; closePanel(); selected = null; query = null; qpos = null; scores = new Map(); hover = null;
      activeCl = k; chapterNode = nodeId; focus = new Set(N.filter(n => n.cl===k).map(n => n.id));
      $$(".legend button").forEach(b => b.classList.remove("on"));
      fit(N.filter(n => n.cl===k), true, 80);
    } else if (mode !== "hero"){
      mode = "hero"; activeCl = null; chapterNode = null; focus = new Set(); selected = null; refit(true);
    }
  }
  function focusPoint(){
    const n = selected || (query && scores.size ? byId[[...scores.keys()][0]] : null) || (mode==="chapter" ? byId[chapterNode] : null);
    if (!n || n.appear < .5) return null;
    return {x:n.sx, y:n.sy + stageTop, color:CL[n.cl].color, label:n.label};
  }

  /* ---------- UI wiring ---------- */
  $("#legend").innerHTML = Object.entries(CL).filter(([k]) => k!=="core").map(([k,c]) =>
    `<button data-k="${k}"><i style="background:${c.color};box-shadow:0 0 8px ${c.color}"></i>${c.name}</button>`).join("");
  $$(".legend button").forEach(b => b.addEventListener("click", () => activeCl===b.dataset.k ? reset() : focusCluster(b.dataset.k)));
  const CHIPS = ["agents that call real tools","grounded answers over documents","LLMs + accounting","fine-tune a model","debugging agent failures"];
  $("#chips").innerHTML = CHIPS.map(c => `<button class="chip">${c}</button>`).join("");
  $$("#chips .chip").forEach(b => b.addEventListener("click", () => { $("#q").value = b.textContent; $("#search").classList.add("has"); runQuery(b.textContent); }));
  $("#search").addEventListener("submit", e => { e.preventDefault(); runQuery($("#q").value); });
  let deb; $("#q").addEventListener("input", () => { $("#search").classList.toggle("has", !!$("#q").value); clearTimeout(deb);
    deb = setTimeout(() => { if ($("#q").value.trim().length > 2) runQuery($("#q").value); }, 380); });
  $("#clearQ").addEventListener("click", () => { $("#q").value = ""; reset(); });
  $("#dClose").addEventListener("click", reset);

  const ptr = new Map(); let drag = null, moved = 0;
  const pick = (sx,sy) => { let best = null, bd = 1e9; N.forEach(n => { const d = Math.hypot(n.sx-sx, n.sy-sy), lim = n.kind==="skill"?14:20; if (d < lim && d < bd){ bd = d; best = n; } }); return best; };
  const local = e => { const r = cv.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; };
  cv.addEventListener("pointerdown", e => { const [x,y] = local(e); ptr.set(e.pointerId,1);
    drag = {x, y, cx:cam.x, cy:cam.y, touch:e.pointerType!=="mouse"}; moved = 0; if (!drag.touch){ camAnim = null; cv.classList.add("drag"); } });
  cv.addEventListener("pointermove", e => { const [x,y] = local(e);
    if (drag && !drag.touch){ const dx = x-drag.x, dy = y-drag.y; moved = Math.max(moved, Math.hypot(dx,dy)); cam.x = drag.cx-dx/cam.z; cam.y = drag.cy-dy/cam.z; }
    else if (drag){ moved = Math.max(moved, Math.hypot(x-drag.x, y-drag.y)); }
    const h = drag && moved > 3 ? null : pick(x,y); hover = h; cv.classList.toggle("hover", !!h);
    const tip = $("#tip");
    if (h && e.pointerType === "mouse"){ tip.innerHTML = `<span style="color:${CL[h.cl].color}">●</span> ${esc(h.label)} <span style="color:var(--dim)">· ${h.kind==="skill"?CL[h.cl].name:h.kind}</span>`;
      tip.style.left = (e.clientX+14)+"px"; tip.style.top = (e.clientY+14)+"px"; tip.classList.add("on"); }
    else tip.classList.remove("on"); });
  const up = e => { ptr.delete(e.pointerId); if (drag && moved < 5){ const [x,y] = local(e); const n = pick(x,y); if (n) select(n); } drag = null; cv.classList.remove("drag"); };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", () => { drag = null; cv.classList.remove("drag"); });
  cv.addEventListener("pointerleave", () => { hover = null; $("#tip").classList.remove("on"); });
  // zoom only with ctrl / pinch, so normal wheel still scrolls the page
  cv.addEventListener("wheel", e => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); camAnim = null;
    const [lx,ly] = local(e), [wx,wy] = toW(lx,ly); cam.z = clamp(cam.z*Math.exp(-e.deltaY*.004), .26, 4);
    const [nx,ny] = toW(lx,ly); cam.x += wx-nx; cam.y += wy-ny; }, {passive:false});

  return { resize, step, render, select, runQuery, reset, setMode, focusPoint, hooks, byId, setStageTop(v){ stageTop = v; }, get mode(){ return mode; } };
})();
