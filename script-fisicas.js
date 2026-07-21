// ============================================================
// script-fisicas.js — Objetos interactivos con físicas
// ============================================================
(function() {
    'use strict';

    // Solo activar si el dispositivo no tiene preferencia de movimiento reducido
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // --- Configuración básica ---
    const { Engine, Render, Runner, Bodies, Body, World, Events, Mouse, MouseConstraint } = Matter;

    // Obtener el canvas
    const canvas = document.getElementById('physics-canvas');
    if (!canvas) return;

    // Ajustar tamaño al viewport
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    // --- Crear motor y mundo ---
    const engine = Engine.create({ gravity: { x: 0, y: 1.2 } });
    const world = engine.world;

    // --- Renderizador ---
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

    // --- Función para cargar imágenes y convertirlas a texturas ---
    function createBodyWithTexture(imgSrc, x, y, w, h, isStatic = false) {
        const img = new Image();
        img.src = imgSrc;
        return new Promise((resolve) => {
            img.onload = function() {
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
                // Si no carga, crear un rectángulo de respaldo
                const body = Bodies.rectangle(x, y, 60, 60, {
                    isStatic: isStatic,
                    restitution: 0.5,
                    friction: 0.1,
                    density: 0.002,
                    render: { fillStyle: '#B08D57' }
                });
                resolve(body);
            };
        });
    }

    // --- Crear los objetos ---
    async function createObjects() {
        const objects = [];

        // Lista de imágenes (AJUSTA LAS RUTAS SEGÚN TUS ARCHIVOS)
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

        // Bordes invisibles
        const borderOptions = { isStatic: true, restitution: 0.6, friction: 0.1 };
        const borders = [
            Bodies.rectangle(width/2, -20, width, 40, borderOptions),
            Bodies.rectangle(width/2, height+20, width, 40, borderOptions),
            Bodies.rectangle(-20, height/2, 40, height, borderOptions),
            Bodies.rectangle(width+20, height/2, 40, height, borderOptions),
        ];
        World.add(world, borders);

        window.physicsObjects = objects;
    }

    // --- Configurar arrastre con el mouse ---
    function setupMouseInteraction() {
        const mouse = Mouse.create(canvas);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.1,
                damping: 0.1,
                render: { visible: false }
            },
            collisionFilter: { mask: 0x0001 }
        });

        mouseConstraint.collisionFilter.mask = 0x0001;

        const originalOnMouseDown = mouseConstraint.mouseDown;
        mouseConstraint.mouseDown = function(event) {
            const mousePosition = mouse.position;
            const bodies = Matter.Composite.allBodies(engine.world);
            let clickedBody = null;
            for (const body of bodies) {
                if (body.isStatic) continue;
                if (Matter.Bounds.contains(body.bounds, mousePosition)) {
                    clickedBody = body;
                    break;
                }
            }
            if (clickedBody) {
                mouseConstraint.body = clickedBody;
                mouseConstraint.constraint.bodyB = clickedBody;
                mouseConstraint.constraint.pointA = { x: mousePosition.x, y: mousePosition.y };
                mouseConstraint.constraint.pointB = { x: 0, y: 0 };
                mouseConstraint.constraint.length = 0;
                mouseConstraint.constraint.stiffness = 0.1;
                mouseConstraint.constraint.damping = 0.1;
            } else {
                mouseConstraint.body = null;
                mouseConstraint.constraint.bodyB = null;
            }
        };

        Events.on(engine, 'beforeUpdate', function() {
            if (mouseConstraint.body) {
                const mousePos = mouse.position;
                mouseConstraint.constraint.pointA = { x: mousePos.x, y: mousePos.y };
            }
        });

        World.add(world, mouseConstraint);
        window.mouseConstraint = mouseConstraint;
    }

    // --- Iniciar ---
    createObjects().then(() => {
        setupMouseInteraction();
        Render.run(render);
        const runner = Runner.create();
        Runner.run(runner, engine);
    });

    // --- Redimensionar ---
    window.addEventListener('resize', function() {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        canvas.width = newWidth;
        canvas.height = newHeight;
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';
        render.bounds.max.x = newWidth;
        render.bounds.max.y = newHeight;
    });

})();
