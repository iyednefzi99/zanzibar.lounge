import type { Dictionary } from "./fr";

const ja: Dictionary = {
  meta: {
    title: "Zanzibar Lounge — メジェズ・エル・バブ",
    description:
      "コーヒー、料理、そしてシーザャーが楽しめるメジェズ・エル・バブ。テラスは朝から遅くまで営業。WhatsApp、SMS、またはオンラインで予約できます。",
  },

  nav: {
    menu: "メニュー",
    gallery: "ギャラリー",
    info: "アクセス",
    book: "予約",
    language: "言語",
    skipToContent: "コンテンツへスキップ",
  },

  status: {
    openUntil: "{time}まで営業中",
    opensAt: "{time}に開店",
    opensDay: "{day} {time}に開店",
    closedToday: "本日閉店",
    now: "現在",
  },

  hero: {
    eyebrow: "メジェズ・エル・バブ · ベジャ",
    title: "ザンジバーはあなたの幸せな場所",
    lead: "テラス、短いメニュー、しっかりしたコーヒー、そして遅くまでシーザャー。あなたの席を確保しています。",
    book: "テーブル予約",
    bookWhatsapp: "WhatsAppで予約",
    menu: "メニューを見る",
  },

  about: {
    title: "私たちのこだわり",
    body: "朝はコーヒーのために開店し、最後のテーブルが帰るまで閉めません。その間：一貫したシンプルな料理、その場で搾るジュース、そして誰にも急かれることなく三時間座れるアンビエンス大通りのテラス。",
    covers: "{count}席",
    zones: {
      title: "座り方3つ",
      terrasse: {
        name: "テラス",
        body: "大通り沿い、日陰。終日シーザャーを提供しています。",
      },
      salle: {
        name: "ダイニングルーム",
        body: "静かで落ち着いた空間。大人数のパーティーに向いています。",
      },
      salon: {
        name: "ラウンジ",
        body: "低い座席、柔らかな照明。長時間滞在する方に。",
      },
    },
  },

  menu: {
    title: "メニュー",
    lead: "チュニジア・ディナール表示、サービス料込み。",
    priceOfDay: "日替わり価格",
    jumpTo: "ジャンプ先",
    tags: {
      vegetarien: "ベジタリアン",
      epice: "辛い",
      signature: "スペシャル",
      "sans-alcool": "ノンアルコール",
    },
  },

  gallery: {
    title: "写真で見る",
    lead: "写真は店舗のInstagramアカウントからのものです。",
    instagram: "Instagramでフォロー",
  },

  info: {
    title: "アクセス",
    address: "住所",
    hours: "営業時間",
    contact: "お問い合わせ",
    directions: "マップで開く",
    phone: "電話",
    whatsapp: "WhatsApp",
    closed: "閉店",
    today: "今日",
    reviews: "TripAdvisorの口コミを読む",
  },

  booking: {
    title: "テーブル予約",
    lead: "3行入力するだけで予約完了。WhatsAppまたはSMSで確認メールが届き、前日にもリマインダーが届きます。",
    orChat:
      "メッセージの方が良いですか？担当者がWhatsAppとSMSで24時間対応しています。",
    fields: {
      name: "お名前",
      phone: "電話番号",
      phoneHint: "国際フォーマット、例: +216 20 123 456",
      date: "日付",
      time: "時間",
      partySize: "人数",
      zone: "どこに座りたいですか？",
      zoneAny: "どちらでも",
      notes: "備考はありますか？（誕生日、ベビーカー、アレルギー…）",
      notesPlaceholder: "任意",
    },
    zones: {
      terrasse: "テラス",
      salle: "ダイニングルーム",
      salon: "ラウンジ",
    },
    periods: {
      morning: "午前",
      afternoon: "午後",
      evening: "夕方",
      late: "深夜",
    },
    otp: {
      label: "確認コード",
      hint: "番号確認用の6桁のコードをお送りします。",
      send: "コードを送信",
      sending: "送信中…",
      sent: "コードを送信しました。10分間有効です。",
      resend: "再送信",
      missing: "受け取ったコードを入力してください。",
      invalid: "コードが正しくありません。",
      expired: "コードの有効期限が切れました。新しく取得してください。",
      tooMany: "試行回数が多すぎます。新しいコードを取得してください。",
      failed: "コードの送信に失敗しました。しばらくしてから再試行してください。",
    },
    slotsLoading: "空き枠を検索中…",
    submit: "予約する",
    submitting: "送信中…",
    success: {
      title: "予約完了",
      body: "{date} {time}、{count}名のテーブルが予約されました。確認を{phone}に送信します。",
      again: "新しい予約",
    },
    errors: {
      generic: "予約が完了しませんでした。もう一度お試しいただくか、お電話ください。",
      name: "予約名前を入力してください。",
      phone: "無効な番号です。国際フォーマットをご利用ください。例: +21620123456",
      date: "日付を選択してください。",
      time: "時間を選択してください。",
      partySize: "人数を入力してください。",
      closed: "その時間は営業時間外です。",
      slotsUnavailable:
        "空き枠が表示されていません。もう一度お試しいただくか、WhatsAppでお問い合わせください。",
      tooSoon: "少なくとも{minutes}分前までにご予約ください。",
      tooFar: "予約は{days}日前から受け付けています。",
      partyTooLarge:
        "{max}名以上の場合はお電話ください。ご相談いたします。",
      full: "その枠は満席です。{alternatives}をお試しください。",
      rateLimited: "試行回数が多すぎます。1分お待ちください。",
    },
  },

  notFound: {
    title: "ページが見つかりません",
    description: "お探しのページは存在しないか、移動しました。",
    backHome: "ホームページへ戻る",
  },

  discover: {
    title: "レストランを探す",
    description: "お近くの完璧なレストランを見つけましょう。",
    search: "レストランや料理を検索...",
    filters: { cuisine: "料理の種類", price: "予算", rating: "最低評価", openNow: "営業中", sort: "並べ替え" },
    sort: { relevance: "関連性", rating: "評価順", price: "価格順", distance: "距離順", popularity: "人気順", name: "名前順", newest: "新しい順" },
    cards: { reviews: "件のレビュー", book: "予約", open: "営業中", closed: "閉店", featured: "人気" },
    empty: "条件に合うレストランがありません。",
    loading: "検索中...",
    pagination: { previous: "前へ", next: "次へ" },
  },

  footer: {
    tagline: "ザンジバーはあなたの幸せな場所",
    follow: "フォロー",
    rights: "全著作権所有。",
  },

  reviews: {
    title: "お客様の声",
    lead: "ザンジバーラウンジでの体験について、お客様がどのように評価しているかご覧ください。",
    formTitle: "レビューを書く",
    titleField: "タイトル",
    rating: "評価",
    comment: "コメント",
    submit: "送信",
    success: "ありがとうございます！レビューは審査後に公開されます。",
    error: "エラーが発生しました。もう一度お試しください。",
    namePlaceholder: "お名前",
  },

  days: {
    long: [
      "日曜日",
      "月曜日",
      "火曜日",
      "水曜日",
      "木曜日",
      "金曜日",
      "土曜日",
    ],
    short: ["日", "月", "火", "水", "木", "金", "土"],
  },
};

export default ja;
