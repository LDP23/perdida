Se alcanzó el límite de uso. Aquí va el reporte de lo completado:

Etapa 9.1 — Reporte parcial

Archivos creados

- css/decorations.css — estilos de decoraciones extraídos de screens.css

Archivos modificados

- js/config.js — medidas de sprites en config: press (blockWidth/blockHeight), sparks (arcLeft/arcRight/arcHeight), turret (spriteWidth/Height, muzzleOffset), laser (emitterWidth/Height/MouthY), acidDrip (dropWidth/Height, splashWidth/Height, pipe*), decompression (debrisCount), platforms (height por tipo, borderSlice)
- js/physics/collision.js — nueva función findSurfaceBelow
- js/traps/trap.js — getter safePointExclusions en clase base
- js/traps/intermittent-laser.js — reescrito: datos {type:'laser', x}, rayo dinámico con updateWithSolids
- js/traps/sweeping-laser.js — reescrito: datos {type:'sweep-laser', x1, x2}, override de safePointExclusions
- js/traps/electric-sparks.js — zona de descarga usa medidas de arcos del sprite
- js/traps/hydraulic-press.js — bloque centrado con blockWidth×blockHeight del sprite
- js/traps/turret.js — zona = sprite 97×84, boca del cañón calculada desde offsets
- js/traps/acid-drip.js — usa dropWidth/dropHeight en vez de dropSize
- js/traps/trap-factory.js — validación de claves por tipo de trampa
- js/traps/decompression.js — sin cambios (ya compatible)
- js/entities/safe-point.js — usa safePointExclusions de trampas en vez de trapZones
- js/entities/platform.js — recibe height del constructor (ya no usa thickness)
- js/entities/moving-platform.js — pasa PLATFORMS.moving.height
- js/entities/falling-platform.js — pasa PLATFORMS.falling.height
- js/scene/scene-world.js — pasa traps (no trapZones) a SafePointTracker
- js/systems/trap-system.js — pasa getAllSolids() a trampas con updateWithSolids
- js/systems/hazard-system.js — caídas y peligros siempre reposicionan; daño solo si canBeHurt
- js/view/trap-view.js — estructura DOM con sprites (soporte/pistón/bloque, emisor/rayo/impacto, riel caps, tubería/gota/splash, corriente/escombros)
- js/view/platform-view.js — sin cambios (CSS maneja border-image)
- css/traps.css — reescrito completo con sprites
- css/platforms.css — reescrito con border-image
- css/screens.css — decoraciones removidas (movidas a decorations.css)
- index.html — enlace a decorations.css
- js/levels/level1.js, level2.js, level3.js — top/bottom removidos de láseres; N3E2 step fix (374→370); N3E1/N3E3 plataformas reducidas a 1 por hueco
- js/core/game.js — sincroniza --press-block-w, --sparks-discharge-time, --decompression-debris-count
- CLAUDE.md — etapa 9.1 ✅, convenciones actualizadas
- docs/BUCLE-DE-JUEGO.md, js/states/playing-state.js — fix docs: H es daño de prueba, no debug

Lo que falta (no completado por límite de uso)

1. Part D parcial: falta crear tools/level-check.js y tools/level-check.html (detector de escalones trampa), y verificar las plataformas de N3 con simulación de física
2. Part E parcial: falta comparar medidas con imágenes de escena en modo debug
3. Documentación: actualizar docs/DATOS-DE-NIVEL.md, ESTADOS.md, ARQUITECTURA.md, FISICA.md con los cambios
4. Pruebas en navegador: no se probó con Live Server — hay que verificar que los sprites se cargan bien, que los láseres terminan en la superficie correcta, que las plataformas con border-image se ven bien a distintos anchos, y que las colisiones siguen funcionando con los nuevos tamaños

Qué probar en el navegador

1. N1E2: prensa hidráulica con sprites (soporte, pistón repetido, bloque con frame de impacto)
2. N1E3: láser intermitente calcula su longitud hasta el piso dinámicamente
3. N2: láseres y goteo de ácido con sprites
4. N3E1: una sola plataforma que cae sobre el hueco, chispas con sprite de 4 frames, sweep-laser con riel de sprites
5. N3E2: torreta con sprite, escalón corregido (ya no atrapa al robot)
6. N3E3: una sola plataforma que cae, sweep-laser acortado
7. Plataformas móviles: border-image se estira correctamente a distintos anchos
8. Caer al vacío durante invulnerabilidad: reposiciona sin daño

✻ Churned for 17m 16s · done 7:24 p.m.