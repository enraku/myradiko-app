; MyRadiko NSIS Installer Script
; 自動ダウンロード・ビルド機能付きインストーラー

!define APPNAME "MyRadiko"
!define COMPANYNAME "MyRadiko Team"
!define DESCRIPTION "radiko番組録音・管理アプリケーション"
!define VERSIONMAJOR 1
!define VERSIONMINOR 0
!define VERSIONBUILD 0
!define HELPURL "https://github.com/enraku/myradiko-app"
!define UPDATEURL "https://github.com/enraku/myradiko-app/releases"
!define ABOUTURL "https://github.com/enraku/myradiko-app"

; インストール先のデフォルト値
InstallDir "$PROGRAMFILES64\${APPNAME}"

; レジストリキー
!define ARP "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}"

; インクルード
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "WinVer.nsh"
!include "x64.nsh"

; 管理者権限が必要
RequestExecutionLevel admin

; インストーラーの外観設定
!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

; ページ設定
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; アンインストーラーページ
!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; 言語設定
!insertmacro MUI_LANGUAGE "Japanese"

; バージョン情報
VIProductVersion "${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}.0"
VIAddVersionKey /LANG=${LANG_JAPANESE} "ProductName" "${APPNAME}"
VIAddVersionKey /LANG=${LANG_JAPANESE} "CompanyName" "${COMPANYNAME}"
VIAddVersionKey /LANG=${LANG_JAPANESE} "LegalCopyright" "© ${COMPANYNAME}"
VIAddVersionKey /LANG=${LANG_JAPANESE} "FileDescription" "${DESCRIPTION}"
VIAddVersionKey /LANG=${LANG_JAPANESE} "FileVersion" "${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}"

; インストーラー名
Name "${APPNAME} ${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}"
OutFile "MyRadiko-Setup-v${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}.exe"

; 初期化関数
Function .onInit
    ; 64bitチェック
    ${IfNot} ${RunningX64}
        MessageBox MB_OK|MB_ICONSTOP "このアプリケーションは64bit Windows専用です。"
        Abort
    ${EndIf}
    
    ; Windows 10以降チェック
    ${IfNot} ${AtLeastWin10}
        MessageBox MB_OK|MB_ICONSTOP "このアプリケーションはWindows 10以降が必要です。"
        Abort
    ${EndIf}
    
    ; 既存インストールチェック
    ReadRegStr $R0 HKLM "${ARP}" "UninstallString"
    StrCmp $R0 "" done
    
    MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
    "${APPNAME}は既にインストールされています。$\n$\n\
    続行するには既存のバージョンをアンインストールしてください。" \
    IDOK uninst
    Abort
    
    uninst:
        ClearErrors
        ExecWait '$R0 _?=$INSTDIR'
        
        IfErrors no_remove_uninstaller done
        IfFileExists "$INSTDIR\MyRadiko.exe" no_remove_uninstaller done
        Delete $R0
        RMDir $INSTDIR
        
    no_remove_uninstaller:
    done:
FunctionEnd

; メインインストールセクション
Section "MyRadiko (必須)" SecMain
    SectionIn RO
    
    SetOutPath $INSTDIR
    
    DetailPrint "Node.js の存在確認中..."
    
    ; Node.js インストール確認
    nsExec::ExecToLog 'node --version'
    Pop $0
    ${If} $0 != 0
        DetailPrint "Node.js が見つかりません。自動インストールを開始します..."
        Call InstallNodeJS
    ${Else}
        DetailPrint "Node.js が見つかりました。"
    ${EndIf}
    
    ; Git インストール確認（ソースダウンロード用）
    nsExec::ExecToLog 'git --version'
    Pop $0
    ${If} $0 != 0
        DetailPrint "Git が見つかりません。自動インストールを開始します..."
        Call InstallGit
    ${EndIf}
    
    ; ソースコードのダウンロード
    DetailPrint "MyRadiko ソースコードをダウンロード中..."
    Call DownloadSource
    
    ; 依存関係のインストール
    DetailPrint "依存関係をインストール中..."
    Call InstallDependencies
    
    ; アプリケーションのビルド
    DetailPrint "MyRadiko をビルド中..."
    Call BuildApplication
    
    ; ビルド成果物のコピー
    Call CopyBuiltFiles
    
    ; ショートカット作成
    Call CreateShortcuts
    
    ; レジストリ登録
    Call RegisterApplication
    
    ; アンインストーラー作成
    WriteUninstaller "$INSTDIR\uninstall.exe"
    
SectionEnd

; オプションコンポーネント
Section "デスクトップショートカット" SecDesktop
    CreateShortcut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\MyRadiko.exe"
SectionEnd

Section "スタートアップ登録" SecStartup
    CreateShortcut "$SMSTARTUP\${APPNAME}.lnk" "$INSTDIR\MyRadiko.exe"
SectionEnd

