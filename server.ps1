# Macro Deck 7 Inch - Pure PowerShell Web Server (Zero Python Required)
$port = 5000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "========================================================" -ForegroundColor Cyan
    Write-Host "  MACRO DECK 7 INCH - POWERSHELL SERVER (ZERO PYTHON)" -ForegroundColor Green
    Write-Host "  Melayani di: http://localhost:$port/" -ForegroundColor Yellow
    Write-Host "========================================================" -ForegroundColor Cyan
} catch {
    Write-Host "Gagal memulai server di port $port. Menjalankan mode offline..." -ForegroundColor Red
    exit
}

$wsh = New-Object -ComObject WScript.Shell
$htmlPath = Join-Path $PSScriptRoot "offline_deck.html"
$htmlContent = [System.IO.File]::ReadAllBytes($htmlPath)

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response

    $path = $req.Url.AbsolutePath

    # Enable CORS
    $res.AddHeader("Access-Control-Allow-Origin", "*")
    $res.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    if ($req.HttpMethod -eq "OPTIONS") {
        $res.StatusCode = 200
        $res.Close()
        continue
    }

    if ($path -eq "/" -or $path -eq "/index.html") {
        $res.ContentType = "text/html; charset=utf-8"
        $res.ContentLength64 = $htmlContent.Length
        $res.OutputStream.Write($htmlContent, 0, $htmlContent.Length)
    }
    elseif ($path -eq "/api/action" -and $req.HttpMethod -eq "POST") {
        $reader = New-Object System.IO.StreamReader($req.InputStream)
        $body = $reader.ReadToEnd() | ConvertFrom-Json

        $msg = "Aksi dieksekusi"
        if ($body.action -eq "volume_up") {
            $wsh.SendKeys([char]175) # Media Volume Up
            $msg = "Volume Dinaikkan"
        }
        elseif ($body.action -eq "volume_down") {
            $wsh.SendKeys([char]174) # Media Volume Down
            $msg = "Volume Diturunkan"
        }
        elseif ($body.type -eq "hotkey") {
            $wsh.SendKeys($body.action)
            $msg = "Hotkey terkirim: " + $body.action
        }

        $resBytes = [System.Text.Encoding]::UTF8.GetBytes("{`"success`":true,`"message`":`"$msg`"}")
        $res.ContentType = "application/json"
        $res.ContentLength64 = $resBytes.Length
        $res.OutputStream.Write($resBytes, 0, $resBytes.Length)
    }
    else {
        $res.StatusCode = 404
    }

    $res.Close()
}
