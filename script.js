(function () {
    'use strict';

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
    // 6. ACCESIBILIDAD: soporte para reduced-motion ya en CSS
    // ============================================================
    // Todo el motion está controlado por CSS y preferencias del sistema.
    // El script no añade animaciones adicionales.
})();