// ============================================================
// script-fisicas.js — Objetos interactivos con físicas
// (Con arrastre mejorado y colisiones con cards)
// ============================================================
(function() {
    'use strict';

    console.log('✅ script-fisicas.js cargado correctamente');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        console.log('⏭️ prefers-reduced-motion activado, se omite la física');
        return;
    }

    if (typeof Matter === 'undefined') {
        console.error('❌ Matter.js no está cargado.');
        return;
    }

    console.log('✅ Matter.js cargado correctamente');

    const { Engine, Render, Runner, Bodies, Body, World, Events, Mouse, MouseConstraint, Composite, Bounds } = Matter;

    const canvas = document.getElementById('physics-canvas');
    if (!canvas) {
        console.error('❌ No se encontró el canvas #physics-canvas');
        return;
    }
    console.log('✅ Canvas encontrado');

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    console.log(`📐 Canvas redimensionado a ${width}x${height}`);

    const engine = Engine.create({ gravity: { x: 0, y: 1.2 } });
    const world = engine.world;

    const render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: width,
            height: height,
            wireframes: false,
            background: 'transparent',
            showAngleIndicator: false,
            showVelocity: false,
            showCollisions: false,
            showAxes: false,
        }
    });
    console.log('✅ Renderizador creado');

    // ============================================================
    // FUNCIÓN PARA CREAR OBJETOS CON IMAGEN O COLOR DE RESPALDO
    // ============================================================
    function createBodyWithTexture(imgSrc, x, y, w, h, isStatic = false) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = imgSrc;
            let loaded = false;

            img.onload = function() {
                loaded = true;
                console.log(`🖼️ Imagen cargada: ${imgSrc}`);
                const aspect = img.width / img.height;
                let bodyWidth = 60;
                let bodyHeight = bodyWidth / aspect;
                if (bodyHeight > 100) { bodyHeight = 100; bodyWidth = bodyHeight * aspect; }

                const body = Bodies.rectangle(x, y, bodyWidth, bodyHeight, {
                    isStatic: isStatic,
                    restitution: 0.5,
                    friction: 0.1,
                    density: 0.002,
                    render: {
                        sprite: {
                            texture: imgSrc,
                            xScale: bodyWidth / img.width,
                            yScale: bodyHeight / img.height,
                        }
                    }
                });
                resolve(body);
            };

            img.onerror = function() {
                console.warn(`⚠️ No se pudo cargar: ${imgSrc} - Usando color de respaldo`);
                const body = Bodies.rectangle(x, y, 60, 60, {
                    isStatic: isStatic,
                    restitution: 0.5,
                    friction: 0.1,
                    density: 0.002,
                    render: {
                        fillStyle: '#B08D57',
                        strokeStyle: '#D4B482',
                        lineWidth: 2
                    }
                });
                resolve(body);
            };

            setTimeout(() => {
                if (!loaded) {
                    console.warn(`⏰ Timeout: ${imgSrc} - Usando color de respaldo`);
                    const body = Bodies.rectangle(x, y, 60, 60, {
                        isStatic: isStatic,
                        restitution: 0.5,
                        friction: 0.1,
                        density: 0.002,
                        render: {
                            fillStyle: '#B08D57',
                            strokeStyle: '#D4B482',
                            lineWidth: 2
                        }
                    });
                    resolve(body);
                }
            }, 3000);
        });
    }

    // ============================================================
    // CREAR OBJETOS QUE CAEN (con imágenes o colores)
    // ============================================================
    async function createObjects() {
        console.log('🔄 Creando objetos...');
        const objects = [];

        const images = [
            { src: 'assets/objetos/blender.png', label: 'Blender' },
            { src: 'assets/objetos/steve.png', label: 'Steve' },
            { src: 'assets/objetos/creeper.png', label: 'Creeper' },
            { src: 'assets/objetos/minecraft-logo.png', label: 'Minecraft' },
        ];

        const startX = width * 0.1;
        const endX = width * 0.9;
        const startY = -50;

        for (let i = 0; i < images.length; i++) {
            const x = startX + Math.random() * (endX - startX);
            const y = startY - Math.random() * 200 - 50;
            const body = await createBodyWithTexture(images[i].src, x, y, 60, 60);
            body.label = images[i].label;
            objects.push(body);
        }

        World.add(world, objects);
        console.log(`✅ ${objects.length} objetos añadidos al mundo`);
        window.physicsObjects = objects;
    }

    // ============================================================
    // CREAR BORDES DE PANTALLA
    // ============================================================
    function createBorders() {
        const borderOptions = { isStatic: true, restitution: 0.6, friction: 0.1 };
        const borders = [
            Bodies.rectangle(width/2, -20, width, 40, borderOptions),
            Bodies.rectangle(width/2, height+20, width, 40, borderOptions),
            Bodies.rectangle(-20, height/2, 40, height, borderOptions),
            Bodies.rectangle(width+20, height/2, 40, height, borderOptions),
        ];
        World.add(world, borders);
        console.log('✅ Bordes de pantalla añadidos');
    }

    // ============================================================
    // CREAR COLISIONES CON CARDS (cuerpos estáticos invisibles)
    // ============================================================
    let cardBodies = [];

    function updateCardCollisions() {
        // Eliminar cuerpos antiguos
        if (cardBodies.length > 0) {
            World.remove(world, cardBodies);
            cardBodies = [];
        }

        const cards = document.querySelectorAll('.card');
        if (cards.length === 0) return;

        const newBodies = [];
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            // Crear un cuerpo estático que coincida con la posición y tamaño de la card
            const body = Bodies.rectangle(
                rect.left + rect.width/2,
                rect.top + rect.height/2,
                rect.width * 0.9,  // Un poco más pequeño para que los objetos no queden atascados
                rect.height * 0.9,
                {
                    isStatic: true,
                    restitution: 0.4,
                    friction: 0.3,
                    label: 'cardCollision',
                    render: { visible: false } // Invisible
                }
            );
            newBodies.push(body);
        });

        if (newBodies.length > 0) {
            World.add(world, newBodies);
            cardBodies = newBodies;
            console.log(`✅ ${newBodies.length} cuerpos de colisión para cards añadidos`);
        }
    }

    // ============================================================
    // ARRASTRE MEJORADO CON FILTRO DE EVENTOS
    // ============================================================
    function setupMouseInteraction() {
        console.log('🖱️ Configurando arrastre...');

        const mouse = Mouse.create(canvas);

        // Configurar mouse constraint
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.1,
                damping: 0.1,
                render: { visible: false }
            }
        });

        // Guardar referencia para el arrastre
        let isDragging = false;

        // Sobrescribir el evento mousedown para filtrar clics en elementos interactivos
        const originalMouseDown = mouseConstraint.mouseDown;
        mouseConstraint.mouseDown = function(event) {
            // Verificar si el clic fue sobre un botón, enlace o elemento interactivo
            const target = event.target;
            if (target.closest('button') || target.closest('a') || target.closest('.card')) {
                console.log('🖱️ Clic en elemento interactivo, ignorando arrastre');
                return;
            }

            // Si no, proceder con el arrastre normal
            originalMouseDown.call(this, event);
        };

        // Cuando se suelta el mouse, liberar el cuerpo
        mouseConstraint.mouseUp = function(event) {
            if (mouseConstraint.body) {
                console.log('🖱️ Soltando objeto');
                mouseConstraint.body = null;
                mouseConstraint.constraint.bodyB = null;
            }
        };

        World.add(world, mouseConstraint);
        window.mouseConstraint = mouseConstraint;
        console.log('✅ Arrastre configurado');
    }

    // ============================================================
    // INICIALIZAR
    // ============================================================
    async function init() {
        await createObjects();
        createBorders();
        updateCardCollisions();
        setupMouseInteraction();

        Render.run(render);
        const runner = Runner.create();
        Runner.run(runner, engine);
        console.log('🚀 Física en ejecución');

        // Actualizar colisiones con cards cuando cambie el scroll o tamaño
        window.addEventListener('scroll', updateCardCollisions);
        window.addEventListener('resize', () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            canvas.width = newWidth;
            canvas.height = newHeight;
            canvas.style.width = newWidth + 'px';
            canvas.style.height = newHeight + 'px';
            render.bounds.max.x = newWidth;
            render.bounds.max.y = newHeight;
            // Recrear bordes
            World.remove(world, world.bodies.filter(b => b.isStatic && b.label !== 'cardCollision'));
            createBorders();
            updateCardCollisions();
            console.log(`📐 Canvas redimensionado a ${newWidth}x${newHeight}`);
        });

        // También actualizar cuando haya cambios en el DOM (ej. modal abierto)
        const observer = new MutationObserver(() => {
            updateCardCollisions();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    init().catch(error => {
        console.error('❌ Error al iniciar:', error);
    });

})();
