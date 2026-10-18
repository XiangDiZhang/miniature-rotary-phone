<#
  Genera los sprites incluidos con el juego (assets/sprites/*.js) a partir de una carpeta de sprites de PokeAPI.

  Toma solo lo que usa el juego: una imagen normal y una shiny de cada especie (1-1025) y de cada forma de
  js/datos/formas.js, y las medallas que piden las regiones de js/datos/regiones.js. Las mide en Chrome con
  herramientas/medir-sprite.js y lo guarda todo en tres archivos .js con las
  imágenes dentro, para que funcionen igual abriendo index.html que publicadas como artefacto.

  Las imágenes originales que usa el juego se guardan en assets\sprites\originales (pokemon\, pokemon\shiny\ y badges\).
  Uso (desde la carpeta del proyecto):
    .\herramientas\generar-sprites.ps1                          # vuelve a generar desde assets\sprites\originales
    .\herramientas\generar-sprites.ps1 -Origen "D:\mis sprites"  # toma lo que falte de otra carpeta de PokeAPI y lo copia a originales
  La carpeta de origen tiene que tener pokemon\<nº>.png, pokemon\shiny\<nº>.png y badges\<nº>.png. Las variantes sin número
  (VARIANTS en js/datos/formas.js: Alcremie, Vivillon…) usan su archivo con nombre, p. ej. pokemon\869-ruby-cream-berry-sweet.png.
#>
param(
  [string] $Origen = (Join-Path $PSScriptRoot "..\assets\sprites\originales"),   # carpeta de sprites de PokeAPI (https://github.com/PokeAPI/sprites, carpeta sprites)
  [string] $Destino = (Join-Path $PSScriptRoot '..\assets\sprites'),
  [int] $MedallaMax = 96           # las medallas se ven a 40-54 px: se reducen a este tamaño como mucho (nítidas en pantallas de alta densidad)
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Origen = (Resolve-Path $Origen).Path
$originales = Join-Path $raiz "assets\sprites\originales"
New-Item -ItemType Directory -Force $Destino | Out-Null
$Destino = (Resolve-Path $Destino).Path
$utf8 = New-Object Text.UTF8Encoding($false)

# ---- 1. Qué necesita el juego ----
$formas = [IO.File]::ReadAllText("$raiz\js\datos\formas.js", $utf8)
$regiones = [IO.File]::ReadAllText("$raiz\js\datos\regiones.js", $utf8)
$ids = @(1..1025) + ([regex]::Matches($formas, '\[(\d{5}),"') | ForEach-Object { [int]$_.Groups[1].Value } | Sort-Object -Unique)
$medallas = [regex]::Matches($regiones, 'badgeId: (\d+)') | ForEach-Object { [int]$_.Groups[1].Value } | Sort-Object -Unique
$reglas = [IO.File]::ReadAllText("$raiz\js\datos\reglas.js", $utf8)
# iconos de las megapiedras (MEGA_STONES de reglas.js): nombre del archivo en items\ de PokeAPI (las de Z-A, en items\gen9\)
$piedras = [regex]::Matches($reglas, "\d{5}: \['([a-z0-9/-]+)',") | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
# variantes sin número en PokeAPI (VARIANTS de formas.js): id propio -> nombre de su archivo
$archivo = @{}
foreach ($v in [regex]::Matches($formas, '\[(\d{5}),"[^"]*",\d+,"(\d+-[a-z0-9-]+)"\]')) { $archivo[[int]$v.Groups[1].Value] = $v.Groups[2].Value }
$lista = @()
foreach ($id in $ids) {
  $f = if ($archivo.ContainsKey($id)) { $archivo[$id] } else { $id }
  $lista += , @('normal', $id, "$Origen\pokemon\$f.png", "pokemon\$f.png")
  $lista += , @('shiny', $id, "$Origen\pokemon\shiny\$f.png", "pokemon\shiny\$f.png")
}
foreach ($id in $medallas) { $lista += , @('badge', $id, "$Origen\badges\$id.png", "badges\$id.png") }
foreach ($p in $piedras) { $f = $p.Replace('/', '\'); $lista += , @('item', $p, "$Origen\items\$f.png", "items\$f.png") }
$faltan = $lista | Where-Object { -not (Test-Path $_[2]) }
foreach ($f in $faltan) { Write-Warning "falta $($f[0]) $($f[1]): $($f[2])" }
$lista = $lista | Where-Object { Test-Path $_[2] }
# copia de las imágenes originales dentro del proyecto (assets\sprites\originales): así no hace falta la carpeta de PokeAPI
if ($Origen -ne (Resolve-Path -LiteralPath $originales -ErrorAction SilentlyContinue).Path) {
  foreach ($e in $lista) { $d = Join-Path $originales $e[3]; New-Item -ItemType Directory -Force (Split-Path $d) | Out-Null; Copy-Item -LiteralPath $e[2] $d -Force }
  Write-Host "Copiadas $($lista.Count) imágenes a $originales"
}
Write-Host "Imágenes: $($lista.Count) ($($ids.Count) especies y formas × normal/shiny + $($medallas.Count) medallas + $($piedras.Count) megapiedras)"

# ---- 2. Imágenes en base64 (las medallas, reducidas) ----
function Get-Png64([string] $ruta, [int] $max) {
  if ($max -le 0) { return [Convert]::ToBase64String([IO.File]::ReadAllBytes($ruta)) }
  $img = [System.Drawing.Image]::FromFile($ruta)
  try {
    $k = [Math]::Min(1.0, $max / [double][Math]::Max($img.Width, $img.Height))
    if ($k -ge 1) { return [Convert]::ToBase64String([IO.File]::ReadAllBytes($ruta)) }
    $w = [Math]::Max(1, [int][Math]::Round($img.Width * $k)); $h = [Math]::Max(1, [int][Math]::Round($img.Height * $k))
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'HighQuality'; $g.PixelOffsetMode = 'HighQuality'; $g.CompositingQuality = 'HighQuality'
    $g.DrawImage($img, 0, 0, $w, $h); $g.Dispose()
    $ms = New-Object IO.MemoryStream; $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
    return [Convert]::ToBase64String($ms.ToArray())
  } finally { $img.Dispose() }
}
$datos = @{}
foreach ($e in $lista) { $datos["$($e[0]):$($e[1])"] = 'data:image/png;base64,' + (Get-Png64 $e[2] $(if ($e[0] -eq 'badge') { $MedallaMax } elseif ($e[0] -eq 'item') { 64 } else { 0 })) }

# ---- 3. Medir en Chrome (suelo, sombra y colores shiny) con herramientas/medir-sprite.js ----
$navegador = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $navegador) { throw 'No encuentro Chrome ni Edge para medir los sprites' }
$tmp = Join-Path $env:TEMP ('ruleta-sprites-' + [guid]::NewGuid()); New-Item -ItemType Directory $tmp | Out-Null
$url = { param($p) 'file:///' + ($p -replace '\\', '/' -replace ' ', '%20') }
$sb = New-Object Text.StringBuilder; [void]$sb.Append('const RAW = [')
foreach ($k in $datos.Keys) { [void]$sb.Append("[`"$k`",`"$($datos[$k])`"],") }
[void]$sb.Append('];'); [IO.File]::WriteAllText("$tmp\raw.js", $sb.ToString(), $utf8)
[IO.File]::WriteAllText("$tmp\medir.html", @"
<!doctype html><meta charset="utf-8"><pre id="out"></pre>
<script src="$(& $url "$PSScriptRoot\medir-sprite.js")"></script><script src="raw.js"></script>
<script>
// las imágenes van dentro de la página, así el evento load espera a que estén todas cargadas
const imgs = RAW.map(([key, u]) => { const im = new Image(); im.src = u; document.body.appendChild(im); return [key, im]; });
addEventListener('load', () => {
  const out = {}, r4 = v => Math.round(v * 1e4) / 1e4;
  for (const [key, im] of imgs) {
    if (key.startsWith('badge:') || key.startsWith('item:')) { out[key] = []; continue; }
    const w = im.naturalWidth, h = im.naturalHeight, m = feetGap(im, w, h);
    out[key] = [Math.max(w, h) <= 160 ? 1 : 0, r4(m.fb), r4(m.fw), r4(m.fx), m.pc ? m.pc[0] : 0, m.pc ? m.pc[1] : 0];
  }
  document.getElementById('out').textContent = JSON.stringify(out);
  document.querySelectorAll('img').forEach(im => im.remove());
});
</script>
"@, $utf8)
$perfil = "$tmp\perfil"
Start-Process -FilePath $navegador -ArgumentList @('--headless=new', '--disable-gpu', '--no-first-run', "`"--user-data-dir=$perfil`"", '--virtual-time-budget=120000', '--dump-dom', "`"$(& $url "$tmp\medir.html")`"") `
  -RedirectStandardOutput "$tmp\out.html" -RedirectStandardError "$tmp\err.txt" -Wait -NoNewWindow
$m = [regex]::Match([IO.File]::ReadAllText("$tmp\out.html", $utf8), '<pre id="out">(.*?)</pre>', 'Singleline')
if (-not $m.Success -or -not $m.Groups[1].Value) { throw "Chrome no ha devuelto las medidas (mira $tmp)" }
$medidas = [Net.WebUtility]::HtmlDecode($m.Groups[1].Value) | ConvertFrom-Json
Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue

# ---- 4. Escribir los paquetes ----
function Write-Paquete([string] $tipo, [string] $archivo, [string] $constante, [string] $explica) {
  $sb = New-Object Text.StringBuilder
  [void]$sb.Append("// Sprites incluidos con el juego · $explica`n// Generado por herramientas/generar-sprites.ps1: no editar a mano.`n")
  if ($tipo -eq 'badge') { [void]$sb.Append("// nº de medalla -> imagen`nconst $constante = {`n") }
  elseif ($tipo -eq 'item') { [void]$sb.Append("// icono (nombre del archivo de items de PokeAPI) -> imagen`nconst $constante = {`n") }
  else { [void]$sb.Append("// id -> [imagen, pixel art (1/0), hueco bajo los pies, ancho, centro (fracciones del cuadro), color principal, color secundario]`nconst $constante = {`n") }
  $n = 0
  foreach ($k in ($datos.Keys | Where-Object { $_.StartsWith("${tipo}:") } | Sort-Object { if ($tipo -eq 'item') { $_ } else { [int]($_.Split(':')[1]) } })) {
    $id = $k.Split(':')[1]; $u = $datos[$k]
    if ($tipo -eq 'badge' -or $tipo -eq 'item') { [void]$sb.Append("`"$id`":`"$u`",`n") }
    else {
      $v = $medidas.$k
      $c1 = if ($v[4]) { "`"$($v[4])`"" } else { '0' }; $c2 = if ($v[5]) { "`"$($v[5])`"" } else { '0' }
      $num = { param($x) ([double]$x).ToString([Globalization.CultureInfo]::InvariantCulture) }
      [void]$sb.Append("`"$id`":[`"$u`",$($v[0]),$(& $num $v[1]),$(& $num $v[2]),$(& $num $v[3]),$c1,$c2],`n")
    }
    $n++
  }
  [void]$sb.Append("};`n")
  [IO.File]::WriteAllText("$Destino\$archivo", $sb.ToString(), $utf8)
  Write-Host ("{0,-14} {1,5} imágenes  {2,10:N0} bytes" -f $archivo, $n, (Get-Item "$Destino\$archivo").Length)
}
Write-Paquete 'normal' 'normales.js' 'SPRITES_NORMAL' 'Pokémon (normales)'
Write-Paquete 'shiny' 'shiny.js' 'SPRITES_SHINY' 'Pokémon (shiny)'
Write-Paquete 'badge' 'medallas.js' 'SPRITES_BADGE' 'medallas de gimnasio'
Write-Paquete 'item' 'objetos.js' 'SPRITES_ITEM' 'iconos de las megapiedras'
