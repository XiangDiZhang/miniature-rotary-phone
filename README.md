# Ruleta Pokémon

Juego de aventura Pokémon en el que todo lo decide una ruleta, con Pokédex completa de las nueve generaciones (1025 especies, formas, megaevoluciones y Pokédex regionales).

- **Pokédex**: filtros por generación, tipo y categoría, buscador, numeración nacional o regional y ficha de cada Pokémon.
- **Jugar**: elige región (o deja que decida la ruleta) y recorre el camino hasta la Liga: capturas, entrenadores, villanos, gimnasios, Alto Mando y Campeón. Hay 9 regiones jugables.
- **Opciones**: sonido, tema claro u oscuro, animaciones, velocidad del texto, locutor y repetir las cinemáticas.

## Cómo abrirlo

Abre `index.html` en el navegador (doble clic). No hace falta servidor ni instalar nada. Las fuentes se cargan de Google Fonts; sin internet se usan las del sistema.

Los sprites (normales y shiny de las 1025 especies y sus formas) y las medallas **vienen incluidos** en `assets/sprites/`. Se cargan solos al abrir el juego.

## Estructura

```
index.html              página: cabecera, escenas (menú, Pokédex, opciones, jugar, aventura) y carga de CSS y JS
assets/img/             fondos del Hall de la Fama y de la derrota
assets/sprites/         sprites incluidos (normales.js, shiny.js, medallas.js), generados: no editar a mano
css/                    estilos por área (el orden de carga importa: cada archivo puede afinar los anteriores)
  base.css                tokens de color y tema claro, maquetación, cabecera, botones y animaciones comunes
  menu.css                tarjetas del menú, ruleta de generaciones, generación elegida e historial
  pokedex.css             filtros, cuadros de la Pokédex, desplazamiento y barra lateral
  ficha.css               ficha de cada Pokémon
  aventura.css            escena de la aventura, línea de fases, equipo, mochila, líder y versión móvil
  caja-pc.css             Caja PC
  cinematicas.css         destellos shiny, evolución, Hall de la Fama y derrota
  opciones.css            opciones y carga de sprites
  interaccion.css         efectos al pasar el ratón y al pulsar (va el último)
js/
  datos/                  solo datos: tipos, especies, descripciones, habilidades, formas, regiones, sucesos y reglas
  nucleo/                 utilidades, ajustes guardados, sonido y texto progresivo
  ui/                     escenas, menú de generaciones e iconos de tipo
  ruletas/                motor de giro, ruleta de generaciones y ruleta genérica de la aventura
  pokedex/                Pokédex conseguida, lista y filtros, desplazamiento con inercia y ficha
  aventura/               partida, combates, interfaz, Caja PC, equipo, animaciones, cinemáticas, capturas, sucesos y flujo
  recursos/sprites.js     carga de los sprites y medallas incluidos y botón shiny de la Pokédex
  opciones.js             botones de Opciones
  main.js                 teclado global y arranque
pruebas/                capturas y partidas automáticas con Chrome sin ventana
herramientas/           empaquetar.ps1: copia de un solo archivo para publicar (dist/)
                        generar-sprites.ps1 y medir-sprite.js: vuelven a crear assets/sprites/ desde una carpeta de sprites de PokeAPI
```

### Cómo encaja el JavaScript

Son scripts normales (no módulos) que se cargan con `defer` en el orden de `index.html` y comparten el ámbito global. La regla es: **al cargarse, un archivo solo usa lo que han definido los anteriores**. Lo que se usa más tarde (al pulsar, al girar…) puede estar en cualquier archivo. Así el juego funciona abriendo el archivo directamente, sin servidor (los módulos ES no funcionan con `file://`).

Si añades un archivo, ponlo en `index.html` después de todo lo que necesite al cargarse.

### Datos guardados en el navegador

| Dónde | Clave | Qué guarda |
|---|---|---|
| localStorage | `ruleta-run-<región>` | partida en curso de cada región |
| localStorage | `ruleta-best`, `ruleta-hist`, `ruleta-hof` | récords, historial y último equipo campeón |
| localStorage | `ruleta-dex` | Pokédex conseguida (y shiny conseguidos) |
| localStorage | `ruleta-theme`, `ruleta-motion`, `ruleta-tspeed`, `ruleta-tts`, `ruleta-mode`, `ruleta-shiny`, `ruleta-num` | ajustes |

Todo pasa por `store` (`js/nucleo/utilidades.js`), que no falla si el navegador no deja guardar.

### Añadir contenido

- **Región nueva**: añádela a `GENS` y a `REGIONS` en `js/datos/regiones.js` (camino, gimnasios, Alto Mando y Campeón). Si tiene villano propio, añádelo a `VILLAINS`.
- **Sitio especial de un camino**: añádelo a `EVENTS` en `js/datos/eventos.js` con `SP(...)`; el tipo de suceso (`wild`, `legend`, `gift`, `catch`, `villain`, `mix`…) lo resuelve `runSpot` en `js/aventura/sucesos.js`, sin código nuevo. Luego ponlo en el `local` del tramo del camino.
- **Reglas** (puntos, probabilidades de captura y de evolución, ruletas de aventura): `js/datos/reglas.js`.

## Sprites incluidos

Ya están generados. Solo hay que rehacerlos si cambias los sprites o añades especies o formas: descarga los sprites de PokeAPI (https://github.com/PokeAPI/sprites, carpeta `sprites`) y ejecuta `.\herramientas\generar-sprites.ps1 -Origen "ruta\a\sprites"`. Toma solo lo que usa el juego, reduce las medallas, mide cada sprite en Chrome con `herramientas/medir-sprite.js` y escribe los tres archivos de `assets/sprites/`, con las imágenes dentro para que funcionen igual abriendo `index.html` que publicados.

## Pruebas

Necesitan Windows PowerShell y Chrome o Edge. Desde esta carpeta:

```powershell
.\pruebas\ejecutar.ps1 -Salida pruebas\resultados\antes        # antes de un cambio
.\pruebas\ejecutar.ps1 -Salida pruebas\resultados\despues -Referencia pruebas\resultados\antes
```

Hacen 29 capturas (escritorio, móvil y tema claro, con las animaciones apagadas) y juegan 260 pasos en cada una de las 9 regiones, con el azar fijado. Avisan de cualquier error de JavaScript y comparan paso a paso y píxel a píxel con la referencia. Unas decenas de píxeles distintos suelen ser ruido del navegador: si aparecen, repite la prueba.

## Publicar como artefacto de Claude

Se publica una copia de **un solo archivo** con todo dentro (CSS, JavaScript, sprites e imágenes), que es lo que mejor carga desde el enlace público:

```powershell
.\herramientas\empaquetar.ps1      # crea dist\ruleta-pokemon.html (unos 5,6 MB)
```

El proyecto se sigue editando en `index.html`, `css/` y `js/`; vuelve a empaquetar antes de cada publicación. El mismo archivo sirve para mandarlo por correo o subirlo a cualquier alojamiento web (Netlify, GitHub Pages…).

## Pendiente

- En `js/aventura/flujo.js` (`phaseStarter`) el inicial sale siempre shiny: está marcado como **PRUEBA** («luego volverá a ser el 1 %»).
