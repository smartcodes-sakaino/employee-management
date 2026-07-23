# 交通費精算Webアプリ (kotsuhi-portal)

Google Form + スプレッドシート + GASで運用していた交通費(通勤・外出・熱中症アラート)精算システムのWebアプリ版。

- 要件定義: `../requirements.md`
- 設計書一式: `../設計書/`(概要・機能・画面・詳細・非機能要件・インフラ設計はMarkdown、DB/API/外部インターフェース/テスト仕様書はGoogle Sheets)
- プロトタイプ: `../kotsuhi-prototype.html`

## 技術スタック

- Next.js (App Router, TypeScript)
- Supabase (PostgreSQL)
- NextAuth.js (Google OAuth, tcdigital.jpドメイン制限)
- googleapis (Google Calendar API / Google Drive API)
- Tailwind CSS
