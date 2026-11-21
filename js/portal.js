/* =====================================================================
   portal.js: "enter" a checkpoint. A circular reveal from the click
   point, then a deep-dive scene with a live visual:
     term  typed terminal       slm  a toy language model trained live
     cnn   CNN reading a retina  rank promotion ladder
   ===================================================================== */
const Portal = (() => {
  const el = $("#portal"), vis = $("#ptVis"), cv = $("#ptcv"), ctx = cv.getContext("2d"), dom = $("#ptDom");
  const hooks = {};
  let isOpen = false, idx = -1, cur = null, raf = 0, last = 0, W = 0, H = 0, DPR = 1;

  function size(){ DPR = Math.min(innerWidth < 900 ? 1.25 : 1.5, devicePixelRatio||1); const r = vis.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W*DPR; cv.height = H*DPR; }
  function open(i, from){
    i = clamp(i, 0, JOURNEY.length-1); idx = i; const c = JOURNEY[i];
    el.style.setProperty("--ox", (from ? from.x : innerWidth/2) + "px"); el.style.setProperty("--oy", (from ? from.y : innerHeight/2) + "px");
    el.style.setProperty("--c", c.color);
    $("#ptCrumb").innerHTML = `journey / <b>${c.id}</b> · ${c.file}`;
    $("#ptText").innerHTML = `<div class="ptk"><span>${c.tag}</span><span>${c.date}</span></div>
      <h2>${c.title}</h2><div class="ptorg">${esc(c.org)}</div><p>${esc(c.body)}</p>
      ${c.authors ? `<div class="ptmeta"><b>Authors</b>${esc(c.authors)}</div>` : ""}
      ${c.venue ? `<div class="ptmeta"><b>Venue</b>${esc(c.venue)}</div>` : ""}
      <div class="jtags">${c.tags.map(t => `<span>${esc(t)}</span>`).join("")}</div>
      <div class="ptlinks">${(c.links||[]).map(([t,k]) => `<a class="btn" href="${LINKS[k]}" target="_blank" rel="noopener">${t}</a>`).join("")}
        ${c.id === "ckpt-3" ? `<button class="btn" data-doc="paper">Read it with attention ↓</button>` : ""}
        ${c.future ? `<a class="btn solid" href="mailto:${LINKS.email}">Email Vijay →</a>` : ""}</div>`;
    $("#ptPrev").disabled = i === 0; $("#ptNext").disabled = i === JOURNEY.length-1;
    el.classList.add("open"); document.documentElement.classList.add("portal-open"); isOpen = true;
    requestAnimationFrame(() => { size(); start(c); });
    hooks.onOpen && hooks.onOpen(c, i);
  }
  function close(){ if (!isOpen) return; isOpen = false; stop(); el.classList.remove("open"); document.documentElement.classList.remove("portal-open"); hooks.onClose && hooks.onClose(); }
  function start(c){ stop(); dom.innerHTML = ""; dom.className = "ptdom"; ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,cv.width,cv.height);
    cur = VIS[c.vis](c); last = performance.now(); const loop = now => { const dt = Math.min(.05,(now-last)/1000); last = now; cur && cur.frame && cur.frame(dt); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); }
  function stop(){ cancelAnimationFrame(raf); if (cur && cur.stop) cur.stop(); cur = null; }

  $("#ptClose").addEventListener("click", close);
  $("#ptPrev").addEventListener("click", () => open(idx-1, {x:60, y:innerHeight/2}));
  $("#ptNext").addEventListener("click", () => open(idx+1, {x:innerWidth-60, y:innerHeight/2}));
  addEventListener("keydown", e => { if (!isOpen) return; if (e.key === "Escape") close(); if (e.key === "ArrowRight" && idx < JOURNEY.length-1) open(idx+1); if (e.key === "ArrowLeft" && idx > 0) open(idx-1); });
  addEventListener("resize", () => { if (isOpen) size(); });

  /* =================================================================== */
  const VIS = {};

  /* ---------- typed terminal ---------- */
  VIS.term = c => {
    dom.className = "ptdom term"; dom.innerHTML = `<div class="tbar"><i></i><i></i><i></i><span>unit-vb@${c.id} — zsh</span></div><pre id="ptTerm"></pre>`;
    const pre = $("#ptTerm"), lines = c.term || []; let li = 0, ci = 0, acc = 0, out = "";
    const fmt = l => l.startsWith("$") ? `<span class="pr">$</span>${esc(l.slice(1))}` : l.startsWith("✓") ? `<span class="okc">${esc(l)}</span>` : l.startsWith("→") ? `<span class="ac">${esc(l)}</span>` : `<span class="mu">${esc(l)}</span>`;
    return { frame(dt){ ctx.setTransform(DPR,0,0,DPR,0,0); ctx.clearRect(0,0,W,H); grid(dt);
      if (li >= lines.length){ pre.innerHTML = out + `<span class="cur">▋</span>`; return; }
      acc += dt*(lines[li].startsWith("$") ? 38 : 120);
      while (acc >= 1 && li < lines.length){ acc -= 1; ci++; if (ci > lines[li].length){ out += fmt(lines[li]) + "\n"; li++; ci = 0; acc -= 6; } }
      pre.innerHTML = out + (li < lines.length ? fmt(lines[li].slice(0,ci)) : "") + `<span class="cur">▋</span>`; } };
  };
  let gT = 0;
  function grid(dt){ gT += dt; ctx.strokeStyle = "rgba(255,255,255,.04)"; ctx.lineWidth = 1; const s = 36, o = (gT*12)%s; ctx.beginPath();
    for (let x = -o; x < W; x += s){ ctx.moveTo(x,0); ctx.lineTo(x,H); } for (let y = -o; y < H; y += s){ ctx.moveTo(0,y); ctx.lineTo(W,y); } ctx.stroke(); }

  /* ---------- toy SLM: char n-gram trained live on this site's text ---------- */
  const CORPUS = (() => {
    const strip = s => s.replace(/<[^>]+>/g,"").replace(/[{}]/g,"").replace(/&amp;/g,"&").replace(/\s+/g," ");
    return strip([...DOCS.map(d => d.text), ...CHAPTERS.map(c => c.body), ...JOURNEY.map(j => j.body)].join(" "));
  })();
  VIS.slm = () => {
    dom.className = "ptdom slm";
    dom.innerHTML = `<div class="slm-h"><span>toy SLM · character 4-gram · trained on this website's text</span><span id="slmStat">0 chars</span></div>
      <canvas id="slmLoss"></canvas>
      <div class="slm-out" id="slmOut"><span class="mu">training…</span></div>
      <div class="slm-ctl"><button class="btn" id="slmRe">↺ retrain</button><button class="btn go" id="slmGen">▶ generate</button>
        <label>temperature <input id="slmT" type="range" min="0.2" max="1.4" step="0.1" value="0.7"><b id="slmTv">0.7</b></label></div>
      <div class="slm-note">A real (tiny) language model: it learns which character comes next, live. My first SLM was bigger. Each run says something new.</div>`;
    const lc = $("#slmLoss"), lx = lc.getContext("2d"); const lr = lc.getBoundingClientRect(); lc.width = lr.width*DPR; lc.height = lr.height*DPR;
    const ORD = 4, K = .1, V = [...new Set(CORPUS)], VN = V.length;
    let counts, pos, hist, gen = null, out = "", genAcc = 0, temp = .7, ema = null;
    function reset(){ counts = Array.from({length:ORD+1}, () => new Map()); pos = ORD; hist = []; ema = null; gen = null; $("#slmOut").innerHTML = `<span class="mu">training…</span>`; }
    function prob(ctxs, ch){ for (let o = ORD; o >= 1; o--){ const m = counts[o].get(ctxs.slice(-o)); if (m && m.t){ return ((m.c.get(ch)||0)+K)/(m.t+K*VN); } } return 1/VN; }
    function add(ctxs, ch){ for (let o = 1; o <= ORD; o++){ const k = ctxs.slice(-o); let m = counts[o].get(k); if (!m){ m = {t:0, c:new Map()}; counts[o].set(k,m); } m.t++; m.c.set(ch,(m.c.get(ch)||0)+1); } }
    function sample(ctxs){ for (let o = ORD; o >= 1; o--){ const m = counts[o].get(ctxs.slice(-o)); if (m && m.t){
        const ks = [...m.c.keys()], ws = ks.map(k => Math.pow(m.c.get(k), 1/temp)), s = ws.reduce((a,b)=>a+b,0); let r = Math.random()*s;
        for (let i = 0; i < ks.length; i++){ r -= ws[i]; if (r <= 0) return ks[i]; } return ks[ks.length-1]; } } return V[Math.floor(Math.random()*VN)]; }
    function startGen(){ const seeds = ["I build ","Agents ","The model ","At Colligence ","I published "]; out = seeds[Math.floor(Math.random()*seeds.length)]; gen = 0; }
    $("#slmRe").addEventListener("click", reset); $("#slmGen").addEventListener("click", () => { if (pos >= CORPUS.length*2) startGen(); });
    $("#slmT").addEventListener("input", e => { temp = +e.target.value; $("#slmTv").textContent = temp.toFixed(1); });
    reset();
    return { frame(dt){
      ctx.setTransform(DPR,0,0,DPR,0,0); ctx.clearRect(0,0,W,H); grid(dt);
      const END = CORPUS.length*2;
      if (pos < END){ let nll = 0, n = 0;
        for (let k = 0; k < 110 && pos < END; k++, pos++){ const at = pos % CORPUS.length; if (at < ORD) continue; const c = CORPUS.slice(at-ORD, at), ch = CORPUS[at]; nll += -Math.log(prob(c,ch)); n++; add(c,ch); }
        const v = nll/Math.max(1,n)/Math.LN2; ema = ema === null ? v : ema*.8 + v*.2; hist.push(ema);
        $("#slmStat").textContent = `epoch ${pos <= CORPUS.length ? 1 : 2}/2 · ${Math.min(pos,END).toLocaleString()} / ${END.toLocaleString()} chars · ${ema.toFixed(2)} bits/char`;
        if (pos >= END) startGen(); }
      // loss chart
      const w = lc.width/DPR, h = lc.height/DPR; lx.setTransform(DPR,0,0,DPR,0,0); lx.clearRect(0,0,w,h);
      lx.strokeStyle = "rgba(255,255,255,.08)"; lx.beginPath(); lx.moveTo(0,h-.5); lx.lineTo(w,h-.5); lx.stroke();
      const total = Math.ceil(CORPUS.length*2/110), mx = Math.max(6.5, ...hist);
      lx.strokeStyle = "#b48cff"; lx.lineWidth = 2; lx.beginPath(); hist.forEach((v,k) => { const x = k/(total-1)*w, y = h-4-(v/mx)*(h-12); k ? lx.lineTo(x,y) : lx.moveTo(x,y); }); lx.stroke();
      lx.fillStyle = "rgba(255,255,255,.4)"; lx.font = '10px "JetBrains Mono", monospace'; lx.fillText("bits/char ↓ as it reads (2 epochs)", 6, 12); lx.strokeStyle = "rgba(255,255,255,.12)"; lx.setLineDash([3,4]); lx.beginPath(); lx.moveTo(w/2,0); lx.lineTo(w/2,h); lx.stroke(); lx.setLineDash([]);
      // generation
      if (gen !== null && gen < 280){ genAcc += dt*55; while (genAcc >= 1 && gen < 280){ genAcc--; out += sample(out); gen++; }
        $("#slmOut").innerHTML = `<span class="seed">${esc(out.slice(0, out.indexOf(" ")+1))}</span>${esc(out.slice(out.indexOf(" ")+1))}<span class="cur">▋</span>`; }
    } };
  };

  /* ---------- CNN reading a retina ---------- */
  VIS.cnn = () => {
    dom.className = "ptdom cnnhud";
    dom.innerHTML = `<div class="cnn-h">illustration · CNN binary classifier · retinal image → convolutions → risk</div>
      <div class="cnn-acc"><b>95%</b><span>accuracy reported<br/>in the paper</span></div><div class="cnn-out" id="cnnOut"></div>`;
    // procedural fundus image
    let sd = 4; const rnd = () => (sd = (sd*16807) % 2147483647) / 2147483647;
    const vessels = [];
    function branch(x,y,a,len,w,d){ if (d > 6 || w < .4) return; const segs = []; let cx = x, cy = y, ca = a;
      for (let i = 0; i < 8; i++){ ca += (rnd()-.5)*.5; cx += Math.cos(ca)*len/8; cy += Math.sin(ca)*len/8; segs.push([cx,cy]); }
      vessels.push({x,y,segs,w,d});
      branch(cx,cy,ca+.45+rnd()*.3,len*.72,w*.7,d+1); if (rnd() > .25) branch(cx,cy,ca-.45-rnd()*.3,len*.68,w*.65,d+1);
      const mid = segs[3]; if (rnd() > .5) branch(mid[0],mid[1],ca+(rnd()>.5?1:-1)*1.1,len*.5,w*.5,d+2); }
    for (let k = 0; k < 4; k++){ const a = [-.9,-2.3,.9,2.3][k]; branch(.18, 0, a, .62, 3.2, 0); }
    const LAYERS = [{n:6,s:.62,c:"#59d0ff"},{n:9,s:.46,c:"#7af5ff"},{n:12,s:.32,c:"#b48cff"},{n:16,s:.2,c:"#ffb454"}];
    let t = 0, verdict = null, vT = 0;
    const fm = LAYERS.map(L => Array.from({length:L.n}, () => Array.from({length:36}, () => Math.random())));
    return { frame(dt){
      t += dt; const cyc = t % 6.5;
      ctx.setTransform(DPR,0,0,DPR,0,0); ctx.clearRect(0,0,W,H); grid(dt);
      const narrow = W < 600, R = narrow ? Math.min(W*.26, H*.17) : Math.min(H*.34, W*.19), ex = narrow ? W/2 : R + 34, ey = narrow ? H*.3 : H*.52, cy2 = narrow ? H*.68 : ey;
      // fundus
      const fg = ctx.createRadialGradient(ex-R*.2,ey-R*.1,R*.1,ex,ey,R); fg.addColorStop(0,"#d9602a"); fg.addColorStop(.6,"#a3301b"); fg.addColorStop(1,"#3a0c0a");
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(ex,ey,R,0,6.283); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(ex,ey,R,0,6.283); ctx.clip();
      const dx = ex + R*.18, dy = ey;
      ctx.lineCap = "round";
      vessels.forEach(v => { ctx.strokeStyle = v.d < 2 ? "rgba(90,10,10,.9)" : "rgba(120,20,15,.75)"; ctx.lineWidth = v.w*R/90;
        ctx.beginPath(); ctx.moveTo(dx + (v.x-.18)*R, dy + v.y*R); v.segs.forEach(q => ctx.lineTo(dx + (q[0]-.18)*R, dy + q[1]*R)); ctx.stroke(); });
      const dg = ctx.createRadialGradient(dx,dy,0,dx,dy,R*.18); dg.addColorStop(0,"#fff3c4"); dg.addColorStop(.6,"#f2b45a"); dg.addColorStop(1,"rgba(242,180,90,0)");
      ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(dx,dy,R*.18,0,6.283); ctx.fill();
      ctx.fillStyle = "rgba(60,8,8,.35)"; ctx.beginPath(); ctx.arc(ex-R*.32,ey+R*.04,R*.12,0,6.283); ctx.fill();
      // scanning line
      if (cyc < 1.6){ const sy = ey - R + (cyc/1.6)*2*R; ctx.fillStyle = "rgba(122,245,255,.18)"; ctx.fillRect(ex-R, sy-6, 2*R, 12); ctx.fillStyle = "#7af5ff"; ctx.fillRect(ex-R, sy, 2*R, 1.5); }
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(ex,ey,R+6,0,6.283); ctx.stroke();
      ctx.font = '11px "JetBrains Mono", monospace'; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.fillText("retinal image (illustrative)", ex, ey+R+26);
      // conv blocks
      const x0 = narrow ? 14 : ex + R + 46, x1 = narrow ? W - 112 : W - 150, gap = (x1-x0)/LAYERS.length, SC = [1,.8,.62,.46];
      LAYERS.forEach((L,li) => { const sz = Math.min(H*.5, gap*.78)*SC[li], lx = x0 + gap*li + (gap-sz)/2 - 8, on = clamp((cyc-1.2-li*.55)/.5,0,1);
        for (let k = Math.min(L.n,6)-1; k >= 0; k--){ const ox = lx + k*3.5, oy = cy2 - sz/2 - k*3.5;
          ctx.fillStyle = `rgba(14,17,24,.95)`; ctx.fillRect(ox,oy,sz,sz);
          if (on > 0 && k === 0){ const cells = 6, cs = sz/cells; for (let a = 0; a < cells; a++) for (let b = 0; b < cells; b++){ const v = fm[li][(a*cells+b)%36];
            fm[li][(a*cells+b)%36] = clamp(v + (Math.random()-.5)*.15, 0, 1); ctx.fillStyle = hexA(L.c, v*on*.85); ctx.fillRect(ox+a*cs+.5, oy+b*cs+.5, cs-1, cs-1); } }
          ctx.strokeStyle = hexA(L.c, .25 + on*.6); ctx.lineWidth = 1; ctx.strokeRect(ox,oy,sz,sz); }
        ctx.fillStyle = hexA(L.c, .4+on*.6); ctx.font = '10.5px "JetBrains Mono", monospace'; ctx.fillText(`conv ${li+1}`, lx+sz/2, cy2+sz/2+24);
        if (on > .5){ ctx.strokeStyle = hexA(L.c,.5); ctx.setLineDash([2,4]); ctx.beginPath(); ctx.moveTo(lx+sz+24, cy2); ctx.lineTo(x0+gap*(li+1)-6, cy2); ctx.stroke(); ctx.setLineDash([]); } });
      ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.font = '10.5px "JetBrains Mono", monospace'; ctx.fillText("DenseNet-style feature maps", (x0+x1)/2, narrow ? cy2+H*.16 : cy2-H*.32);
      // dense + output
      const dxp = x1 + 26, dOn = clamp((cyc-3.6)/.5,0,1);
      for (let k = 0; k < 7; k++){ const y = cy2 - 66 + k*22; ctx.fillStyle = hexA("#f4efe4", .15 + dOn*.7*Math.abs(Math.sin(t*3+k))); ctx.beginPath(); ctx.arc(dxp, y, 5, 0, 6.283); ctx.fill(); }
      const oOn = clamp((cyc-4.1)/.4,0,1);
      if (oOn > 0 && verdict === null){ verdict = Math.random() < .5 ? {p:.08+Math.random()*.25, risk:false} : {p:.7+Math.random()*.25, risk:true}; vT = 0; }
      if (cyc < .1) verdict = null;
      if (verdict){ vT += dt; const ox = dxp + 22, col = verdict.risk ? "#ff6b8b" : "#5fe3a1";
        ctx.strokeStyle = hexA(col, oOn); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ox+24, cy2, 22, 0, 6.283); ctx.stroke();
        ctx.fillStyle = hexA(col, oOn); ctx.font = '600 12px "JetBrains Mono", monospace'; ctx.fillText(verdict.p.toFixed(2), ox+24, cy2+4);
        $("#cnnOut").innerHTML = `<span style="color:${col}">● ${verdict.risk ? "elevated" : "low"} cardiovascular risk</span> <small>σ(z) = ${verdict.p.toFixed(2)} · demo sample</small>`; }
    } };
  };

  /* ---------- promotion ladder ---------- */
  VIS.rank = c => {
    dom.className = "ptdom rank";
    dom.innerHTML = `<div class="rk-h">career.rank · Colligence Research</div>` + RANKS.map((r,i) => `
      <div class="rk ${i < c.rank ? "done" : i === c.rank ? "now" : "next"}" style="--d:${i*.5}s"><span class="rn">LV ${i+1}</span><b>${r}</b><span class="xp"><i></i></span><span class="st">${i < c.rank ? "✓ cleared" : i === c.rank ? "▲ level up" : "locked"}</span></div>`).reverse().join("")
      + `<div class="rk-f">intern → engineer → product engineer</div>`;
    let t = 0; const sparks = [];
    return { frame(dt){ t += dt; ctx.setTransform(DPR,0,0,DPR,0,0); ctx.clearRect(0,0,W,H); grid(dt);
      if (Math.random() < .5) sparks.push({x:Math.random()*W, y:H+10, v:40+Math.random()*90, s:1+Math.random()*2});
      for (let i = sparks.length-1; i >= 0; i--){ const s = sparks[i]; s.y -= s.v*dt; if (s.y < -10){ sparks.splice(i,1); continue; } ctx.fillStyle = hexA(c.color, .5); ctx.fillRect(s.x, s.y, s.s, s.s*4); } } };
  };

  return { open, close, hooks, get isOpen(){ return isOpen; } };
})();
