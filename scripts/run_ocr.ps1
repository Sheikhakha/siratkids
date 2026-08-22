# Runs Windows.Media.Ocr (ar-SA default) over PNG images and writes UTF-8 text.
# Output: for each input.png -> <out-dir>\<name>.txt (Y-sorted lines) + <name>.lines.json (bbox fidelity)
# Usage: powershell -NoProfile -File scripts\run_ocr.ps1 -Images a.png,b.png -OutDir path [-Lang ar-SA]
param(
    [Parameter(Mandatory=$true)][string]$Images,
    [Parameter(Mandatory=$true)][string]$OutDir,
    [string]$Lang = 'ar-SA'
)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
}
[Windows.Storage.StorageFile,Windows.Foundation.Metadata,ContentType=WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder,Windows.Foundation.Metadata,ContentType=WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine,Windows.Foundation.Metadata,ContentType=WindowsRuntime] | Out-Null

$langObj = [Windows.Globalization.Language,Windows.Globalization,ContentType=WindowsRuntime]::new($Lang)
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($langObj)
if (-not $engine) { Write-Error "OCR engine unavailable for $Lang"; exit 2 }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$paths = $Images -split '\|'

foreach ($p in $paths) {
    try {
        $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($p)) ([Windows.Storage.StorageFile])
        $stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
        $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
        $bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
        $result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])

        $base = [System.IO.Path]::GetFileNameWithoutExtension($p)
        $lines = @()
        foreach ($line in $result.Lines) {
            $words = @()
            foreach ($w in $line.Words) {
                $r = $w.BoundingRect
                $words += @{ t = $w.Text; x = [math]::Round($r.X); y = [math]::Round($r.Y);
                             w = [math]::Round($r.Width); h = [math]::Round($r.Height) }
            }
            if ($words.Count -gt 0) {
                $minY = ($words | ForEach-Object { $_.y } | Measure-Object -Minimum).Minimum
                $maxY = ($words | ForEach-Object { $_.y } | Measure-Object -Maximum).Maximum
                $minX = ($words | ForEach-Object { $_.x } | Measure-Object -Minimum).Minimum
                $text = (($words | Sort-Object { $_.x }) | ForEach-Object { $_.t }) -join ' '
                $lines += @{ y = $minY; y2 = $maxY; x = $minX; text = $text }
            }
        }
        $sorted = $lines | Sort-Object { $_.y }
        $plain = ($sorted | ForEach-Object { $_.text }) -join "`n"

        [System.IO.File]::WriteAllText((Join-Path $OutDir ($base + '.txt')), $plain,
            (New-Object System.Text.UTF8Encoding($false)))
        $payload = @{ image = (Split-Path $p -Leaf); lines = $lines } |
            ConvertTo-Json -Depth 4
        [System.IO.File]::WriteAllText((Join-Path $OutDir ($base + '.lines.json')), $payload,
            (New-Object System.Text.UTF8Encoding($false)))
        Write-Output ("OK " + (Split-Path $p -Leaf) + " lines=" + $lines.Count)
    } catch {
        Write-Output ("ERR " + (Split-Path $p -Leaf) + " : " + $_.Exception.Message)
    }
}
