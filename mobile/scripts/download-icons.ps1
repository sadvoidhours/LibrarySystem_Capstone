# Download MaterialDesign SVG icons and optionally convert to PNG
# Usage (PowerShell):
# cd mobile
# .\scripts\download-icons.ps1

$icons = @(
  'help-circle-outline',
  'menu',
  'close',
  'arrow-left',
  'chevron-down',
  'radiobox-marked',
  'refresh',
  'book-outline',
  'library-outline',
  'bookshelf',
  'account-outline',
  'account-circle-outline',
  'account-group-outline',
  'account-plus-outline',
  'school-outline',
  'card-account-details-outline',
  'check-circle-outline',
  'check-all',
  'alert-circle-outline',
  'close-circle-outline',
  'clock-outline',
  'timer-sand',
  'undo-variant',
  'barcode-scan',
  'qrcode',
  'magnify',
  'swap-horizontal',
  'cloud-upload-outline',
  'image-outline',
  'camera-outline',
  'chart-bar',
  'cash',
  'calendar-outline',
  'file-document-outline',
  'briefcase-outline',
  'shield-check-outline',
  'bell-outline',
  'bell-off-outline',
  'map-marker-outline',
  'cellphone',
  'white-balance-sunny',
  'moon-waning-crescent',
  'cog-outline',
  'home-outline',
  'speedometer',
  'tray-arrow-down',
  'logout'
)

$base = 'https://unpkg.com/@mdi/svg/svg'
$svgOut = "assets/icons-svg"
$pngOut = "assets/icons"

# create output directories
New-Item -ItemType Directory -Path $svgOut -Force | Out-Null
New-Item -ItemType Directory -Path $pngOut -Force | Out-Null

Write-Host "Downloading $($icons.Count) SVG icons to $svgOut..."

foreach ($icon in $icons) {
  $url = "$base/$icon.svg"
  $outSvg = Join-Path $svgOut ("$icon.svg")
  try {
    Invoke-WebRequest -Uri $url -OutFile $outSvg -UseBasicParsing -ErrorAction Stop
    Write-Host "Downloaded: $icon.svg"
  } catch {
    Write-Warning "Failed to download $url : $_"
  }
}

Write-Host "SVG download complete."

# Optional PNG conversion using ImageMagick (magick) if available
$magick = Get-Command magick -ErrorAction SilentlyContinue
if ($magick) {
  Write-Host "ImageMagick detected; converting SVGs to 48x48 PNGs in $pngOut"
  foreach ($svg in Get-ChildItem -Path $svgOut -Filter *.svg) {
    $name = [System.IO.Path]::GetFileNameWithoutExtension($svg.Name)
    $outPng = Join-Path $pngOut ("$name.png")
    try {
      & magick convert $svg.FullName -background transparent -resize 48x48 $outPng
      Write-Host "Converted: $outPng"
    } catch {
      Write-Warning "Failed to convert $($svg.FullName): $_"
    }
  }
  Write-Host "PNG conversion complete."
} else {
  Write-Host "ImageMagick not found. If you want PNGs, install ImageMagick or use the Node 'sharp' script (see scripts/generate-icon-assets.js comment)."
}

Write-Host "Next: run 'node scripts/generate-icon-assets.js' to create src/iconAssets.js mapping for use in the app."