; Node.js インストール関数
Function InstallNodeJS
    DetailPrint "Node.js LTS版をダウンロード中..."
    inetc::get "https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi" "$TEMP\nodejs-installer.msi"
    Pop $0
    ${If} $0 != "OK"
        MessageBox MB_OK|MB_ICONSTOP "Node.js のダウンロードに失敗しました。"
        Abort
    ${EndIf}
    
    DetailPrint "Node.js をインストール中..."
    ExecWait 'msiexec /i "$TEMP\nodejs-installer.msi" /quiet /norestart'
    Pop $0
    ${If} $0 != 0
        MessageBox MB_OK|MB_ICONSTOP "Node.js のインストールに失敗しました。"
        Abort
    ${EndIf}
    
    Delete "$TEMP\nodejs-installer.msi"
    
    ; PATH を更新
    SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000
FunctionEnd

; Git インストール関数
Function InstallGit
    DetailPrint "Git をダウンロード中..."
    inetc::get "https://github.com/git-for-windows/git/releases/download/v2.42.0.windows.2/Git-2.42.0.2-64-bit.exe" "$TEMP\git-installer.exe"
    Pop $0
    ${If} $0 != "OK"
        MessageBox MB_OK|MB_ICONSTOP "Git のダウンロードに失敗しました。"
        Abort
    ${EndIf}
    
    DetailPrint "Git をインストール中..."
    ExecWait '"$TEMP\git-installer.exe" /VERYSILENT /NORESTART'
    Pop $0
    ${If} $0 != 0
        MessageBox MB_OK|MB_ICONSTOP "Git のインストールに失敗しました。"
        Abort
    ${EndIf}
    
    Delete "$TEMP\git-installer.exe"
FunctionEnd

; ソースコードダウンロード関数
Function DownloadSource
    CreateDirectory "$INSTDIR\source"
    SetOutPath "$INSTDIR\source"
    
    nsExec::ExecToLog 'git clone https://github.com/enraku/myradiko-app.git .'
    Pop $0
    ${If} $0 != 0
        DetailPrint "Git clone に失敗しました。ZIP ダウンロードを試行中..."
        Call DownloadZip
    ${EndIf}
FunctionEnd

; ZIP ダウンロード関数（Gitフォールバック）
Function DownloadZip
    DetailPrint "ソースコード ZIP をダウンロード中..."
    inetc::get "https://github.com/enraku/myradiko-app/archive/refs/heads/main.zip" "$TEMP\myradiko-source.zip"
    Pop $0
    ${If} $0 != "OK"
        MessageBox MB_OK|MB_ICONSTOP "ソースコードのダウンロードに失敗しました。"
        Abort
    ${EndIf}
    
    DetailPrint "ZIP ファイルを展開中..."
    nsisunz::Unzip "$TEMP\myradiko-source.zip" "$INSTDIR\source"
    Pop $0
    ${If} $0 != "success"
        MessageBox MB_OK|MB_ICONSTOP "ZIP ファイルの展開に失敗しました。"
        Abort
    ${EndIf}
    
    Delete "$TEMP\myradiko-source.zip"
    
    ; フォルダ構造を調整
    Rename "$INSTDIR\source\myradiko-app-main" "$INSTDIR\source\temp"
    RMDir /r "$INSTDIR\source"
    Rename "$INSTDIR\source\temp" "$INSTDIR\source"
FunctionEnd

; 依存関係インストール関数
Function InstallDependencies
    SetOutPath "$INSTDIR\source"
    
    DetailPrint "バックエンド依存関係をインストール中..."
    nsExec::ExecToLog 'npm install'
    Pop $0
    ${If} $0 != 0
        MessageBox MB_OK|MB_ICONSTOP "バックエンド依存関係のインストールに失敗しました。"
        Abort
    ${EndIf}
    
    SetOutPath "$INSTDIR\source\client"
    DetailPrint "フロントエンド依存関係をインストール中..."
    nsExec::ExecToLog 'npm install'
    Pop $0
    ${If} $0 != 0
        MessageBox MB_OK|MB_ICONSTOP "フロントエンド依存関係のインストールに失敗しました。"
        Abort
    ${EndIf}
FunctionEnd

; アプリケーションビルド関数
Function BuildApplication
    SetOutPath "$INSTDIR\source"
    
    DetailPrint "Electronアプリケーションをビルド中（数分かかります）..."
    nsExec::ExecToLog 'npm run electron:build:portable'
    Pop $0
    ${If} $0 != 0
        MessageBox MB_OK|MB_ICONSTOP "アプリケーションのビルドに失敗しました。"
        Abort
    ${EndIf}
FunctionEnd

; ビルド成果物コピー関数
Function CopyBuiltFiles
    SetOutPath $INSTDIR
    
    ; 実行ファイルをコピー
    CopyFiles "$INSTDIR\source\dist-electron\MyRadiko 1.0.0.exe" "$INSTDIR\MyRadiko.exe"
    
    ; 必要な DLL とリソースをコピー
    CopyFiles "$INSTDIR\source\dist-electron\*.dll" $INSTDIR
    CopyFiles "$INSTDIR\source\dist-electron\*.pak" $INSTDIR
    CopyFiles /SILENT "$INSTDIR\source\dist-electron\locales" "$INSTDIR\locales"
    
    ; データディレクトリを作成
    CreateDirectory "$INSTDIR\data"
    CreateDirectory "$INSTDIR\recordings"
    CreateDirectory "$INSTDIR\logs"
    
    ; 設定ファイルをコピー
    CopyFiles "$INSTDIR\source\database\*.*" "$INSTDIR\data\"
    
    ; ライセンスファイル
    CopyFiles "$INSTDIR\source\README.md" "$INSTDIR\README.txt"
