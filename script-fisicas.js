// ============================================================
// script-fisicas.js — Objetos interactivos con físicas
// ============================================================
(function() {
    'use strict';

    console.log('✅ script-fisicas.js cargado');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        console.log('⏭️ prefers-reduced-motion activado, se omite la física');
        return;
    }

    if (typeof Matter === 'undefined') {
        console.error('❌ Matter.js no está cargado');
        return;
    }
    console.log('✅ Matter.js cargado');

    const { Engine, Render, Runner, Bodies, World, Events, Mouse, MouseConstraint } = Matter;

    const canvas = document.getElementById('physics-canvas');
    if (!canvas) {
        console.error('❌ Canvas no encontrado');
        return;
    }
    console.log('✅ Canvas encontrado');

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    console.log(`📐 Canvas: ${width}x${height}`);

    // Agregar un borde rojo temporal para verificar visibilidad
    canvas.style.border = '2px solid red';

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

    // Añadir un rectángulo de prueba directamente al mundo
    const testBody = Bodies.rectangle(width/2, 100, 80, 80, {
        isStatic: false,
        restitution: 0.5,
        render: { fillStyle: '#FF0000' }
    });
    World.add(world, testBody);
    console.log('🔴 Rectángulo de prueba añadido');

    function createBodyWithTexture(imgSrc, x, y) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = imgSrc;
            let loaded = false;
            img.onload = function() {
                loaded = true;
                console.log(`🖼️ Cargada: ${imgSrc}`);
                const aspect = img.width / img.height;
                let bodyWidth = 60;
                let bodyHeight = bodyWidth / aspect;
                if (bodyHeight > 100) { bodyHeight = 100; bodyWidth = bodyHeight * aspect; }
                const body = Bodies.rectangle(x, y, bodyWidth, bodyHeight, {
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
                console.warn(`⚠️ Falló carga: ${imgSrc} - Usando color`);
                const body = Bodies.rectangle(x, y, 60, 60, {
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
                    console.warn(`⏰ Timeout: ${imgSrc} - Usando color`);
                    const body = Bodies.rectangle(x, y, 60, 60, {
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
            }, 2000);
        });
    }

    async function createObjects() {
        const objects = [];
        const images = [
            { src: 'assets/objetos/blender.png', label: 'Blender' },
            { src: 'assets/objetos/steve.png', label: 'Steve' },
            { src: 'assets/objetos/creeper.png', label: 'Creeper' },
            { src: 'assets/objetos/minecraft-logo.png', label: 'Minecraft' },
            // Agregar un objeto extra para asegurar cantidad
        ];

        const startX = width * 0.1;
        const endX = width * 0.9;
        const startY = -50;

        for (let i = 0; i < images.length; i++) {
            const x = startX + Math.random() * (endX - startX);
            const y = startY - Math.random() * 200 - 50;
            const body = await createBodyWithTexture(images[i].src, x, y);
            body.label = images[i].label;
            objects.push(body);
        }

        World.add(world, objects);
        console.log(`✅ ${objects.length} objetos añadidos`);

        const borderOptions = { isStatic: true, restitution: 0.6, friction: 0.1 };
        const borders = [
            Bodies.rectangle(width/2, -20, width, 40, borderOptions),
            Bodies.rectangle(width/2, height+20, width, 40, borderOptions),
            Bodies.rectangle(-20, height/2, 40, height, borderOptions),
            Bodies.rectangle(width+20, height/2, 40, height, borderOptions),
        ];
        World.add(world, borders);
        console.log('✅ Bordes añadidos');

        window.physicsObjects = objects;
    }

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
                console.log(`🖱️ Arrastrando: ${clickedBody.label || 'objeto'}`);
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
        console.log('✅ Arrastre configurado');
    }

    createObjects().then(() => {
        setupMouseInteraction();
        Render.run(render);
        const runner = Runner.create();
        Runner.run(runner, engine);
        console.log('🚀 Física en ejecución');
    }).catch(error => {
        console.error('❌ Error:', error);
    });

    window.addEventListener('resize', function() {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        canvas.width = newWidth;
        canvas.height = newHeight;
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';
        render.bounds.max.x = newWidth;
        render.bounds.max.y = newHeight;
        console.log(`📐 Canvas redimensionado a ${newWidth}x${newHeight}`);
    });

})();
