document.addEventListener('DOMContentLoaded', function(){
  // HAMBURGER MENU TOGGLE
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if(navToggle && navLinks){
    navToggle.addEventListener('click', ()=>{
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link=>{
      link.addEventListener('click', ()=>{
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  // reveal on scroll — use Motion One if available for smoother animations
  const motionLib = window.MotionOne || window.motion || null;
  const MOTION_DUR = { fast: 380, medium: 700, slow: 1200, hero: 14000 };
  function motionReveal(el){
    if(!motionLib){ el.classList.add('visible'); return; }
    // avoid re-animating
    if(el.dataset.motionRevealed) return; el.dataset.motionRevealed = '1';
    motionLib.animate(el, { opacity: [0,1], transform: ['translateY(18px)','translateY(0px)'] }, { duration: MOTION_DUR.medium, easing: 'ease-out' });
  }

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const t = e.target;
        // support stagger groups: reveal children with slight delay
        if(t.querySelectorAll){
          const children = t.querySelectorAll('.stagger-item');
          if(children.length){
            children.forEach((c,i)=> setTimeout(()=> motionReveal(c), i*90));
            motionReveal(t);
            return;
          }
        }
        motionReveal(t);
        // animate counters inside
        t.querySelectorAll('.stat-value').forEach(el=>animateStat(el));
      }
    });
  },{threshold:0.12});
  document.querySelectorAll('.reveal, .event-card, .stats-grid, .category-card, .stagger-item').forEach(el=>io.observe(el));

  // simple booking flow: from event -> checkout
  const bookBtn = document.getElementById('bookNow');
  if(bookBtn){
    bookBtn.addEventListener('click', ()=>{
      const qty = document.getElementById('qty')?.value || 1;
      showToast('Proceeding to checkout…');
      setTimeout(()=> location.href = `checkout.html?qty=${qty}`, 300);
    });
  }

  // simple form hooks
  document.getElementById('doLogin')?.addEventListener('click', ()=>{
    const em = document.getElementById('loginEmail').value;
    if(!em){ alert('Enter email'); return; }
    showToast('Signed in');
    setTimeout(()=> location.href = 'profile.html', 300);
  });
  document.getElementById('doSignup')?.addEventListener('click', ()=>{
    showToast('Account created');
    setTimeout(()=> location.href='profile.html', 400);
  });

  // THEME: dark / light toggle persisted in localStorage
  function applyTheme(theme){
    if(theme==='dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
    // update icon
    const icon = document.getElementById('themeIcon');
    if(icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
  function initTheme(){
    const saved = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(saved);
    // add toggle listener
    const themeToggle = document.getElementById('themeToggle');
    if(themeToggle){
      themeToggle.addEventListener('click', ()=>{
        const cur = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const next = cur === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem('theme', next);
        showToast(next === 'dark' ? 'Dark mode on' : 'Light mode on');
      });
    }
  }
  initTheme();

  // TOAST helper
  function showToast(msg, opts={timeout:3000}){
    const wrapId = '__toast_wrap';
    let wrap = document.getElementById(wrapId);
    if(!wrap){ wrap = document.createElement('div'); wrap.id = wrapId; wrap.className='toast-wrap'; document.body.appendChild(wrap); }
    const it = document.createElement('div'); it.className = 'toast-item' + (document.documentElement.classList.contains('dark')? ' dark':'');
    it.innerHTML = `<div class="toast-msg">${msg}</div><button class="btn-close" aria-label="Close">×</button>`;
    wrap.appendChild(it);
    // use Motion One if available
    const motionLib = window.MotionOne || window.motion || null;
    if(motionLib){ motionLib.animate(it, { opacity: [0,1], transform: ['translateY(8px)','translateY(0)'] }, { duration: MOTION_DUR.fast, easing: 'ease-out' }); }
    const to = setTimeout(()=>dismiss(), opts.timeout);
    function dismiss(){ if(to) clearTimeout(to); if(motionLib){ motionLib.animate(it, { opacity: [1,0], transform: ['translateY(0)','translateY(8px)'] }, { duration: Math.round(MOTION_DUR.fast * 0.7) }).then(()=>it.remove()); } else it.remove(); }
    it.querySelector('.btn-close').addEventListener('click', dismiss);
    return it;
  }

  // animate number counters
  function animateStat(el){
    if(el.dataset.animated) return; el.dataset.animated = '1';
    const target = parseFloat(el.getAttribute('data-target')) || 0;
    const isFloat = (String(target).indexOf('.')>-1);
    const duration = MOTION_DUR.slow; const frameRate = 30; const totalFrames = Math.round(duration / (1000/frameRate));
    let frame = 0; const start = 0;
    const id = setInterval(()=>{
      frame++;
      const progress = frame/totalFrames;
      const value = start + (target-start) * easeOutCubic(progress);
      el.textContent = isFloat ? (Math.round(value*10)/10) : Math.round(value).toLocaleString();
      if(frame>=totalFrames){ clearInterval(id); el.textContent = isFloat ? target : Math.round(target).toLocaleString(); }
    }, 1000/frameRate);
  }
  function easeOutCubic(t){ return 1 - Math.pow(1-t,3); }

  // internal link page-exit animation
  document.querySelectorAll('a[href$=".html"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const href = a.getAttribute('href');
      if(!href || href.startsWith('http') || a.target) return; // external or new-tab
      e.preventDefault();
      document.body.classList.add('page-exit');
      setTimeout(()=> window.location.href = href, 320);
    });
  });
  
  // Load event data dynamically when on event.html
  async function loadEventFromJSON(){
    if(!location.href.includes('event.html')) return;
    const params = new URLSearchParams(location.search);
    const id = params.get('id') || 'neon';
    try{
      const res = await fetch('assets/data/events.json');
      const data = await res.json();
      const ev = (data.events || []).find(e=>e.id === id) || data.events[0];
      if(!ev) return;
      
      // Populate title
      document.getElementById('eventTitle').textContent = ev.title;
      
      // Format date/time
      const d = new Date(ev.date);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      // Update hero metadata
      const metaEl = document.getElementById('eventMeta');
      const categoryTag = ev.tags && ev.tags.length > 0 ? ev.tags[0] : 'Event';
      metaEl.innerHTML = `
        <span class="meta-item"><i class="far fa-calendar"></i> ${dateStr}</span>
        <span class="meta-item"><i class="far fa-clock"></i> ${timeStr}</span>
        <span class="meta-item"><i class="fas fa-map-marker-alt"></i> ${ev.venue}</span>
        <span class="meta-item"><i class="fas fa-music"></i> ${categoryTag}</span>
      `;
      
      // Set hero background image
      const hero = document.getElementById('detailHero');
      if(hero){
        hero.style.backgroundImage = `url('${ev.image}')`;
        hero.dataset.image = ev.image;
      }
      
      // Populate description
      document.getElementById('eventDescription').textContent = ev.description;
      
      // Populate venue name
      document.getElementById('venueName').textContent = ev.venue;
      
      // Populate address
      const addressEl = document.getElementById('address');
      if(addressEl) addressEl.textContent = ev.address || ev.venue;
      
      // Price and breakdown - handle both numeric and string prices (with currency symbols)
      let ticketPrice, priceDisplay, currencySymbol = '$';
      if(typeof ev.price === 'string'){
        // Extract currency symbol and number from string like "₦45,000"
        const currencyMatch = ev.price.match(/^[^\d]*/);
        if(currencyMatch){
          currencySymbol = currencyMatch[0].trim() || '₦';
        }
        const numMatch = ev.price.match(/\d+/g);
        ticketPrice = numMatch ? parseFloat(numMatch.join('')) : 25;
        priceDisplay = ev.price;
      } else {
        ticketPrice = parseFloat(ev.price) || 25;
        priceDisplay = '$' + ticketPrice.toFixed(2).replace(/\.00$/, '');
      }
      
      const serviceFeeFactor = 0.1;
      const serviceFee = Math.round(ticketPrice * serviceFeeFactor * 100) / 100;
      const total = ticketPrice + serviceFee;
      
      document.getElementById('ticketPrice').textContent = priceDisplay;
      
      // Update price breakdown on quantity change
      function updatePriceBreakdown(){
        const qty = parseInt(document.getElementById('qty').value) || 1;
        const subtotal = (ticketPrice * qty).toFixed(2);
        const serviceFeeTotal = (serviceFee * qty).toFixed(2);
        const grandTotal = (total * qty).toFixed(2);
        
        // Format with appropriate currency symbol
        const formatPrice = (val) => {
          const numStr = val.replace(/\.00$/, '');
          return currencySymbol + numStr;
        };
        
        document.getElementById('subtotal').textContent = formatPrice(subtotal);
        document.getElementById('serviceFee').textContent = formatPrice(serviceFeeTotal);
        document.getElementById('totalPrice').textContent = formatPrice(grandTotal);
      }
      
      updatePriceBreakdown();
      
      // Quantity controls
      const qtyInput = document.getElementById('qty');
      const qtyMinus = document.getElementById('qtyMinus');
      const qtyPlus = document.getElementById('qtyPlus');
      
      if(qtyMinus) qtyMinus.addEventListener('click', ()=>{
        const val = parseInt(qtyInput.value) || 1;
        if(val > 1) qtyInput.value = val - 1;
        updatePriceBreakdown();
      });
      
      if(qtyPlus) qtyPlus.addEventListener('click', ()=>{
        const val = parseInt(qtyInput.value) || 1;
        if(val < 10) qtyInput.value = val + 1;
        updatePriceBreakdown();
      });
      
      if(qtyInput) qtyInput.addEventListener('change', updatePriceBreakdown);
      
      // Populate schedule/what to expect
      const scheduleList = document.getElementById('scheduleList');
      if(scheduleList){
        scheduleList.innerHTML = '';
        if(ev.schedule && ev.schedule.length){
          ev.schedule.forEach(s=>{
            const li = document.createElement('li');
            li.textContent = s.act || s;
            scheduleList.appendChild(li);
          });
        } else {
          scheduleList.innerHTML = '<li>World-class performances from top artists</li><li>State-of-the-art venue facilities</li><li>Premium seating options</li><li>Unforgettable atmosphere</li>';
        }
      }
      
      // Hotels
      const hotelsBox = document.getElementById('hotelsList');
      hotelsBox.innerHTML = '';
      if(ev.hotels && ev.hotels.length){
        ev.hotels.forEach(h=>{
          const div = document.createElement('div');
          div.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.9rem';
          div.innerHTML = `<span>${h.name}</span><span>$${h.price}</span>`;
          hotelsBox.appendChild(div);
        });
      } else {
        hotelsBox.textContent = 'Popular hotels available in the area';
      }

      // Flights
      const flightsBox = document.getElementById('flightsList');
      flightsBox.innerHTML = '';
      if(ev.flights && ev.flights.length){
        ev.flights.forEach(f=>{
          const div = document.createElement('div');
          div.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.9rem';
          div.innerHTML = `<span>${f.route}</span><span>${f.price}</span>`;
          flightsBox.appendChild(div);
        });
      } else {
        flightsBox.textContent = 'Flight options available via major carriers';
      }
      
      // Set up booking button
      const bookBtn = document.getElementById('bookNow');
      if(bookBtn){
        bookBtn.addEventListener('click', ()=>{
          const qty = parseInt(document.getElementById('qty').value) || 1;
          showToast('Proceeding to checkout…');
          setTimeout(()=> location.href = `checkout.html?event=${id}&qty=${qty}`, 400);
        });
      }
    }catch(e){
      console.error('Error loading event:', e);
    }
  }
  loadEventFromJSON();

  // Events listing rendering & search
  async function renderEventsList(){
    if(!location.href.includes('events.html')) return;
    try{
      const res = await fetch('assets/data/events.json');
      const data = await res.json();
      const list = data.events || [];
      const grid = document.getElementById('eventsGrid');
      
      // Get current filter from data attribute or query string
      let currentFilter = 'all';
      const qs = new URLSearchParams(location.search);
      const q = (qs.get('q')||'').toLowerCase();
      const category = qs.get('cat') || '';
      
      function displayEvents(filterCategory = 'all'){
        const filtered = list.filter(ev=>{
          const matchCategory = filterCategory === 'all' || (ev.tags && ev.tags.includes(filterCategory));
          if(!matchCategory) return false;
          if(!q) return true;
          return (ev.title+ ' '+ (ev.description||'') + ' ' + (ev.venue||'')).toLowerCase().includes(q);
        });
        
        grid.innerHTML = '';
        filtered.forEach(ev=>{
          const a = document.createElement('a'); 
          a.className='card-link'; 
          a.href = `event.html?id=${ev.id}`;
          
          const article = document.createElement('article'); 
          article.className='event-card reveal';
          
          const wrapper = document.createElement('div'); 
          wrapper.style.position='relative';
          
          const img = document.createElement('img'); 
          img.loading='lazy'; 
          img.src = ev.image; 
          img.alt = ev.title;
          
          const fav = document.createElement('button'); 
          fav.className='favorite-btn'; 
          fav.setAttribute('data-id', ev.id); 
          fav.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-7-4.35-9.5-7.03C-1 9.5 4 .5 12 6c8-5.5 13 3.5 9.5 7.97C19 16.65 12 21 12 21z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
          if(isFav(ev.id)) fav.classList.add('activated');
          
          wrapper.appendChild(img); 
          wrapper.appendChild(fav);
          
          const content = document.createElement('div'); 
          content.className='card-content';
          content.innerHTML = `<h3>${ev.title}</h3><p class="muted">${ev.venue} • ${new Date(ev.date).toLocaleDateString()}</p><div class="price">${ev.price?('$'+ev.price):'Free'}</div>`;
          
          article.appendChild(wrapper); 
          article.appendChild(content); 
          a.appendChild(article); 
          grid.appendChild(a);
        });
        
        // re-observe new items
        document.querySelectorAll('#eventsGrid .reveal, #eventsGrid .event-card').forEach(el=>io.observe(el));
        // ensure fallback handlers on new images
        attachImageFallbacks();
      }
      
      // Set up filter buttons
      const filterBtns = document.querySelectorAll('.filter-btn');
      filterBtns.forEach(btn=>{
        btn.addEventListener('click', ()=>{
          // Remove active class from all buttons
          filterBtns.forEach(b=>b.classList.remove('active'));
          // Add active to clicked button
          btn.classList.add('active');
          // Get filter value and render
          const filterVal = btn.getAttribute('data-filter') || 'all';
          displayEvents(filterVal);
        });
      });
      
      // Display initial events
      displayEvents(category || 'all');
      
    }catch(err){ console.error('Failed to load events', err); }
  }
  renderEventsList();

  // FAVORITES: localStorage-backed
  function getFavorites(){ try{ return JSON.parse(localStorage.getItem('favorites')||'[]') }catch(e){ return [] } }
  function isFav(id){ return getFavorites().indexOf(id) > -1 }
  function toggleFav(id, btn){ const favs = getFavorites(); const idx = favs.indexOf(id); if(idx>-1){ favs.splice(idx,1); btn.classList.remove('activated'); showToast('Removed from favorites'); } else { favs.push(id); btn.classList.add('activated'); showToast('Added to favorites'); } localStorage.setItem('favorites', JSON.stringify(favs)); }
  // delegate favorite clicks
  document.body.addEventListener('click', (e)=>{
    const b = e.target.closest && e.target.closest('.favorite-btn'); if(!b) return; e.preventDefault(); const id = b.getAttribute('data-id'); if(!id) return; toggleFav(id,b);
  });

  // Attach fallback handlers to all images and hero backgrounds
  function attachImageFallbacks(){
    // Better fallback images with SVG placeholders
    const DEFAULT_HERO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1400' height='600'%3E%3Crect fill='%236C5CE7' width='1400' height='600'/%3E%3Ctext x='50%25' y='50%25' font-size='48' fill='white' text-anchor='middle' dominant-baseline='middle' font-family='Arial,sans-serif'%3EEvent Image Unavailable%3C/text%3E%3C/svg%3E";
    const DEFAULT_THUMB = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e9ecef' width='400' height='300'/%3E%3Ctext x='50%25' y='40%25' font-size='18' fill='%236b7280' text-anchor='middle' font-family='Arial,sans-serif'%3EImage Not%3C/text%3E%3Ctext x='50%25' y='55%25' font-size='18' fill='%236b7280' text-anchor='middle' font-family='Arial,sans-serif'%3EAvailable%3C/text%3E%3C/svg%3E";
    
    // image fallback for <img>
    document.querySelectorAll('img').forEach(img=>{
      if(img.dataset.fallbackAttached) return; img.dataset.fallbackAttached='1';
      img.addEventListener('error', ()=>{
        if(img.dataset.fallbacked) return; img.dataset.fallbacked='1';
        const isHero = img.id==='eventImage' || img.closest('.hero');
        img.src = isHero ? DEFAULT_HERO : DEFAULT_THUMB;
        img.style.backgroundColor = isHero ? '#6C5CE7' : '#e9ecef';
      });
    });

    // hero background fallback: verify image URL from --hero-url and replace if fails
    document.querySelectorAll('.hero.has-bg').forEach(el=>{
      // prefer explicit data-hero attribute if present
      const dataHero = el.getAttribute('data-hero');
      let src = dataHero || '';
      if(!src){
        // try to parse inline background-image
        const bg = el.style.backgroundImage || getComputedStyle(el).backgroundImage || '';
        const match = bg.match(/url\((?:"|')?(.*?)(?:"|')?\)/);
        src = match ? match[1] : null;
      }
      if(!src) return;
      const img = new Image();
      img.onload = ()=>{
        // success — ensure hero uses the loaded URL as first image
        el.style.backgroundImage = `url('${src}'), url('${DEFAULT_HERO}')`;
      };
      img.onerror = ()=>{
        // replace with fallback SVG
        el.style.backgroundImage = `url('${DEFAULT_HERO}')`;
        el.style.backgroundColor = '#6C5CE7';
      };
      img.src = src;
    });
  }

  // Attach fallbacks initially
  attachImageFallbacks();

  // Animated hero background shapes using Motion One (if available)
  function initHeroShapes(){
    const shapes = document.querySelectorAll('.bg-animated-shapes .bg-shape');
    if(!shapes || !shapes.length) return;
    if(window.MotionOne){
      shapes.forEach((s,i)=>{
        const dir = i % 2 === 0 ? 1 : -1;
        try{
          window.MotionOne.animate(s, {
            transform: [ 'translate3d(0,0,0)', `translate3d(${dir*28}px,-26px,0)`, 'translate3d(0,0,0)']
          }, { duration: MOTION_DUR.hero + i*900, easing: 'ease-in-out', delay: i*200, iterations: Infinity });
        }catch(e){ /* ignore */ }
      });
    }
  }
  initHeroShapes();

  // handle homepage search form: redirect to events with query
  const homeSearchForm = document.getElementById('homeSearchForm');
  homeSearchForm?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const v = document.getElementById('homeSearch')?.value || '';
    const q = new URLSearchParams({q:v});
    location.href = `events.html?${q.toString()}`;
  });

  // sync category select to re-render with filter
  const categorySelect = document.getElementById('categorySelect');
  categorySelect?.addEventListener('change', ()=>{
    const cat = categorySelect.value;
    const q = new URLSearchParams(location.search);
    if(cat) q.set('cat', cat); else q.delete('cat');
    history.replaceState(null,'', 'events.html?'+q.toString());
    renderEventsList();
  });
});