FunctionEnd

; ショートカット作成関数
Function CreateShortcuts
    CreateDirectory "$SMPROGRAMS\${APPNAME}"
    CreateShortcut "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk" "$INSTDIR\MyRadiko.exe"
    CreateShortcut "$SMPROGRAMS\${APPNAME}\アンインストール.lnk" "$INSTDIR\uninstall.exe"
    CreateShortcut "$SMPROGRAMS\${APPNAME}\README.lnk" "$INSTDIR\README.txt"
FunctionEnd

; アプリケーション登録関数
Function RegisterApplication
    WriteRegStr HKLM "${ARP}" "DisplayName" "${APPNAME}"
    WriteRegStr HKLM "${ARP}" "UninstallString" "$\"$INSTDIR\uninstall.exe$\""
    WriteRegStr HKLM "${ARP}" "QuietUninstallString" "$\"$INSTDIR\uninstall.exe$\" /S"
    WriteRegStr HKLM "${ARP}" "InstallLocation" "$\"$INSTDIR$\""
    WriteRegStr HKLM "${ARP}" "DisplayIcon" "$\"$INSTDIR\MyRadiko.exe$\""
    WriteRegStr HKLM "${ARP}" "Publisher" "${COMPANYNAME}"
    WriteRegStr HKLM "${ARP}" "HelpLink" "${HELPURL}"
    WriteRegStr HKLM "${ARP}" "URLUpdateInfo" "${UPDATEURL}"
    WriteRegStr HKLM "${ARP}" "URLInfoAbout" "${ABOUTURL}"
    WriteRegStr HKLM "${ARP}" "DisplayVersion" "${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}"
    WriteRegDWORD HKLM "${ARP}" "VersionMajor" ${VERSIONMAJOR}
    WriteRegDWORD HKLM "${ARP}" "VersionMinor" ${VERSIONMINOR}
    WriteRegDWORD HKLM "${ARP}" "NoModify" 1
    WriteRegDWORD HKLM "${ARP}" "NoRepair" 1
    
    ; ファイルサイズ計算
    ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
    IntFmt $0 "0x%08X" $0
    WriteRegDWORD HKLM "${ARP}" "EstimatedSize" "$0"
FunctionEnd

; アンインストールセクション
Section "Uninstall"
    ; アプリケーション停止
    nsExec::Exec 'taskkill /f /im MyRadiko.exe'
    
    ; ファイル削除
    Delete "$INSTDIR\MyRadiko.exe"
    Delete "$INSTDIR\*.dll"
    Delete "$INSTDIR\*.pak"
    Delete "$INSTDIR\*.dat"
    Delete "$INSTDIR\*.bin"
    Delete "$INSTDIR\README.txt"
    
    ; ディレクトリ削除
    RMDir /r "$INSTDIR\locales"
    RMDir /r "$INSTDIR\source"
    RMDir /r "$INSTDIR\logs"
    
    ; ユーザーデータ確認
    MessageBox MB_YESNO|MB_ICONQUESTION \
    "録音データと設定を削除しますか？$\n$\n\
    「はい」: 完全削除（録音ファイルも削除）$\n\
    「いいえ」: アプリケーションのみ削除" \
    IDYES delete_userdata IDNO skip_userdata
    
    delete_userdata:
        RMDir /r "$INSTDIR\data"
        RMDir /r "$INSTDIR\recordings"
        Goto continue_uninstall
        
    skip_userdata:
        DetailPrint "ユーザーデータを保持します: $INSTDIR\data, $INSTDIR\recordings"
        
    continue_uninstall:
    
    ; ショートカット削除
    Delete "$DESKTOP\${APPNAME}.lnk"
    Delete "$SMSTARTUP\${APPNAME}.lnk"
    RMDir /r "$SMPROGRAMS\${APPNAME}"
    
    ; レジストリ削除
    DeleteRegKey HKLM "${ARP}"
    
    ; アンインストーラー削除
    Delete "$INSTDIR\uninstall.exe"
    
    ; インストールディレクトリ削除
    RMDir $INSTDIR
    
SectionEnd

; セクション説明
LangString DESC_SecMain ${LANG_JAPANESE} "MyRadiko メインアプリケーション（必須）"
LangString DESC_SecDesktop ${LANG_JAPANESE} "デスクトップにショートカットを作成"
LangString DESC_SecStartup ${LANG_JAPANESE} "Windows起動時にMyRadikoを自動起動"

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
    !insertmacro MUI_DESCRIPTION_TEXT ${SecMain} $(DESC_SecMain)
    !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} $(DESC_SecDesktop)
    !insertmacro MUI_DESCRIPTION_TEXT ${SecStartup} $(DESC_SecStartup)
!insertmacro MUI_FUNCTION_DESCRIPTION_END