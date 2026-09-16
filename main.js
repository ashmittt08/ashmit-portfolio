(() => {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const headerOffset = () => header.offsetHeight + 12;

  /* ---------- Smooth scroll (Lenis, with native fallback) ---------- */
  let lenis = null;
  if (!reduceMotion && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  const scrollToTarget = (hash) => {
    const target = hash === '#index' ? 0 : document.querySelector(hash);
    if (target === null) return;
    if (lenis) {
      lenis.scrollTo(target, { offset: target === 0 ? 0 : -headerOffset() });
    } else if (target === 0) {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    } else {
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  };

  /* ---------- Mobile menu ---------- */
  const menuBtn = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-menu');
  const setMenu = (open) => {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? '[ Close ]' : '[ Menu ]';
  };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));

  document.querySelectorAll('a[data-scroll]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const hash = link.getAttribute('href');
      if (!hash || !hash.startsWith('#')) return;
      e.preventDefault();
      setMenu(false);
      scrollToTarget(hash);
      history.replaceState(null, '', hash);
    });
  });

  /* ---------- Hero load-in ---------- */
  requestAnimationFrame(() => root.classList.add('is-loaded'));

  /* ---------- Scroll reveals ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Terminal lines type in sequentially ---------- */
  const terminal = document.querySelector('[data-terminal]');
  if (terminal) {
    terminal.querySelectorAll('.terminal-body p').forEach((line, i) => {
      line.style.transitionDelay = `${250 + i * 380}ms`;
    });
    if ('IntersectionObserver' in window && !reduceMotion) {
      const termObserver = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          terminal.classList.add('is-running');
          termObserver.disconnect();
        },
        { threshold: 0.35 }
      );
      termObserver.observe(terminal);
    } else {
      terminal.classList.add('is-running');
    }
  }

  /* ---------- Active nav (scroll spy) ---------- */
  const navLinks = document.querySelectorAll('[data-nav]');
  const setActive = (id) => {
    navLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === id));
  };
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    document.querySelectorAll('[data-section]').forEach((s) => spy.observe(s));
  }

  /* ---------- Subtle parallax + header hide on scroll down ---------- */
  const parallaxEls = [...document.querySelectorAll('[data-parallax]')];
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;

    if (!reduceMotion) {
      parallaxEls.forEach((el) => {
        const rect = el.parentElement.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > vh + 100) return;
        const offset = (rect.top + rect.height / 2 - vh / 2) * parseFloat(el.dataset.parallax);
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
    }

    const menuOpen = !menu.hidden;
    header.classList.toggle('is-hidden', !menuOpen && y > lastY && y > 400);
    lastY = y;
    ticking = false;
  };

  const requestTick = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  };

  if (lenis) lenis.on('scroll', requestTick);
  else window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  onScroll();

  /* ---------- Copy email ---------- */
  const copyBtn = document.querySelector('[data-copy]');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.copy);
        copyBtn.textContent = '[ Address Copied ✓ ]';
        copyBtn.classList.add('is-copied');
      } catch {
        copyBtn.textContent = '[ Copy Failed — Select Manually ]';
      }
      setTimeout(() => {
        copyBtn.textContent = '[ Copy Address ]';
        copyBtn.classList.remove('is-copied');
      }, 2200);
    });
  }
})();
