Add-Type -AssemblyName System.IO.Compression.FileSystem

$candidatePaths = @(
    "docs/clientes/carcar/CARCAR_CARGA_PLATAFORMA_FINAL_2026.xlsx",
    "CARCAR_CARGA_PLATAFORMA_FINAL_2026.xlsx",
    (Join-Path $PSScriptRoot "../docs/clientes/carcar/CARCAR_CARGA_PLATAFORMA_FINAL_2026.xlsx")
)
$xlsxPath = $candidatePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $xlsxPath) {
    throw "No se encontró el archivo CARCAR_CARGA_PLATAFORMA_FINAL_2026.xlsx"
}
$zip = [System.IO.Compression.ZipFile]::OpenRead($xlsxPath)

# 1. Read shared strings
$ssEntry = $zip.GetEntry('xl/sharedStrings.xml')
$sharedStrings = @()
if ($ssEntry) {
    $stream = $ssEntry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xml = [xml]$reader.ReadToEnd()
    $stream.Close()
    $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
    $ns.AddNamespace("s", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
    foreach ($si in $xml.SelectNodes("//s:si", $ns)) {
        $sharedStrings += (($si.SelectNodes(".//s:t", $ns) | ForEach-Object { $_.InnerText }) -join "")
    }
}

function Get-CellValue($cell, $ns) {
    $t = $cell.GetAttribute("t")
    $vNode = $cell.SelectSingleNode(".//s:v", $ns)
    $val = if ($vNode) { $vNode.InnerText } else { "" }
    if ($t -eq "s" -and $val -ne "") {
        $idx = [int]$val
        if ($idx -lt $sharedStrings.Count) {
            return $sharedStrings[$idx]
        }
    }
    return $val
}

function Parse-SheetRows($entryPath) {
    $entry = $zip.GetEntry($entryPath)
    if (-not $entry) { return @() }
    $stream = $entry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xml = [xml]$reader.ReadToEnd()
    $stream.Close()
    $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
    $ns.AddNamespace("s", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
    
    $rows = $xml.SelectNodes("//s:row", $ns)
    $result = @()
    foreach ($r in $rows) {
        $rowMap = @{}
        foreach ($c in $r.SelectNodes(".//s:c", $ns)) {
            $colRef = ($c.r -replace '\d+', '')
            $rowMap[$colRef] = (Get-CellValue $c $ns)
        }
        $result += ,$rowMap
    }
    return $result
}

# Sheet 1: Rentas largo plazo
$sheet1Rows = Parse-SheetRows 'xl/worksheets/sheet1.xml'
$longTermUnits = @()
# Header is at row index 0 (row 1 in excel)
for ($i = 1; $i -lt $sheet1Rows.Count; $i++) {
    $r = $sheet1Rows[$i]
    $prop = if ($r.ContainsKey('A')) { $r['A'].Trim() } else { '' }
    $unit = if ($r.ContainsKey('B')) { $r['B'].Trim() } else { '' }
    $price = if ($r.ContainsKey('C')) { $r['C'].Trim() } else { '' }
    $currency = if ($r.ContainsKey('D')) { $r['D'].Trim() } else { 'MXN' }
    if ($prop -ne '' -and $unit -ne '') {
        $numPrice = 0
        if ($price -ne '') {
            $numPrice = [double]$price
        }
        $longTermUnits += [PSCustomObject]@{
            building = $prop
            code = $unit
            monthlyRent = $numPrice
            currency = if ($currency -ne '') { $currency } else { 'MXN' }
            type = "LONG_TERM"
        }
    }
}

# Sheet 2: Renta vacacional
$sheet2Rows = Parse-SheetRows 'xl/worksheets/sheet2.xml'
$vacationUnits = @()
for ($i = 1; $i -lt $sheet2Rows.Count; $i++) {
    $r = $sheet2Rows[$i]
    $prop = if ($r.ContainsKey('A')) { $r['A'].Trim() } else { '' }
    $unit = if ($r.ContainsKey('B')) { $r['B'].Trim() } else { '' }
    $nightly = if ($r.ContainsKey('C')) { [double]$r['C'].Trim() } else { 0 }
    $weekly = if ($r.ContainsKey('D')) { [double]$r['D'].Trim() } else { 0 }
    $monthly = if ($r.ContainsKey('E')) { [double]$r['E'].Trim() } else { 0 }
    $currency = if ($r.ContainsKey('F')) { $r['F'].Trim() } else { 'USD' }
    if ($prop -ne '' -and $unit -ne '') {
        $vacationUnits += [PSCustomObject]@{
            building = $prop
            code = $unit
            nightlyPrice = $nightly
            weeklyPrice = $weekly
            monthlyRent = $monthly
            currency = if ($currency -ne '') { $currency } else { 'USD' }
            type = "VACATION"
        }
    }
}

$zip.Dispose()

$payload = [PSCustomObject]@{
    organization = @{
        name = "CARCAR"
        brandName = "CARCAR"
        primaryColor = "#0F766E"
        fontFamily = "Inter"
    }
    summary = @{
        longTermCount = $longTermUnits.Count
        vacationCount = $vacationUnits.Count
        totalUnits = ($longTermUnits.Count + $vacationUnits.Count)
    }
    longTermUnits = $longTermUnits
    vacationUnits = $vacationUnits
}

$json = $payload | ConvertTo-Json -Depth 5
$json | Out-File -FilePath "scripts/carcar-inventory.json" -Encoding utf8

Write-Output "Extracted $($longTermUnits.Count) long-term units and $($vacationUnits.Count) vacation units. Total: $($longTermUnits.Count + $vacationUnits.Count)"
