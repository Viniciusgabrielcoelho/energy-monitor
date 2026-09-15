$ErrorActionPreference = 'SilentlyContinue'

if ($PSVersionTable.PSVersion.Major -le 5) {
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
}
$OutputEncoding = [System.Text.Encoding]::UTF8

function ReadBytes([System.IO.MemoryMappedFiles.MemoryMappedViewAccessor]$acc, [int]$off, [int]$len) {
  $b = New-Object byte[] $len
  $acc.ReadArray($off, $b, 0, $len) | Out-Null
  return ,$b
}

function ReadU32([System.IO.MemoryMappedFiles.MemoryMappedViewAccessor]$acc, [int]$off) {
  $b = ReadBytes $acc $off 4
  return [BitConverter]::ToUInt32($b, 0)
}

function ReadI64([System.IO.MemoryMappedFiles.MemoryMappedViewAccessor]$acc, [int]$off) {
  $b = ReadBytes $acc $off 8
  return [BitConverter]::ToInt64($b, 0)
}

function ReadDouble([System.IO.MemoryMappedFiles.MemoryMappedViewAccessor]$acc, [int]$off) {
  $b = ReadBytes $acc $off 8
  return [BitConverter]::ToDouble($b, 0)
}

function DecodeString([byte[]]$b) {
  $s = [System.Text.Encoding]::UTF8.GetString($b)
  $i = $s.IndexOf("`0")
  if ($i -ge 0) { $s = $s.Substring(0, $i) }
  if (-not $s.Contains([string][char]0xFFFD)) { return $s }
  $s = [System.Text.Encoding]::GetEncoding(1252).GetString($b)
  $i = $s.IndexOf("`0")
  if ($i -ge 0) { $s = $s.Substring(0, $i) }
  return $s
}

function ReadCString([System.IO.MemoryMappedFiles.MemoryMappedViewAccessor]$acc, [int]$off, [int]$len) {
  $b = ReadBytes $acc $off $len
  return DecodeString $b
}

$map = $null
$acc = $null
try {
  foreach ($name in @('Global\HWiNFO_SENS_SM2', 'Local\HWiNFO_SENS_SM2')) {
    try {
      $map = [System.IO.MemoryMappedFiles.MemoryMappedFile]::OpenExisting($name, [System.IO.MemoryMappedFiles.MemoryMappedFileRights]::Read)
      break
    } catch {}
  }
  if (-not $map) { Write-Output '{}'; exit 0 }

  $acc = $map.CreateViewAccessor(0, $map.Size, [System.IO.MemoryMappedFiles.MemoryMappedFileAccess]::Read)

  $hdr = ReadBytes $acc 0 44
  $sig = [System.Text.Encoding]::ASCII.GetString($hdr, 0, 4)
  if ($sig -ne 'HWiS') { Write-Output '{}'; exit 0 }

  $version = [BitConverter]::ToUInt32($hdr, 4)
  $revision = [BitConverter]::ToUInt32($hdr, 8)
  $poll = ReadI64 $acc 12
  $offS = [BitConverter]::ToUInt32($hdr, 20)
  $sizeS = [BitConverter]::ToUInt32($hdr, 24)
  $numS = [BitConverter]::ToUInt32($hdr, 28)
  $offR = [BitConverter]::ToUInt32($hdr, 32)
  $sizeR = [BitConverter]::ToUInt32($hdr, 36)
  $numR = [BitConverter]::ToUInt32($hdr, 40)

  $sensors = New-Object System.Collections.ArrayList
  for ($i = 0; $i -lt $numS; $i++) {
    $base = $offS + $i * $sizeS
    $nameUser = ReadCString $acc ($base + 136) 128
    if (-not $nameUser) { $nameUser = ReadCString $acc ($base + 8) 128 }
    [void]$sensors.Add($nameUser)
  }

  $readings = New-Object System.Collections.ArrayList
  for ($i = 0; $i -lt $numR; $i++) {
    $base = $offR + $i * $sizeR
    $t = ReadU32 $acc $base
    $sIdx = ReadU32 $acc ($base + 4)
    $label = ReadCString $acc ($base + 12) 128
    $unit = ReadCString $acc ($base + 268) 16
    $value = ReadDouble $acc ($base + 284)
    $sensorName = ''
    if ($sIdx -lt $sensors.Count) { $sensorName = $sensors[$sIdx] }
    [void]$readings.Add([pscustomobject]@{ t = $t; sensor = $sensorName; label = $label; unit = $unit; value = $value })
  }

  $out = [pscustomobject]@{
    live   = $true
    poll   = $poll
    ver    = "$version.$revision"
    count  = $readings.Count
    readings = $readings
  }
  $out | ConvertTo-Json -Depth 4 -Compress
} catch {
  Write-Output '{}'
} finally {
  if ($acc) { $acc.Dispose() }
  if ($map) { $map.Dispose() }
}