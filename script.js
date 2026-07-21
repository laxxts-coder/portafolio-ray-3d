(function () {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // ============================================================
    // 0. FONDO DINÁMICO — voxels ambientales
    // ============================================================
    const bgCanvas = document.getElementById('bg-canvas');
    if (bgCanvas && !prefersReducedMotion) {
        const ctx = bgCanvas.getContext('2d');
        let width = 0, height = 0;
        let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        let voxels = [];
        let parallaxX = 0, parallaxY = 0;
        let targetParallaxX = 0, targetParallaxY = 0;
        let rafId = null, running = true;

        const palette = [
            { fill: 'rgba(176, 141, 87, 0.10)', edge: 'rgba(212, 180, 130, 0.16)' },
            { fill: 'rgba(236, 231, 218, 0.05)', edge: 'rgba(236, 231, 218, 0.10)' },
            { fill: 'rgba(140, 110, 66, 0.09)', edge: 'rgba(176, 141, 87, 0.14)' },
        ];

        function countFor(w) {
            if (w < 600) return 14;
            if (w < 1100) return 20;
            return 28;
        }
        function makeVoxel() {
            const size = 10 + Math.random() * 22;
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                size,
                speed: 6 + Math.random() * 14,
                drift: (Math.random() - 0.5) * 8,
                rot: Math.random() * Math.PI,
                rotSpeed: (Math.random() - 0.5) * 0.25,
                depth: 0.3 + Math.random() * 0.7,
                colors: palette[Math.floor(Math.random() * palette.length)],
            };
        }
        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            bgCanvas.width = width * dpr;
            bgCanvas.height = height * dpr;
            bgCanvas.style.width = width + 'px';
            bgCanvas.style.height = height + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const target = countFor(width);
            if (voxels.length < target) {
                while (voxels.length < target) voxels.push(makeVoxel());
            } else {
                voxels.length = target;
            }
        }
        function drawChamfer(x, y, size, rot, fill, edge) {
            const c = size * 0.22;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);
            ctx.beginPath();
            ctx.moveTo(-size/2, -size/2 + c);
            ctx.lineTo(-size/2 + c, -size/2);
            ctx.lineTo(size/2, -size/2);
            ctx.lineTo(size/2, size/2);
            ctx.lineTo(-size/2, size/2);
            ctx.closePath();
            ctx.fillStyle = fill;
            ctx.fill();
            ctx.strokeStyle = edge;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }
        let lastTime = performance.now();
        function tick(now) {
            if (!running) return;
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;
            parallaxX += (targetParallaxX - parallaxX) * 0.04;
            parallaxY += (targetParallaxY - parallaxY) * 0.04;
            ctx.clearRect(0, 0, width, height);
            for (const v of voxels) {
                v.y -= v.speed * dt;
                v.x += v.drift * dt;
                v.rot += v.rotSpeed * dt;
                if (v.y < -v.size * 2) {
                    v.y = height + v.size * 2;
                    v.x = Math.random() * width;
                }
                if (v.x < -v.size * 2) v.x = width + v.size * 2;
                if (v.x > width + v.size * 2) v.x = -v.size * 2;
                const px = v.x + parallaxX * v.depth;
                const py = v.y + parallaxY * v.depth;
                drawChamfer(px, py, v.size, v.rot, v.colors.fill, v.colors.edge);
            }
            rafId = requestAnimationFrame(tick);
        }
        window.addEventListener('resize', resize);
        resize();
        if (canHover) {
            window.addEventListener('mousemove', (e) => {
                targetParallaxX = (e.clientX / width - 0.5) * -18;
                targetParallaxY = (e.clientY / height - 0.5) * -18;
            });
        }
        document.addEventListener('visibilitychange', () => {
            running = !document.hidden;
            if (running) {
                lastTime = performance.now();
                rafId = requestAnimationFrame(tick);
            } else if (rafId) {
                cancelAnimationFrame(rafId);
            }
        });
        rafId = requestAnimationFrame(tick);
    } else if (bgCanvas) {
        bgCanvas.style.display = 'none';
    }

    // ============================================================
    // 0b. NAV — scroll, blur y enlace activo
    // ============================================================
    const navEl = document.querySelector('.nav');
    const sections = document.querySelectorAll('main section[id]');
    const navAnchors = document.querySelectorAll('.nav-links a');

    if (navEl) {
        let ticking = false;
        function onScroll() {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    navEl.classList.toggle('scrolled', window.scrollY > 24);
                    ticking = false;
                });
                ticking = true;
            }
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }
    if (sections.length && navAnchors.length) {
        const navObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        navAnchors.forEach((a) => {
                            a.classList.toggle('active', a.getAttribute('href') === '#' + id);
                        });
                    }
                });
            },
            { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
        );
        sections.forEach((s) => navObserver.observe(s));
    }

    // ============================================================
    // 0c. HERO — tilt 3D del avatar
    // ============================================================
    const heroSection = document.querySelector('.hero');
    const avatarSvg = document.querySelector('.hero-avatar-svg');
    if (heroSection && canHover && !prefersReducedMotion) {
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            if (avatarSvg) {
                const cx = (e.clientX - rect.left) / rect.width - 0.5;
                const cy = (e.clientY - rect.top) / rect.height - 0.5;
                avatarSvg.style.transform = `rotateX(${(-cy * 22).toFixed(2)}deg) rotateY(${(cx * 22).toFixed(2)}deg)`;
            }
        });
        heroSection.addEventListener('mouseleave', () => {
            if (avatarSvg) avatarSvg.style.transform = 'rotateX(0deg) rotateY(0deg)';
        });
    }

    // ============================================================
    // 0c-bis. CURSOR GLOW GLOBAL
    // ============================================================
    if (canHover && !prefersReducedMotion) {
        const cursorGlow = document.createElement('div');
        cursorGlow.className = 'cursor-glow';
        cursorGlow.setAttribute('aria-hidden', 'true');
        document.body.appendChild(cursorGlow);
        let glowRAF = null;
        window.addEventListener('mousemove', (e) => {
            if (glowRAF) return;
            glowRAF = requestAnimationFrame(() => {
                cursorGlow.style.setProperty('--cx', e.clientX + 'px');
                cursorGlow.style.setProperty('--cy', e.clientY + 'px');
                cursorGlow.classList.add('active');
                glowRAF = null;
            });
        });
        document.addEventListener('mouseleave', () => {
            cursorGlow.classList.remove('active');
        });
    }

    // ============================================================
    // 0d. CARDS — tilt 3D + highlight de cursor
    // ============================================================
    if (canHover && !prefersReducedMotion) {
        document.querySelectorAll('.card').forEach((card) => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const relX = (e.clientX - rect.left) / rect.width;
                const relY = (e.clientY - rect.top) / rect.height;
                card.style.setProperty('--mx', relX * 100 + '%');
                card.style.setProperty('--my', relY * 100 + '%');
                card.style.setProperty('--rx', ((relX - 0.5) * 6).toFixed(2) + 'deg');
                card.style.setProperty('--ry', ((0.5 - relY) * 6).toFixed(2) + 'deg');
            });
            card.addEventListener('mouseleave', () => {
                card.style.setProperty('--rx', '0deg');
                card.style.setProperty('--ry', '0deg');
            });
        });
    }

    // ============================================================
    // 1. LOADBAR
    // ============================================================
    const loadbar = document.querySelector('.loadbar');
    if (loadbar) {
        setTimeout(() => loadbar.classList.add('done'), 800);
        loadbar.addEventListener('transitionend', () => {
            if (loadbar.classList.contains('done')) {
                loadbar.style.display = 'none';
            }
        });
    }

    // ============================================================
    // 2. SCROLL REVEAL
    // ============================================================
    const revealEls = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const parentGrid = entry.target.closest('.grid');
                    if (parentGrid) {
                        const cards = parentGrid.querySelectorAll('.card');
                        const index = Array.from(cards).indexOf(entry.target);
                        if (index !== -1) {
                            entry.target.style.setProperty('--index', index);
                        }
                    }
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -20px 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));

    // ============================================================
    // 3. MODAL — vista 16:9 + info cristal
    // ============================================================
    const modal = document.getElementById('projectModal');
    if (modal) {
        const modalPanel = modal.querySelector('.project-modal-panel');
        const modalTitleEl = modal.querySelector('.modal-title');
        const modalDescEl = modal.querySelector('.modal-desc');
        const modalTagsEl = modal.querySelector('.modal-tags');
        const modalFinalView = modal.querySelector('.modal-final-view');
        const compareSliderEl = modal.querySelector('.compare-slider');
        const compareBeforeEl = modal.querySelector('.compare-before');
        const compareAfterEl = modal.querySelector('.compare-after');
        const compareHandle = modal.querySelector('.compare-handle');
        const breakdownBtn = modal.querySelector('.modal-breakdown-btn');
        let lastFocused = null;

        // 👇 Datos de los proyectos (¡Reemplaza los gradientes por tus imágenes!)
        const projectsData = {
            forest: {
                title: 'Forest',
                desc: 'Render realista de un bosque oscuro con iluminación dramática. Modelado en Blockbench, texturizado y renderizado en Blender Cycles.',
                tags: ['Blender', 'Blockbench', 'Cycles'],
                clay: 'url(assets/forest-raw.jpg)', // ← url(assets/proyectos/forest-clay.jpg)
                final: 'url(assets/forest.jpg)', // ← url(assets/proyectos/forest-final.jpg)
            },
            pool: {
                title: 'Pool',
                desc: 'Piscina con iluminación volumétrica y reflejos realistas. Trabajo de iluminación en Blender con texturas personalizadas.',
                tags: ['Blender', 'Volumetric', 'Reflections'],
                clay: 'linear-gradient(135deg, #1e2a3a, #0f1a22)',
                final: 'linear-gradient(135deg, #1e3a4a, #0f222b)',
            },
            hide: {
                title: 'Hide and Seek',
                desc: 'Escena de persecución en Blockbench con personajes low-poly y narrativa visual. Animación básica incluida.',
                tags: ['Blockbench', 'Low-poly', 'Animation'],
                clay: 'linear-gradient(135deg, #3a2a1a, #1f150e)',
                final: 'linear-gradient(135deg, #3d2a1a, #221510)',
            },
            circle: {
                title: 'El Circulo BerSty',
                desc: 'Ciclo animado con estilo gráfico inspirado en Minecraft. Combina modelado Blockbench y postproducción en Photoshop.',
                tags: ['Animation', 'Blockbench', 'Photoshop'],
                clay: 'linear-gradient(135deg, #2a1e3a, #171022)',
                final: 'linear-gradient(135deg, #2a1e3a, #171022)',
            },
        };

        function setSplit(percent) {
            const clamped = Math.max(0, Math.min(100, percent));
            compareSliderEl.style.setProperty('--split', clamped + '%');
            compareHandle.setAttribute('aria-valuenow', String(Math.round(clamped)));
        }

        function onKeydown(e) {
            if (e.key === 'Escape') closeModal();
        }

        function openModal(projectKey) {
            const data = projectsData[projectKey];
            if (!data) return;

            lastFocused = document.activeElement;

            modalTitleEl.textContent = data.title;
            modalDescEl.textContent = data.desc;
            modalTagsEl.innerHTML = data.tags.map((t) => `<li>${t}</li>`).join('');
            modalFinalView.style.backgroundImage = data.final;
            compareBeforeEl.style.backgroundImage = data.clay;
            compareAfterEl.style.backgroundImage = data.final;

            modal.classList.remove('showing-breakdown');
            setSplit(50);
            breakdownBtn.textContent = 'Ver Breakdown';

            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('no-scroll');
            document.addEventListener('keydown', onKeydown);

            requestAnimationFrame(() => modalPanel.focus());
        }

        function closeModal() {
            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('no-scroll');
            document.removeEventListener('keydown', onKeydown);
            if (lastFocused && typeof lastFocused.focus === 'function') {
                lastFocused.focus();
            }
        }

        modal.querySelectorAll('[data-modal-close]').forEach((el) => {
            el.addEventListener('click', closeModal);
        });

        breakdownBtn.addEventListener('click', () => {
            const isShowing = modal.classList.toggle('showing-breakdown');
            breakdownBtn.textContent = isShowing ? 'Ocultar breakdown' : 'Ver Breakdown';
        });

        // --- Slider de comparación ---
        function splitFromClientX(clientX) {
            const rect = compareSliderEl.getBoundingClientRect();
            const percent = ((clientX - rect.left) / rect.width) * 100;
            setSplit(percent);
        }

        let dragging = false;
        compareHandle.addEventListener('pointerdown', (e) => {
            dragging = true;
            compareHandle.setPointerCapture(e.pointerId);
        });
        compareSliderEl.addEventListener('pointerdown', (e) => {
            if (compareHandle.contains(e.target)) return;
            splitFromClientX(e.clientX);
            dragging = true;
        });
        window.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            splitFromClientX(e.clientX);
        });
        window.addEventListener('pointerup', () => { dragging = false; });

        compareHandle.addEventListener('keydown', (e) => {
            const current = parseFloat(compareSliderEl.style.getPropertyValue('--split')) || 50;
            if (e.key === 'ArrowLeft') {
                setSplit(current - 5);
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                setSplit(current + 5);
                e.preventDefault();
            }
        });

        // ============================================================
        // 4. ABRIR MODAL DESDE LAS CARDS Y BOTONES "Ver más"
        // ============================================================
        document.querySelectorAll('.portfolio-card').forEach((card) => {
            const project = card.dataset.project;
            if (project) {
                card.addEventListener('click', (e) => {
                    if (e.target.classList.contains('card-btn')) return;
                    openModal(project);
                });
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openModal(project);
                    }
                });
            }
        });

        document.querySelectorAll('.card-btn').forEach((btn) => {
            const project = btn.dataset.project;
            if (project) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openModal(project);
                });
            }
        });
    }

    // ============================================================
    // 5. MENÚ MÓVIL
    // ============================================================
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            menuToggle.setAttribute('aria-expanded', isOpen);
        });
        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // ============================================================
    // 6. FORMULARIO DE CONTACTO
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
    // 7. ENFOQUE AL INICIO Y BLOQUEO DE SCROLL
    // ============================================================
    if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);

    function enableScrollAndShowCards() {
        document.body.classList.add('scroll-enabled');
        setTimeout(() => {
            document.querySelectorAll('#build .card.reveal').forEach(card => {
                card.classList.add('visible');
            });
            const header = document.querySelector('#build .section-header.reveal');
            if (header) header.classList.add('visible');
        }, 300);
    }

    const verBuildsBtn = document.getElementById('verBuildsBtn');
    if (verBuildsBtn) {
        verBuildsBtn.addEventListener('click', function(e) {
            enableScrollAndShowCards();
        });
    }

    const contactBtn = document.getElementById('contactBtn');
    if (contactBtn) {
        contactBtn.addEventListener('click', function(e) {
            enableScrollAndShowCards();
        });
    }

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            enableScrollAndShowCards();
        });
    });
})();
