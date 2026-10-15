<#
  Compara dos ejecuciones de pruebas\ejecutar.ps1: trazas de las partidas (paso a paso) y píxeles de cada captura.
  Unas pocas decenas de píxeles distintos suelen ser ruido del navegador (repite la prueba para confirmarlo).
  Uso: .\pruebas\comparar.ps1 -A pruebas\resultados\antes -B pruebas\resultados\despues
#>
param([Parameter(Mandatory)] [string] $A, [Parameter(Mandatory)] [string] $B)
Add-Type -AssemblyName System.Drawing
if (-not ('PixDiff' -as [type])) {
  Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
public static class PixDiff {
  public static long Count(string a, string b) {
    using (var x = new Bitmap(a)) using (var y = new Bitmap(b)) {
      if (x.Width != y.Width || x.Height != y.Height) return -1;
      var r = new Rectangle(0, 0, x.Width, x.Height);
      var dx = x.LockBits(r, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb); var dy = y.LockBits(r, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
      int n = dx.Stride * x.Height; var bx = new byte[n]; var by = new byte[n];
      Marshal.Copy(dx.Scan0, bx, 0, n); Marshal.Copy(dy.Scan0, by, 0, n); x.UnlockBits(dx); y.UnlockBits(dy);
      long c = 0; for (int i = 0; i < n; i += 4) if (bx[i] != by[i] || bx[i + 1] != by[i + 1] || bx[i + 2] != by[i + 2]) c++;
      return c;
    }
  }
}
'@
}
$distintos = 0
Get-ChildItem $A -Filter 'partida-*.json' | ForEach-Object {
  $fb = Join-Path $B $_.Name; if (-not (Test-Path $fb)) { return }
  $ta = (Get-Content $_.FullName -Raw -Encoding utf8 | ConvertFrom-Json).trace; $tb = (Get-Content $fb -Raw -Encoding utf8 | ConvertFrom-Json).trace
  $i = 0; while ($i -lt [Math]::Max($ta.Count, $tb.Count) -and $ta[$i] -eq $tb[$i]) { $i++ }
  if ($i -lt [Math]::Max($ta.Count, $tb.Count)) { $distintos++; Write-Host "PARTIDA  $($_.BaseName): cambia en el paso $i`n   antes:   $($ta[$i])`n   después: $($tb[$i])" -ForegroundColor Yellow }
  else { Write-Host "igual    $($_.BaseName) ($($ta.Count) pasos)" }
}
Get-ChildItem $A -Filter *.png | ForEach-Object {
  $fb = Join-Path $B $_.Name; if (-not (Test-Path $fb)) { return }
  $c = [PixDiff]::Count($_.FullName, $fb)
  if ($c -eq 0) { Write-Host "igual    $($_.BaseName)" } else { $distintos++; Write-Host "CAPTURA  $($_.BaseName): $c píxeles distintos" -ForegroundColor Yellow }
}
exit [int]($distintos -gt 0)
