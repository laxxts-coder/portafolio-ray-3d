(function() {
    'use strict';

    // ============================================================
    // 1. PARTICULAS (fondo dinámico)
    // ============================================================
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;
    let mouseX = -1000,
        mouseY = -1000;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.reset();
        }
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
            // Interacción con mouse
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
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

    // Crear partículas
    const particleCount = Math.min(120, Math.floor((w * h) / 15000));
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    // Conexiones entre partículas
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
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
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        drawConnections();
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // Mouse tracking para partículas
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    document.addEventListener('mouseleave', () => {
        mouseX = -1000;
        mouseY = -1000;
    });

    // ============================================================
    // 2. CURSOR PERSONALIZADO
    // ============================================================
    const cursor = document.getElementById('customCursor');
    const cursorDot = document.getElementById('customCursorDot');
    let cursorX = 0,
        cursorY = 0;
    let dotX = 0,
        dotY = 0;

    document.addEventListener('mousemove', (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
        dotX = e.clientX;
        dotY = e.clientY;
    });

    // Hover effects en elementos interactivos
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
        setTimeout(() => {
            loadbar.classList.add('done');
        }, 1000);
        loadbar.addEventListener('transitionend', () => {
            if (loadbar.classList.contains('done')) {
                loadbar.style.display = 'none';
            }
        });
    }

    // ============================================================
    // 5. SCROLL REVEAL (con stagger)
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
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));

    // ============================================================
    // 6. SPOTLIGHT
    // ============================================================
    const spotlight = document.getElementById('spotlight');
    if (spotlight) {
        const spotlightTitle = spotlight.querySelector('.spotlight-title');
        const spotlightDesc = spotlight.querySelector('.spotlight-desc');
        const spotlightTags = spotlight.querySelector('.spotlight-tags');
        const clayImg = spotlight.querySelector('.clay');
        const finalImg = spotlight.querySelector('.final');
        const verMasBtn = spotlight.querySelector('.btn');

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

        function updateSpotlight(projectKey) {
            const data = projectsData[projectKey];
            if (!data) return;
            spotlightTitle.style.opacity = '0';
            spotlightDesc.style.opacity = '0';
            setTimeout(() => {
                spotlightTitle.textContent = data.title;
                spotlightDesc.textContent = data.desc;
                spotlightTags.innerHTML = data.tags.map(t => `<li>${t}</li>`).join('');
                clayImg.style.backgroundImage = data.clay;
                finalImg.style.backgroundImage = data.final;
                verMasBtn.href = data.link;
                spotlightTitle.style.opacity = '1';
                spotlightDesc.style.opacity = '1';
            }, 200);
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
            if (firstProject) updateSpotlight(firstProject);
        }
    }

    // ============================================================
    // 7. EFECTO TILT EN CARDS (solo desktop)
    // ============================================================
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.transform =
                    `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-6px) scale(1.01)`;
                // Actualizar posición del brillo
                const px = ((e.clientX - rect.left) / rect.width * 100);
                const py = ((e.clientY - rect.top) / rect.height * 100);
                card.style.setProperty('--mouse-x', px + '%');
                card.style.setProperty('--mouse-y', py + '%');
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    // ============================================================
    // 8. MENÚ MÓVIL
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
    // 9. FORMULARIO
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
    // 10. REDUCED MOTION - ocultar cursor personalizado
    // ============================================================
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
        document.getElementById('customCursor').style.display = 'none';
        document.getElementById('customCursorDot').style.display = 'none';
        document.body.style.cursor = 'auto';
    }

})();
