/* =========================================================================
   AMAN & PRIYA — LUXURY WEDDING INVITATION
   Vanilla JS + GSAP/ScrollTrigger + Canvas (scratch card + confetti)
   ========================================================================= */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ======================================================================
     1. UTILITIES
     ====================================================================== */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const rand = (min, max) => Math.random() * (max - min) + min;

  // Shared handle to the music player, set by initMusicPlayer(), used by initPreloader()
  // so tapping the palace doors (a real user gesture) can start the music automatically.
  let musicAPI = null;

  /* ======================================================================
     2. CUSTOM CURSOR
     ====================================================================== */
  function initCursor() {
    const dot = $("#cursorDot");
    const glow = $("#cursorGlow");
    if (!dot || !glow || window.matchMedia("(hover:none)").matches) return;

    let mouseX = 0,
      mouseY = 0,
      glowX = 0,
      glowY = 0;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + "px";
      dot.style.top = mouseY + "px";
    });

    // smooth trailing glow
    function raf() {
      glowX += (mouseX - glowX) * 0.14;
      glowY += (mouseY - glowY) * 0.14;
      glow.style.left = glowX + "px";
      glow.style.top = glowY + "px";
      requestAnimationFrame(raf);
    }
    raf();

    // hover states on interactive elements
    $$(
      "a, button, .gallery__item, .event-card, .countdown__unit, input, select, textarea",
    ).forEach((el) => {
      el.addEventListener("mouseenter", () => {
        dot.classList.add("hover");
        glow.classList.add("hover");
      });
      el.addEventListener("mouseleave", () => {
        dot.classList.remove("hover");
        glow.classList.remove("hover");
      });
    });

    // click ripple
    window.addEventListener("mousedown", (e) => {
      const ripple = document.createElement("div");
      ripple.className = "cursor-ripple";
      ripple.style.left = e.clientX + "px";
      ripple.style.top = e.clientY + "px";
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  }

  /* ======================================================================
     3. SCROLL PROGRESS BAR + BACK TO TOP + SIDE NAV ACTIVE STATE
     ====================================================================== */
  function initScrollChrome() {
    const fill = $("#scrollProgress");
    const backBtn = $("#backToTop");
    const dots = $$(".side-nav__dot");
    const sections = dots
      .map((d) => document.querySelector(d.getAttribute("href")))
      .filter(Boolean);

    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      if (fill) fill.style.width = pct + "%";

      if (backBtn) backBtn.classList.toggle("visible", scrollTop > 700);

      // determine active section
      let currentIndex = 0;
      sections.forEach((sec, i) => {
        if (sec && sec.getBoundingClientRect().top <= window.innerHeight * 0.4)
          currentIndex = i;
      });
      dots.forEach((d, i) => d.classList.toggle("active", i === currentIndex));
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (backBtn) {
      backBtn.addEventListener("click", () =>
        window.scrollTo({ top: 0, behavior: "smooth" }),
      );
    }

    dots.forEach((dot) => {
      dot.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.querySelector(dot.getAttribute("href"));
        if (target) target.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  /* ======================================================================
     4. AMBIENT FX — floating petals, fireflies, gold particles, diyas
     ====================================================================== */
  function initAmbientFX() {
    const layer = $("#fxLayer");
    if (!layer) return;

    const petalSVG = `<svg width="22" height="22" viewBox="0 0 22 22"><path d="M11 0C15 4 22 8 11 22C0 8 7 4 11 0Z" fill="#C48A82" opacity="0.55"/></svg>`;

    function spawnPetal() {
      const el = document.createElement("div");
      el.className = "fx-petal";
      el.innerHTML = petalSVG;
      const size = rand(14, 26);
      el.style.left = rand(0, 100) + "vw";
      el.style.width = size + "px";
      el.style.height = size + "px";
      layer.appendChild(el);

      const duration = rand(9, 16);
      const drift = rand(-120, 120);
      if (window.gsap) {
        gsap.fromTo(
          el,
          { y: -40, x: 0, rotation: 0, opacity: 0 },
          {
            y: window.innerHeight + 60,
            x: drift,
            rotation: rand(180, 540),
            opacity: rand(0.5, 0.9),
            duration,
            ease: "none",
            onComplete: () => el.remove(),
          },
        );
        gsap.to(el, { opacity: 0, duration: 1.5, delay: duration - 1.5 });
      } else {
        el.remove();
      }
    }

    function spawnFirefly() {
      const el = document.createElement("div");
      el.className = "fx-firefly";
      el.style.left = rand(0, 100) + "vw";
      el.style.top = rand(20, 90) + "vh";
      layer.appendChild(el);
      if (window.gsap) {
        const tl = gsap.timeline({ onComplete: () => el.remove() });
        tl.to(el, { opacity: 1, duration: 1 })
          .to(el, {
            x: rand(-80, 80),
            y: rand(-80, 80),
            duration: rand(3, 5),
            ease: "sine.inOut",
            repeat: 1,
            yoyo: true,
          })
          .to(el, { opacity: 0, duration: 1.2 }, "-=1");
      } else {
        el.remove();
      }
    }

    function spawnParticle() {
      const el = document.createElement("div");
      el.className = "fx-particle";
      const size = rand(2, 5);
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.left = rand(0, 100) + "vw";
      el.style.top = rand(0, 100) + "vh";
      layer.appendChild(el);
      if (window.gsap) {
        gsap.fromTo(
          el,
          { opacity: 0, y: 0 },
          {
            opacity: rand(0.3, 0.7),
            y: -rand(40, 120),
            duration: rand(4, 8),
            ease: "sine.inOut",
            onComplete: () => el.remove(),
          },
        );
      } else {
        el.remove();
      }
    }

    function spawnDiya() {
      const el = document.createElement("div");
      el.className = "fx-diya";
      el.innerHTML = '<i class="fa-solid fa-fire"></i>';
      el.style.left = rand(0, 100) + "vw";
      layer.appendChild(el);
      if (window.gsap) {
        gsap.to(el, {
          y: -(window.innerHeight + 100),
          x: rand(-60, 60),
          opacity: 0,
          duration: rand(10, 16),
          ease: "none",
          onComplete: () => el.remove(),
        });
      } else {
        el.remove();
      }
    }

    if (!reduceMotion) {
      setInterval(spawnPetal, 1400);
      setInterval(spawnFirefly, 2200);
      setInterval(spawnParticle, 900);
      setInterval(spawnDiya, 3600);
      // seed a few immediately
      for (let i = 0; i < 4; i++) setTimeout(spawnPetal, i * 300);
      for (let i = 0; i < 3; i++) setTimeout(spawnFirefly, i * 500);
    }
  }

  let hasUserInteracted = false;

function enableScrollAnimations() {
  if (hasUserInteracted) return;

  hasUserInteracted = true;

  initScrollReveals();

  ScrollTrigger.refresh();
}

  /* ======================================================================
     5. PRELOADER — envelope opening sequence
     ====================================================================== */
  function initPreloader() {
    const preloader = $("#preloader");
    const palace = $("#palace");
    if (!preloader || !palace) return;

    let opened = false;

    function sparkleBurst() {
      const rect = palace.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      for (let i = 0; i < 26; i++) {
        const s = document.createElement("div");
        s.className = "preloader-sparkle";
        s.style.left = cx + "px";
        s.style.top = cy + "px";
        preloader.appendChild(s);
        const angle = rand(0, Math.PI * 2);
        const dist = rand(60, 220);
        if (window.gsap) {
          gsap.to(s, {
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            opacity: 0,
            duration: rand(0.7, 1.2),
            ease: "power2.out",
            onComplete: () => s.remove(),
          });
        } else {
          setTimeout(() => s.remove(), 900);
        }
      }
    }

    function openInvitation(isUserGesture) {
      if (opened) return;
      opened = true;

      if (isUserGesture) {
        if (musicAPI) musicAPI.playOnGesture();
        enableScrollAnimations(); // <-- Add this
      }

      palace.classList.add("is-opening");
      sparkleBurst();

      setTimeout(() => {
        preloader.style.display = "none";
        animateHeroIn();
      }, 950);
    }

    palace.addEventListener("click", () => {
      if (musicAPI) musicAPI.playOnGesture(); // fire immediately, tied directly to this click
      openInvitation(true);
    });

    // auto-open after a few seconds if the user doesn't interact
    setTimeout(() => openInvitation(false), 4200);

    // Fallback: some browsers only count a gesture on the exact element/tab that
    // received it. If the door-tap didn't unlock audio, the very next interaction
    // anywhere on the page will — the moment isPlaying is still false, it retries.
    function firstInteractionFallback() {
      if (musicAPI && !musicAPI.isPlaying()) musicAPI.playOnGesture();
      document.removeEventListener("click", firstInteractionFallback);
      document.removeEventListener("touchend", firstInteractionFallback);
    }
    document.addEventListener("click", firstInteractionFallback);
    document.addEventListener("touchend", firstInteractionFallback);
  }

  /* ======================================================================
     6. GSAP HERO INTRO + SCROLL REVEALS
     ====================================================================== */
  function animateHeroIn() {
    if (!window.gsap) return; // CSS/HTML already renders these fully visible by default
    gsap.set(
      [
        ".hero__eyebrow",
        ".hero__name",
        ".hero__amp",
        ".hero__tagline",
        ".hero__date-pill",
        ".hero__scroll-cue",
      ],
      {
        clearProps: "all",
      },
    );
    const heroEls = $$("[data-anim]");
    try {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-anim='fade-down']", { y: -24, opacity: 0, duration: 1 })
        .from(
          ".hero__name",
          { y: 60, opacity: 0, duration: 1.1, stagger: 0.15 },
          "-=0.6",
        )
        .from(
          ".hero__amp",
          { scale: 0, opacity: 0, duration: 0.8, ease: "back.out(2)" },
          "-=0.9",
        )
        .fromTo(
          "[data-anim='fade-up']",
          {
            y: 24,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.15,
          },
        )
        .from(".hero__scroll-cue", { opacity: 0, duration: 1 }, "-=0.2");
    } catch (err) {
      // If the timeline errors out partway, don't leave hero content stuck at opacity 0.
      console.error(
        "Hero intro animation failed, showing content immediately:",
        err,
      );
      heroEls.forEach((el) => {
        el.style.opacity = 1;
        el.style.transform = "none";
      });
    }
  }

  function initScrollReveals() {
    if (!window.gsap || !window.ScrollTrigger) {
      // fallback: just show everything
      $$("[data-reveal]").forEach((el) => (el.style.opacity = 1));
      return;
    }

    $$("[data-reveal]").forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        },
      );
    });

    // timeline media parallax-ish scale in
    $$(".timeline__media").forEach((el) => {
      gsap.fromTo(
        el,
        { scale: 1.15, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        },
      );
    });

    // event cards stagger
    gsap.utils.toArray(".events-grid .event-card").forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay: (i % 3) * 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 88%" },
        },
      );
    });

    // gentle parallax on section mandalas / hero bg
    gsap.to(".hero__mandala--1", {
      y: 80,
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });
    gsap.to(".hero__mandala--2", {
      y: -60,
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });

    // gallery parallax
    gsap.utils.toArray(".gallery__item").forEach((img, i) => {
      gsap.fromTo(
        img,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: { trigger: img, start: "top 92%" },
        },
      );
    });
  }

  /* ======================================================================
     7. MOUSE SPOTLIGHT ON HERO
     ====================================================================== */
  function initSpotlight() {
    const hero = $(".hero");
    if (!hero) return;
    hero.addEventListener("mousemove", (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      hero.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(217,182,115,.16), transparent 45%)`;
    });
  }

  /* ======================================================================
     8. SCRATCH CARD (Canvas)
     ====================================================================== */
  function initScratchCard() {
    const canvas = $("#scratchCanvas");
    const card = $("#scratchCard");
    const hint = $("#scratchHint");
    if (!canvas || !card) return;

    const ctx = canvas.getContext("2d");
    let width, height;
    let scratching = false;
    let revealed = false;
    let scratchedPixels = 0;
    let totalPixels = 0;
    let lastCheck = 0;

    function resize() {
      const rect = card.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
      drawFoil();
    }

    function drawFoil() {
      // Base gold foil gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#f6e2a8");
      grad.addColorStop(0.35, "#d9b673");
      grad.addColorStop(0.6, "#d4af37");
      grad.addColorStop(1, "#9c7a1c");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // subtle mandala-like ring pattern for texture
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = "#fffbe8";
      for (let r = 20; r < Math.max(width, height); r += 26) {
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // diagonal shimmer streaks
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "#ffffff";
      for (let i = -height; i < width; i += 34) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + height * 0.6, height);
        ctx.lineTo(i + height * 0.6 + 10, height);
        ctx.lineTo(i + 10, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      totalPixels = width * height;
      scratchedPixels = 0;
    }

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches && e.touches[0];
      const clientX = touch ? touch.clientX : e.clientX;
      const clientY = touch ? touch.clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function scratchAt(x, y) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.fill();
      spawnGoldDust(x, y);
    }

    function spawnGoldDust(x, y) {
      const rect = canvas.getBoundingClientRect();
      for (let i = 0; i < 2; i++) {
        const dust = document.createElement("div");
        dust.style.position = "absolute";
        dust.style.left = rect.left + x + rand(-6, 6) + "px";
        dust.style.top = rect.top + y + rand(-6, 6) + "px";
        dust.style.width = rand(2, 4) + "px";
        dust.style.height = dust.style.width;
        dust.style.borderRadius = "50%";
        dust.style.background = "#f4e5be";
        dust.style.boxShadow = "0 0 6px 1px rgba(244,229,190,.8)";
        dust.style.pointerEvents = "none";
        dust.style.zIndex = "9400";
        document.body.appendChild(dust);
        if (window.gsap) {
          gsap.to(dust, {
            y: rand(-20, -40),
            x: rand(-15, 15),
            opacity: 0,
            duration: rand(0.5, 0.9),
            ease: "power1.out",
            onComplete: () => dust.remove(),
          });
        } else {
          setTimeout(() => dust.remove(), 700);
        }
      }
    }

    function checkProgress() {
      const now = Date.now();
      if (now - lastCheck < 180) return; // throttle expensive pixel read
      lastCheck = now;

      const imgData = ctx.getImageData(0, 0, width, height).data;
      let transparent = 0;
      // sample every 8th pixel for performance
      for (let i = 3; i < imgData.length; i += 8 * 4) {
        if (imgData[i] < 30) transparent++;
      }
      const sampledTotal = imgData.length / (8 * 4);
      const pct = transparent / sampledTotal;

      if (pct > 0.6 && !revealed) {
        revealCard();
      }
    }

    function revealCard() {
      revealed = true;
      if (hint) hint.style.opacity = "0";
      if (window.gsap) {
        gsap.to(canvas, {
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          onComplete: () => {
            canvas.style.pointerEvents = "none";
          },
        });
      } else {
        canvas.style.opacity = 0;
        canvas.style.pointerEvents = "none";
      }
      launchConfetti();
      playScratchCompleteSound();
    }

    function startScratch(e) {
      scratching = true;
      canvas.style.cursor = "none";
      const pos = getPos(e);
      scratchAt(pos.x, pos.y);
      if (hint) hint.style.transition = "opacity .3s";
      if (hint) hint.style.opacity = "0.0001"; // fade hint quickly once touched, GSAP-free
    }
    function moveScratch(e) {
      if (!scratching || revealed) return;
      e.preventDefault();
      const pos = getPos(e);
      scratchAt(pos.x, pos.y);
      checkProgress();
      playScratchSound();
    }
    function endScratch() {
      scratching = false;
      checkProgress();
    }

    canvas.addEventListener("mousedown", startScratch);
    canvas.addEventListener("mousemove", moveScratch);
    window.addEventListener("mouseup", endScratch);

    canvas.addEventListener("touchstart", startScratch, { passive: true });
    canvas.addEventListener("touchmove", moveScratch, { passive: false });
    canvas.addEventListener("touchend", endScratch);

    window.addEventListener("resize", () => {
      if (!revealed) resize();
    });
    resize();

    /* ---- optional scratching sound (uses Web Audio API, no external file needed) ---- */
    let audioCtx;
    let lastSoundTime = 0;
    function playScratchSound() {
      const now = Date.now();
      if (now - lastSoundTime < 90) return;
      lastSoundTime = now;
      try {
        audioCtx =
          audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = audioCtx.sampleRate * 0.04;
        const buffer = audioCtx.createBuffer(
          1,
          bufferSize,
          audioCtx.sampleRate,
        );
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++)
          data[i] = (Math.random() * 2 - 1) * 0.3;
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 1200;
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0.15;
        noise.connect(filter).connect(gainNode).connect(audioCtx.destination);
        noise.start();
      } catch (err) {
        /* audio not available, fail silently */
      }
    }
    function playScratchCompleteSound() {
      try {
        audioCtx =
          audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const now = audioCtx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          osc.frequency.value = freq;
          osc.type = "sine";
          gainNode.gain.setValueAtTime(0.0001, now + i * 0.12);
          gainNode.gain.linearRampToValueAtTime(0.12, now + i * 0.12 + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(
            0.0001,
            now + i * 0.12 + 0.5,
          );
          osc.connect(gainNode).connect(audioCtx.destination);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.55);
        });
      } catch (err) {
        /* fail silently */
      }
    }
  }

  /* ======================================================================
     9. CONFETTI CANVAS (celebration after scratch reveal)
     ====================================================================== */
  function launchConfetti() {
    const canvas = $("#confettiCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#D9B673", "#D4AF37", "#F6E2A8", "#C48A82", "#7A1730"];
    const pieces = Array.from({ length: 140 }, () => ({
      x: rand(0, canvas.width),
      y: rand(-canvas.height, 0),
      w: rand(6, 11),
      h: rand(8, 14),
      color: colors[Math.floor(rand(0, colors.length))],
      speedY: rand(2, 5),
      speedX: rand(-2, 2),
      rotation: rand(0, 360),
      rotSpeed: rand(-6, 6),
    }));

    let frame = 0;
    const maxFrames = 220;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    draw();
  }

  /* ======================================================================
     10. COUNTDOWN TIMER
     ====================================================================== */
  function initCountdown() {
    const targetDate = new Date("2026-09-21T19:00:00");
    const els = {
      months: $("#cd-months"),
      days: $("#cd-days"),
      hours: $("#cd-hours"),
      minutes: $("#cd-minutes"),
      seconds: $("#cd-seconds"),
    };
    if (!els.months) return;

    function update() {
      const now = new Date();
      let diff = targetDate - now;
      if (diff < 0) diff = 0;

      const totalSeconds = Math.floor(diff / 1000);
      const months = Math.floor(totalSeconds / (30 * 24 * 3600));
      const days = Math.floor((totalSeconds % (30 * 24 * 3600)) / (24 * 3600));
      const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const pad = (n) => String(n).padStart(2, "0");
      els.months.textContent = pad(months);
      els.days.textContent = pad(days);
      els.hours.textContent = pad(hours);
      els.minutes.textContent = pad(minutes);
      els.seconds.textContent = pad(seconds);
    }
    update();
    setInterval(update, 1000);
  }

  /* ======================================================================
     11. GALLERY LIGHTBOX
     ====================================================================== */
  function initLightbox() {
    const items = $$(".gallery__item");
    const lightbox = $("#lightbox");
    const img = $("#lightboxImg");
    const closeBtn = $("#lightboxClose");
    const prevBtn = $("#lightboxPrev");
    const nextBtn = $("#lightboxNext");
    if (!items.length || !lightbox) return;

    let currentIndex = 0;

    function open(index) {
      currentIndex = index;
      img.src = items[currentIndex].src;
      img.alt = items[currentIndex].alt || "";
      lightbox.classList.add("active");
    }
    function close() {
      lightbox.classList.remove("active");
    }
    function show(delta) {
      currentIndex = (currentIndex + delta + items.length) % items.length;
      img.src = items[currentIndex].src;
      img.alt = items[currentIndex].alt || "";
    }

    items.forEach((item, i) => item.addEventListener("click", () => open(i)));
    closeBtn && closeBtn.addEventListener("click", close);
    prevBtn && prevBtn.addEventListener("click", () => show(-1));
    nextBtn && nextBtn.addEventListener("click", () => show(1));
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });
    window.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("active")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(-1);
      if (e.key === "ArrowRight") show(1);
    });
  }

  /* ======================================================================
     12. RSVP FORM (no backend — local confirmation)
     ====================================================================== */
  function initRSVPForm() {
    const form = $("#rsvpForm");
    const success = $("#rsvpSuccess");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      // In production, replace this with a real fetch() call to your backend or form service.
      success.classList.add("show");
      launchConfetti();
      form.reset();
      setTimeout(() => success.classList.remove("show"), 5000);
    });
  }

  /* ======================================================================
     13. MUSIC PLAYER
     ====================================================================== */
  function initMusicPlayer() {
    const player = $("#musicPlayer");
    const toggle = $("#musicToggle");
    const icon = $("#musicIcon");
    const volume = $("#musicVolume");
    const audio = $("#bgMusic");
    if (!player || !audio) return;

    let isPlaying = false;
    audio.volume = parseFloat(volume ? volume.value : 0.5);

    function setPlayingUI(playing) {
      isPlaying = playing;
      icon.classList.toggle("fa-pause", playing);
      icon.classList.toggle("fa-play", !playing);
      player.classList.toggle("playing", playing);
      toggle.setAttribute("aria-label", playing ? "Pause music" : "Play music");
    }

    function play() {
      return audio
        .play()
        .then(() => {
          setPlayingUI(true);
        })
        .catch((err) => {
          // Autoplay/file may be blocked or missing — fail gracefully, UI stays on "play".
          console.info(
            "Background music didn't start automatically (browser blocked it or the file is missing). Tap the play button to start it manually.",
            err,
          );
        });
    }

    function pause() {
      audio.pause();
      setPlayingUI(false);
    }

    toggle.addEventListener("click", () => {
      if (isPlaying) pause();
      else play();
    });

    if (volume) {
      volume.addEventListener("input", () => {
        audio.volume = parseFloat(volume.value);
      });
    }

    // Expose a minimal API so other interactions (e.g. opening the invitation doors)
    // can start playback using that same click as the required user gesture.
    musicAPI = {
      playOnGesture() {
        if (!isPlaying) play();
      },
      isPlaying: () => isPlaying,
    };
  }

  /* ======================================================================
     INIT — run everything once DOM is ready
     ====================================================================== */
  // Run each feature independently: if one throws (an unsupported API on a
  // particular browser, a blocked resource, etc.) the rest — most importantly
  // initPreloader(), which opens the doors and reveals the hero — still runs.
  function safeInit(name, fn) {
    try {
      fn();
    } catch (err) {
      console.error("Init failed for " + name + ":", err);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    safeInit("cursor", initCursor);
    safeInit("scrollChrome", initScrollChrome);
    safeInit("ambientFX", initAmbientFX);
    safeInit("spotlight", initSpotlight);
    safeInit("scratchCard", initScratchCard);
    safeInit("countdown", initCountdown);
    safeInit("lightbox", initLightbox);
    safeInit("rsvpForm", initRSVPForm);
    safeInit("musicPlayer", initMusicPlayer);
    // safeInit("scrollReveals", initScrollReveals);
    safeInit("preloader", initPreloader);
  });
})();
