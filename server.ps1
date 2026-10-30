# Enterprise Bot Local Development Server (HTTP on port 5173)
# Uses System.Net.Sockets.TcpListener - zero external dependencies

$port = 5173
$root = $PSScriptRoot
if (-not $root) { $root = "C:\Users\Pallavi BG\.gemini\antigravity\scratch\enterprise-bot-agent-builder" }

$mimeMap = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".ico"  = "image/x-icon"
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
$listener.Start()

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  ENTERPRISE BOT AI AGENT BUILDER - LOCAL DEV SERVER    " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Server running at: http://localhost:$port/" -ForegroundColor Yellow
Write-Host " Serving root:      $root" -ForegroundColor Gray
Write-Host " Press Ctrl+C in PowerShell to stop the server." -ForegroundColor Gray
Write-Host "========================================================" -ForegroundColor Cyan

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $requestLine = $reader.ReadLine()

        if ($requestLine) {
            $parts = $requestLine.Split(" ")
            if ($parts.Length -ge 2) {
                $method = $parts[0]
                $urlPath = $parts[1].Split("?")[0]
                if ($urlPath -eq "/" -or $urlPath -eq "") {
                    $urlPath = "/index.html"
                }

                $filePath = Join-Path $root ($urlPath.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar))
                
                if (Test-Path $filePath -PathType Leaf) {
                    $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                    $contentType = $mimeMap[$ext]
                    if (-not $contentType) { $contentType = "application/octet-stream" }
                    
                    $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
                    $header = "HTTP/1.1 200 OK`r`n" +
                              "Content-Type: $contentType`r`n" +
                              "Content-Length: $($fileBytes.Length)`r`n" +
                              "Access-Control-Allow-Origin: *`r`n" +
                              "Cache-Control: no-cache`r`n" +
                              "Connection: close`r`n`r`n"
                    
                    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
                    $stream.Write($headerBytes, 0, $headerBytes.Length)
                    $stream.Write($fileBytes, 0, $fileBytes.Length)
                } else {
                    $notFoundBody = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
                    $header = "HTTP/1.1 404 Not Found`r`n" +
                              "Content-Type: text/plain`r`n" +
                              "Content-Length: $($notFoundBody.Length)`r`n" +
                              "Connection: close`r`n`r`n"
                    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
                    $stream.Write($headerBytes, 0, $headerBytes.Length)
                    $stream.Write($notFoundBody, 0, $notFoundBody.Length)
                }
            }
        }
        $stream.Close()
        $client.Close()
    }
} finally {
    $listener.Stop()
    Write-Host "Server stopped." -ForegroundColor Yellow
}
