# 交通費精算Webアプリ (kotsuhi-portal)

Google Form + スプレッドシート + GASで運用していた交通費(通勤・外出・熱中症アラート)精算システムのWebアプリ版。

- 要件定義: `../requirements.md`
- 設計書一式: `../設計書/`(概要・機能・画面・詳細・非機能要件・インフラ設計はMarkdown、DB/API/外部インターフェース/テスト仕様書はGoogle Sheets)
- プロトタイプ: `../kotsuhi-prototype.html`

## 技術スタック

- Next.js (App Router, TypeScript)
- Google Sheets(専用のシステムDBスプレッドシート。Supabase等の外部DBは使わない方針)
- NextAuth.js (Google OAuth, tcdigital.jpドメイン制限)
- googleapis (Google Sheets API / Google Calendar API / Google Drive API)
- Tailwind CSS

## セットアップ手順

1. `npm install`
2. Google Cloudでサービスアカウントを作成し、Sheets API・Calendar API・Drive APIを有効化する
3. システムDB用に空のGoogleスプレッドシートを1つ作成し、そのIDを控える
4. 作成したスプレッドシートを、サービスアカウントのメールアドレスに「編集者」として共有する
5. `.env.local.example` を `.env.local` にコピーし、各値を設定する
6. `npm run setup:sheets` を実行する(`lib/google/schema.ts` の定義どおりに、必要なタブと見出し行を自動作成する。何度実行しても安全)
7. Google Cloud ConsoleでOAuthクライアントを作成し、`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` を設定する
8. 「社員マスタ」タブに、少なくとも自分自身の行(社員番号・氏名・メールアドレス・ロール=admin)を手動で1件登録する(初回ログインの照合に必要)
9. `npm run dev` で起動し、Googleでログインする
