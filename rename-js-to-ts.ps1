# Rename all .js files to .ts in app/src and app/public
# Excludes: .config.js, webpack.config.js, .d.ts files

$srcFiles = Get-ChildItem -Path "app/src" -Filter *.js -Recurse | Where-Object { 
    $_.Name -notmatch '\.config\.js$|webpack\.config\.js$' -and 
    $_.Name -notmatch '\.d\.ts$'
}

$publicFiles = Get-ChildItem -Path "app/public" -Filter *.js -Recurse | Where-Object { 
    $_.Name -notmatch '\.config\.js$|webpack\.config\.js$' -and 
    $_.Name -notmatch '\.d\.ts$'
}

$allFiles = $srcFiles + $publicFiles

Write-Host "Found $($allFiles.Count) .js files to rename"

foreach ($file in $allFiles) {
    $newName = $file.FullName -replace '\.js$', '.ts'
    Write-Host "Renaming: $($file.Name) -> $([System.IO.Path]::GetFileName($newName))"
    Rename-Item -Path $file.FullName -NewName $newName
}

Write-Host "Renamed $($allFiles.Count) files from .js to .ts"
