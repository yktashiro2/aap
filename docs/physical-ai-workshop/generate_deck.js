/*
 * フィジカルAI 社内勉強会資料 ドラフト生成スクリプト
 * 実行: NODE_PATH=<node_modules親> node generate_deck.js
 */
const pptxgen = require("pptxgenjs");
const ReactDOMServer = require("react-dom/server");
const fa = require("react-icons/fa");
const sharp = require("sharp");
const path = require("path");

// ---------- palette ----------
const C = {
  navy: "101A38", // dominant dark
  navy2: "23305E", // support dark
  ice: "CADCFC", // light blue text on dark
  iceTint: "EEF3FB", // card tint on white
  orange: "E8622D", // accent
  orangeSoft: "FBE8DE",
  gray: "5A6478",
  grayLight: "8B93A5",
  white: "FFFFFF",
  line: "D8DEEA",
};
const FONT = "Meiryo UI";
const W = 13.33, H = 7.5;

// ---------- icon rendering ----------
const iconCache = {};
async function iconData(name, hex) {
  const key = name + hex;
  if (iconCache[key]) return iconCache[key];
  const el = fa[name]({ color: "#" + hex, size: "256" });
  const svg = ReactDOMServer.renderToStaticMarkup(el);
  const buf = await sharp(Buffer.from(svg), { density: 300 })
    .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  iconCache[key] = "image/png;base64," + buf.toString("base64");
  return iconCache[key];
}

