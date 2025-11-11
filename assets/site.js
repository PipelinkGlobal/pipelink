document.addEventListener('DOMContentLoaded', () => {
  // ----- Header state (on-hero vs scrolled) -----
  const header = document.getElementById('siteHeader');
  const hero = document.getElementById('hero');
  const sentinel = document.getElementById('hero-sentinel');
  function setHeaderState(inHero){
    if(!header) return;
    header.classList.toggle('on-hero', !!inHero);
    header.classList.toggle('scrolled', !inHero);
  }
  if ('IntersectionObserver' in window && hero && sentinel){
    const ioHeader = new IntersectionObserver(entries=>{
      entries.forEach(entry=> setHeaderState(entry.isIntersecting));
    }, { rootMargin: `-` + ((header?.offsetHeight||80) + 8) + `px 0px 0px 0px`, threshold: 0 });
    ioHeader.observe(sentinel);
  } else {
    setHeaderState(false);
  }

  // ----- Smooth anchor scrolling with header offset -----
  const HEADER_OFFSET = () => (header?.offsetHeight || 80) + 8;
  function easeInOutCubic(t){ return t<0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }
  function smoothScrollTo(targetY, duration = 800){
    const startY = window.scrollY; const dist = targetY - startY; const start = performance.now();
    function step(now){ const t = Math.min(1, (now - start) / duration);
      window.scrollTo(0, startY + dist * easeInOutCubic(t)); if (t < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  document.querySelectorAll("a[href^='#']").forEach(a=>{
    a.addEventListener('click', e=>{
      const id = a.getAttribute('href'); const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault(); const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET();
      smoothScrollTo(top, 850); history.pushState(null, '', id);
    });
  });

  // ----- Search overlay (standardized) -----
  const search = {
    overlay: document.getElementById('searchOverlay'),
    openBtn: document.getElementById('openSearch'),
    closeBtn: document.getElementById('closeSearch'),
    input: document.getElementById('siteSearch'),
    results: document.getElementById('searchResults')
  };

  function siteIndex(){
    // Static site-wide index
    const INDEX = [
      { href:'index.html#who',         title:'Home - Who We Are',        text:'Overview and capabilities' },
      { href:'index.html#capabilities',title:'Home - Capabilities',      text:'Stats and highlights' },
      { href:'index.html#featured',    title:'Home - Featured Products', text:'PL6/PL8, linepipe, OCTG' },
      { href:'about.html#about',       title:'About - Our Story',        text:'Company background and what we do' },
      { href:'about.html#locations',   title:'About - Our Location',     text:'Global coverage and markers' },
      { href:'about.html#value',       title:'About - Our Value',        text:'Strategic value proposition' },
      { href:'about.html#identity',    title:'About - Our Identity',     text:'Identity and positioning' },
      { href:'engineering.html#segments', title:'Engineering - Business', text:'Business segments' },
      { href:'engineering.html#products', title:'Engineering - Our Products', text:'PL6/PL8, linepipe, OCTG, stainless, mechanical' },
      { href:'services.html#solutions',   title:'Services',              text:'End-to-end offerings' },
      { href:'contact.html#contact',      title:'Contact',               text:'Contact form and details' }
    ];
    return INDEX;
  }

  function pageIndex(){
    return Array.from(document.querySelectorAll('section[id]')).map(sec=>{
      const heading = sec.querySelector('h2, h3');
      const title = (heading ? heading.textContent : sec.id || '').trim();
      const text = (sec.innerText || '').replace(/\s+/g,' ').trim();
      return { href:'#'+sec.id, title, text };
    });
  }

  function escapeHTML(s){
    return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  function highlight(html, q){
    if(!q) return escapeHTML(html||'');
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')','ig');
    return escapeHTML(html||'').replace(re, '<span class="bg-yellow-200">$1</span>');
  }
  function getExcerpt(text, q, span = 120){
    const t = (text||'');
    if(!q) return t.slice(0, span) + (t.length > span ? '.' : '');
    const low = t.toLowerCase();
    const i = low.indexOf(q.toLowerCase());
    if(i < 0) return t.slice(0, span) + (t.length > span ? '.' : '');
    const start = Math.max(0, i - Math.floor(span/2));
    const end = Math.min(t.length, i + q.length + Math.floor(span/2));
    return (start>0?'.':'') + t.slice(start, end) + (end<t.length?'.':'');
  }

  let SEARCH_INDEX = null;
  function buildIndex(){
    SEARCH_INDEX = siteIndex().concat(pageIndex());
  }
  function renderResults(list, q){
    if(!search.results) return;
    if(!list.length){
      search.results.innerHTML = '<div class="p-4 text-sm text-gray-500">No results</div>';
      return;
    }
    search.results.innerHTML = list.slice(0,12).map(m=>{
      const title = highlight(m.title, q);
      const snippet = highlight(getExcerpt(m.text, q), q);
      return `<a class="block px-4 py-3 hover:bg-gray-50" href="${m.href}"><div class="text-sm font-semibold">${title}</div><div class="text-xs text-gray-600">${snippet}</div></a>`;
    }).join('');
    search.results.querySelectorAll('a').forEach(a=> a.addEventListener('click', closeSearch));
  }
  function openSearch(e){
    if(e) e.preventDefault();
    if(!search.overlay) return;
    buildIndex();
    renderResults(SEARCH_INDEX, '');
    search.overlay.classList.add('open');
    search.overlay.setAttribute('aria-hidden','false');
    search.openBtn?.setAttribute('aria-expanded','true');
    setTimeout(()=> search.input?.focus(), 20);
  }
  function closeSearch(){
    if(!search.overlay) return;
    search.overlay.classList.remove('open');
    search.overlay.setAttribute('aria-hidden','true');
    search.openBtn?.setAttribute('aria-expanded','false');
  }
  if (search.openBtn && search.overlay){
    search.openBtn.addEventListener('click', openSearch);
    search.closeBtn?.addEventListener('click', closeSearch);
    search.overlay.addEventListener('click', (e)=>{ if(e.target === search.overlay) closeSearch(); });
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape' && search.overlay.classList.contains('open')) closeSearch();
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      if ((isMac && e.metaKey && e.key.toLowerCase() === 'k') || (!isMac && e.ctrlKey && e.key.toLowerCase() === 'k')) {
        openSearch(e);
      }
    });
    let tId; search.input?.addEventListener('input', ()=>{
      clearTimeout(tId);
      tId = setTimeout(()=>{
        const q = (search.input.value||'').trim();
        const list = (SEARCH_INDEX||[]).filter(it =>
          it.title.toLowerCase().includes(q.toLowerCase()) || it.text.toLowerCase().includes(q.toLowerCase())
        );
        renderResults(list, q);
      }, 80);
    });
  }

  // ----- Reveal animations -----
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver(es => es.forEach(e=> e.isIntersecting && e.target.classList.add('show')),
      {rootMargin:'0px 0px -10% 0px', threshold:.1});
    document.querySelectorAll('.reveal, .card').forEach(el=> io.observe(el));
  } else {
    document.querySelectorAll('.reveal, .card').forEach(el=> el.classList.add('show'));
  }

  // ----- Dropdown hover intent (uniform ~0.5s close delay) -----
  const HOVER_CLOSE_DELAY = 500; // ms
  document.querySelectorAll('.nav-group').forEach(group => {
    let closeTimer = null;
    const open = () => { group.classList.add('open'); };
    const scheduleClose = () => {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => group.classList.remove('open'), HOVER_CLOSE_DELAY);
    };
    const cancelClose = () => { clearTimeout(closeTimer); };

    group.addEventListener('mouseenter', () => { cancelClose(); open(); });
    group.addEventListener('mouseleave', () => { scheduleClose(); });
    group.addEventListener('focusin', () => { cancelClose(); open(); });
    group.addEventListener('focusout', () => { scheduleClose(); });
  });
});
