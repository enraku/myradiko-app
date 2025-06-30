; MyRadiko Simple NSIS Installer Script
; 基本的な自動ダウンロード・ビルド機能付きインストーラー

!define APPNAME "MyRadiko"
!define COMPANYNAME "MyRadiko Team"
!define DESCRIPTION "radiko番組録音・管理アプリケーション"
!define VERSIONMAJOR 1
!define VERSIONMINOR 0
!define VERSIONBUILD 0

; インストール先のデフォルト値
InstallDir "$PROGRAMFILES64\${APPNAME}"

; レジストリキー
!define ARP "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}"

; インクルード
!include "MUI2.nsh"
!include "LogicLib.nsh"

; 管理者権限が必要
RequestExecutionLevel admin

; インストーラーの外観設定
!define MUI_ABORTWARNING

; ページ設定
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; アンインストーラーページ
!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; 言語設定
!insertmacro MUI_LANGUAGE "Japanese"

; インストーラー情報
Name "${APPNAME}"
OutFile "MyRadiko-Setup-v${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}.exe"
BrandingText "${COMPANYNAME}"

; セクション：メインインストール
Section "MyRadiko アプリケーション" SecMain
    SectionIn RO ; 必須セクション
    
    SetOutPath "$INSTDIR"
    
    ; 使用法の説明
    DetailPrint "MyRadiko自動セットアップを開始します..."
    DetailPrint "このインストーラーは以下を自動で行います："
    DetailPrint "1. Node.js のインストール確認"
    DetailPrint "2. Git のインストール確認" 
    DetailPrint "3. ソースコードのダウンロード"
    DetailPrint "4. 依存関係のインストール"
    DetailPrint "5. アプリケーションのビルド"
    
    ; Node.js確認・インストール
    DetailPrint "Node.js をチェック中..."
    nsExec::ExecToStack 'node --version'
    Pop $0
    ${If} $0 != 0
        DetailPrint "Node.js が見つかりません。手動でインストールしてください。"
        DetailPrint "https://nodejs.org/ からダウンロードしてください。"
        MessageBox MB_OK "Node.js が必要です。https://nodejs.org/ からインストールしてください。"
        Abort
    ${EndIf}
    DetailPrint "Node.js が見つかりました。"
    
    ; Git確認・インストール
    DetailPrint "Git をチェック中..."
    nsExec::ExecToStack 'git --version'
    Pop $0
    ${If} $0 != 0
        DetailPrint "Git が見つかりません。手動でインストールしてください。"
        DetailPrint "https://git-scm.com/download/win からダウンロードしてください。"
        MessageBox MB_OK "Git が必要です。https://git-scm.com/download/win からインストールしてください。"
        Abort
    ${EndIf}
    DetailPrint "Git が見つかりました。"
    
    ; ソースコードダウンロード
    DetailPrint "ソースコードをダウンロード中..."
    nsExec::ExecToLog 'git clone https://github.com/enraku/myradiko-app.git "$INSTDIR\myradiko"'
    
    ; 依存関係インストール
    DetailPrint "依存関係をインストール中..."
    SetOutPath "$INSTDIR\myradiko"
    nsExec::ExecToLog 'npm install'
    
    SetOutPath "$INSTDIR\myradiko\client"
    nsExec::ExecToLog 'npm install'
    
    ; アプリケーションビルド
    DetailPrint "アプリケーションをビルド中..."
    SetOutPath "$INSTDIR\myradiko"
    nsExec::ExecToLog 'npm run electron:build:portable'
    
    ; ショートカット作成
    CreateDirectory "$SMPROGRAMS\${APPNAME}"
    CreateShortcut "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk" "$INSTDIR\myradiko\MyRadiko.bat"
    CreateShortcut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\myradiko\MyRadiko.bat"
    
    ; アンインストーラー作成
    WriteUninstaller "$INSTDIR\Uninstall.exe"
    
    ; レジストリ登録
    WriteRegStr HKLM "${ARP}" "DisplayName" "${APPNAME}"
    WriteRegStr HKLM "${ARP}" "UninstallString" "$INSTDIR\Uninstall.exe"
    WriteRegStr HKLM "${ARP}" "InstallLocation" "$INSTDIR"
    WriteRegStr HKLM "${ARP}" "Publisher" "${COMPANYNAME}"
    WriteRegStr HKLM "${ARP}" "DisplayVersion" "${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}"
    WriteRegDWORD HKLM "${ARP}" "VersionMajor" ${VERSIONMAJOR}
    WriteRegDWORD HKLM "${ARP}" "VersionMinor" ${VERSIONMINOR}
    WriteRegDWORD HKLM "${ARP}" "NoModify" 1
    WriteRegDWORD HKLM "${ARP}" "NoRepair" 1
    
    DetailPrint "インストールが完了しました！"
    
SectionEnd

; アンインストーラー
Section "Uninstall"
    ; ショートカット削除
    Delete "$DESKTOP\${APPNAME}.lnk"
    Delete "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk"
    RMDir "$SMPROGRAMS\${APPNAME}"
    
    ; インストールファイル削除
    MessageBox MB_YESNO "録音データとアプリケーション設定も削除しますか？" IDYES delete_all IDNO delete_app_only
    
    delete_all:
        RMDir /r "$INSTDIR"
        Goto done
        
    delete_app_only:
        ; アプリケーションファイルのみ削除（データは保持）
        Delete "$INSTDIR\myradiko\*.exe"
        Delete "$INSTDIR\myradiko\*.bat" 
        RMDir /r "$INSTDIR\myradiko\node_modules"
        RMDir /r "$INSTDIR\myradiko\dist-electron"
        Delete "$INSTDIR\Uninstall.exe"
        Goto done
        
    done:
    
    ; レジストリクリーンアップ
    DeleteRegKey HKLM "${ARP}"
    
SectionEnd