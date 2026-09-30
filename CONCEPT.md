Señal Perdida — Concepto del juego

Premisa
Señal Perdida es un juego de plataformas 2D en pixel art sobre un robot que investiga qué
le pasó a la tripulación de una estación espacial abandonada.
Un robot de mantenimiento se reactiva a oscuras. Nadie responde; solo capta una señal
débil que se repite. Avanza por la estación recuperando bitácoras hasta descubrir la
verdad: la tripulación se convirtió en las criaturas que lo atacan.
Estilo: oscuro y misterioso. Fondos negro y azul profundo, el robot con luz cian y alarmas
en rojo.
Niveles
Son 3 niveles cortos: cada uno suma un peligro nuevo y revela una parte del misterio.
Nombre Número de cuenta
Jafet Antonio Sevilla Ayala 2024210002
Roy David Urtecho 2024210301
Luis David Palomo 2017210043
Nivel Zona Peligros nuevos Lo que cuentan las bitácoras
1 Bahía de carga Pinchos, plataformas
móviles
Vida normal; llega una muestra
extraña
2 Laboratorio Ácido, láseres, primeras
criaturas
Tripulantes enfermos y cambios
raros
Señal Perdida — Concepto del juego
Page 1 of 3
Mecánicas
La batería es el recurso central: une las vidas, el tiempo y el disparo en una sola decisión
constante.
Controles: flechas o WASD para moverse, espacio para saltar, una tecla para disparar.
En celular, botones táctiles en pantalla.
Habilidades: doble salto y disparo láser contra criaturas.
Batería: baja con el tiempo, con cada golpe y con cada disparo. Se recarga con celdas
repartidas por el nivel.
Intentos: 3. Si la batería llega a cero, se reinicia el nivel y se pierde un intento.
Puntuación: bitácoras encontradas (más puntos), criaturas eliminadas (puntos
medios) y bonus por batería restante al llegar a la puerta.
Salida del nivel: llegar a la puerta. Las bitácoras son opcionales y premian la
exploración.
Victoria y derrota
Victoria: cruzar la puerta del nivel 3. Se muestra la revelación final, la puntuación y
cuántas bitácoras se encontraron.
Derrota: perder los 3 intentos. Aparece la pantalla de Game Over con la puntuación y el
botón REINICIAR.
Pantallas y efectos
Inicio: título con efecto de interferencia (glitch), fondo de estrellas y botón INICIAR.
HUD: barra de batería, intentos, puntos, bitácoras encontradas y nivel actual.
Game Over y Victoria: puntuación final y botón REINICIAR.
Efectos: sacudida de pantalla al recibir daño, partículas del láser, luces de alarma que
parpadean y líneas de monitor CRT.
Nivel Zona Peligros nuevos Lo que cuentan las bitácoras
3 Puente de
mando
Plataformas que caen,
más criaturas
La transformación y la última
grabación del capitán
Señal Perdida — Concepto del juego
Page 2 of 3
Enfoque técnico
El juego se construye solo con HTML, CSS y JavaScript, en tres archivos: index.html ,
style.css y game.js .
CSS para todo lo visual: sprites en pixel art, pantallas, HUD y animaciones.
JavaScript solo para la lógica: física, colisiones, puntuación, batería y cambio de
niveles.
Responsive: se adapta a computadora y celular, con controles táctiles en pantalla.
Pendiente: confirmar si se permite <canvas> o si todo debe dibujarse con elementos
HTML y CSS.
