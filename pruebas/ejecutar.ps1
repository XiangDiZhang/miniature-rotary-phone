<#
  Pruebas automáticas de Ruleta Pokémon con Chrome (o Edge) sin ventana.

  Hace capturas de las pantallas principales (escritorio, móvil y tema claro) y juega partidas
  automáticas en las 9 regiones con el azar fijado, guardando una traza de cada paso.
  Si le pasas -Referencia, compara el resultado con otra ejecución anterior: lo normal es guardar
  una referencia antes de un cambio y comparar después.

  Ejemplos (desde la carpeta del proyecto):
    .\pruebas\ejecutar.ps1 -Salida pruebas\resultados\antes
    .\pruebas\ejecutar.ps1 -Salida pruebas\resultados\despues -Referencia pruebas\resultados\antes
    .\pruebas\ejecutar.ps1 -SinPartidas          # solo capturas (más rápido)
#>
param(
  [string] $Html = (Join-Path $PSScriptRoot '..\index.html'),
  [string] $Salida = (Join-Path $PSScriptRoot ('resultados\' + (Get-Date -Format 'yyyyMMdd-HHmmss'))),
  [string] $Referencia = '',
  [int] $Pasos = 260,
  [switch] $SinPartidas
)
$ErrorActionPreference = 'Stop'
$navegador = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $navegador) { throw 'No encuentro Chrome ni Edge' }

$escenas = @('home=scene=home', 'menu=scene=menu', 'roulette=scene=roulette', 'roulette-landed=scene=roulette-landed', 'chosen=scene=chosen',
  'dex=scene=dex&dev=1', 'dex-user=scene=dex', 'dex-filter=scene=dex-filter&dev=1', 'dex-search=scene=dex-search&dev=1', 'dex-regional=scene=dex-regional&dev=1', 'dex-scroll=scene=dex-scroll&dev=1',
  'info=scene=info&dev=1', 'info-form=scene=info-form&dev=1', 'info-next=scene=info-next&dev=1', 'options=scene=options',
  'adv=scene=adv&region=kanto&steps=6', 'adv-johto=scene=adv&region=johto&steps=14', 'adv-paldea=scene=adv&region=paldea&steps=20', 'pc=scene=pc', 'hof=scene=hof', 'lose=scene=lose',
  'home-light=scene=home&theme=light', 'dex-light=scene=dex&dev=1&theme=light', 'adv-light=scene=adv&region=hoenn&steps=10&theme=light', 'info-light=scene=info&dev=1&theme=light',
  'home-m=scene=home', 'dex-m=scene=dex&dev=1', 'adv-m=scene=adv&region=kanto&steps=8', 'info-m=scene=info&dev=1', 'pc-m=scene=pc')   # -m = pantalla de móvil
$regiones = if ($SinPartidas) { @() } else { @('kanto', 'johto', 'hoenn', 'sinnoh', 'teselia', 'kalos', 'alola', 'galar', 'paldea') }

# copia del juego con los scripts de prueba: entorno.js antes que el juego, escenarios.js al final
$Html = (Resolve-Path $Html).Path
New-Item -ItemType Directory -Force $Salida | Out-Null
$url = { param($p) 'file:///' + ($p -replace '\\', '/' -replace ' ', '%20') }
$doc = [IO.File]::ReadAllText($Html)
$doc = $doc.Insert($doc.IndexOf('<head>') + 6, "<base href=`"$(& $url (Split-Path $Html))/`"><script src=`"$(& $url "$PSScriptRoot\entorno.js")`"></script>")
$doc = $doc.Insert($doc.LastIndexOf('</body>'), "<script src=`"$(& $url "$PSScriptRoot\escenarios.js")`"></script>")
$banco = Join-Path $env:TEMP ('ruleta-prueba-' + [guid]::NewGuid() + '.html')
[IO.File]::WriteAllText($banco, $doc, (New-Object Text.UTF8Encoding($false)))

function Invoke-Navegador([string[]] $extra, [string] $hash, [int] $tiempo) {
  $perfil = Join-Path $env:TEMP ('ruleta-perfil-' + [guid]::NewGuid())
  $args2 = @('--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
    '"--host-resolver-rules=MAP * ~NOTFOUND"', "`"--user-data-dir=$perfil`"", "--virtual-time-budget=$tiempo") + $extra + @("`"$(& $url $banco)#$hash`"")
  Start-Process -FilePath $navegador -ArgumentList $args2 -RedirectStandardOutput "$perfil.out" -RedirectStandardError "$perfil.err" -Wait -NoNewWindow
  $o = [IO.File]::ReadAllText("$perfil.out", [Text.Encoding]::UTF8)
  Remove-Item -Recurse -Force $perfil, "$perfil.out", "$perfil.err" -ErrorAction SilentlyContinue
  $m = [regex]::Match($o, '<pre id="__report" hidden="">(.*?)</pre>', 'Singleline')
  if ($m.Success) { [Net.WebUtility]::HtmlDecode($m.Groups[1].Value) } else { '{"errors":["SIN INFORME"]}' }
}
foreach ($e in $escenas) {
  $nombre, $hash = $e -split '=', 2
  $tam = if ($nombre -like '*-m') { '390,844' } else { '1280,900' }
  Write-Host "captura  $nombre"
  Invoke-Navegador @("--window-size=$tam", "--screenshot=$Salida\$nombre.png") $hash 15000 | Out-Null
  Invoke-Navegador @("--window-size=$tam", '--dump-dom') $hash 15000 | Set-Content -Encoding utf8 "$Salida\$nombre.json"
}
foreach ($r in $regiones) {
  Write-Host "partida  $r"
  Invoke-Navegador @('--window-size=1280,900', '--dump-dom') "flow=$r&steps=$Pasos" 600000 | Set-Content -Encoding utf8 "$Salida\partida-$r.json"
}
Remove-Item $banco -ErrorAction SilentlyContinue

# ---- Resumen: errores de JavaScript y, si hay referencia, diferencias ----
$fallos = 0
Get-ChildItem $Salida -Filter *.json | ForEach-Object { $j = Get-Content $_.FullName -Raw -Encoding utf8 | ConvertFrom-Json; if ($j.errors.Count) { $fallos++; Write-Host "ERROR    $($_.BaseName): $($j.errors -join ' ; ')" -ForegroundColor Red } }
if ($Referencia) { & (Join-Path $PSScriptRoot 'comparar.ps1') -A $Referencia -B $Salida; if ($LASTEXITCODE) { $fallos++ } }
if ($fallos) { Write-Host "Hay problemas (resultados en $Salida)" -ForegroundColor Red; exit 1 }
Write-Host "Sin errores (resultados en $Salida)" -ForegroundColor Green
