# DogRun Connect システム仕様書

## 1. システム概要
DogRun Connect は、ドッグランの利用状況や会員情報を管理するためのNext.js製Webアプリケーションです。
バックエンドのデータベースとしてGoogle Sheetsを利用し、画像ストレージとしてCloudinaryを利用しています。

## 2. システム構成
- **フロントエンド・バックエンド**: Next.js (App Router, API Routes)
- **データベース**: Google Sheets API (`google-spreadsheet`)
- **画像ストレージ**: Cloudinary
- **スタイリング**: Custom CSS / Vanilla CSS (`page.module.css` など), Lucide Icons

## 3. データスキーマ (Google Sheets)
システムではスプレッドシート上の以下の3つのシートを使用します。

### 3.1 `Members` シート (会員情報)
- `id`: 会員ID (一意の文字列)
- `dogName`: ワンちゃんの名前
- `group`: 所属班 (A〜D班など)
- `photoUrl`: Cloudinaryにアップロードされた画像のURL
- `createdAt`: 登録日時 (ISO 8601形式)

### 3.2 `UsageSessions` シート (利用履歴・入退室状況)
- `id`: セッションID (数値の連番)
- `memberId`: 会員ID (`Members`シートの`id`と紐付け)
- `enteredAt`: 入室日時 (ISO 8601形式)
- `exitedAt`: 退室日時 (未退室の場合は空文字。ISO 8601形式)

### 3.3 `Rotation` シート (月間ローテーション表)
- `month`: 該当年月 (フォーマット例: `YYYY/M`)
- `patrol`: エチケット班の担当グループ
- `clean`: 公園清掃班の担当グループ

## 4. APIエンドポイント一覧

| エンドポイント | メソッド | 説明 |
| --- | --- | --- |
| `/api/members` | `GET` | 登録済みメンバーの一覧を降順（新しい順）で取得します。 |
| `/api/members` | `POST` | 新規メンバーを登録します。画像ファイルが含まれる場合はCloudinaryへアップロードし、URLを保存します。 |
| `/api/members` | `PATCH` | 既存メンバーの情報を更新します。 |
| `/api/status` | `GET` | 現在入室中のセッション一覧を取得します。「入室から30分以内」かつ「未退室(`exitedAt`が空)」のアクティブなものが対象です。 |
| `/api/enter` | `POST` | `memberId` を受け取り、新規の入室セッション(`UsageSessions`)を記録します。すでに30分以内に入室済みかつ未退室の場合はエラーとなります。 |
| `/api/exit` | `POST` | `memberId` を受け取り、現在アクティブな入室セッションの `exitedAt` に現在時刻を記録して退室処理を行います。 |
| `/api/history` | `GET` | これまでの全ての入退室履歴(`UsageSessions`)をメンバー情報と結合して取得します。 |
| `/api/rotation` | `GET` | 現在の年月(`YYYY/M`)に一致する、エチケット班および公園清掃班の当番データを取得します。 |

## 5. 主要なビジネスロジック・制約
- **自動退室仕様**: 入室(`enteredAt`)から30分（1800000ミリ秒）が経過したセッションは、明示的な退室完了処理（`exitedAt`の更新）がなくとも、システム上では自動的に「退室済」として扱われます。
- **画像サイズ制限**: 会員登録時および更新時のワンちゃんの写真アップロードは、ファイルサイズが「10MB以下」に制限されています。
- **重複入室の防止**: 既にアクティブに利用中（入室中）の会員IDによる二重入室は防止されます。
