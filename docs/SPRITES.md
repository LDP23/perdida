# Sprites del juego

Todos los sprites están en `assets/sprites/`. Ya están procesados:

- fondo transparente;
- recortados al contenido;
- frames alineados;
- exportados **al doble** del tamaño en el mundo.

En el juego se muestran a la mitad con `background-size`, así se ven nítidos cuando el escenario se escala.
**No los vuelvas a procesar ni a redimensionar.**

Convenciones de esta tabla:

- **Tamaño en el mundo**: px del mundo (= px de la imagen de escena, 2172 × 724), o sea la mitad del archivo.
- **Hoja**: los frames van en una fila (o grilla) de celdas iguales; el orden se lee de izquierda a derecha.
- **Repetible**: la imagen se repite sin que se note la unión (`background-repeat`).
- Todo mira a la **derecha** salvo que se indique otra cosa; el lado contrario se logra con `scaleX(-1)`.

## Personajes y objetos

| Archivo | Archivo (px) | Celdas | Celda en el mundo | Frames y anclas |
|---|---|---|---|---|
| `robot.png` | 828 × 732 | 3 × 3 | 138 × 122 | 1 reposo · 2–3 (sin uso) · 4 subiendo · 5 cayendo · 6 ataque · 7 daño · 8 arrodillado · 9 tirado. Pies en el borde inferior; casco centrado. |
| `robot_correr.png` | 828 × 244 | 3 × 1 | 138 × 122 | Ciclo de carrera 1 → 2 → 3. Mismas anclas que `robot.png`. |
| `espantapajaros.png` | 228 × 264 | 1 | 114 × 132 | Base del poste en el borde inferior. Hitbox 100 × 90, 6 px bajo el borde superior. |
| `criatura.png` | 1992 × 620 | 4 × 2 | 249 × 155 | 1 reposo · 2–3 caminar · 4 preparar ataque · 5 zarpazo · 6 daño · 7 desplomándose · 8 muerta. Punto medio entre los pies centrado y apoyado en el borde inferior. |

## Trampas

| Archivo | Archivo (px) | Celdas | Celda en el mundo | Uso y anclas |
|---|---|---|---|---|
| `trampa_chispas.png` | 688 × 122 | 4 × 1 | 86 × 61 | 1 reposo · 2 aviso (arco chico) · 3–4 descarga. Caja centrada y apoyada en el borde inferior (el piso). Los arcos de la descarga ocupan desde 36 px a la izquierda hasta 30 px a la derecha del centro, y hasta **58 px** de alto. |
| `trampa_laser_emisor.png` | 160 × 72 | 2 × 1 | 40 × 36 | 1 apagado · 2 encendido. Cuelga desde arriba (borde superior = techo). El rayo sale del centro horizontal, unos 4 px por encima del borde inferior. |
| `trampa_laser_rayo.png` | 72 × 32 | 2 × 1 | 18 × 16 | Columna 1 aviso (hilo fino) · columna 2 encendido. **Repetible en vertical.** El núcleo del rayo está centrado. |
| `trampa_laser_impacto.png` | 79 × 64 | 1 | 39.5 × 32 | Destello donde el rayo toca una superficie. Centrado en el rayo, apoyado sobre la superficie. |
| `trampa_prensa_soporte.png` | 268 × 62 | 1 | 134 × 31 | Placa del techo. Borde superior = techo; centrada sobre la prensa. |
| `trampa_prensa_piston.png` | 67 × 45 | 1 | 33.5 × 22.5 | Tramo del pistón. **Repetible en vertical**, desde el soporte hasta el bloque. |
| `trampa_prensa_bloque.png` | 808 × 152 | 2 × 1 | 202 × 76 | 1 normal · 2 golpe (con escombros a los lados). Bloque visible de 121 × 67, centrado y apoyado en el borde inferior. |
| `trampa_torreta.png` | 388 × 168 | 2 × 1 | 97 × 84 | 1 activa · 2 destruida. **Mira a la izquierda.** La placa de pared toca el borde derecho de la celda. La boca del cañón queda 95.5 px a la izquierda del borde derecho y 38.8 px sobre el borde inferior. |
| `trampa_tuberia.png` | 144 × 122 | 2 × 1 | 36 × 61 | 1 seca · 2 goteando. Alineada arriba. La boca termina a ~50 px del borde superior (frame 1). |
| `trampa_tuberia_tramo.png` | 72 × 20 | 1 | 36 × 10 | Tramo de tubo. **Repetible en vertical**, desde el techo hasta la boca. |
| `trampa_acido_gota.png` | 21 × 42 | 1 | 10.5 × 21 | La gota mientras cae. |
| `trampa_acido_salpicadura.png` | 83 × 58 | 1 | 41.5 × 29 | Salpicadura centrada, apoyada sobre la superficie. |
| `trampa_riel_izq.png` / `trampa_riel_der.png` | 67 × 35 | 1 | 33.5 × 17.5 | Extremos del riel del láser de barrido. |
| `trampa_riel_tramo.png` | 154 × 35 | 1 | 77 × 17.5 | Tramo del riel. **Repetible en horizontal**, entre los dos extremos. |

## Plataformas

| Archivo | Archivo (px) | En el mundo | Uso |
|---|---|---|---|
| `plataforma_movil.png` | 240 × 35 | 120 × 17.5 | Plataforma móvil, con el propulsor debajo. El borde superior de la imagen coincide con el borde superior de la plataforma. Para otros anchos se usa `border-image` con cortes laterales de 13 px del archivo (6.5 px del mundo): los extremos no se deforman. |
| `plataforma_cae.png` | 240 × 22 | 120 × 11 | Plataforma que cae (solo la placa, sin propulsor). Misma regla de `border-image`. |

## Descompresión

La descompresión no usa sprites: el efecto de corriente de viento se dibuja con gradientes CSS animados.
