import type { Dictionary } from "./fr";

const zh: Dictionary = {
  meta: {
    title: "E-Coffee Node — 梅杰兹巴巴",
    description:
      "咖啡、美食和水烟，在梅杰兹巴巴。露台从早开到晚。通过WhatsApp、短信或在线预订座位。",
  },

  nav: {
    menu: "菜单",
    gallery: "图库",
    info: "找到我们",
    book: "预订",
    language: "语言",
    skipToContent: "跳至内容",
  },

  status: {
    openUntil: "营业至 {time}",
    opensAt: "{time} 开始营业",
    opensDay: "{day} {time} 开始营业",
    closedToday: "今日休息",
    now: "现在",
  },

  hero: {
    eyebrow: "梅杰兹巴巴 · 比塞大",
    title: "E-Coffee是您的快乐之地",
    lead: "一个露台，一份简洁的菜单，真正的好咖啡，以及深夜的水烟。我们为您保留一个座位。",
    book: "预订座位",
    bookWhatsapp: "通过WhatsApp预订",
    menu: "查看菜单",
  },

  about: {
    title: "我们做什么",
    body: "我们早上开门营业咖啡，直到最后一桌客人离开才关门。在此之间：我们用心做好简单的烹饪，现场榨汁，以及在环境大道上的露台，您可以坐上三个小时，没有人会催促您。",
    covers: "{count} 个座位",
    zones: {
      title: "三种就座方式",
      terrasse: {
        name: "露台",
        body: "在大道上，有阴凉。全天供应水烟。",
      },
      salle: {
        name: "餐厅",
        body: "安静且舒适。大型聚会的首选。",
      },
      salon: {
        name: "休息室",
        body: "低矮座椅，柔和灯光。适合久坐。",
      },
    },
  },

  menu: {
    title: "菜单",
    lead: "价格以突尼斯第纳尔计，含服务费。",
    priceOfDay: "当日价格",
    jumpTo: "跳转至",
    tags: {
      vegetarien: "素食",
      epice: "辣味",
      signature: "招牌",
      "sans-alcool": "无酒精",
    },
  },

  gallery: {
    title: "图片展示",
    lead: "照片来自店家的Instagram账户。",
    instagram: "在Instagram上关注",
  },

  info: {
    title: "找到我们",
    address: "地址",
    hours: "营业时间",
    contact: "联系方式",
    directions: "在地图中打开",
    phone: "电话",
    whatsapp: "WhatsApp",
    closed: "休息",
    today: "今天",
    reviews: "阅读TripAdvisor评价",
  },

  booking: {
    title: "预订座位",
    lead: "三行即可完成预订。您将通过WhatsApp或短信收到确认——并在前一天收到提醒。",
    orChat:
      "更喜欢文字沟通？我们的客服全天候通过WhatsApp和短信回复。",
    fields: {
      name: "姓名",
      phone: "电话",
      phoneHint: "国际格式，例如 +216 20 123 456",
      date: "日期",
      time: "时间",
      partySize: "人数",
      zone: "您想坐哪里？",
      zoneAny: "都可以",
      notes: "有什么需要备注吗？（生日、婴儿车、过敏…）",
      notesPlaceholder: "可选",
    },
    zones: {
      terrasse: "露台",
      salle: "餐厅",
      salon: "休息室",
    },
    periods: {
      morning: "上午",
      afternoon: "下午",
      evening: "晚上",
      late: "深夜",
    },
    otp: {
      label: "验证码",
      hint: "我们将发送六位数验证码以确认您的号码。",
      send: "发送验证码",
      sending: "发送中…",
      sent: "验证码已发送。十分钟内有效。",
      resend: "重新发送",
      missing: "请输入收到的验证码。",
      invalid: "验证码错误。",
      expired: "验证码已过期。请重新获取。",
      tooMany: "尝试次数过多。请重新获取验证码。",
      failed: "验证码发送失败。请稍后重试。",
    },
    slotsLoading: "搜索可用时段…",
    submit: "预订",
    submitting: "提交中…",
    success: {
      title: "预订成功",
      body: "您 {date} {time} 的 {count} 人座位已预订。确认信息将发送至 {phone}。",
      again: "再次预订",
    },
    errors: {
      generic: "预订未成功。请重试或致电我们。",
      name: "请输入预订姓名。",
      phone: "号码无效。请使用国际格式，例如 +21620123456。",
      date: "请选择日期。",
      time: "请选择时间。",
      partySize: "请输入人数。",
      closed: "该时段已打烊。",
      slotsUnavailable:
        "暂无法显示可用时段。请重试，或通过WhatsApp联系我们。",
      tooSoon: "至少需要提前 {minutes} 分钟预订。",
      tooFar: "预订开放时间为 {days} 天前。",
      partyTooLarge:
        "超过 {max} 人请致电，我们将为您安排。",
      full: "该时段已满。请尝试 {alternatives}。",
      rateLimited: "尝试次数过多。请等待一分钟。",
    },
  },

  notFound: {
    title: "页面未找到",
    description: "您访问的页面不存在或已被移动。",
    backHome: "返回首页",
  },

  discover: {
    title: "发现我们的餐厅",
    description: "找到您附近的完美餐厅。",
    search: "搜索餐厅或菜系...",
    filters: { cuisine: "菜系类型", price: "预算", rating: "最低评分", openNow: "现在营业", sort: "排序方式" },
    sort: { relevance: "相关性", rating: "评分最高", price: "价格", distance: "距离", popularity: "最受欢迎", name: "名称 A-Z", newest: "最新" },
    cards: { reviews: "条评论", book: "预订", open: "营业中", closed: "已关闭", featured: "热门" },
    empty: "没有符合条件的餐厅。",
    loading: "搜索中...",
    pagination: { previous: "上一页", next: "下一页" },
  },

  footer: {
    tagline: "E-Coffee是您的快乐之地",
    follow: "关注",
    rights: "版权所有。",
  },

  reviews: {
    title: "顾客评价",
    lead: "了解顾客对E-Coffee Node体验的评价。",
    formTitle: "发表评价",
    titleField: "标题",
    rating: "评分",
    comment: "评论",
    submit: "提交",
    success: "谢谢！您的评价将在审核后显示。",
    error: "出现错误。请重试。",
    namePlaceholder: "您的姓名",
  },

  days: {
    long: [
      "星期日",
      "星期一",
      "星期二",
      "星期三",
      "星期四",
      "星期五",
      "星期六",
    ],
    short: ["日", "一", "二", "三", "四", "五", "六"],
  },
};

export default zh;
