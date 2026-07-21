// ============================================================
// script-fisicas.js — Objetos interactivos con físicas (versión mínima)
// ============================================================
(function() {
    'use strict';

    console.log('✅ script-fisicas.js cargado');

    // Verificar si Matter.js está disponible
    if (typeof Matter === 'undefined') {
        console.error('❌ Matter.js no cargado. Asegúrate de incluir <script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"></script>');
        return;
    }

    const { Engine, Render, Runner, Bodies, World, Events, Mouse, MouseConstraint } = Matter;

    // Obtener el canvas
    const canvas = document.getElementById('physics-canvas');
    if (!canvas) {
        console.error('❌ Canvas #physics-canvas no encontrado');
        return;
    }
    console.log('✅ Canvas encontrado');

    // Dimensiones
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    console.log(`📐 Canvas: ${width}x${height}`);

    // --- Motor y mundo ---
    const engine = Engine.create({
        gravity: { x: 0, y: 1.2 }
    });
    const world = engine.world;

    // --- Renderizador (con fondo visible para depuración) ---
    const render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: width,
            height: height,
            wireframes: false,
            background: 'transparent', // fondo transparente
            showAngleIndicator: false,
            showVelocity: false,
            showCollisions: false,
            showAxes: false,
        }
    });

    // --- Crear objetos (rectángulos con colores) ---
    const colors = ['#B08D57', '#D4B482', '#8C6E42', '#E07B5A'];
    const objects = [];
    const startX = width * 0.15;
    const endX = width * 0.85;
    const startY = -80;

    for (let i = 0; i < 6; i++) {
        const x = startX + Math.random() * (endX - startX);
        const y = startY - Math.random() * 300 - 50;
        const size = 40 + Math.random() * 30;
        const body = Bodies.rectangle(x, y, size, size, {
            restitution: 0.4 + Math.random() * 0.3,
            friction: 0.1,
            density: 0.002,
            render: {
                fillStyle: colors[i % colors.length],
                strokeStyle: '#ECE7DA',
                lineWidth: 2
            }
        });
        body.label = 'objeto-' + i;
        objects.push(body);
    }

    // Agregar objetos al mundo
    World.add(world, objects);
    console.log(`✅ ${objects.length} objetos añadidos`);

    // Bordes (paredes invisibles)
    const borderOptions = { isStatic: true, restitution: 0.6, friction: 0.1 };
    const borders = [
        Bodies.rectangle(width/2, -20, width, 40, borderOptions),
        Bodies.rectangle(width/2, height+20, width, 40, borderOptions),
        Bodies.rectangle(-20, height/2, 40, height, borderOptions),
        Bodies.rectangle(width+20, height/2, 40, height, borderOptions),
    ];
    World.add(world, borders);
    console.log('✅ Bordes añadidos');

    // --- Arrastre con el mouse ---
    const mouse = Mouse.create(canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.1,
            damping: 0.1,
            render: { visible: false }
        }
    });
    World.add(world, mouseConstraint);
    console.log('✅ Arrastre configurado');

    // --- Ejecutar ---
    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);
    console.log('🚀 Física en ejecución');

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
        // Nota: los bordes no se reubican en este ejemplo mínimo
    });

})();