async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.theme = { headFontFace: FONT, bodyFontFace: FONT };

  // preload icons
  const I = {};
  const load = async (n, c) => (I[n + "_" + c] = await iconData(n, c));
  await load("FaRobot", C.white);
  await load("FaRobot", C.orange);
  await load("FaBrain", C.white);
  await load("FaBrain", C.orange);
  await load("FaMicrochip", C.white);
  await load("FaMicrochip", C.orange);
  await load("FaBroadcastTower", C.white);
  await load("FaBroadcastTower", C.orange);
  await load("FaCubes", C.white);
  await load("FaCubes", C.orange);
  await load("FaFlagCheckered", C.white);
  await load("FaEye", C.white);
  await load("FaBolt", C.white);
  await load("FaBolt", C.orange);
  await load("FaCogs", C.white);
  await load("FaClock", C.orange);
  await load("FaShieldAlt", C.orange);
  await load("FaLock", C.orange);
  await load("FaYenSign", C.orange);
  await load("FaCloud", C.white);
  await load("FaSyncAlt", C.white);
  await load("FaSyncAlt", C.orange);
  await load("FaWarehouse", C.navy);
  await load("FaIndustry", C.navy);
  await load("FaHardHat", C.navy);
  await load("FaTree", C.navy);
  await load("FaCheckCircle", C.orange);
  await load("FaComments", C.white);
  await load("FaWifi", C.orange);
  await load("FaGraduationCap", C.white);
  await load("FaDatabase", C.white);
  await load("FaVideo", C.orange);
  await load("FaServer", C.orange);

  let pageNo = 0;

  // ---------- helpers ----------
  function baseSlide(opts = {}) {
    const s = pres.addSlide();
    pageNo++;
    s.background = { color: opts.dark ? C.navy : C.white };
    if (!opts.noPageNum) {
      s.addText(String(pageNo), {
        x: W - 0.75, y: H - 0.42, w: 0.5, h: 0.3, align: "right",
        fontFace: FONT, fontSize: 10, color: opts.dark ? C.ice : C.grayLight, margin: 0,
      });
    }
    return s;
  }

  function kicker(s, text, dark) {
    s.addText(text, {
      x: 0.65, y: 0.34, w: 9.5, h: 0.32, margin: 0,
      fontFace: FONT, fontSize: 12, bold: true, color: C.orange, charSpacing: 2,
    });
  }

  function title(s, text, dark, w) {
    s.addText(text, {
      x: 0.63, y: 0.62, w: w || 12.0, h: 0.75, margin: 0,
      fontFace: FONT, fontSize: 27, bold: true, color: dark ? C.white : C.navy,
    });
  }

  function source(s, text, dark) {
    s.addText(text, {
      x: 0.65, y: H - 0.44, w: 10.5, h: 0.3, margin: 0,
      fontFace: FONT, fontSize: 9, color: dark ? C.grayLight : C.grayLight,
    });
  }

  function iconCircle(s, iconKey, x, y, d, circleColor) {
    s.addShape("ellipse", { x, y, w: d, h: d, fill: { color: circleColor }, line: { type: "none" } });
    const inset = d * 0.26;
    s.addImage({ data: I[iconKey], x: x + inset, y: y + inset, w: d - inset * 2, h: d - inset * 2 });
  }

  function divider(num, titleText, subText, iconKey) {
    const s = baseSlide({ dark: true });
    // ghost number
    s.addText(num, {
      x: 5.6, y: 1.55, w: 7.2, h: 4.4, margin: 0, align: "right", wrap: false,
      fontFace: "Arial", fontSize: 250, bold: true, color: C.navy2,
    });
    iconCircle(s, iconKey, 0.85, 2.35, 0.85, C.orange);
    s.addText(titleText, {
      x: 0.85, y: 3.35, w: 9.6, h: 1.0, margin: 0,
      fontFace: FONT, fontSize: 36, bold: true, color: C.white,
    });
    s.addText(subText, {
      x: 0.87, y: 4.45, w: 9.2, h: 0.9, margin: 0,
      fontFace: FONT, fontSize: 15, color: C.ice, lineSpacingMultiple: 1.3,
    });
    return s;
  }

  function card(s, x, y, w, h, fillColor, lineColor) {
    s.addShape("roundRect", {
      x, y, w, h, rectRadius: 0.08,
      fill: { color: fillColor },
      line: lineColor ? { color: lineColor, width: 1 } : { type: "none" },
      shadow: { type: "outer", color: "9AA4B8", blur: 6, offset: 2, angle: 90, opacity: 0.25 },
    });
  }

  // =========================================================
  // 1. タイトル
  // =========================================================
  {
    const s = baseSlide({ dark: true, noPageNum: true });
    // subtle deco circles
    s.addShape("ellipse", { x: 10.4, y: -1.6, w: 5.2, h: 5.2, fill: { color: C.navy2 }, line: { type: "none" } });
    s.addShape("ellipse", { x: -1.8, y: 5.3, w: 4.4, h: 4.4, fill: { color: C.navy2 }, line: { type: "none" } });
    iconCircle(s, "FaRobot_" + C.white, 0.9, 1.15, 1.0, C.orange);
    s.addText("社内勉強会", {
      x: 0.92, y: 2.45, w: 6.0, h: 0.4, margin: 0,
      fontFace: FONT, fontSize: 14, bold: true, color: C.orange, charSpacing: 4,
    });
    s.addText("フィジカルAI入門", {
      x: 0.88, y: 2.9, w: 11.6, h: 1.15, margin: 0,
      fontFace: FONT, fontSize: 54, bold: true, color: C.white,
    });
    s.addText("〜 AIが、現実世界で動き出す 〜", {
      x: 0.92, y: 4.15, w: 11.0, h: 0.6, margin: 0,
      fontFace: FONT, fontSize: 22, color: C.ice,
    });
    s.addText(
      [
        { text: "エッジAI × ローカル5G × AI集中管理基盤 —— 3つの要素で読み解く次のインフラ商機", options: { breakLine: true } },
        { text: "", options: { breakLine: true } },
        { text: "20XX年X月X日   ネットワーク事業部 ○○○○（発表者名に差し替え）", options: {} },
      ],
      { x: 0.92, y: 5.35, w: 11.4, h: 1.2, margin: 0, fontFace: FONT, fontSize: 14, color: C.ice, lineSpacingMultiple: 1.35 }
    );
    s.addNotes("本編30〜45分+Q&A15分。日付・発表者名を差し替えてください。冒頭のつかみ: 「自席でロボットアームにボールを掴ませています。今日はその裏側にある大きな地殻変動の話をします」");
  }

  // =========================================================
  // 2. ゴールと進め方
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "INTRODUCTION");
    title(s, "本日のゴールと進め方");
    // left: goals
    const goals = [
      ["FaCheckCircle_" + C.orange, "フィジカルAIの全体像を掴む", "「何ができて、なぜ今盛り上がっているのか」を一枚絵で語れるようになる"],
      ["FaCheckCircle_" + C.orange, "要素技術と弊社の実績を知る", "VLA・エッジAI・ローカル5G・AI基盤。それぞれで弊社が検証済みのこと"],
      ["FaCheckCircle_" + C.orange, "提案づくりの議論の土台にする", "「3要素パッケージ」構想へのツッコミ・アイデアをQ&Aでもらう"],
    ];
    goals.forEach((g, i) => {
      const y = 1.75 + i * 1.55;
      card(s, 0.65, y, 6.8, 1.3, C.iceTint);
      s.addImage({ data: I[g[0]], x: 0.95, y: y + 0.42, w: 0.45, h: 0.45 });
      s.addText(g[1], { x: 1.6, y: y + 0.16, w: 5.7, h: 0.45, margin: 0, fontFace: FONT, fontSize: 16, bold: true, color: C.navy });
      s.addText(g[2], { x: 1.6, y: y + 0.62, w: 5.7, h: 0.6, margin: 0, fontFace: FONT, fontSize: 11.5, color: C.gray, lineSpacingMultiple: 1.15 });
    });
    // right: agenda
    card(s, 7.85, 1.75, 4.85, 4.9, C.navy);
    s.addText("アジェンダ（約40分＋Q&A）", { x: 8.15, y: 1.98, w: 4.3, h: 0.4, margin: 0, fontFace: FONT, fontSize: 14, bold: true, color: C.white });
    const agenda = [
      ["01", "フィジカルAIとは何か", "10分"],
      ["02", "頭脳 — VLAモデル", "8分"],
      ["03", "五感と反射神経 — エッジAI", "8分"],
      ["04", "神経網 — ローカル5G", "5分"],
      ["05", "中枢 — AI集中管理基盤", "5分"],
      ["06", "まとめ — 3要素パッケージ", "4分"],
      ["Q&A", "質疑応答・ディスカッション", "15分"],
    ];
    agenda.forEach((a, i) => {
      const y = 2.52 + i * 0.56;
      s.addText(a[0], { x: 8.15, y, w: 0.62, h: 0.4, margin: 0, fontFace: "Arial", fontSize: 12, bold: true, color: C.orange });
      s.addText(a[1], { x: 8.8, y, w: 3.0, h: 0.4, margin: 0, fontFace: FONT, fontSize: 12.5, color: C.white });
      s.addText(a[2], { x: 11.85, y, w: 0.7, h: 0.4, margin: 0, align: "right", fontFace: FONT, fontSize: 12, color: C.ice });
    });
    s.addNotes("2分。ゴールを先に共有し「営業・SE両方に持ち帰りがある構成」と宣言する。");
  }

  // =========================================================
  // 3. Divider 01
  // =========================================================
  divider("01", "フィジカルAIとは何か", "生成AI・エージェントAIの次に来る「第3の波」。\nまずは全体像と、いま世界で起きていることから。", "FaRobot_" + C.white)
    .addNotes("セクション1: 10分");

  // =========================================================
  // 4. AIの3つの波
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "01｜フィジカルAIとは");
    title(s, "AIの進化 — 3つの波");
    const waves = [
      ["FaComments_" + C.white, C.grayLight, "第1波：生成AI", "2022年〜", "デジタル世界で「言葉と知識」を扱う", "文章生成・要約・翻訳・コード生成\n代表例：ChatGPT"],
      ["FaCogs_" + C.white, C.navy2, "第2波：エージェントAI", "2024年〜", "デジタル世界で「作業」をこなす", "自律的なツール操作・調査・業務代行\n代表例：Claude Code、各種AIエージェント"],
      ["FaRobot_" + C.white, C.orange, "第3波：フィジカルAI", "2025年〜", "物理世界を認識し、行動する", "ロボット・自動運転・ドローン・AMR\n代表例：ヒューマノイド、VLA搭載アーム"],
    ];
    waves.forEach((wv, i) => {
      const x = 0.65 + i * 4.28;
      card(s, x, 1.8, 3.95, 3.7, i === 2 ? C.orangeSoft : C.iceTint);
      iconCircle(s, wv[0], x + 0.35, 2.1, 0.75, wv[1]);
      s.addText(wv[2], { x: x + 0.35, y: 3.0, w: 3.3, h: 0.45, margin: 0, fontFace: FONT, fontSize: 17, bold: true, color: C.navy });
      s.addText(wv[3], { x: x + 0.35, y: 3.45, w: 3.3, h: 0.35, margin: 0, fontFace: FONT, fontSize: 12, bold: true, color: C.orange });
      s.addText(wv[4], { x: x + 0.35, y: 3.85, w: 3.3, h: 0.6, margin: 0, fontFace: FONT, fontSize: 13, bold: true, color: C.navy2, lineSpacingMultiple: 1.15 });
      s.addText(wv[5], { x: x + 0.35, y: 4.55, w: 3.3, h: 0.85, margin: 0, fontFace: FONT, fontSize: 11, color: C.gray, lineSpacingMultiple: 1.2 });
    });
    card(s, 0.65, 5.85, 12.0, 0.95, C.navy);
    s.addText(
      [
        { text: "フィジカルAI ＝ ", options: { color: C.white, bold: true } },
        { text: "物理世界を認識し、理解し、行動するAI", options: { color: C.orange, bold: true } },
        { text: "（見る → 考える → 動く）", options: { color: C.ice } },
      ],
      { x: 1.0, y: 6.05, w: 11.3, h: 0.55, margin: 0, fontFace: FONT, fontSize: 15, align: "center" }
    );
    s.addNotes("3分。ポイント: 波は置き換えではなく積み重なり。生成AI/エージェントAIの成果(基盤モデル)がそのまま物理世界に流れ込んできたのがフィジカルAI。");
  }

  // =========================================================
  // 5. なぜ今か（市場）
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "01｜フィジカルAIとは");
    title(s, "なぜ今か — 市場は「兆円」の単位で動き始めた");
    // left chart
    card(s, 0.65, 1.8, 5.9, 4.7, C.iceTint);
    s.addText("国内AIシステム市場（IDC Japan）", { x: 0.95, y: 2.0, w: 5.3, h: 0.4, margin: 0, fontFace: FONT, fontSize: 13, bold: true, color: C.navy });
    s.addChart("bar", [
      {
        name: "市場規模（兆円）",
        labels: ["2024年", "2029年（予測）"],
        values: [1.34, 4.19],
      },
    ], {
      x: 0.95, y: 2.45, w: 5.3, h: 3.3,
      barDir: "col",
      chartColors: [C.navy2],
      showValue: true, dataLabelPosition: "outEnd", dataLabelColor: C.navy, dataLabelFontSize: 13, dataLabelFontFace: FONT, dataLabelFormatCode: "0.00\"兆円\"",
      showLegend: false, showTitle: false,
      catAxisLabelColor: C.gray, catAxisLabelFontSize: 12, catAxisLabelFontFace: FONT,
      valAxisLabelColor: C.grayLight, valAxisLabelFontSize: 10, valAxisLabelFontFace: FONT,
      valGridLine: { color: C.line, size: 0.5 }, catGridLine: { style: "none" },
      valAxisMaxVal: 5, valAxisMajorUnit: 1,
    });
    s.addText("5年で3.1倍（CAGR 25.6%）", { x: 0.95, y: 5.85, w: 5.3, h: 0.4, margin: 0, align: "center", fontFace: FONT, fontSize: 13, bold: true, color: C.orange });
    // right stats
    const stats = [
      ["50兆ドル", "NVIDIA CEOが語る市場機会", "製造・物流・自動運転を含む長期の市場規模感（2025年発言）"],
      ["5兆ドル", "ヒューマノイド市場 2050年", "Morgan Stanley予測。2050年に世界10億台稼働のシナリオ"],
      ["828億ドル", "日本のフィジカルAI市場 2035年", "国内でも2035年に向けて大幅拡大の予測"],
    ];
    stats.forEach((st, i) => {
      const y = 1.8 + i * 1.62;
      card(s, 6.95, y, 5.75, 1.4, C.white, C.line);
      s.addText(st[0], { x: 7.2, y: y + 0.28, w: 2.35, h: 0.8, margin: 0, fontFace: FONT, fontSize: 25, bold: true, color: C.orange });
      s.addText(st[1], { x: 9.6, y: y + 0.18, w: 3.0, h: 0.45, margin: 0, fontFace: FONT, fontSize: 12.5, bold: true, color: C.navy });
      s.addText(st[2], { x: 9.6, y: y + 0.62, w: 3.0, h: 0.7, margin: 0, fontFace: FONT, fontSize: 10, color: C.gray, lineSpacingMultiple: 1.15 });
    });
    source(s, "出典：IDC Japan（2025）、NVIDIA CEO Jensen Huang発言（VivaTech 2025）、Morgan Stanley（2025）、日本フィジカルAI市場予測（2026-2035）");
    s.addNotes('2分。「フィジカルAIのChatGPTモーメントは既に来た」(Jensen Huang)を紹介。数字の桁感だけ持ち帰ってもらえばOK。予測はソースにより幅がある点も正直に。');
  }

  // =========================================================
  // 6. 基本ループ
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "01｜フィジカルAIとは");
    title(s, "フィジカルAIの基本ループ — 認識・判断・行動");
    const steps = [
      ["FaEye_" + C.white, "認識 Sense", "カメラ・LiDAR・各種センサーで\n周囲の状況を捉える"],
      ["FaBrain_" + C.white, "判断 Think", "VLA／基盤モデルが状況を理解し\n次の行動を決める"],
      ["FaBolt_" + C.white, "行動 Act", "アーム・車輪・プロペラが\n物理世界に働きかける"],
    ];
    steps.forEach((st, i) => {
      const x = 0.85 + i * 4.25;
      card(s, x, 2.0, 3.35, 2.5, C.navy);
      iconCircle(s, st[0], x + 0.32, 2.3, 0.7, C.orange);
      s.addText(st[1], { x: x + 1.2, y: 2.42, w: 2.1, h: 0.5, margin: 0, fontFace: FONT, fontSize: 17, bold: true, color: C.white });
      s.addText(st[2], { x: x + 0.32, y: 3.25, w: 2.75, h: 1.0, margin: 0, fontFace: FONT, fontSize: 12, color: C.ice, lineSpacingMultiple: 1.25 });
      if (i < 2) {
        s.addShape("rightArrow", { x: x + 3.42, y: 2.95, w: 0.75, h: 0.6, fill: { color: C.orange }, line: { type: "none" } });
      }
    });
    // feedback arrow
    s.addShape("leftArrow", { x: 2.5, y: 4.85, w: 8.3, h: 0.5, fill: { color: C.iceTint }, line: { color: C.line, width: 1 } });
    s.addText("行動の結果が環境を変え、次の「認識」へ —— このループを回し続ける", {
      x: 2.9, y: 4.9, w: 7.6, h: 0.4, margin: 0, align: "center", fontFace: FONT, fontSize: 11.5, color: C.navy2, bold: true,
    });
    card(s, 0.85, 5.75, 11.6, 1.05, C.orangeSoft);
    s.addImage({ data: I["FaClock_" + C.orange], x: 1.2, y: 6.02, w: 0.5, h: 0.5 });
    s.addText(
      [
        { text: "求められる応答速度は 数ms〜100ms。", options: { bold: true, color: C.navy } },
        { text: " チャットなら1秒待てるが、動く機械は待てない —— ここがフィジカルAI特有の難しさ", options: { color: C.gray } },
      ],
      { x: 1.9, y: 6.05, w: 10.3, h: 0.5, margin: 0, fontFace: FONT, fontSize: 14 }
    );
    source(s, "応答要件：総務省 地域エッジAI実証 提案仕様（数ms〜100msのリアルタイム処理）より");
    s.addNotes("2分。後半のエッジAI・ローカル5Gの伏線。「クラウド往復では間に合わない場面がある」ことをここで植え付ける。");
  }

  // =========================================================
  // 7. NVIDIA 3コンピュータ
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "01｜フィジカルAIとは");
    title(s, "開発の全体像 — NVIDIAが説く「3つのコンピュータ」");
    const comps = [
      ["FaGraduationCap_" + C.white, "① 学習（Train）", "NVIDIA DGX", "大量データでロボットの頭脳\n（基盤モデル）を訓練する\nAIスーパーコンピュータ"],
      ["FaCloud_" + C.white, "② シミュレーション（Sim）", "Omniverse ＋ Cosmos", "デジタルツインで安全に試し、\n合成データを量産。Cosmosは\n2,000万時間の実映像で学習した\n「世界モデル」"],
      ["FaMicrochip_" + C.white, "③ 実行（Act）", "Jetson Thor", "ロボットに載るエッジ計算機。\n2070 TFLOPS（FP4）・128GB\n$3,499（2025年8月GA）"],
    ];
    comps.forEach((cp, i) => {
      const x = 0.65 + i * 4.28;
      card(s, x, 1.85, 3.95, 3.9, C.iceTint);
      iconCircle(s, cp[0], x + 0.35, 2.15, 0.75, C.navy2);
      s.addText(cp[1], { x: x + 0.35, y: 3.05, w: 3.3, h: 0.4, margin: 0, fontFace: FONT, fontSize: 14.5, bold: true, color: C.orange });
      s.addText(cp[2], { x: x + 0.35, y: 3.45, w: 3.3, h: 0.45, margin: 0, fontFace: FONT, fontSize: 17, bold: true, color: C.navy });
      s.addText(cp[3], { x: x + 0.35, y: 4.0, w: 3.35, h: 1.6, margin: 0, fontFace: FONT, fontSize: 11.5, color: C.gray, lineSpacingMultiple: 1.25 });
    });
    card(s, 0.65, 6.0, 12.0, 0.85, C.navy);
    s.addText(
      [
        { text: "学習 → シミュレーション → 実行 のループ全体が開発基盤。", options: { color: C.white, bold: true } },
        { text: " 「③実行」だけでなく「①②を支えるインフラ」にも商機がある（→ セクション05へ）", options: { color: C.ice } },
      ],
      { x: 1.0, y: 6.18, w: 11.3, h: 0.5, margin: 0, fontFace: FONT, fontSize: 13.5, align: "center" }
    );
    source(s, "出典：NVIDIA（CES 2025 / GTC 2025 発表、Jetson Thor 2025年8月GA）");
    s.addNotes("3分。NVIDIAのフレームで全体像を掴んでもらう。弊社文脈: ③はSAKURA-IIのようなNPUでも代替可能、①②はK8s基盤の話につながる、と一言添える。");
  }

  // =========================================================
  // 8. Divider 02
  // =========================================================
  divider("02", "頭脳 — VLAモデル", "「見て・聞いて・動く」を1つのモデルで。\nロボットの頭脳は基盤モデルの時代へ。", "FaBrain_" + C.white)
    .addNotes("セクション2: 8分");

  // =========================================================
  // 9. VLAとは
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "02｜頭脳：VLAモデル");
    title(s, "VLA（Vision-Language-Action）とは");
    // left: evolution
    const evo = [
      ["LLM", "言葉 → 言葉", "ChatGPTなど。テキストの入出力", C.grayLight],
      ["VLM", "画像＋言葉 → 言葉", "画像を理解して説明・回答できる", C.navy2],
      ["VLA", "画像＋言葉 → 行動", "カメラ映像と指示から、ロボットの動作を直接出力", C.orange],
    ];
    evo.forEach((e, i) => {
      const y = 1.95 + i * 1.5;
      card(s, 0.65, y, 5.6, 1.25, i === 2 ? C.orangeSoft : C.iceTint);
      s.addText(e[0], { x: 0.95, y: y + 0.3, w: 1.15, h: 0.65, margin: 0, fontFace: "Arial", fontSize: 21, bold: true, color: e[3] });
      s.addText(e[1], { x: 2.2, y: y + 0.16, w: 3.9, h: 0.45, margin: 0, fontFace: FONT, fontSize: 14.5, bold: true, color: C.navy });
      s.addText(e[2], { x: 2.2, y: y + 0.62, w: 3.9, h: 0.55, margin: 0, fontFace: FONT, fontSize: 11, color: C.gray, lineSpacingMultiple: 1.15 });
    });
    // right: I/O diagram
    card(s, 6.65, 1.95, 6.05, 2.6, C.navy);
    s.addText("VLAの入出力イメージ", { x: 6.95, y: 2.15, w: 5.4, h: 0.4, margin: 0, fontFace: FONT, fontSize: 13, bold: true, color: C.white });
    s.addText("入力：カメラ画像 ＋ 「青いボールを掴んで」", { x: 6.95, y: 2.62, w: 5.5, h: 0.4, margin: 0, fontFace: FONT, fontSize: 13, color: C.ice });
    s.addShape("downArrow", { x: 9.35, y: 3.05, w: 0.5, h: 0.5, fill: { color: C.orange }, line: { type: "none" } });
    s.addText("出力：各関節の動き（モーター指令値の連続列）", { x: 6.95, y: 3.6, w: 5.5, h: 0.4, margin: 0, fontFace: FONT, fontSize: 13, color: C.ice });
    s.addText("＝ プログラムを書かずに、デモを見せて教える", { x: 6.95, y: 4.05, w: 5.5, h: 0.4, margin: 0, fontFace: FONT, fontSize: 13, bold: true, color: C.orange });
    // bottom-right: vs traditional
    card(s, 6.65, 4.8, 6.05, 1.85, C.iceTint);
    s.addText("従来のロボット開発との違い", { x: 6.95, y: 4.98, w: 5.4, h: 0.4, margin: 0, fontFace: FONT, fontSize: 13, bold: true, color: C.navy });
    s.addText(
      [
        { text: "ティーチング・専用プログラミングが不要 — 自然言語＋実演で教える", options: { bullet: true, breakLine: true } },
        { text: "学習した動作を、少し違う状況にも汎化できる", options: { bullet: true } },
      ],
      { x: 7.0, y: 5.4, w: 5.4, h: 1.1, margin: 0, fontFace: FONT, fontSize: 12, color: C.gray, paraSpaceAfter: 6, lineSpacingMultiple: 1.15 }
    );
    s.addNotes("3分。「VLAはロボット版の基盤モデル」という一言に集約。従来のティーチングペンダントとの違いを製造業の聴衆に響かせる。");
  }

  // =========================================================
  // 10. 主要VLAモデル
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "02｜頭脳：VLAモデル");
    title(s, "世界の主要プレイヤー — 2025年に一気に出揃った");
    const rows = [
      [
        { text: "モデル", options: { bold: true, color: C.white, fill: { color: C.navy }, fontFace: FONT, fontSize: 12.5, valign: "middle" } },
        { text: "開発元", options: { bold: true, color: C.white, fill: { color: C.navy }, fontFace: FONT, fontSize: 12.5, valign: "middle" } },
        { text: "特徴", options: { bold: true, color: C.white, fill: { color: C.navy }, fontFace: FONT, fontSize: 12.5, valign: "middle" } },
      ],
      ["Isaac GR00T N1 / N1.5", "NVIDIA", "オープンなヒューマノイド汎用基盤モデル（公開版 約2.2B）。Jetson Thor上での実行を想定"],
      ["π0 / π0.5", "Physical Intelligence", "汎用ロボット基盤モデルの先駆。openpiとしてOSS化。評価額110億ドル（2026年報道）"],
      ["Gemini Robotics 1.5 / 2", "Google DeepMind", "On-Device版はネット接続なしでロボット上で動作。2026年に全身制御の「2」を発表"],
      ["Helix", "Figure", "ヒューマノイド上半身を高周波制御。7B VLM（7〜9Hz）＋高速制御系（200Hz）の二重構成"],
      ["SmolVLA", "Hugging Face", "450Mの軽量オープンVLA。コンシューマGPUでも動作 —— 弊社が検証中（次頁）"],
    ];
    const tableRows = rows.map((r, ri) =>
      ri === 0 ? r : r.map((cell, ci) => ({
        text: cell,
        options: {
          fontFace: FONT, fontSize: 11.5, color: ci === 0 ? C.navy : C.gray, bold: ci === 0,
          fill: { color: ri % 2 === 1 ? C.white : C.iceTint }, valign: "middle",
        },
      }))
    );
    s.addTable(tableRows, {
      x: 0.65, y: 1.9, w: 12.0, colW: [3.1, 2.3, 6.6],
      border: { type: "solid", color: C.line, pt: 0.75 },
      rowH: [0.42, 0.72, 0.72, 0.72, 0.72, 0.72],
      margin: 0.08,
    });
    card(s, 0.65, 6.3, 12.0, 0.6, C.orangeSoft);
    s.addText("ポイント：巨大プロプライエタリ勢とオープン勢が併走 —— オープン勢の存在が、私たちのような事業者にも検証の門戸を開いた", {
      x: 1.0, y: 6.4, w: 11.3, h: 0.4, margin: 0, fontFace: FONT, fontSize: 12.5, bold: true, color: C.navy, align: "center",
    });
    source(s, "出典：各社公開情報（2025〜2026年）。パラメータ数・評価額は公表値/報道ベース");
    s.addNotes("2分。表は読み上げず「1年でこれだけ出た」というスピード感と、オープン化の流れだけ強調。");
  }

  // =========================================================
  // 11. 民主化
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "02｜頭脳：VLAモデル");
    title(s, "ロボット学習の民主化 — 机の上で始められる");
    const stats = [
      ["約1.5万円〜", "LeRobot SO-101 部品コスト", "Hugging Face発の3Dプリント6軸アーム（約$100〜130）。組立キットも数万円台"],
      ["450M", "SmolVLAのパラメータ数", "軽量でもSO-101実機ベンチで大型モデルに匹敵。コンシューマGPUで動く"],
      ["約1,000万", "事前学習フレーム数", "コミュニティが持ち寄った487データセットで事前学習済み。少数デモの追加学習で使える"],
      ["30%短縮", "非同期推論の応答改善", "推論と動作を並行処理。実タスクのスループットは約2倍に"],
    ];
    stats.forEach((st, i) => {
      const x = 0.65 + (i % 2) * 6.2;
      const y = 1.9 + Math.floor(i / 2) * 2.2;
      card(s, x, y, 5.85, 1.95, C.iceTint);
      s.addText(st[0], { x: x + 0.3, y: y + 0.22, w: 5.2, h: 0.7, margin: 0, fontFace: FONT, fontSize: 30, bold: true, color: C.orange });
      s.addText(st[1], { x: x + 0.3, y: y + 0.95, w: 5.2, h: 0.4, margin: 0, fontFace: FONT, fontSize: 13.5, bold: true, color: C.navy });
      s.addText(st[2], { x: x + 0.3, y: y + 1.35, w: 5.25, h: 0.55, margin: 0, fontFace: FONT, fontSize: 10.5, color: C.gray, lineSpacingMultiple: 1.15 });
    });
    card(s, 0.65, 6.3, 12.0, 0.6, C.navy);
    s.addText("数年前まで研究室の話だった「ロボットに教える」が、数万円と1台のGPUで試せる時代に", {
      x: 1.0, y: 6.4, w: 11.3, h: 0.4, margin: 0, fontFace: FONT, fontSize: 13, bold: true, color: C.white, align: "center",
    });
    source(s, "出典：Hugging Face LeRobot / SmolVLA 公開情報（2025年）。円換算は概算");
    s.addNotes("2分。「参入障壁が崩れた」ことが本セクションの結論。次のスライドで自社検証につなぐ。");
  }

  // =========================================================
  // 12. 弊社検証① SO-101
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "02｜頭脳：VLAモデル");
    title(s, "弊社検証① LeRobot SO-101 × SmolVLA でボール把持");
    // left: photo placeholder
    card(s, 0.65, 1.9, 5.3, 3.6, C.iceTint);
    s.addText("［写真差し替え］\n自席検証環境\n（SO-101＋カメラ＋GPU PC）", {
      x: 0.95, y: 3.0, w: 4.7, h: 1.4, margin: 0, align: "center", fontFace: FONT, fontSize: 14, color: C.grayLight, lineSpacingMultiple: 1.3,
    });
    card(s, 0.65, 5.75, 5.3, 1.15, C.orangeSoft);
    s.addText("実機は私の席にあります。動くところは\nいつでもお見せできます（Q&A後でもぜひ）", {
      x: 0.95, y: 5.95, w: 4.75, h: 0.8, margin: 0, fontFace: FONT, fontSize: 12.5, bold: true, color: C.navy, lineSpacingMultiple: 1.2,
    });
    // right: setup & steps
    s.addText("検証構成", { x: 6.45, y: 1.95, w: 6.0, h: 0.4, margin: 0, fontFace: FONT, fontSize: 15, bold: true, color: C.navy });
    s.addText(
      [
        { text: "SO-101 リーダー／フォロワーアーム ＋ USBカメラ ＋ GPU搭載PC", options: { bullet: true, breakLine: true } },
        { text: "SmolVLA（公開ベースモデル）を自前データでファインチューニング", options: { bullet: true } },
      ],
      { x: 6.5, y: 2.35, w: 6.15, h: 0.95, margin: 0, fontFace: FONT, fontSize: 12.5, color: C.gray, paraSpaceAfter: 6, lineSpacingMultiple: 1.2 }
    );
    const steps = [
      ["①", "収集", "リーダーアームを人が操作し、把持デモを数十エピソード記録"],
      ["②", "学習", "収集データでSmolVLAをファインチューニング（数時間）"],
      ["③", "実行", "「ボールを掴む」を自律実行 —— 把持に成功"],
    ];
    steps.forEach((st, i) => {
      const y = 3.5 + i * 0.82;
      s.addShape("ellipse", { x: 6.5, y: y + 0.05, w: 0.55, h: 0.55, fill: { color: C.navy }, line: { type: "none" } });
      s.addText(st[0], { x: 6.5, y: y + 0.05, w: 0.55, h: 0.55, margin: 0, align: "center", valign: "middle", fontFace: FONT, fontSize: 14, bold: true, color: C.white });
      s.addText(st[1], { x: 7.2, y, w: 0.95, h: 0.6, margin: 0, fontFace: FONT, fontSize: 14, bold: true, color: C.navy, valign: "middle" });
      s.addText(st[2], { x: 8.2, y, w: 4.5, h: 0.68, margin: 0, fontFace: FONT, fontSize: 11.5, color: C.gray, valign: "middle", lineSpacingMultiple: 1.1 });
    });
    s.addText("得られた学び", { x: 6.45, y: 6.05, w: 6.0, h: 0.4, margin: 0, fontFace: FONT, fontSize: 13, bold: true, color: C.orange });
    s.addText("データ品質（照明・背景・カメラ位置）が精度を大きく左右する／「収集→学習→実行」のループを社内で回せることを確認", {
      x: 6.45, y: 6.42, w: 6.25, h: 0.6, margin: 0, fontFace: FONT, fontSize: 11.5, color: C.gray, lineSpacingMultiple: 1.15,
    });
    s.addNotes("3分。実体験を語る一番の見せ場。デモ動画があればここで再生。失敗談(データの取り直し等)も入れると質疑が盛り上がる。");
  }

  // =========================================================
  // 13. Divider 03
  // =========================================================
  divider("03", "五感と反射神経 — エッジAI", "「考える」だけでは動けない。ミリ秒で反応する\n推論チップが、フィジカルAIの身体性を支える。", "FaMicrochip_" + C.white)
    .addNotes("セクション3: 8分");

  // =========================================================
  // 14. なぜエッジ推論か
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "03｜エッジAI");
    title(s, "なぜクラウドではなくエッジで推論するのか");
    const rows = [
      ["FaClock_" + C.orange, "応答時間", "制御ループは数ms〜100ms。クラウド往復（数十〜数百ms＋揺らぎ）では機械の制御に間に合わない"],
      ["FaShieldAlt_" + C.orange, "可用性・安全", "通信が切れても、その場で判断して安全に止まる／動き続ける必要がある"],
      ["FaLock_" + C.orange, "データ主権", "現場の映像・機微データを外に出さない。プライバシーと機密保持の要請"],
      ["FaYenSign_" + C.orange, "通信コスト", "全カメラ映像をクラウドへ上げ続ける帯域・転送コストは非現実的。現場で絞ってから送る"],
    ];
    rows.forEach((r, i) => {
      const y = 1.95 + i * 1.15;
      card(s, 0.65, y, 12.0, 0.98, i % 2 === 0 ? C.iceTint : C.white, i % 2 === 0 ? undefined : C.line);
      s.addShape("ellipse", { x: 0.95, y: y + 0.17, w: 0.64, h: 0.64, fill: { color: C.white }, line: { color: C.orange, width: 1.5 } });
      s.addImage({ data: I[r[0]], x: 1.11, y: y + 0.33, w: 0.32, h: 0.32 });
      s.addText(r[1], { x: 1.85, y, w: 1.75, h: 0.98, margin: 0, fontFace: FONT, fontSize: 15, bold: true, color: C.navy, valign: "middle" });
      s.addText(r[2], { x: 3.7, y, w: 8.7, h: 0.98, margin: 0, fontFace: FONT, fontSize: 12.5, color: C.gray, valign: "middle", lineSpacingMultiple: 1.2 });
    });
    s.addText("→ 学習はクラウド/センター、推論は現場（エッジ）へ —— 推論の主戦場はエッジに移りつつある", {
      x: 0.65, y: 6.65, w: 12.0, h: 0.45, margin: 0, fontFace: FONT, fontSize: 14, bold: true, color: C.orange,
    });
    s.addNotes("2分。4つの理由はNW屋・インフラ屋の実感に訴える。ここからSAKURA-IIへ。");
  }

  // =========================================================
  // 15. SAKURA-II
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "03｜エッジAI");
    title(s, "EdgeCortix SAKURA-II — 日本発のエッジAIアクセラレータ");
    // left specs
    const specs = [
      ["60 TOPS", "AI性能（INT8）／BF16でも30 TFLOPS"],
      ["約8〜10W", "動作時消費電力（典型値）"],
      ["$399", "PCIe/M.2モジュール価格帯"],
      ["16GB", "LPDDR4x搭載・帯域68GB/s"],
    ];
    specs.forEach((sp, i) => {
      const x = 0.65 + (i % 2) * 3.0;
      const y = 2.0 + Math.floor(i / 2) * 1.75;
      card(s, x, y, 2.8, 1.5, C.navy);
      s.addText(sp[0], { x: x + 0.2, y: y + 0.18, w: 2.4, h: 0.6, margin: 0, fontFace: FONT, fontSize: 22, bold: true, color: C.orange });
      s.addText(sp[1], { x: x + 0.2, y: y + 0.8, w: 2.45, h: 0.6, margin: 0, fontFace: FONT, fontSize: 10, color: C.ice, lineSpacingMultiple: 1.15 });
    });
    s.addText("開発元：EDGECORTIX株式会社（川崎・2019年設立のファブレス半導体、累計調達1.1億ドル）", {
      x: 0.65, y: 5.65, w: 6.0, h: 0.7, margin: 0, fontFace: FONT, fontSize: 11, color: C.gray, lineSpacingMultiple: 1.2,
    });
    // right: dataflow vs von Neumann
    card(s, 6.95, 2.0, 5.75, 4.35, C.iceTint);
    s.addText("技術の肝：データフロー型アーキテクチャ", { x: 7.25, y: 2.2, w: 5.2, h: 0.4, margin: 0, fontFace: FONT, fontSize: 14.5, bold: true, color: C.navy });
    s.addText(
      [
        { text: "GPU（ノイマン型）：柔軟だが、メモリ往復で遅延が揺れる。実効利用率は30〜40%程度", options: { bullet: true, breakLine: true } },
        { text: "SAKURA-II（データフロー型）：コンパイラが計算資源を静的に割当。オンチップSRAM中心で動くため、処理時間が「決定論的」＝ジッターが極小", options: { bullet: true, breakLine: true } },
        { text: "DNA（動的再構成IP）＋ MERAコンパイラ（PyTorch / ONNX / TFLite対応）のフルスタック提供", options: { bullet: true } },
      ],
      { x: 7.3, y: 2.7, w: 5.15, h: 3.0, margin: 0, fontFace: FONT, fontSize: 12, color: C.gray, paraSpaceAfter: 10, lineSpacingMultiple: 1.25 }
    );
    s.addText("「速さ」だけでなく「揺れなさ」を設計思想で作り込んだチップ", {
      x: 7.25, y: 5.85, w: 5.2, h: 0.4, margin: 0, fontFace: FONT, fontSize: 12, bold: true, color: C.orange,
    });
    source(s, "出典：EdgeCortix公開情報、弊社NS研向け調査資料（2026年3月）");
    s.addNotes("2分。国産・低消費電力・決定論という3つのキーワード。宇宙(放射線耐性試験済)の小ネタも時間があれば。");
  }

  // =========================================================
  // 16. チップ比較
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "03｜エッジAI");
    title(s, "エッジAIチップの勢力図 — 三者三様の設計思想");
    const header = ["", "SAKURA-II", "Jetson AGX Orin", "Hailo-8"].map((t, i) => ({
      text: t,
      options: { bold: true, color: C.white, fill: { color: i === 1 ? C.orange : C.navy }, fontFace: FONT, fontSize: 13, align: "center", valign: "middle" },
    }));
    const body = [
      ["AI性能", "60 TOPS（INT8）", "275 TOPS", "26 TOPS"],
      ["消費電力", "約8〜10W", "15〜60W", "約2.5W"],
      ["価格帯", "$399", "約$2,000", "約$350"],
      ["電力効率（TOPS/W）", "7.5", "4.6", "3.0"],
      ["実効利用率", "80%以上", "30〜40%", "40〜70%"],
      ["位置づけ", "エッジ汎用・低ジッター", "汎用計算機・CUDA資産", "組込特化"],
    ].map((r, ri) =>
      r.map((cell, ci) => ({
        text: cell,
        options: {
          fontFace: FONT, fontSize: 12, align: ci === 0 ? "left" : "center", valign: "middle",
          bold: ci === 0 || ci === 1, color: ci === 0 ? C.navy : ci === 1 ? C.orange : C.gray,
          fill: { color: ri % 2 === 0 ? C.iceTint : C.white },
        },
      }))
    );
    s.addTable([header, ...body], {
      x: 0.65, y: 1.9, w: 12.0, colW: [3.0, 3.0, 3.0, 3.0],
      border: { type: "solid", color: C.line, pt: 0.75 },
      rowH: [0.45, 0.62, 0.62, 0.62, 0.62, 0.62, 0.62],
      margin: 0.06,
    });
    s.addText("バッチサイズ1（1件ずつ即時処理＝ロボット制御の条件）では、カタログTOPSより「電力効率×実効利用率」が効く", {
      x: 0.65, y: 6.5, w: 12.0, h: 0.4, margin: 0, fontFace: FONT, fontSize: 13, bold: true, color: C.navy,
    });
    source(s, "出典：弊社NS研向け調査資料（2026年3月）。実効利用率はバッチサイズ1前提の推定値を含む");
    s.addNotes("2分。「TOPSの絶対値では語れない」が要点。Jetsonを貶めず、エコシステムの強さと用途の棲み分けとして説明。");
  }

  // =========================================================
  // 17. 弊社検証② SAKURA-II実測
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "03｜エッジAI");
    title(s, "弊社検証② SAKURA-II 実機性能試験（YOLO11m）");
    const stats = [
      ["7.6ms", "推論時間（DNA・INT8）", "物体検出YOLO11mを1フレームあたり数msで処理"],
      ["±0.2ms", "推論ジッター（揺らぎ）", "処理時間のブレが極小 —— 他社製品の約1/10の安定性"],
      ["10W未満", "平均消費電力", "60分連続実行での実測平均。ファンレス設計も視野"],
      ["22%高速", "Mixed精度の効果", "精度低下はわずか-0.3mAP（約0.7%）で速度を2割改善"],
    ];
    stats.forEach((st, i) => {
      const x = 0.65 + (i % 2) * 6.2;
      const y = 1.9 + Math.floor(i / 2) * 2.1;
      card(s, x, y, 5.85, 1.85, i === 1 ? C.orangeSoft : C.iceTint);
      s.addText(st[0], { x: x + 0.3, y: y + 0.18, w: 5.2, h: 0.75, margin: 0, fontFace: FONT, fontSize: 32, bold: true, color: C.orange });
      s.addText(st[1], { x: x + 0.3, y: y + 0.95, w: 5.2, h: 0.4, margin: 0, fontFace: FONT, fontSize: 13.5, bold: true, color: C.navy });
      s.addText(st[2], { x: x + 0.3, y: y + 1.33, w: 5.25, h: 0.5, margin: 0, fontFace: FONT, fontSize: 10.5, color: C.gray, lineSpacingMultiple: 1.1 });
    });
    card(s, 0.65, 6.15, 12.0, 0.72, C.navy);
    s.addText(
      [
        { text: "制御用途では「速い」より「揺れない」が効く。", options: { color: C.orange, bold: true } },
        { text: " 低ジッター×超低消費電力 → ロボット・VLA・自動運転の推論に好適", options: { color: C.white, bold: true } },
      ],
      { x: 1.0, y: 6.3, w: 11.3, h: 0.45, margin: 0, fontFace: FONT, fontSize: 13.5, align: "center" }
    );
    source(s, "弊社実測（2026年）：YOLO11m 640×640、SAKURA-II PCIeカード、60分連続・室温26℃。NS研向け報告より");
    s.addNotes("2分。自社の一次データという強み。「ジッターが小さい＝制御周期を詰められる」を機械屋の言葉で説明。");
  }

  // =========================================================
  // 18. Divider 04
  // =========================================================
  divider("04", "神経網 — ローカル5G", "動き回る機械を、切れない無線でつなぐ。\nフィジカルAIこそが高帯域無線の使い道になる。", "FaBroadcastTower_" + C.white)
    .addNotes("セクション4: 5分");

  // =========================================================
  // 19. Wi-Fi vs L5G
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "04｜ローカル5G");
    title(s, "動くAIには「切れない無線」が必要");
    s.addText("フィジカルAIは移動する（AMR・AGV・ドローン・搬送ロボット）。有線は引けず、無線の質がそのまま安全と生産性になる。", {
      x: 0.65, y: 1.55, w: 12.0, h: 0.45, margin: 0, fontFace: FONT, fontSize: 13.5, color: C.gray,
    });
    // left column: Wi-Fi
    card(s, 0.65, 2.2, 5.9, 4.2, C.white, C.line);
    s.addText("Wi-Fiの限界（現場あるある）", { x: 0.95, y: 2.42, w: 5.3, h: 0.45, margin: 0, fontFace: FONT, fontSize: 15, bold: true, color: C.gray });
    s.addText(
      [
        { text: "AP切替（ローミング）で通信が途切れ、AMRが停止する", options: { bullet: true, breakLine: true } },
        { text: "金属棚・機械の多い環境で電波干渉・不感地帯が発生", options: { bullet: true, breakLine: true } },
        { text: "端末台数が増えると輻輳し、遅延が読めなくなる", options: { bullet: true, breakLine: true } },
        { text: "屋外・広域のカバーが苦手", options: { bullet: true } },
      ],
      { x: 1.0, y: 3.0, w: 5.3, h: 3.1, margin: 0, fontFace: FONT, fontSize: 12.5, color: C.gray, paraSpaceAfter: 12, lineSpacingMultiple: 1.25 }
    );
    // right column: L5G
    card(s, 6.85, 2.2, 5.85, 4.2, C.iceTint);
    s.addText("ローカル5Gの強み", { x: 7.15, y: 2.42, w: 5.2, h: 0.45, margin: 0, fontFace: FONT, fontSize: 15, bold: true, color: C.orange });
    s.addText(
      [
        { text: "ハンドオーバーで移動中も途切れない", options: { bullet: true, breakLine: true } },
        { text: "免許帯域を占有 —— 干渉に強く、遅延・帯域を設計できる", options: { bullet: true, breakLine: true } },
        { text: "多数同時接続・上り偏重（映像アップ中心）のカスタムが可能", options: { bullet: true, breakLine: true } },
        { text: "SIM認証によるセキュリティ、屋外・広カバレッジ対応", options: { bullet: true } },
      ],
      { x: 7.2, y: 3.0, w: 5.25, h: 3.1, margin: 0, fontFace: FONT, fontSize: 12.5, color: C.navy2, paraSpaceAfter: 12, lineSpacingMultiple: 1.25 }
    );
    s.addText("→ 「動き回る機械 × 映像 × リアルタイム制御」の無線は、ローカル5Gが本命", {
      x: 0.65, y: 6.6, w: 12.0, h: 0.45, margin: 0, fontFace: FONT, fontSize: 14, bold: true, color: C.orange,
    });
    s.addNotes("2分。隣の課のL5G担当がいれば補足を振ると良い。Wi-Fi 6/7で足りるケースもあると公平に添えると信頼感が出る。");
  }

  // =========================================================
  // 20. Celona
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "04｜ローカル5G");
    title(s, "Celona「5G LAN」と弊社の取り組み");
    // left: Celona
    card(s, 0.65, 1.9, 6.1, 4.55, C.iceTint);
    s.addText("Celona とは", { x: 0.95, y: 2.1, w: 5.5, h: 0.4, margin: 0, fontFace: FONT, fontSize: 15, bold: true, color: C.navy });
    s.addText(
      [
        { text: "「5G LAN」のパイオニア（2019年設立、NTT等が出資）。セルラーAPを既存の企業LANに統合し、クラウドから一元管理", options: { bullet: true, breakLine: true } },
        { text: "iPhone / iPad 対応 —— 専用端末なしで使い始められる", options: { bullet: true, breakLine: true } },
        { text: "展開実績 500万㎡（サッカー場932面分）", options: { bullet: true, breakLine: true } },
        { text: "もてぎサーキットで高速走行車両からのオンボード映像伝送を実証（弊社ニュースリリース）", options: { bullet: true } },
      ],
      { x: 1.0, y: 2.6, w: 5.5, h: 3.6, margin: 0, fontFace: FONT, fontSize: 12, color: C.gray, paraSpaceAfter: 10, lineSpacingMultiple: 1.25 }
    );
    // right: our assets
    card(s, 7.05, 1.9, 5.65, 4.55, C.navy);
    s.addText("弊社のアセット（隣の課で推進中）", { x: 7.35, y: 2.1, w: 5.0, h: 0.4, margin: 0, fontFace: FONT, fontSize: 15, bold: true, color: C.white });
    const assets = [
      ["検証ラボ", "FACE-1にCelona検証環境を構築（電波シールドテント＋アンリツ測定器）。顧客見学も可能"],
      ["PoCパッケージ", "コア＋屋外RAN＋アンテナのレンタルと、ローカル5G免許取得支援をセットで提供"],
      ["提案課題", "「高帯域・低遅延を活かすユースケース」の決め手に欠けていた —— 次頁がその答え"],
    ];
    assets.forEach((a, i) => {
      const y = 2.62 + i * 1.28;
      s.addText(a[0], { x: 7.35, y, w: 5.1, h: 0.35, margin: 0, fontFace: FONT, fontSize: 13, bold: true, color: C.orange });
      s.addText(a[1], { x: 7.35, y: y + 0.37, w: 5.15, h: 0.85, margin: 0, fontFace: FONT, fontSize: 11, color: C.ice, lineSpacingMultiple: 1.2 });
    });
    source(s, "出典：Celona公開情報、弊社ニュースリリース・社内資料");
    s.addNotes("1.5分。「箱(L5G)は用意できている。使い道が課題だった」と正直に言うと次のスライドが立つ。");
  }

  // =========================================================
  // 21. キラーユースケース
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "04｜ローカル5G");
    title(s, "フィジカルAIが、ローカル5Gのキラーユースケースになる");
    // the inversion
    card(s, 0.65, 1.8, 5.9, 1.6, C.white, C.line);
    s.addText("これまで", { x: 0.95, y: 1.98, w: 5.2, h: 0.35, margin: 0, fontFace: FONT, fontSize: 12, bold: true, color: C.grayLight });
    s.addText("「ローカル5Gありき」でユースケースを探す\n→ 帯域と投資を正当化する理由が弱い", { x: 0.95, y: 2.35, w: 5.3, h: 0.9, margin: 0, fontFace: FONT, fontSize: 12.5, color: C.gray, lineSpacingMultiple: 1.2 });
    s.addShape("rightArrow", { x: 6.62, y: 2.3, w: 0.55, h: 0.6, fill: { color: C.orange }, line: { type: "none" } });
    card(s, 7.25, 1.8, 5.45, 1.6, C.orangeSoft);
    s.addText("これから", { x: 7.55, y: 1.98, w: 4.8, h: 0.35, margin: 0, fontFace: FONT, fontSize: 12, bold: true, color: C.orange });
    s.addText("フィジカルAIが低遅延・上り帯域・移動性を\n「必要とする」—— 需要側から5Gを引っ張る", { x: 7.55, y: 2.35, w: 4.9, h: 0.9, margin: 0, fontFace: FONT, fontSize: 12.5, bold: true, color: C.navy, lineSpacingMultiple: 1.2 });
    // 4 use cases
    const ucs = [
      ["FaWarehouse_" + C.navy, "物流倉庫", "AMR/AGVの群制御、棚映像のAI検品、コネクテッドフォークリフト"],
      ["FaIndustry_" + C.navy, "製造", "外観検査カメラ×エッジAI、協働ロボット、設備の映像監視"],
      ["FaHardHat_" + C.navy, "建設・プラント", "建機の遠隔操縦、ドローンによる点検・測量、安全監視"],
      ["FaTree_" + C.navy, "地域・屋外", "防災監視、害獣対策ドローン、インフラ点検（→事例は後述）"],
    ];
    ucs.forEach((u, i) => {
      const x = 0.65 + i * 3.1;
      card(s, x, 3.85, 2.85, 2.55, C.iceTint);
      s.addShape("ellipse", { x: x + 0.3, y: 4.1, w: 0.7, h: 0.7, fill: { color: C.white }, line: { color: C.navy2, width: 1.25 } });
      s.addImage({ data: I[u[0]], x: x + 0.47, y: 4.27, w: 0.36, h: 0.36 });
      s.addText(u[1], { x: x + 0.3, y: 4.95, w: 2.3, h: 0.4, margin: 0, fontFace: FONT, fontSize: 14.5, bold: true, color: C.navy });
      s.addText(u[2], { x: x + 0.3, y: 5.35, w: 2.35, h: 1.0, margin: 0, fontFace: FONT, fontSize: 10.5, color: C.gray, lineSpacingMultiple: 1.2 });
    });
    s.addText("共通項：上り映像が太い／移動体が多い／遅延が読める必要がある —— まさにローカル5Gの得意領域", {
      x: 0.65, y: 6.6, w: 12.0, h: 0.42, margin: 0, fontFace: FONT, fontSize: 13, bold: true, color: C.orange,
    });
    s.addNotes("1.5分。本日の提案ストーリーの要。「売り物(5G)と使い道(フィジカルAI)が噛み合う」構図を強調。");
  }

  // =========================================================
  // 22. Divider 05
  // =========================================================
  divider("05", "中枢 — AI集中管理基盤", "エッジだけでは完結しない。集めて・学び直して・配る。\nKubernetesが「AIの運用」の共通基盤になる。", "FaCubes_" + C.white)
    .addNotes("セクション5: 5分");

  // =========================================================
  // 23. データフライホイール
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "05｜AI集中管理基盤");
    title(s, "フィジカルAIは「運用しながら賢くする」システム");
    // flywheel: edge -> collect -> central -> distribute -> edge
    card(s, 0.85, 2.0, 3.6, 2.1, C.navy);
    iconCircle(s, "FaRobot_" + C.white, 1.15, 2.25, 0.6, C.orange);
    s.addText("エッジ（現場）", { x: 1.9, y: 2.32, w: 2.4, h: 0.45, margin: 0, fontFace: FONT, fontSize: 14.5, bold: true, color: C.white });
    s.addText("ロボット・AMR・カメラが\n推論しながら稼働", { x: 1.15, y: 3.0, w: 3.0, h: 0.85, margin: 0, fontFace: FONT, fontSize: 11, color: C.ice, lineSpacingMultiple: 1.2 });
    card(s, 8.85, 2.0, 3.6, 2.1, C.navy);
    iconCircle(s, "FaDatabase_" + C.white, 9.15, 2.25, 0.6, C.navy2);
    s.addText("中央基盤", { x: 9.9, y: 2.32, w: 2.4, h: 0.45, margin: 0, fontFace: FONT, fontSize: 14.5, bold: true, color: C.white });
    s.addText("データ蓄積・再学習・評価\n（GPUクラスタ）", { x: 9.15, y: 3.0, w: 3.1, h: 0.85, margin: 0, fontFace: FONT, fontSize: 11, color: C.ice, lineSpacingMultiple: 1.2 });
    // arrows
    s.addShape("rightArrow", { x: 4.65, y: 2.35, w: 4.0, h: 0.55, fill: { color: C.orange }, line: { type: "none" } });
    s.addText("映像・走行ログ・失敗データを収集", { x: 4.65, y: 2.4, w: 4.0, h: 0.45, margin: 0, align: "center", fontFace: FONT, fontSize: 10.5, bold: true, color: C.white });
    s.addShape("leftArrow", { x: 4.65, y: 3.35, w: 4.0, h: 0.55, fill: { color: C.iceTint }, line: { color: C.line, width: 1 } });
    s.addText("改善したモデルを配信（OTA）", { x: 4.65, y: 3.4, w: 4.0, h: 0.45, margin: 0, align: "center", fontFace: FONT, fontSize: 10.5, bold: true, color: C.navy2 });
    // K8s roles
    s.addText("その中枢を担うのが Kubernetes", { x: 0.85, y: 4.45, w: 11.6, h: 0.45, margin: 0, fontFace: FONT, fontSize: 15, bold: true, color: C.navy });
    const roles = [
      ["GPUオーケストレーション", "学習・推論ジョブへのGPU割当を自動化（DRA、ギャングスケジューリング等が成熟）"],
      ["推論サービング", "モデルのバージョン管理・A/B展開・スケールを標準化"],
      ["フリート管理", "数十〜数百台のエッジ機器・ロボットへの一斉配信と監視"],
    ];
    roles.forEach((r, i) => {
      const x = 0.85 + i * 4.0;
      card(s, x, 4.95, 3.75, 1.6, C.iceTint);
      s.addText(r[0], { x: x + 0.25, y: 5.12, w: 3.25, h: 0.42, margin: 0, fontFace: FONT, fontSize: 12.5, bold: true, color: C.orange });
      s.addText(r[1], { x: x + 0.25, y: 5.55, w: 3.3, h: 0.9, margin: 0, fontFace: FONT, fontSize: 10.5, color: C.gray, lineSpacingMultiple: 1.2 });
    });
    s.addText("→ 「作って終わり」ではなく「回し続ける」インフラ —— ここがインフラ事業者の出番", {
      x: 0.85, y: 6.7, w: 11.6, h: 0.42, margin: 0, fontFace: FONT, fontSize: 13.5, bold: true, color: C.orange,
    });
    s.addNotes("2.5分。K8s導入シナリオの答え: 「AIの継続運用(MLOps/フリート管理)」が用途。NVIDIAの3コンピュータの①②に相当する話だと繋げる。");
  }

  // =========================================================
  // 24. K8s + simplyblock
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "05｜AI集中管理基盤");
    title(s, "弊社の強みの延長線 — 3Tier/HCI の「次」としてのK8s基盤");
    // left: our position
    card(s, 0.65, 1.9, 5.9, 4.5, C.iceTint);
    s.addText("インフラ提案の系譜", { x: 0.95, y: 2.1, w: 5.3, h: 0.4, margin: 0, fontFace: FONT, fontSize: 14.5, bold: true, color: C.navy });
    const steps2 = [
      ["3Tier（VMware）", "サーバ・SAN・NWの設計構築 —— 弊社の主戦場"],
      ["HCI（Nutanix）", "ストレージのSDS化・運用簡素化 —— 実績多数"],
      ["K8s＋SDS", "AI基盤の標準形。VMもKubeVirtで統合する流れ —— 同じお客様の「次の更改」で必ず出てくる"],
    ];
    steps2.forEach((st, i) => {
      const y = 2.62 + i * 1.2;
      s.addShape("ellipse", { x: 0.98, y: y + 0.06, w: 0.5, h: 0.5, fill: { color: i === 2 ? C.orange : C.navy2 }, line: { type: "none" } });
      s.addText(String(i + 1), { x: 0.98, y: y + 0.06, w: 0.5, h: 0.5, margin: 0, align: "center", valign: "middle", fontFace: "Arial", fontSize: 14, bold: true, color: C.white });
      s.addText(st[0], { x: 1.62, y, w: 4.6, h: 0.42, margin: 0, fontFace: FONT, fontSize: 13.5, bold: true, color: C.navy });
      s.addText(st[1], { x: 1.62, y: y + 0.42, w: 4.75, h: 0.7, margin: 0, fontFace: FONT, fontSize: 10.5, color: C.gray, lineSpacingMultiple: 1.15 });
    });
    // right: simplyblock
    card(s, 6.85, 1.9, 5.85, 4.5, C.navy);
    s.addText("ストレージの答え：simplyblock", { x: 7.15, y: 2.1, w: 5.2, h: 0.4, margin: 0, fontFace: FONT, fontSize: 14.5, bold: true, color: C.white });
    s.addText(
      [
        { text: "K8sネイティブなNVMe/TCP SDS（ベルリン発、SPDKベース）。カーネルバイパスでローカルNVMe並みの低遅延", options: { bullet: true, color: C.ice, breakLine: true } },
        { text: "Tier0（ローカルNVMe）→ Tier1（クラスタ）→ Tier2（S3）の自動階層化で容量とコストを最適化", options: { bullet: true, color: C.ice, breakLine: true } },
        { text: "LLM推論のKV Cacheを永続化・共有し、応答開始時間（TTFT）を大幅改善 —— AI推論基盤の差別化要素", options: { bullet: true, color: C.ice, breakLine: true } },
        { text: "Ceph比で軽量・NVMe特化。弊社がNS研向け調査で競合比較・評価済み", options: { bullet: true, color: C.orange, bold: true } },
      ],
      { x: 7.2, y: 2.6, w: 5.25, h: 3.6, margin: 0, fontFace: FONT, fontSize: 11.5, paraSpaceAfter: 9, lineSpacingMultiple: 1.25 }
    );
    source(s, "出典：simplyblock公開情報、弊社NS研向け調査資料（2026年3月）");
    s.addNotes("2.5分。聴衆(インフラ屋)への持ち帰り: 「K8sは畑違いの新技術ではなく、HCIで起きたSDS化の続き」という位置づけ。");
  }

  // =========================================================
  // 25. Divider 06
  // =========================================================
  divider("06", "まとめ — 3要素パッケージ構想", "エッジAI × ローカル5G × AI基盤。\nバラ売りせず「現場で動くAI一式」で提案する。", "FaFlagCheckered_" + C.white)
    .addNotes("セクション6: 4分");

  // =========================================================
  // 26. 3要素アーキテクチャ
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "06｜まとめ");
    title(s, "提案構想 — 3要素を1つのパッケージに");
    const layers = [
      ["FaMicrochip_" + C.white, "エッジ層（現場）", "ロボット・AMR・ドローン・カメラ ＋ SAKURA-II等のNPU", "数ms〜100msの自律制御・現場推論", "SAKURA-II実測／SO-101×SmolVLA検証", C.orange],
      ["FaBroadcastTower_" + C.white, "ネットワーク層（神経網）", "ローカル5G（Celona 5G LAN）", "移動体を切れずにつなぐ・上り映像・遅延設計", "Celona検証ラボ／PoCパッケージ", C.navy2],
      ["FaCubes_" + C.white, "基盤層（中枢）", "Kubernetes ＋ GPU ＋ simplyblock", "データ蓄積・再学習・モデル配信・フリート管理", "3Tier/HCI実績／SDS技術調査（NS研）", C.navy2],
    ];
    // header row for右列
    s.addText("弊社の裏付け", { x: 10.15, y: 1.72, w: 2.5, h: 0.35, margin: 0, fontFace: FONT, fontSize: 11.5, bold: true, color: C.orange, align: "center" });
    layers.forEach((l, i) => {
      const y = 2.1 + i * 1.5;
      card(s, 0.65, y, 9.2, 1.3, i === 0 ? C.navy : C.iceTint);
      iconCircle(s, l[0], 0.95, y + 0.3, 0.7, i === 0 ? C.orange : C.navy2);
      s.addText(l[1], { x: 1.85, y: y + 0.14, w: 3.3, h: 0.45, margin: 0, fontFace: FONT, fontSize: 14.5, bold: true, color: i === 0 ? C.white : C.navy });
      s.addText(l[2], { x: 1.85, y: y + 0.6, w: 3.6, h: 0.6, margin: 0, fontFace: FONT, fontSize: 10.5, color: i === 0 ? C.ice : C.gray, lineSpacingMultiple: 1.15 });
      s.addText(l[3], { x: 5.6, y, w: 4.0, h: 1.3, margin: 0, fontFace: FONT, fontSize: 11, color: i === 0 ? C.ice : C.gray, valign: "middle", lineSpacingMultiple: 1.2 });
      card(s, 10.05, y + 0.1, 2.65, 1.1, C.orangeSoft);
      s.addText(l[4], { x: 10.2, y: y + 0.15, w: 2.35, h: 1.0, margin: 0, fontFace: FONT, fontSize: 10, bold: true, color: C.navy, valign: "middle", lineSpacingMultiple: 1.2 });
      if (i < 2) {
        s.addShape("downArrow", { x: 5.0, y: y + 1.28, w: 0.35, h: 0.24, fill: { color: C.orange }, line: { type: "none" } });
        s.addShape("upArrow", { x: 5.45, y: y + 1.28, w: 0.35, h: 0.24, fill: { color: C.grayLight }, line: { type: "none" } });
      }
    });
    card(s, 0.65, 6.65, 12.0, 0.55, C.navy);
    s.addText("3つを個別に売らない。「現場で動くAI」を一式で提案する —— 各要素に弊社の検証実績という裏付けがある", {
      x: 1.0, y: 6.73, w: 11.3, h: 0.4, margin: 0, fontFace: FONT, fontSize: 12.5, bold: true, color: C.white, align: "center",
    });
    s.addNotes("2分。本日の結論スライド。右列の「裏付け」が単なる構想でない根拠。矢印は上り(データ収集)と下り(モデル配信)の双方向。");
  }

  // =========================================================
  // 27. 国内事例（秋田）
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "06｜まとめ");
    title(s, "国内でも動き始めている — 地域エッジAI実証（秋田）");
    // left: overview
    card(s, 0.65, 1.9, 6.9, 4.5, C.iceTint);
    s.addText("地域デジタルツイン × マルチエージェント協調AI", { x: 0.95, y: 2.1, w: 6.3, h: 0.4, margin: 0, fontFace: FONT, fontSize: 14.5, bold: true, color: C.navy });
    s.addText("総務省「地域社会DX推進パッケージ事業」応募案件（2026年・採択前）。秋田ケーブルテレビを代表に、弊社はアーキテクチャ設計・通信/MEC担当として参画。", {
      x: 0.95, y: 2.55, w: 6.35, h: 0.75, margin: 0, fontFace: FONT, fontSize: 11.5, color: C.gray, lineSpacingMultiple: 1.2,
    });
    const elems = [
      ["エッジ端末AI", "ドローン・ロボット＋専用推論チップ。物体検出・追跡・姿勢推定を数ms〜100msで並列実行"],
      ["地域共有MEC", "点群から地域デジタルツインを構築し、予測・シミュレーション・協調制御"],
      ["通信（協調AI）", "5G等でAI同士が推論結果を共有。AI on RAN / AI for RAN の技術指針獲得も狙う"],
    ];
    elems.forEach((e, i) => {
      const y = 3.5 + i * 0.95;
      s.addText(e[0], { x: 0.95, y, w: 1.85, h: 0.85, margin: 0, fontFace: FONT, fontSize: 12, bold: true, color: C.orange });
      s.addText(e[1], { x: 2.85, y: y - 0.02, w: 4.5, h: 0.9, margin: 0, fontFace: FONT, fontSize: 10.5, color: C.gray, lineSpacingMultiple: 1.15, valign: "top" });
    });
    // right: why (bear stats)
    card(s, 7.85, 1.9, 4.85, 4.5, C.navy);
    s.addText("なぜ地域で？ — 切実な社会課題", { x: 8.15, y: 2.1, w: 4.3, h: 0.4, margin: 0, fontFace: FONT, fontSize: 14, bold: true, color: C.white });
    s.addText("98件・108人", { x: 8.15, y: 2.6, w: 4.3, h: 0.6, margin: 0, fontFace: FONT, fontSize: 26, bold: true, color: C.orange });
    s.addText("秋田県のクマ人身被害（令和2〜6年度）。被害の約7割は日常生活の中で発生。2025年秋には市街地出没で小中高が臨時休校に。", {
      x: 8.15, y: 3.25, w: 4.25, h: 1.2, margin: 0, fontFace: FONT, fontSize: 11, color: C.ice, lineSpacingMultiple: 1.25,
    });
    s.addText("ユースケース", { x: 8.15, y: 4.6, w: 4.3, h: 0.35, margin: 0, fontFace: FONT, fontSize: 12, bold: true, color: C.orange });
    s.addText(
      [
        { text: "害獣対策：検知→予測→ドローン派遣→音・光で森へ誘導", options: { bullet: true, breakLine: true } },
        { text: "防災：逃げ遅れ把握・避難誘導支援", options: { bullet: true } },
      ],
      { x: 8.2, y: 4.98, w: 4.25, h: 1.3, margin: 0, fontFace: FONT, fontSize: 10.5, color: C.ice, paraSpaceAfter: 6, lineSpacingMultiple: 1.2 }
    );
    source(s, "出典：実証事業応募提案書（2026年7月・応募段階）。個人情報・詳細体制は割愛");
    s.addNotes("1.5分。「3要素パッケージ」の実地版がすでに提案として動いていることを示す。採択前である点は明確に伝える。");
  }

  // =========================================================
  // 28. 弊社の歩み
  // =========================================================
  {
    const s = baseSlide();
    kicker(s, "06｜まとめ");
    title(s, "弊社の歩みと、これから");
    // timeline
    const tl = [
      ["先期", "NS研向け技術調査", "EdgeCortix／simplyblockの市場・技術調査を受託・完遂", false],
      ["先期", "SAKURA-II 実機検証", "YOLO11mで低ジッター±0.2ms・平均10W未満を実測", false],
      ["今期", "VLA技術検証", "LeRobot SO-101×SmolVLAでボール把持を実証（自席で継続中）", false],
      ["今期", "ローカル5G体制", "Celona検証ラボ・PoCパッケージ（隣課と連携）", false],
      ["次", "3要素パッケージ", "リファレンス構成→統合デモ→顧客PoC提案へ", true],
    ];
    const lineY = 3.1;
    const cardW = 2.3, gap = 0.125;
    const startX = (W - (cardW * 5 + gap * 4)) / 2; // centered
    s.addShape("line", { x: startX + cardW / 2, y: lineY, w: (cardW + gap) * 4, h: 0, line: { color: C.line, width: 2 } });
    tl.forEach((t, i) => {
      const cx = startX + i * (cardW + gap) + cardW / 2;
      s.addShape("ellipse", { x: cx - 0.14, y: lineY - 0.14, w: 0.28, h: 0.28, fill: { color: t[3] ? C.orange : C.navy2 }, line: { type: "none" } });
      s.addText(t[0], { x: cx - 1.0, y: lineY - 0.75, w: 2.0, h: 0.4, margin: 0, align: "center", fontFace: FONT, fontSize: 12, bold: true, color: t[3] ? C.orange : C.grayLight });
      card(s, cx - cardW / 2, lineY + 0.35, cardW, 1.95, t[3] ? C.orangeSoft : C.iceTint);
      s.addText(t[1], { x: cx - cardW / 2 + 0.15, y: lineY + 0.5, w: cardW - 0.3, h: 0.65, margin: 0, fontFace: FONT, fontSize: 11.5, bold: true, color: C.navy, lineSpacingMultiple: 1.1 });
      s.addText(t[2], { x: cx - cardW / 2 + 0.15, y: lineY + 1.15, w: cardW - 0.28, h: 1.05, margin: 0, fontFace: FONT, fontSize: 9.5, color: C.gray, lineSpacingMultiple: 1.15 });
    });
    card(s, 0.65, 5.75, 12.0, 1.05, C.navy);
    s.addText(
      [
        { text: "全社のAI技術獲得ロードマップ（STEP0：K8s基礎 → STEP1：AIOps → STEP2：推論基盤 → STEP3：AIグリッド）とも整合。", options: { color: C.ice, breakLine: true } },
        { text: "フィジカルAIは、STEP2「推論基盤」を現場側から引っ張る需要ドライバー", options: { color: C.orange, bold: true } },
      ],
      { x: 1.0, y: 5.95, w: 11.3, h: 0.7, margin: 0, fontFace: FONT, fontSize: 12.5, align: "center", lineSpacingMultiple: 1.3 }
    );
    s.addNotes("1.5分。個人の取り組みを会社のロードマップに接続して締める。次アクション(リファレンス構成づくり)への協力・巻き込みを呼びかける。");
  }

  // =========================================================
  // 29. まとめ & Q&A
  // =========================================================
  {
    const s = baseSlide({ dark: true });
    kicker(s, "SUMMARY & Q&A", true);
    title(s, "本日のまとめ", true);
    const takeaways = [
      ["1", "フィジカルAIは「第3の波」", "市場は兆円規模へ。要素技術（VLA・エッジNPU）はこの1〜2年で急速に民主化した"],
      ["2", "弊社は3要素すべてに実績の種がある", "エッジAI（SAKURA-II実測・SO-101検証）×ローカル5G（Celonaラボ）×AI基盤（HCI実績・SDS調査）"],
      ["3", "バラ売りせず、一式で価値を訴求する", "小さな検証を重ね、「現場で動くAIパッケージ」としてリファレンス構成→デモ→顧客PoCへ"],
    ];
    takeaways.forEach((t, i) => {
      const y = 1.75 + i * 1.35;
      card(s, 0.65, y, 12.0, 1.15, C.navy2);
      s.addShape("ellipse", { x: 0.95, y: y + 0.28, w: 0.6, h: 0.6, fill: { color: C.orange }, line: { type: "none" } });
      s.addText(t[0], { x: 0.95, y: y + 0.28, w: 0.6, h: 0.6, margin: 0, align: "center", valign: "middle", fontFace: "Arial", fontSize: 18, bold: true, color: C.white });
      s.addText(t[1], { x: 1.8, y: y + 0.14, w: 10.6, h: 0.45, margin: 0, fontFace: FONT, fontSize: 16, bold: true, color: C.white });
      s.addText(t[2], { x: 1.8, y: y + 0.6, w: 10.7, h: 0.45, margin: 0, fontFace: FONT, fontSize: 11.5, color: C.ice });
    });
    iconCircle(s, "FaComments_" + C.white, 0.85, 6.05, 0.75, C.orange);
    s.addText(
      [
        { text: "Q&A・ディスカッション（15分）", options: { bold: true, color: C.white, fontSize: 18, breakLine: true } },
        { text: "「この業界のこの現場なら刺さりそう」というアイデアを、ぜひ聞かせてください。SO-101の実機デモは私の席でいつでも。", options: { color: C.ice, fontSize: 12.5 } },
      ],
      { x: 1.8, y: 6.0, w: 10.8, h: 0.95, margin: 0, fontFace: FONT, lineSpacingMultiple: 1.3 }
    );
    s.addNotes("2分でまとめ→Q&A15分。想定問答: ①費用感は? ②Wi-Fi 6Eではだめ? ③K8sの学習コストは? ④SAKURA-IIとJetsonどちらを推す? を準備しておく。");
  }

  const outPath = path.resolve(__dirname, "フィジカルAI社内勉強会_ドラフト_v1.pptx");
  await pres.writeFile({ fileName: outPath });
  console.log("written:", outPath, "slides:", pageNo);
}

main().catch((e) => { console.error(e); process.exit(1); });
