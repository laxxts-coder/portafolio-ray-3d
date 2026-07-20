(function () {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // ============================================================
    // 0. FONDO DINÁMICO — voxels ambientales a la deriva
    // ============================================================
    const bgCanvas = document.getElementById('bg-canvas');
    if (bgCanvas && !prefersReducedMotion) {
        const ctx = bgCanvas.getContext('2d');
        let width = 0;
        let height = 0;
        let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        let voxels = [];
        let parallaxX = 0;
        let parallaxY = 0;
        let targetParallaxX = 0;
        let targetParallaxY = 0;
        let rafId = null;
        let running = true;

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
                speed: 6 + Math.random() * 14, // px por segundo, hacia arriba
                drift: (Math.random() - 0.5) * 8,
                rot: Math.random() * Math.PI,
                rotSpeed: (Math.random() - 0.5) * 0.25,
                depth: 0.3 + Math.random() * 0.7, // afecta parallax
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

        // Dibuja un cuadrado achaflanado (mismo lenguaje visual que las cards/tags de la UI)
        function drawChamfer(x, y, size, rot, fill, edge) {
            const c = size * 0.22;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);
            ctx.beginPath();
            ctx.moveTo(-size / 2, -size / 2 + c);
            ctx.lineTo(-size / 2 + c, -size / 2);
            ctx.lineTo(size / 2, -size / 2);
            ctx.lineTo(size / 2, size / 2);
            ctx.lineTo(-size / 2, size / 2);
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

            // Suavizar el parallax hacia el objetivo (respuesta tipo resorte simple)
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
        // Reduced motion: ocultar el canvas, ya cubierto por CSS, pero por si acaso.
        bgCanvas.style.display = 'none';
    }

    // ============================================================
    // 0b. NAV — fondo con blur al hacer scroll + enlace activo
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
    // 0c. HERO — glow que sigue el cursor + tilt 3D del avatar
    // ============================================================
    const heroSection = document.querySelector('.hero');
    const heroGlow = document.querySelector('.hero-glow');
    const avatarSvg = document.querySelector('.hero-avatar-svg');

    if (heroSection && canHover && !prefersReducedMotion) {
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * 100;
            const relY = ((e.clientY - rect.top) / rect.height) * 100;

            if (heroGlow) {
                heroGlow.style.setProperty('--gx', relX + '%');
                heroGlow.style.setProperty('--gy', relY + '%');
            }
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
    // 1. LOADBAR (generando chunk)
    // ============================================================
    const loadbar = document.querySelector('.loadbar');
    if (loadbar) {
        // Forzamos un pequeño delay para que la barra se vea
        setTimeout(() => {
            loadbar.classList.add('done');
        }, 800);

        // Ocultar completamente después de la transición
        loadbar.addEventListener('transitionend', () => {
            if (loadbar.classList.contains('done')) {
                loadbar.style.display = 'none';
            }
        });
    }

    // ============================================================
    // 2. SCROLL REVEAL (con stagger)
    // ============================================================
    const revealEls = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // Aplicar índice para stagger (si está en grid)
                    const parentGrid = entry.target.closest('.grid');
                    if (parentGrid) {
                        const cards = parentGrid.querySelectorAll('.card');
                        const index = Array.from(cards).indexOf(entry.target);
                        if (index !== -1) {
                            entry.target.style.setProperty('--index', index);
                        }
                    }
                    entry.target.classList.add('visible');
                    // Una vez visible, dejar de observar
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.12,
            rootMargin: '0px 0px -20px 0px',
        }
    );

    revealEls.forEach((el) => revealObserver.observe(el));

    // ============================================================
    // 3. SPOTLIGHT – case study dinámico
    // ============================================================
    const spotlight = document.getElementById('spotlight');
    if (spotlight) {
        const spotlightTitle = spotlight.querySelector('.spotlight-title');
        const spotlightDesc = spotlight.querySelector('.spotlight-desc');
        const spotlightTags = spotlight.querySelector('.spotlight-tags');
        const clayImg = spotlight.querySelector('.clay');
        const finalImg = spotlight.querySelector('.final');
        const verMasBtn = spotlight.querySelector('.btn');

        // Data de proyectos (simulada, reemplazar con datos reales)
        const projectsData = {
            forest: {
                title: 'Forest',
                desc: 'Render realista de un bosque oscuro con iluminación dramática. Modelado en Blockbench, texturizado y renderizado en Blender Cycles.',
                tags: ['Blender', 'Blockbench', 'Cycles'],
                clay: 'linear-gradient(135deg, #2e2e2e, #1a1a1a)',
                final: 'linear-gradient(135deg, #3d2a1a, #221510)',
                link: '#',
            },
            pool: {
                title: 'Pool',
                desc: 'Piscina con iluminación volumétrica y reflejos realistas. Trabajo de iluminación en Blender con texturas personalizadas.',
                tags: ['Blender', 'Volumetric', 'Reflections'],
                clay: 'linear-gradient(135deg, #1e2a3a, #0f1a22)',
                final: 'linear-gradient(135deg, #1e3a4a, #0f222b)',
                link: '#',
            },
            hide: {
                title: 'Hide and Seek',
                desc: 'Escena de persecución en Blockbench con personajes low-poly y narrativa visual. Animación básica incluida.',
                tags: ['Blockbench', 'Low-poly', 'Animation'],
                clay: 'linear-gradient(135deg, #3a2a1a, #1f150e)',
                final: 'linear-gradient(135deg, #3d2a1a, #221510)',
                link: '#',
            },
            circle: {
                title: 'El Circulo BerSty',
                desc: 'Ciclo animado con estilo gráfico inspirado en Minecraft. Combina modelado Blockbench y postproducción en Photoshop.',
                tags: ['Animation', 'Blockbench', 'Photoshop'],
                clay: 'linear-gradient(135deg, #2a1e3a, #171022)',
                final: 'linear-gradient(135deg, #2a1e3a, #171022)',
                link: '#',
            },
        };

        // Función para actualizar el spotlight con fade
        function updateSpotlight(projectKey) {
            const data = projectsData[projectKey];
            if (!data) return;

            // Aplicar fade a los textos
            spotlightTitle.style.opacity = '0';
            spotlightDesc.style.opacity = '0';
            clayImg.classList.add('switching');
            finalImg.classList.add('switching');

            setTimeout(() => {
                spotlightTitle.textContent = data.title;
                spotlightDesc.textContent = data.desc;
                // Tags
                spotlightTags.innerHTML = data.tags.map(t => `<li>${t}</li>`).join('');
                // Imágenes
                clayImg.style.backgroundImage = data.clay;
                finalImg.style.backgroundImage = data.final;
                // Enlace
                verMasBtn.href = data.link;

                // Restaurar opacidad
                spotlightTitle.style.opacity = '1';
                spotlightDesc.style.opacity = '1';
                clayImg.classList.remove('switching');
                finalImg.classList.remove('switching');
            }, 150);
        }

        // Escuchar clics en las cards del portafolio
        const portfolioCards = document.querySelectorAll('.portfolio-card');
        portfolioCards.forEach((card) => {
            const project = card.dataset.project;
            if (project) {
                // Click con mouse o teclado (Enter/Space)
                card.addEventListener('click', () => {
                    updateSpotlight(project);
                });
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        updateSpotlight(project);
                    }
                });
            }
        });

        // Inicializar con el primer proyecto (Forest)
        if (portfolioCards.length > 0) {
            const firstProject = portfolioCards[0].dataset.project;
            if (firstProject) updateSpotlight(firstProject);
        }
    }

    // ============================================================
    // 4. MENÚ MÓVIL
    // ============================================================
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            menuToggle.setAttribute('aria-expanded', isOpen);
        });

        // Cerrar al hacer clic en un enlace
        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // ============================================================
    // 5. FORMULARIO DE CONTACTO (simulación)
    // ============================================================
    const form = document.getElementById('contactForm');
    if (form) {
        const feedback = form.querySelector('.form-feedback');

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Validación básica
            const name = form.querySelector('#name').value.trim();
            const type = form.querySelector('#commissionType').value;
            const message = form.querySelector('#message').value.trim();

            if (!name || !type || !message) {
                feedback.textContent = '⚠️ Por favor, completa todos los campos obligatorios.';
                feedback.style.color = '#E07B5A';
                return;
            }

            // Simular envío
            feedback.textContent = '✉️ ¡Mensaje enviado! Te responderé pronto.';
            feedback.style.color = 'var(--accent)';
            form.reset();

            // Limpiar feedback después de 5s
            setTimeout(() => {
                feedback.textContent = '';
            }, 5000);
        });
    }

    // ============================================================
    // 6. ACCESIBILIDAD
    // ============================================================
    // El canvas de fondo, el tilt de las cards y el glow del hero
    // se desactivan por completo si prefers-reduced-motion está
    // activo o el dispositivo no tiene hover fino (móvil/táctil).
})();
