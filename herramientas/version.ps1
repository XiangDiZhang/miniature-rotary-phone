<#
  Pone un número de versión (?v=fecha y hora) en los enlaces de index.html a css\, js\ y assets\.
  Así, al publicar una versión nueva, el navegador descarga los archivos nuevos en vez de usar los que tenía guardados
  (GitHub Pages deja que se guarden unos minutos y a veces se veía la versión anterior).
  Uso (desde la carpeta del proyecto), antes de publicar:  .\herramientas\version.ps1
#>
$ErrorActionPreference = 'Stop'
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$utf8 = New-Object Text.UTF8Encoding($false)
$v = Get-Date -Format 'yyyyMMddHHmm'
$html = [IO.File]::ReadAllText("$raiz\index.html", $utf8)
$html = [regex]::Replace($html, '(href|src)="((?:css|js|assets)/[^"?]+)(\?v=[^"]*)?"', { param($m) "$($m.Groups[1].Value)=`"$($m.Groups[2].Value)?v=$v`"" })
[IO.File]::WriteAllText("$raiz\index.html", $html, $utf8)
"Versión $v puesta en index.html"
