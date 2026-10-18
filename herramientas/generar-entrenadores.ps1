<#
  Genera assets/sprites/entrenadores.js con los sprites de entrenadores (estilo Pokémon Showdown, 80 × 80 px)
  de assets\sprites\originales\entrenadores, con las imágenes dentro (data URL), igual que los demás paquetes de sprites.

  Los usa el juego para: tu sprite de entrenador (se elige en Opciones), la imagen del historial y los líderes,
  el Alto Mando y los Campeones (tabla LEADER_SPR de js/datos/entrenadores.js).
  Uso (desde la carpeta del proyecto):
    .\herramientas\generar-entrenadores.ps1
  Para añadir sprites, copia los .png a assets\sprites\originales\entrenadores y vuelve a ejecutarlo.
#>
param(
  [string] $Origen = (Join-Path $PSScriptRoot '..\assets\sprites\originales\entrenadores'),
  [string] $Destino = (Join-Path $PSScriptRoot '..\assets\sprites\entrenadores.js')
)
$ErrorActionPreference = 'Stop'
$utf8 = New-Object Text.UTF8Encoding($false)
$archivos = Get-ChildItem -LiteralPath (Resolve-Path $Origen).Path -Filter *.png | Sort-Object Name
$sb = New-Object Text.StringBuilder
[void]$sb.Append("// Sprites incluidos con el juego · entrenadores (estilo Pokémon Showdown)`n// Generado por herramientas/generar-entrenadores.ps1: no editar a mano.`n")
[void]$sb.Append("// nombre del archivo (sin .png) -> imagen`nconst TRAINER_SPR = {`n")
foreach ($f in $archivos) {
  $k = [IO.Path]::GetFileNameWithoutExtension($f.Name)
  [void]$sb.Append("`"$k`":`"data:image/png;base64,$([Convert]::ToBase64String([IO.File]::ReadAllBytes($f.FullName)))`",`n")
}
[void]$sb.Append("};`n")
[IO.File]::WriteAllText((Join-Path (Resolve-Path (Split-Path $Destino)).Path (Split-Path $Destino -Leaf)), $sb.ToString(), $utf8)
Write-Host "Entrenadores: $($archivos.Count) sprites -> $Destino"
