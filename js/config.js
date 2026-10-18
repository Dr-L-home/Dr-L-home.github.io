/* 網站設定：只要改這個檔案，首頁與預留頁的文字、連結就會跟著變。
   不想顯示的連結，留空字串 "" 即可。 */
window.SITE = {
  owner: "Dr. L",                 // 顯示在頁首與頁尾
  handle: "Dr-L-home",    // 你的 GitHub 帳號
  title: "數獨",
  tagline: "一個數獨 App，和它背後的解題思路。",

  links: {
    webApp: "https://github.com/Dr-L-home/Dr-L-home.github.io",      // 網頁版數獨的網址
    playStore: "",   // Google Play 商店頁網址（上架後填入）
    repo: "https://github.com/Dr-L-home/Dr-L-home.github.io",        // 原始碼所在的 GitHub 專案網址
    email: "lyliao76@gmail.com"        // 聯絡信箱
  },

  // 三個主題。第 2、3 個目前是預留位置：
  // 想啟用時，把 status 改成 "live"，並把 topic-2/、topic-3/ 裡的頁面換成你的內容。
  topics: [
    {
      id: "strategies",
      no: "01",
      title: "數獨解題策略",
      blurb: "27 種策略，用動畫一步步看懂。從唯一候選到 X 翼、XY 鏈，每一種都有圖。",
      href: "strategies/",
      status: "live",
      accent: "#58C4DD"
    },
    {
      id: "topic-2",
      no: "02",
      title: "主題二",
      blurb: "預留。可以放解題器與出題演算法的筆記。",
      href: "topic-2/",
      status: "reserved",
      accent: "#5CD0B3"
    },
    {
      id: "topic-3",
      no: "03",
      title: "主題三",
      blurb: "預留。可以放 App 開發與上架 Play 商店的紀錄。",
      href: "topic-3/",
      status: "reserved",
      accent: "#FF862F"
    }
  ]
};
