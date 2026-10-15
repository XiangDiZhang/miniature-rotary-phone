# Ruleta Pokémon: cómo alojarlo para compartirlo

## Situación actual

- El juego está publicado como artefacto de Claude: https://claude.ai/artifact/MacFEHqtKUaGtgxq5kyU81 (versión 168, compartido como «cualquiera con el enlace»).
- **Problema:** desde el enlace público (ventana de incógnito, otros dispositivos, compañeros) sale **«Couldn't load this artifact»**. La cuenta de Claude es personal (no de empresa), así que no es un bloqueo de organización.
- Primero se publicó como proyecto de 52 archivos. Después se volvió a publicar como **un solo archivo HTML** con todo dentro, y el enlace público sigue sin cargar. Así que el fallo parece estar en cómo claude.ai sirve el enlace público, no en el juego.
- **Netlify Drop** se probó y dio **«Not Found»**. Lo más probable es que se arrastrara el archivo suelto en lugar de la carpeta con `index.html`.

## Archivos listos para publicar

Se generan con `.\herramientas\empaquetar.ps1` desde la carpeta del proyecto:

| Archivo | Para qué |
|---|---|
| `dist\ruleta-pokemon.html` | el juego entero en un solo archivo (5,6 MB): CSS, JavaScript, sprites e imágenes dentro |
| `dist\web\index.html` | la misma copia con el nombre que necesitan los alojamientos web |
| `dist\ruleta-pokemon-web.zip` | la carpeta `web` comprimida (3,5 MB) |

El juego es una página estática: no necesita servidor, base de datos ni compilación. Funciona incluso abriendo el archivo con doble clic.

## Opción recomendada: GitHub Pages (gratis y permanente)

Todo desde el navegador, sin instalar nada:

1. Crear una cuenta gratuita en **github.com** (si no hay).
2. Arriba a la derecha: **+ → New repository**. Nombre, por ejemplo, `ruleta-pokemon`, marcado como **Public** → **Create repository**.
3. En el repositorio: **uploading an existing file** → arrastrar **`dist\web\index.html`** (tiene que llamarse `index.html`) → **Commit changes**.
4. **Settings → Pages**. En *Branch*: **main** y **/ (root)** → **Save**.
5. Tras uno o dos minutos, recargar esa página: aparece la dirección **`https://TU-USUARIO.github.io/ruleta-pokemon/`**. La abre cualquiera, en cualquier dispositivo y sin cuenta.

**Actualizar:** ejecutar el empaquetador y volver a subir el `index.html` nuevo al mismo repositorio (sustituye al anterior).

## Otras opciones

- **Cloudflare Pages** (pages.cloudflare.com): gratis y permanente. Con cuenta: *Create → Pages → Upload assets* y arrastrar la carpeta `dist\web`.
- **Netlify Drop** (app.netlify.com/drop): arrastrar la **carpeta `dist\web` entera** o el **ZIP**, nunca el archivo suelto. Sin cuenta, la web se borra al cabo de una hora: hay que reclamarla («Claim») con una cuenta gratuita.
- **Sin alojamiento:** mandar `dist\ruleta-pokemon.html` por Drive, WeTransfer o correo. Se abre con doble clic, también sin internet.

## Pendiente

- Confirmar si el enlace de claude.ai llega a cargar en público (revisar el menú *Compartir* del artefacto en claude.ai).
- Si se usa GitHub Pages, ese pasa a ser el enlace para compartir con los compañeros.
