// ── DBR AI AGENTS — CANVAS VIDEO ENGINE ──────────────────────────────────────
// Synced to Roger's voiceover (70s). 5 scenes matching transcript beats.
// Scene timing:
//   0–12s  : "Hey, before you set this up..." — THE PROBLEM (agents doing it alone)
//   12–25s : "What you're about to activate..." — THE SOLUTION (4 AI agents)
//   25–39s : "This is your team..." — THE INTELLIGENCE (knows your pipeline)
//   39–57s : "Setup takes about 3 minutes..." — THE SETUP (3-min launch)
//   57–70s : "Nobody in our space..." — THE FUTURE (fully autonomous team)

(function() {
  // Landing canvas (idle animation)
  const landingCanvas = document.getElementById('introCanvas');
  // Playback canvas
  const canvas = document.getElementById('vidPlayCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stage = document.getElementById('vidStage');
  const captionEl = document.getElementById('vidCaption');
  const progressEl = document.getElementById('vidProgressFill');
  const timeEl = document.getElementById('vidTime');
  const pauseBtn = document.getElementById('vidPauseBtn');

  let W, H;
  let playing = false, paused = false;
  let globalT = 0, lastRAF = null;
  let audioStarted = false;

  // ── AUDIO ──
  const audio = new Audio('voiceover.mp3');
  audio.preload = 'auto';

  // ── PARTICLES ──
  let particles = [], dataStreams = [];

  function initParticles() {
    particles = Array.from({length: 60}, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.3,
      a: Math.random() * 0.45 + 0.08,
      color: Math.random() < 0.7 ? '#2dd4bf' : (Math.random() < 0.5 ? '#c9a84c' : '#22c55e')
    }));
    dataStreams = Array.from({length: 16}, () => ({
      x: Math.random() * W, y: Math.random() * H - 200,
      speed: Math.random() * 1.1 + 0.3,
      len: Math.floor(Math.random() * 10 + 5),
      chars: Array.from({length: 16}, () => String.fromCharCode(0x30A0 + Math.random() * 96)),
      alpha: Math.random() * 0.22 + 0.04
    }));
  }

  function resize() {
    W = canvas.width = stage.clientWidth || 600;
    H = canvas.height = stage.clientHeight || 260;
    if (landingCanvas) {
      landingCanvas.width = landingCanvas.parentElement.clientWidth || 600;
      landingCanvas.height = landingCanvas.parentElement.clientHeight || 260;
    }
    initParticles();
  }

  // ── DRAW HELPERS ──
  function drawBg() {
    ctx.fillStyle = '#030a12';
    ctx.fillRect(0, 0, W, H);
    // subtle grid
    ctx.strokeStyle = 'rgba(45,212,191,0.025)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  }

  function drawParticles() {
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = p.color.replace(')', `,${p.a})`).replace('rgb', 'rgba').replace('#2dd4bf', `rgba(45,212,191,${p.a})`).replace('#c9a84c', `rgba(201,168,76,${p.a})`).replace('#22c55e', `rgba(34,197,94,${p.a})`);
      ctx.fill();
    });
  }

  function drawStreams() {
    dataStreams.forEach(s => {
      s.y += s.speed;
      if (s.y > H + 200) { s.y = -200; s.x = Math.random() * W; }
      for (let i = 0; i < s.len; i++) {
        const a = s.alpha * (1 - i / s.len);
        if (Math.random() < 0.012) s.chars[i] = String.fromCharCode(0x30A0 + Math.random() * 96);
        ctx.fillStyle = i === 0 ? `rgba(180,255,255,${a*2})` : `rgba(45,212,191,${a})`;
        ctx.font = `${Math.floor(H * 0.022)}px 'DM Mono', monospace`;
        ctx.fillText(s.chars[i], s.x, s.y + i * Math.floor(H * 0.024));
      }
    });
  }

  function glowText(text, x, y, size, color, glowColor, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `800 ${size}px 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 30;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function monoText(text, x, y, size, color, alpha, align) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${size}px 'DM Mono', monospace`;
    ctx.textAlign = align || 'center';
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function fade(p, inFrac, outFrac) {
    if (p < inFrac) return p / inFrac;
    if (p > 1 - outFrac) return (1 - p) / outFrac;
    return 1;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ── SCENE 0: THE PROBLEM (0–12s) ──
  // "Hey, before you set this up... number one reason agents don't win is nobody showed them what to do next."
  function drawScene0(p, t) {
    const f = fade(p, 0.12, 0.1);
    drawStreams(t);
    drawParticles();

    // Solo agent figure — alone in the dark
    const cx = W / 2, cy = H * 0.42;
    const figH = H * 0.26;
    const pulse = (Math.sin(t * 0.0015) + 1) / 2;

    // Faint question marks floating
    ['?','?','?'].forEach((c, i) => {
      const qx = cx + [-W*0.22, W*0.22, 0][i];
      const qy = cy - figH * 0.2 + Math.sin(t * 0.001 + i * 2) * H * 0.04;
      monoText(c, qx, qy, H * 0.055, `rgba(90,120,154,${f * (0.3 + pulse * 0.2)})`, 1);
    });

    // Agent figure (white/dim — alone)
    ctx.save(); ctx.globalAlpha = f * 0.75;
    ctx.strokeStyle = '#8aa0b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy - figH*0.38, figH*0.13, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy-figH*0.24); ctx.lineTo(cx, cy+figH*0.18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy-figH*0.12); ctx.lineTo(cx-figH*0.2, cy+figH*0.04); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy-figH*0.12); ctx.lineTo(cx+figH*0.2, cy+figH*0.04); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy+figH*0.18); ctx.lineTo(cx-figH*0.13, cy+figH*0.42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy+figH*0.18); ctx.lineTo(cx+figH*0.13, cy+figH*0.42); ctx.stroke();
    ctx.restore();

    // Floating tasks around agent — overwhelming
    const tasks = ['FOLLOW UP', 'RECRUIT', 'ONBOARD', 'B2B PITCH', 'TRACK LEADS'];
    tasks.forEach((task, i) => {
      const angle = (i / tasks.length) * Math.PI * 2 + t * 0.0004;
      const dist = H * 0.28 + Math.sin(t * 0.001 + i) * H * 0.02;
      const tx = cx + Math.cos(angle) * dist;
      const ty = cy + Math.sin(angle) * dist * 0.55;
      const ta = f * (0.4 + Math.sin(t * 0.002 + i * 1.3) * 0.2);
      monoText(task, tx, ty, H * 0.016, '#5a7a9a', ta);
    });

    monoText('AGENT', cx, cy + figH * 0.6, H * 0.02, '#8aa0b8', f);
    glowText('DOING IT ALL ALONE.', W/2, H * 0.86, H * 0.034, '#c8d8e8', '#2dd4bf', f * Math.min(p * 3, 1));
    monoText('// THE PROBLEM //', W/2, H * 0.93, H * 0.018, '#3a5a7a', f * 0.8);
  }

  // ── SCENE 1: THE SOLUTION (12–25s) ──
  // "What you're about to activate is four AI agents... recruiting, onboarding, B2B sales, intelligence"
  function drawScene1(p, t) {
    const f = fade(p, 0.12, 0.1);
    drawParticles();

    const agents = [
      { label: 'RECRUITING', color: '#2dd4bf', icon: '🤖', angle: -Math.PI/2 },
      { label: 'ONBOARDING', color: '#c9a84c', icon: '🎯', angle: 0 },
      { label: 'B2B SALES',  color: '#22c55e', icon: '💼', angle: Math.PI/2 },
      { label: 'INTELLIGENCE', color: '#a855f7', icon: '🧠', angle: Math.PI },
    ];

    const cx = W/2, cy = H * 0.44;
    const orbitR = H * 0.26;
    const nodeR = H * 0.055;

    // Center orb — "YOUR TEAM"
    const orbGlow = (Math.sin(t * 0.002) + 1) / 2;
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 0.12);
    cg.addColorStop(0, `rgba(45,212,191,${(0.18 + orbGlow * 0.1) * f})`);
    cg.addColorStop(1, 'rgba(45,212,191,0)');
    ctx.beginPath(); ctx.arc(cx, cy, H * 0.12, 0, Math.PI*2);
    ctx.fillStyle = cg; ctx.fill();

    ctx.save(); ctx.globalAlpha = f;
    ctx.beginPath(); ctx.arc(cx, cy, nodeR * 1.1, 0, Math.PI*2);
    ctx.strokeStyle = '#2dd4bf'; ctx.lineWidth = 1.5;
    ctx.shadowColor = '#2dd4bf'; ctx.shadowBlur = 14;
    ctx.stroke(); ctx.shadowBlur = 0;
    ctx.restore();
    monoText('YOUR', cx, cy - H*0.015, H * 0.018, '#2dd4bf', f);
    monoText('TEAM', cx, cy + H*0.018, H * 0.018, '#2dd4bf', f);

    // Agent nodes orbiting
    agents.forEach((ag, i) => {
      const reveal = Math.min(Math.max((p - 0.1 - i * 0.12) / 0.14, 0), 1);
      if (reveal <= 0) return;

      const spinOffset = t * 0.0003;
      const ax = cx + Math.cos(ag.angle + spinOffset) * orbitR;
      const ay = cy + Math.sin(ag.angle + spinOffset) * orbitR * 0.72;

      // Connection line
      ctx.save(); ctx.globalAlpha = f * reveal * 0.5;
      ctx.strokeStyle = ag.color; ctx.lineWidth = 1; ctx.setLineDash([5,5]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ax, ay); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();

      // Node
      ctx.save(); ctx.globalAlpha = f * reveal;
      ctx.beginPath(); ctx.arc(ax, ay, nodeR, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(3,10,18,0.85)';
      ctx.strokeStyle = ag.color; ctx.lineWidth = 1.5;
      ctx.shadowColor = ag.color; ctx.shadowBlur = 10;
      ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.restore();

      // Emoji icon
      ctx.save(); ctx.globalAlpha = f * reveal;
      ctx.font = `${H * 0.032}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(ag.icon, ax, ay + H * 0.012);
      ctx.restore();

      monoText(ag.label, ax, ay + nodeR + H * 0.028, H * 0.015, ag.color, f * reveal);
    });

    glowText('FOUR AI AGENTS.', W/2, H * 0.87, H * 0.034, '#fff', '#2dd4bf', f * Math.min(p * 3, 1));
    monoText('Working for you personally — 24/7', W/2, H * 0.93, H * 0.019, '#5a7a9a', f * Math.min(p * 2, 1));
  }

  // ── SCENE 2: THE INTELLIGENCE (25–39s) ──
  // "This isn't a generic chatbot. It knows your pipeline. It knows your production numbers."
  function drawScene2(p, t) {
    const f = fade(p, 0.12, 0.1);
    drawParticles();

    const panelW = W * 0.82, panelX = W * 0.09;
    const panelY = H * 0.07;
    const panelH = H * 0.72;

    // Dashboard panel frame
    ctx.save(); ctx.globalAlpha = f;
    ctx.fillStyle = 'rgba(3,10,18,0.92)';
    ctx.strokeStyle = 'rgba(45,212,191,0.3)';
    ctx.lineWidth = 1;
    roundRect(panelX, panelY, panelW, panelH, 6);
    ctx.fill(); ctx.stroke();

    // Header bar
    ctx.fillStyle = 'rgba(10,20,32,0.95)';
    roundRect(panelX, panelY, panelW, H * 0.1, 6);
    ctx.fill();
    ctx.restore();

    monoText('// AGENT INTELLIGENCE DASHBOARD', panelX + panelW/2, panelY + H*0.062, H*0.02, '#2dd4bf', f);

    // KPI tiles — reveal one by one
    const kpis = [
      { label: 'ACTIVE RECRUITS', val: '14', color: '#2dd4bf' },
      { label: 'B2B PROSPECTS',   val: '8',  color: '#c9a84c' },
      { label: 'MONTHLY RESIDUAL', val: '$4,820', color: '#22c55e' },
      { label: 'AI TASKS TODAY',  val: '37', color: '#a855f7' },
    ];

    const tileW = panelW * 0.21, tileH = H * 0.14;
    const tileY = panelY + H * 0.14;
    kpis.forEach((kpi, i) => {
      const reveal = Math.min(Math.max((p - 0.1 - i * 0.1) / 0.12, 0), 1);
      if (reveal <= 0) return;
      const tx = panelX + panelW * 0.02 + i * (tileW + panelW * 0.025);
      ctx.save(); ctx.globalAlpha = f * reveal;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.strokeStyle = kpi.color;
      ctx.lineWidth = 1;
      roundRect(tx, tileY, tileW, tileH, 4);
      ctx.fill(); ctx.stroke();
      ctx.restore();
      monoText(kpi.val, tx + tileW/2, tileY + tileH*0.52, H*0.038, kpi.color, f * reveal);
      monoText(kpi.label, tx + tileW/2, tileY + tileH*0.82, H*0.014, '#5a7a9a', f * reveal);
    });

    // Activity lines — typewriter reveal
    const lines = [
      { text: '▸ Agent flagged: JOHNSON, M. — needs 30-day check-in', color: '#2dd4bf' },
      { text: '▸ Pipeline: 3 B2B prospects ready for proposal stage', color: '#c9a84c' },
      { text: '▸ Residual forecast: +$340 if 2 pending apps close', color: '#22c55e' },
      { text: '▸ Morning brief ready — 4 priorities for today', color: '#a855f7' },
    ];

    const lineRevealStart = 0.45;
    lines.forEach((line, i) => {
      const reveal = Math.min(Math.max((p - lineRevealStart - i * 0.1) / 0.1, 0), 1);
      if (reveal <= 0) return;
      const ly = panelY + H * 0.36 + i * H * 0.086;
      const chars = Math.floor(reveal * line.text.length);
      monoText(line.text.slice(0, chars), panelX + 18, ly, H * 0.017, line.color, f, 'left');
    });

    glowText('IT KNOWS YOUR BUSINESS.', W/2, H * 0.87, H * 0.03, '#fff', '#2dd4bf', f * Math.min(p * 3, 1));
  }

  // ── SCENE 3: THE SETUP (39–57s) ──
  // "Setup takes about 3 minutes. No tech background needed. Answer a few questions, flip a few switches."
  function drawScene3(p, t) {
    const f = fade(p, 0.12, 0.1);
    drawParticles();

    const steps = [
      { label: 'STEP 1', desc: 'Enter your name & market', color: '#2dd4bf', icon: '01' },
      { label: 'STEP 2', desc: 'Choose your package',      color: '#c9a84c', icon: '02' },
      { label: 'STEP 3', desc: 'Set your goals',           color: '#22c55e', icon: '03' },
      { label: 'STEP 4', desc: 'Connect your tools',       color: '#a855f7', icon: '04' },
      { label: 'STEP 5', desc: 'Launch your AI team',      color: '#2dd4bf', icon: '05' },
    ];

    const stepH = H * 0.1;
    const stepW = W * 0.78;
    const stepX = W * 0.11;
    const startY = H * 0.1;

    steps.forEach((step, i) => {
      const reveal = Math.min(Math.max((p - 0.05 - i * 0.14) / 0.12, 0), 1);
      if (reveal <= 0) return;
      const sy = startY + i * (stepH + H * 0.025);

      // Row background
      ctx.save(); ctx.globalAlpha = f * reveal;
      ctx.fillStyle = `rgba(0,0,0,${0.35 + (i === Math.floor(p * steps.length) ? 0.2 : 0)})`;
      ctx.strokeStyle = step.color;
      ctx.lineWidth = 1;
      roundRect(stepX, sy, stepW, stepH, 4);
      ctx.fill(); ctx.stroke();

      // Check if "done" (past steps)
      const isDone = p > 0.1 + i * 0.14 + 0.2;
      if (isDone) {
        ctx.save(); ctx.globalAlpha = f * 0.9;
        ctx.fillStyle = step.color;
        ctx.font = `bold ${H * 0.03}px 'DM Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('✓', stepX + H * 0.05, sy + stepH * 0.62);
        ctx.restore();
      } else {
        monoText(step.icon, stepX + H * 0.05, sy + stepH * 0.62, H * 0.024, step.color, f * reveal);
      }

      monoText(step.label, stepX + H * 0.12, sy + stepH * 0.38, H * 0.016, step.color, f * reveal, 'left');
      monoText(step.desc, stepX + H * 0.12, sy + stepH * 0.7, H * 0.02, '#c8d8e8', f * reveal, 'left');
      ctx.restore();
    });

    // Timer badge
    const timerReveal = Math.min(Math.max((p - 0.7) / 0.15, 0), 1);
    if (timerReveal > 0) {
      const bx = W * 0.5, by = H * 0.87;
      ctx.save(); ctx.globalAlpha = f * timerReveal;
      ctx.fillStyle = 'rgba(45,212,191,0.12)';
      ctx.strokeStyle = '#2dd4bf'; ctx.lineWidth = 1;
      roundRect(bx - W*0.18, by - H*0.04, W*0.36, H*0.07, 4);
      ctx.fill(); ctx.stroke();
      ctx.restore();
      monoText('⚡  3 MINUTES TO LAUNCH', bx, by + H*0.015, H * 0.022, '#2dd4bf', f * timerReveal);
    }
  }

  // ── SCENE 4: THE FUTURE (57–70s) ──
  // "Nobody in our space has built anything like this. Fully autonomous AI team."
  function drawScene4(p, t) {
    const f = fade(p, 0.12, 0.05);
    drawStreams(t);
    drawParticles();

    // Hexagon grid background
    const hexGlow = (Math.sin(t * 0.0015) + 1) / 2;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 7; col++) {
        const hx = W * 0.05 + col * W * 0.14 + (row % 2 ? W * 0.07 : 0);
        const hy = H * 0.05 + row * H * 0.24;
        const hr = H * 0.08;
        ctx.save();
        ctx.globalAlpha = f * (0.04 + hexGlow * 0.04);
        ctx.strokeStyle = '#2dd4bf'; ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const angle = a * Math.PI / 3 - Math.PI / 6;
          const px = hx + Math.cos(angle) * hr, py = hy + Math.sin(angle) * hr;
          a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.stroke();
        ctx.restore();
      }
    }

    // Central radial glow
    const cg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, H * 0.5);
    cg.addColorStop(0, `rgba(45,212,191,${0.09 * f})`);
    cg.addColorStop(0.4, `rgba(201,168,76,${0.04 * f})`);
    cg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);

    // Main headline — builds in
    const line1reveal = Math.min(p * 6, 1);
    const line2reveal = Math.min(Math.max((p - 0.2) * 4, 0), 1);
    const line3reveal = Math.min(Math.max((p - 0.45) * 3, 0), 1);

    glowText('NOBODY IN OUR SPACE', W/2, H * 0.32, H * 0.044, '#fff', '#2dd4bf', f * line1reveal);
    glowText('HAS BUILT THIS.', W/2, H * 0.44, H * 0.055, '#2dd4bf', '#2dd4bf', f * line2reveal);
    monoText('While everyone else hands agents a toolbox —', W/2, H * 0.57, H * 0.021, '#8aa0b8', f * line3reveal);
    monoText("we're handing them a fully autonomous AI team.", W/2, H * 0.63, H * 0.021, '#c8d8e8', f * line3reveal);

    // DBR badge
    const badgeReveal = Math.min(Math.max((p - 0.6) * 3, 0), 1);
    if (badgeReveal > 0) {
      ctx.save(); ctx.globalAlpha = f * badgeReveal;
      ctx.fillStyle = 'rgba(45,212,191,0.1)';
      ctx.strokeStyle = '#2dd4bf'; ctx.lineWidth = 1.5;
      ctx.shadowColor = '#2dd4bf'; ctx.shadowBlur = 20;
      roundRect(W/2 - W*0.2, H*0.73, W*0.4, H*0.1, 6);
      ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.restore();
      monoText("LET'S BUILD YOUR FUTURE.", W/2, H * 0.8, H * 0.022, '#2dd4bf', f * badgeReveal);
    }
  }

  // ── SCENES CONFIG ──
  const SCENES = [
    { start: 0,  end: 12, draw: drawScene0, caption: "The #1 reason agents don't win? Nobody showed them what to do next. We fixed that." },
    { start: 12, end: 25, draw: drawScene1, caption: "Four AI agents — Recruiting, Onboarding, B2B Sales, Intelligence — working for you personally." },
    { start: 25, end: 39, draw: drawScene2, caption: "This isn't a generic chatbot. It knows your pipeline, your production numbers, your new agents." },
    { start: 39, end: 57, draw: drawScene3, caption: "Setup takes 3 minutes. Answer a few questions, flip a few switches, hit launch. That's it." },
    { start: 57, end: 70, draw: drawScene4, caption: "Nobody in our space has built anything like what you're about to have. Let's go." },
  ];
  const VID_TOTAL = 70;

  // ── ANIMATION LOOP ──
  function loop(ts) {
    if (!playing) return;
    if (!lastRAF) lastRAF = ts;
    const dt = ts - lastRAF;
    lastRAF = ts;

    if (!paused) globalT += dt;

    const elapsed = !audio.paused && audio.duration ? audio.currentTime : globalT / 1000;
    const clampedT = Math.min(elapsed, VID_TOTAL);

    drawBg();

    // Find and draw current scene
    for (let i = 0; i < SCENES.length; i++) {
      const sc = SCENES[i];
      if (clampedT >= sc.start && clampedT < sc.end) {
        const p = (clampedT - sc.start) / (sc.end - sc.start);
        sc.draw(p, ts);
        if (captionEl) captionEl.textContent = sc.caption;
        break;
      }
    }

    // Progress bar
    if (progressEl) progressEl.style.width = (clampedT / VID_TOTAL * 100) + '%';

    // Time display
    if (timeEl) {
      const m = Math.floor(clampedT / 60);
      const s = Math.floor(clampedT % 60);
      timeEl.textContent = m + ':' + (s < 10 ? '0' : '') + s + ' / 1:10';
    }

    // End
    if (clampedT >= VID_TOTAL) {
      playing = false;
      audio.pause();
      setTimeout(() => { if (typeof goTo === 'function') goTo(1); }, 1200);
      return;
    }

    lastRAF = ts;
    requestAnimationFrame(loop);
  }

  // ── PUBLIC API ──
  window.startVideo = function() {
    const landing = document.getElementById('vidLanding');
    const show = document.getElementById('vidStage');
    const captionBar = document.getElementById('vidCaptionBar');
    const controlsBar = document.getElementById('vidControlsBar');
    if (landing) landing.classList.add('hidden');
    if (show) { show.style.display = 'block'; show.style.position = 'absolute'; show.style.inset = '0'; }
    if (captionBar) captionBar.style.display = 'flex';
    if (controlsBar) controlsBar.style.display = 'flex';
    // Resize canvas to match stage
    const stageEl = document.getElementById('vidStage');
    if (stageEl) {
      W = canvas.width = stageEl.clientWidth;
      H = canvas.height = stageEl.clientHeight;
      initParticles();
    }

    globalT = 0;
    lastRAF = null;
    paused = false;
    playing = true;

    audio.currentTime = 0;
    audio.play().catch(() => {});

    requestAnimationFrame(loop);
  };

  window.pauseVideo = function() {
    paused = !paused;
    if (paused) { audio.pause(); }
    else { audio.play().catch(() => {}); }
    if (pauseBtn) pauseBtn.textContent = paused ? '▶' : '⏸';
  };

  window.skipVideo = function() {
    playing = false;
    audio.pause();
    audio.currentTime = 0;
    if (typeof goTo === 'function') goTo(1);
  };

  // Init
  window.addEventListener('resize', resize);
  resize();

  // Draw idle state on landing canvas
  let idleLandingCtx = null;
  let idleLW, idleLH;
  let idleParticles = [], idleStreams = [];

  function initIdleCanvas() {
    if (!landingCanvas) return;
    idleLandingCtx = landingCanvas.getContext('2d');
    idleLW = landingCanvas.width = landingCanvas.parentElement.clientWidth || 600;
    idleLH = landingCanvas.height = landingCanvas.parentElement.clientHeight || 260;
    idleParticles = Array.from({length: 40}, () => ({
      x: Math.random() * idleLW, y: Math.random() * idleLH,
      vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3,
      r: Math.random()*1.4+0.3, a: Math.random()*0.35+0.06
    }));
    idleStreams = Array.from({length: 10}, () => ({
      x: Math.random() * idleLW, y: Math.random() * idleLH - 100,
      speed: Math.random()*0.9+0.2, len: Math.floor(Math.random()*8+4),
      chars: Array.from({length:12}, () => String.fromCharCode(0x30A0+Math.random()*96)),
      alpha: Math.random()*0.18+0.03
    }));
  }

  function drawIdle(ts) {
    if (playing || !idleLandingCtx) return; // stop idle when video is playing
    const lc = idleLandingCtx;
    lc.fillStyle = '#030a12';
    lc.fillRect(0, 0, idleLW, idleLH);
    // grid
    lc.strokeStyle = 'rgba(45,212,191,0.02)';
    lc.lineWidth = 0.5;
    for (let x=0;x<idleLW;x+=48){lc.beginPath();lc.moveTo(x,0);lc.lineTo(x,idleLH);lc.stroke();}
    for (let y=0;y<idleLH;y+=48){lc.beginPath();lc.moveTo(0,y);lc.lineTo(idleLW,y);lc.stroke();}
    // streams
    idleStreams.forEach(s => {
      s.y += s.speed;
      if (s.y > idleLH+100) { s.y=-100; s.x=Math.random()*idleLW; }
      for (let i=0;i<s.len;i++) {
        const a = s.alpha*(1-i/s.len);
        if (Math.random()<0.01) s.chars[i]=String.fromCharCode(0x30A0+Math.random()*96);
        lc.fillStyle = i===0?`rgba(180,255,255,${a*2})`:`rgba(45,212,191,${a})`;
        lc.font = `${Math.floor(idleLH*0.025)}px 'DM Mono',monospace`;
        lc.fillText(s.chars[i], s.x, s.y+i*Math.floor(idleLH*0.027));
      }
    });
    // particles
    idleParticles.forEach(p => {
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=idleLW; if(p.x>idleLW)p.x=0;
      if(p.y<0)p.y=idleLH; if(p.y>idleLH)p.y=0;
      lc.beginPath(); lc.arc(p.x,p.y,p.r,0,Math.PI*2);
      lc.fillStyle=`rgba(45,212,191,${p.a})`; lc.fill();
    });
    // Glow text
    lc.save();
    lc.font = `800 ${idleLH*0.1}px 'Cinzel',serif`;
    lc.textAlign='center';
    lc.shadowColor='#2dd4bf'; lc.shadowBlur=28;
    lc.fillStyle='#fff';
    lc.fillText('DBR', idleLW/2, idleLH*0.38);
    lc.shadowBlur=0;
    lc.font = `800 ${idleLH*0.04}px 'Cinzel',serif`;
    lc.shadowColor='#2dd4bf'; lc.shadowBlur=18;
    lc.fillStyle='#2dd4bf';
    lc.fillText('AI TEAM SYSTEM', idleLW/2, idleLH*0.52);
    lc.shadowBlur=0;
    lc.font = `${idleLH*0.022}px 'DM Mono',monospace`;
    lc.fillStyle='rgba(58,90,122,0.8)';
    lc.fillText('// AGENT INTELLIGENCE PROTOCOL //', idleLW/2, idleLH*0.65);
    lc.restore();
    requestAnimationFrame(drawIdle);
  }

  initIdleCanvas();
  requestAnimationFrame(drawIdle);

})();
