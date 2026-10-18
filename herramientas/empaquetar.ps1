<#
  Empaqueta el juego en un solo archivo HTML (dist\ruleta-pokemon.html) con todo dentro: CSS, JavaScript, sprites e imágenes.
  Sirve para publicarlo como artefacto de un solo archivo, mandarlo por correo o subirlo a cualquier alojamiento web.
  El proyecto se sigue editando en index.html, css\ y js\; esto solo genera la copia para publicar.

  Uso (desde la carpeta del proyecto):  .\herramientas\empaquetar.ps1
#>
param([string] $Salida = (Join-Path $PSScriptRoot '..\dist\ruleta-pokemon.html'))
$ErrorActionPreference = 'Stop'
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$utf8 = New-Object Text.UTF8Encoding($false)
$html = [IO.File]::ReadAllText("$raiz\index.html", $utf8)
$leer = { param($rel) [IO.File]::ReadAllText((Join-Path $raiz $rel), $utf8) }

# CSS: cada <link> local pasa a <style>; las imágenes que usa (url(../assets/...)) pasan a data URL
$html = [regex]::Replace($html, '<link rel="stylesheet" href="(css/[^"?]+)(?:\?v=[^"]*)?">', {
  param($m)
  $css = & $leer $m.Groups[1].Value
  $css = [regex]::Replace($css, 'url\(\.\./(assets/img/[^)]+\.(webp|jpg|png))\)', { param($u)
    $tipo = @{ webp = 'image/webp'; jpg = 'image/jpeg'; png = 'image/png' }[$u.Groups[2].Value]
    "url(data:$tipo;base64," + [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $raiz $u.Groups[1].Value))) + ')' })
  "<style>/* $($m.Groups[1].Value) */`n$css</style>"
})
# JavaScript: cada <script src> local pasa a script en línea, en el mismo orden (al final del body, ya existe el DOM)
# (los enlaces pueden llevar ?v=…, el número de versión que pone herramientas/version.ps1: aquí no cuenta)
$scripts = New-Object Text.StringBuilder
$html = [regex]::Replace($html, '\s*<script src="((?:js|assets)/[^"?]+)(?:\?v=[^"]*)?" defer></script>', {
  param($m)
  $js = (& $leer $m.Groups[1].Value) -replace '</script', '<\/script'
  [void]$scripts.Append("<script>/* $($m.Groups[1].Value) */`n$js</script>`n")
  ''
})
$html = $html.Replace("  <!-- El orden importa: cada archivo solo usa lo que han definido los anteriores -->`n", '')
$html = $html.Replace('</body>', $scripts.ToString() + '</body>')
if ($html -match '(href|src)="(css|js|assets)/') { throw 'Ha quedado alguna referencia a un archivo local sin incluir' }
New-Item -ItemType Directory -Force (Split-Path $Salida) | Out-Null
[IO.File]::WriteAllText($Salida, $html, $utf8)
"{0}: {1:N0} bytes" -f (Resolve-Path $Salida).Path, (Get-Item $Salida).Length

# versión para alojamientos web (Netlify Drop, GitHub Pages…): carpeta con index.html y la misma carpeta en ZIP
$dist = Split-Path (Resolve-Path $Salida).Path
Remove-Item "$dist\web", "$dist\ruleta-pokemon-web.zip" -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory "$dist\web" | Out-Null
Copy-Item $Salida "$dist\web\index.html"
Compress-Archive -Path "$dist\web\index.html" -DestinationPath "$dist\ruleta-pokemon-web.zip"
"{0}\web\index.html y ruleta-pokemon-web.zip: listos para subir a un alojamiento web" -f $dist
