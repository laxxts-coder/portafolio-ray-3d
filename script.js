(function() {
    'use strict';

    // ============================================================
    // 1. PARTICULAS (fondo dinámico)
    // ============================================================
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;
    let mouseX = -1000, mouseY = -1000;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.speedY = (Math.random() - 0.5) * 0.3;
            this.opacity = Math.random() * 0.5 + 0.1;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 150) {
                const force = (150 - dist) / 150 * 0.5;
                this.x += (dx / dist) * force;
                this.y += (dy / dist) * force;
            }
            if (this.x < 0 || this.x > w) this.speedX *= -1;
            if (this.y < 0 || this.y > h) this.speedY *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(176, 141, 87, ${this.opacity})`;
            ctx.fill();
        }
    }

    const particleCount = Math.min(120, Math.floor((w * h) / 15000));
    for (let i = 0; i < particleCount; i++) { particles.push(new Particle()); }

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 150) {
                    const opacity = (1 - dist / 150) * 0.15;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(176, 141, 87, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => { p.update(); p.draw(); });
        drawConnections();
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
    document.addEventListener('mouseleave', () => { mouseX = -1000; mouseY = -1000; });

    // ============================================================
    // 2. CURSOR PERSONALIZADO
    // ============================================================
    const cursor = document.getElementById('customCursor');
    const cursorDot = document.getElementById('customCursorDot');
    let cursorX = 0, cursorY = 0, dotX = 0, dotY = 0;

    document.addEventListener('mousemove', (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
        dotX = e.clientX;
        dotY = e.clientY;
    });

    const hoverElements = document.querySelectorAll('a, .btn, .card, .portfolio-card, .tool, .process-steps li, .nav-links a, .logo');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
            cursorDot.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
            cursorDot.classList.remove('hover');
        });
    });

    function animateCursor() {
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        cursorDot.style.left = dotX + 'px';
        cursorDot.style.top = dotY + 'px';
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // ============================================================
    // 3. SCROLL PROGRESS
    // ============================================================
    const scrollProgress = document.getElementById('scrollProgress');
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        scrollProgress.style.width = progress + '%';
    });

    // ============================================================
    // 4. LOADBAR
    // ============================================================
    const loadbar = document.querySelector('.loadbar');
    if (loadbar) {
        setTimeout(() => { loadbar.classList.add('done'); }, 1000);
        loadbar.addEventListener('transitionend', () => {
            if (loadbar.classList.contains('done')) { loadbar.style.display = 'none'; }
        });
    }

    // ============================================================
    // 5. SCROLL REVEAL
    // ============================================================
    const revealEls = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const parentGrid = entry.target.closest('.grid');
                if (parentGrid) {
                    const cards = parentGrid.querySelectorAll('.card');
                    const index = Array.from(cards).indexOf(entry.target);
                    if (index !== -1) entry.target.style.setProperty('--index', index);
                }
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));

    // ============================================================
    // 6. SPOTLIGHT (actualizado)
    // ============================================================
    const spotlight = document.getElementById('spotlight');
    if (spotlight) {
        const spotlightTitle = spotlight.querySelector('.spotlight-title');
        const spotlightDesc = spotlight.querySelector('.spotlight-desc');
        const spotlightTags = spotlight.querySelector('.spotlight-tags');
        const spotlightMeta = spotlight.querySelector('.spotlight-meta');
        const mainImg = spotlight.querySelector('.spotlight-img-final');
        const verMasBtn = spotlight.querySelector('.btn');

        const projectsData = {
            forest: {
                title: 'Forest',
                desc: 'Render realista de un bosque oscuro con iluminación dramática. Modelado en Blockbench, texturizado y renderizado en Blender Cycles.',
                tags: ['Blender', 'Blockbench', 'Cycles'],
                final: 'linear-gradient(135deg, #3d2a1a, #221510)',
                time: '6h render',
                tools: 'Blender + Blockbench',
                link: 'https://www.behance.net/your-link-forest',
            },
            pool: {
                title: 'Pool',
                desc: 'Piscina con iluminación volumétrica y reflejos realistas. Trabajo de iluminación en Blender con texturas personalizadas.',
                tags: ['Blender', 'Volumetric', 'Reflections'],
                final: 'linear-gradient(135deg, #1e3a4a, #0f222b)',
                time: '8h render',
                tools: 'Blender + Photoshop',
                link: 'https://www.behance.net/your-link-pool',
            },
            hide: {
                title: 'Hide and Seek',
                desc: 'Escena de persecución en Blockbench con personajes low-poly y narrativa visual. Animación básica incluida.',
                tags: ['Blockbench', 'Low-poly', 'Animation'],
                final: 'linear-gradient(135deg, #3d2a1a, #221510)',
                time: '4h modelado',
                tools: 'Blockbench + Blender',
                link: 'https://www.behance.net/your-link-hide',
            },
            circle: {
                title: 'El Circulo BerSty',
                desc: 'Ciclo animado con estilo gráfico inspirado en Minecraft. Combina modelado Blockbench y postproducción en Photoshop.',
                tags: ['Animation', 'Blockbench', 'Photoshop'],
                final: 'linear-gradient(135deg, #2a1e3a, #171022)',
                time: '12h animación',
                tools: 'Blockbench + Photoshop',
                link: 'https://www.behance.net/your-link-circle',
            },
        };

        function updateSpotlight(projectKey) {
            const data = projectsData[projectKey];
            if (!data) return;
            spotlightTitle.style.opacity = '0';
            spotlightDesc.style.opacity = '0';
            mainImg.style.opacity = '0';
            setTimeout(() => {
                spotlightTitle.textContent = data.title;
                spotlightDesc.textContent = data.desc;
                spotlightTags.innerHTML = data.tags.map(t => `<li>${t}</li>`).join('');
                mainImg.style.backgroundImage = data.final;
                spotlightMeta.innerHTML = `
                    <span>⏱️ ${data.time}</span>
                    <span>🛠️ ${data.tools}</span>
                `;
                verMasBtn.href = data.link;
                spotlightTitle.style.opacity = '1';
                spotlightDesc.style.opacity = '1';
                mainImg.style.opacity = '1';
            }, 250);
        }

        const portfolioCards = document.querySelectorAll('.portfolio-card');
        portfolioCards.forEach((card) => {
            const project = card.dataset.project;
            if (project) {
                card.addEventListener('click', () => { updateSpotlight(project); });
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        updateSpotlight(project);
                    }
                });
            }
        });

        if (portfolioCards.length > 0) {
            const firstProject = portfolioCards[0].dataset.project;
            if (firstProject) setTimeout(() => updateSpotlight(firstProject), 300);
        }
    }

    // ============================================================
    // 7. EFECTO TILT EN CARDS
    // ============================================================
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-6px) scale(1.01)`;
                const px = ((e.clientX - rect.left) / rect.width * 100);
                const py = ((e.clientY - rect.top) / rect.height * 100);
                card.style.setProperty('--mouse-x', px + '%');
                card.style.setProperty('--mouse-y', py + '%');
            });
            card.addEventListener('mouseleave', () => { card.style.transform = ''; });
        });
    }

    // ============================================================
    // 8. FILTROS
    // ============================================================
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioCardsFilter = document.querySelectorAll('.portfolio-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            portfolioCardsFilter.forEach((card, index) => {
                const category = card.dataset.category;
                const shouldShow = (filter === 'all' || category === filter);
                if (shouldShow) {
                    card.style.display = 'block';
                    card.classList.remove('visible');
                    card.style.clipPath = 'polygon(0 0, 0 0, 0 100%, 0 100%)';
                    card.style.opacity = '0';
                    const allVisible = document.querySelectorAll('.portfolio-card[style*="display: block"]');
                    const visibleArr = Array.from(allVisible);
                    const idx = visibleArr.indexOf(card);
                    if (idx !== -1) card.style.setProperty('--index', idx);
                    setTimeout(() => {
                        card.classList.add('visible');
                        card.style.clipPath = '';
                        card.style.opacity = '';
                    }, 50);
                } else {
                    card.style.display = 'none';
                    card.classList.remove('visible');
                }
            });
        });
    });

    // ============================================================
    // 9. MODAL - IMAGEN AMPLIADA Y BREAKDOWN
    // ============================================================
    const modal = document.getElementById('imageModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const modalImage = document.getElementById('modalImage');
    const modalRawImage = document.getElementById('modalRawImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalBehanceBtn = document.getElementById('modalBehanceBtn');
    const modalBreakdownBtn = document.getElementById('modalBreakdownBtn');
    const sliderHandle = document.getElementById('modalSliderHandle');
    const rawOverlay = document.getElementById('modalRawOverlay');

    let currentProject = null;
    let isBreakdown = false;

    // Abrir modal al hacer clic en una card
    document.querySelectorAll('.portfolio-card').forEach(card => {
        card.addEventListener('click', () => {
            const image = card.dataset.image;
            const raw = card.dataset.raw;
            const title = card.querySelector('.card-title').textContent;
            const desc = card.querySelector('.card-desc').textContent;
            const behanceLink = card.dataset.behance || '#';
            openModal(image, raw, title, desc, behanceLink);
        });
    });

    function openModal(imageUrl, rawUrl, title, desc, behanceLink) {
        modalImage.src = imageUrl;
        modalRawImage.src = rawUrl || imageUrl; // fallback
        modalTitle.textContent = title;
        modalDesc.textContent = desc;
        modalBehanceBtn.href = behanceLink;
        // Resetear breakdown
        isBreakdown = false;
        modal.classList.remove('breakdown');
        rawOverlay.style.width = '50%';
        sliderHandle.style.left = '50%';
        modalBreakdownBtn.textContent = '🔍 Breakdown';
        // Mostrar modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        currentProject = { imageUrl, rawUrl, title, desc, behanceLink };
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        isBreakdown = false;
        modal.classList.remove('breakdown');
    }

    modalOverlay.addEventListener('click', closeModal);
    modalClose.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // Breakdown toggle
    modalBreakdownBtn.addEventListener('click', () => {
        isBreakdown = !isBreakdown;
        if (isBreakdown) {
            modal.classList.add('breakdown');
            modalBreakdownBtn.textContent = '✕ Cerrar Breakdown';
            // Asegurar que el slider sea visible
            sliderHandle.style.display = 'block';
            rawOverlay.style.width = '50%';
            sliderHandle.style.left = '50%';
        } else {
            modal.classList.remove('breakdown');
            modalBreakdownBtn.textContent = '🔍 Breakdown';
            // Restaurar slider a 50%
            rawOverlay.style.width = '50%';
            sliderHandle.style.left = '50%';
        }
    });

    // Slider de arrastre (solo cuando breakdown está activo)
    let isDragging = false;

    sliderHandle.addEventListener('mousedown', (e) => {
        if (!isBreakdown) return;
        isDragging = true;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !isBreakdown) return;
        const rect = modalImage.getBoundingClientRect();
        let x = (e.clientX - rect.left) / rect.width * 100;
        x = Math.max(5, Math.min(95, x));
        rawOverlay.style.width = x + '%';
        sliderHandle.style.left = x + '%';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Soporte táctil para móviles
    sliderHandle.addEventListener('touchstart', (e) => {
        if (!isBreakdown) return;
        isDragging = true;
        e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging || !isBreakdown) return;
        const touch = e.touches[0];
        const rect = modalImage.getBoundingClientRect();
        let x = (touch.clientX - rect.left) / rect.width * 100;
        x = Math.max(5, Math.min(95, x));
        rawOverlay.style.width = x + '%';
        sliderHandle.style.left = x + '%';
    });

    document.addEventListener('touchend', () => {
        isDragging = false;
    });

    // ============================================================
    // 10. MENÚ MÓVIL
    // ============================================================
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            menuToggle.setAttribute('aria-expanded', isOpen);
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // ============================================================
    // 11. FORMULARIO
    // ============================================================
    const form = document.getElementById('contactForm');
    if (form) {
        const feedback = form.querySelector('.form-feedback');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = form.querySelector('#name').value.trim();
            const type = form.querySelector('#commissionType').value;
            const message = form.querySelector('#message').value.trim();
            if (!name || !type || !message) {
                feedback.textContent = '⚠️ Por favor, completa todos los campos obligatorios.';
                feedback.style.color = '#E07B5A';
                return;
            }
            feedback.textContent = '✉️ ¡Mensaje enviado! Te responderé pronto.';
            feedback.style.color = 'var(--accent)';
            form.reset();
            setTimeout(() => { feedback.textContent = ''; }, 5000);
        });
    }

    // ============================================================
    // 12. REDUCED MOTION
    // ============================================================
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
        document.getElementById('customCursor').style.display = 'none';
        document.getElementById('customCursorDot').style.display = 'none';
        document.body.style.cursor = 'auto';
    }

})();
