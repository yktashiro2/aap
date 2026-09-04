// Kubernetes Ingress 通信イメージ スライド生成スクリプト
// 実行: node docs/k8s_ingress_diagram.js  → docs/k8s_ingress_diagram.pptx
const path = require('path');
const pptxgen = require('pptxgenjs');

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
const FONT = 'Meiryo UI';

// 配色(元スライドに合わせる)
const C = {
  navy: '1F5AA6', navyDark: '173F7A', white: 'FFFFFF', text: '1F2937',
  podBand: 'FCE4EC', svcBand: 'DAEAF7', nodeBand: 'F6C6C2', node: 'F19C93',
  yellow: 'FFD966', blue: '5AAEE0', orange: 'EE8C6C', green: '8FD14F',
  teal: '00897B', tealLight: '80CBC4', arrow: '2E5FA3', red: 'E53935', gray: '9CA3AF', codeBg: 'F3F4F6',
};

function box(slide, text, x, y, w, h, o = {}) {
  const opts = {
    x, y, w, h, shape: pres.ShapeType.roundRect, rectRadius: o.r ?? 0.08,
    fill: { color: o.fill ?? C.yellow },
    line: o.line ?? { color: o.fill ?? C.yellow, width: 0.75 },
    fontFace: FONT, fontSize: o.fs ?? 9, color: o.color ?? C.text, bold: o.bold ?? false,
    align: o.align ?? 'center', valign: 'middle', margin: o.margin ?? 2, isTextBox: true,
  };
  if (o.shadow) opts.shadow = { type: 'outer', color: '000000', blur: 3, offset: 2, angle: 45, opacity: 0.25 };
  slide.addText(text, opts);
}
function label(slide, text, x, y, w, h, o = {}) {
  slide.addText(text, {
    x, y, w, h, fontFace: FONT, fontSize: o.fs ?? 9, color: o.color ?? C.text, bold: o.bold ?? false,
    align: o.align ?? 'center', valign: o.valign ?? 'middle', margin: 0, isTextBox: true,
  });
}
// 矢印: (x1,y1) → (x2,y2)。矢印の先端は終点側。
function arrow(slide, x1, y1, x2, y2, o = {}) {
  const x = Math.min(x1, x2), y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
  // pptxgenjs の線は左上→右下。向きが違う場合は反転する。
  const flipH = x2 < x1, flipV = y2 < y1;
  slide.addShape(pres.ShapeType.line, {
    x, y, w, h, flipH, flipV,
    line: { color: o.color ?? C.arrow, width: o.width ?? 1.75, endArrowType: 'triangle', dashType: o.dash ?? 'solid' },
  });
}
function numCircle(slide, n, x, y) {
  slide.addText(String(n), {
    x, y, w: 0.27, h: 0.27, shape: pres.ShapeType.ellipse, fill: { color: C.white },
    line: { color: C.arrow, width: 1.25 }, fontFace: FONT, fontSize: 9, bold: true, color: C.arrow,
    align: 'center', valign: 'middle', margin: 0, isTextBox: true,
  });
}
function chrome(slide, title, pageNo) {
  slide.background = { color: C.white };
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.85, fill: { color: C.navy }, line: { color: C.navy } });
  slide.addText(title, { x: 0.35, y: 0.08, w: 12.6, h: 0.7, fontFace: FONT, fontSize: 24, bold: true, color: C.white, valign: 'middle', margin: 0, isTextBox: true });
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 7.12, w: 13.333, h: 0.38, fill: { color: C.navy }, line: { color: C.navy } });
  slide.addText('©Sojitz Tech-Innovation Co., Ltd. All Rights Reserved', { x: 0.35, y: 7.12, w: 8, h: 0.38, fontFace: FONT, fontSize: 8, color: C.white, valign: 'middle', margin: 0, isTextBox: true });
  slide.addText(String(pageNo), { x: 12.3, y: 7.12, w: 0.7, h: 0.38, fontFace: FONT, fontSize: 9, color: C.white, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
}

// ============ スライド1: 通信イメージ(Ingress利用) ============
{
  const s = pres.addSlide();
  chrome(s, 'ユーザPodへの通信イメージ:外部から通信(Ingress利用)', 52);
  s.addNotes('スライド51(NodePort方式)のIngress版。外部からの入口をIngress Controller用のNodePort 1つに集約し、Ingressリソースのルール(ホスト名/パス)でWeb-App Serviceへ転送する。');

  // 外枠
  s.addShape(pres.ShapeType.rect, { x: 0.3, y: 1.0, w: 12.73, h: 5.97, fill: { color: C.white }, line: { color: '6B7280', width: 0.75 } });

  // レイヤーラベル
  label(s, 'Pod', 0.35, 1.1, 0.95, 1.7, { fs: 10 });
  label(s, 'Services\n(ClusterIP)', 0.35, 2.9, 0.95, 0.95, { fs: 10 });
  label(s, 'ノード階層', 0.35, 3.95, 0.95, 1.35, { fs: 10 });
  label(s, '外部\nロードバランサ', 0.35, 5.75, 0.95, 1.15, { fs: 9 });

  // 帯
  s.addShape(pres.ShapeType.roundRect, { x: 1.3, y: 1.1, w: 11.65, h: 1.7, rectRadius: 0.12, fill: { color: C.podBand }, line: { color: C.podBand } });
  s.addShape(pres.ShapeType.roundRect, { x: 1.3, y: 2.9, w: 11.65, h: 0.95, rectRadius: 0.12, fill: { color: C.svcBand }, line: { color: C.svcBand } });
  s.addShape(pres.ShapeType.roundRect, { x: 1.3, y: 3.95, w: 11.65, h: 1.35, rectRadius: 0.12, fill: { color: C.nodeBand }, line: { color: C.nodeBand } });

  // --- Pod層 ---
  label(s, 'IPレンジ:192.168.0.0/16(クラスタ構成時指定無しのデフォルト)', 8.0, 1.13, 4.9, 0.3, { fs: 8, align: 'right' });
  box(s, 'etcd', 1.5, 1.3, 1.0, 0.5);
  box(s, 'Kube-apiserver', 2.6, 1.3, 1.2, 0.5);
  box(s, 'Kube-controller', 1.5, 1.95, 1.15, 0.5);
  box(s, 'Kube-scheduler', 2.75, 1.95, 1.15, 0.5);
  box(s, 'CoreDNS', 4.0, 1.95, 0.9, 0.5);

  // Ingress Controller Pod(新規)
  box(s, 'Ingress Controller\n(ingress-nginx) Pod\nクラスタ内リバースプロキシ', 8.0, 1.5, 1.8, 0.85,
    { fill: C.teal, color: C.white, bold: true, fs: 8.5, line: { color: C.navyDark, width: 1.5 }, shadow: true });

  // Web-App Pod ×2(赤破線枠)
  for (const px of [10.25, 11.65]) {
    s.addShape(pres.ShapeType.rect, { x: px - 0.07, y: 1.55, w: 1.34, h: 0.84, fill: { type: 'none' }, line: { color: C.red, width: 1.5, dashType: 'dash' } });
    box(s, 'Web-App\n(nginx)', px, 1.62, 1.2, 0.7);
  }

  // 中央の説明(緑吹き出し)
  s.addText([
    { text: 'Ingress = クラスタ内のリバースプロキシ(L7)', options: { bold: true, breakLine: true } },
    { text: '① 利用者 → HAProxy(VIP)', options: { breakLine: true } },
    { text: '② Worker の NodePort:30080(Ingress Controller用)', options: { breakLine: true } },
    { text: '③ kube-proxy(iptables DNAT)で Ingress Controller Pod へ', options: { breakLine: true } },
    { text: '④ Ingressリソースのルール(ホスト名/パス)を評価', options: { breakLine: true } },
    { text: '⑤ Web-App Service(ClusterIP)へ転送', options: { breakLine: true } },
    { text: '⑥ Web-App Pod へ到達', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true } },
    { text: '【ポイント】', options: { bold: true, breakLine: true } },
    { text: '外部に開ける NodePort は Ingress 用の1つだけ。アプリ追加は Ingress リソースの追加のみで、HAProxy 設定は不変。TLS終端・証明書管理も Ingress に集約できる。', options: { color: 'B71C1C', bold: true } },
  ], {
    x: 5.05, y: 1.15, w: 2.8, h: 2.6, shape: pres.ShapeType.roundRect, rectRadius: 0.08,
    fill: { color: C.green }, line: { color: '6AA83A', width: 1 }, fontFace: FONT, fontSize: 7.5, color: C.text,
    align: 'left', valign: 'top', margin: 5, paraSpaceAfter: 1, isTextBox: true,
  });

  // --- Services層 ---
  box(s, '10.96.0.1/12\n(Port:443)', 1.5, 3.05, 1.5, 0.65, { fill: C.blue });
  label(s, 'IPレンジ:10.96.0.0/12\n(デフォルト)', 3.1, 3.05, 1.85, 0.65, { fs: 8 });
  box(s, 'ingress-nginx-controller\nService(NodePort)\n30080 / 30443', 7.95, 3.0, 1.85, 0.75, { fill: C.tealLight, fs: 8, bold: true });
  box(s, 'Web-App Service(ClusterIP)\n10.105.122.217 (Port:80)', 10.3, 3.0, 2.55, 0.75, { fill: C.blue, fs: 8.5 });

  // --- ノード階層 ---
  const nodes = [
    { name: 'Master#1', ip: '10.1.12.83' }, { name: 'Master#2', ip: '10.1.12.84' }, { name: 'Master#3', ip: '10.1.12.85' },
    { name: 'Worker#1', ip: '10.1.12.86:30080\n(Ingress用NodePort)' }, { name: 'Worker#2', ip: '10.1.12.87:30080\n(Ingress用NodePort)' },
  ];
  const nx = [1.5, 3.78, 6.06, 8.34, 10.62];
  nodes.forEach((n, i) => {
    const x = nx[i];
    s.addShape(pres.ShapeType.roundRect, { x, y: 4.02, w: 2.2, h: 1.2, rectRadius: 0.1, fill: { color: C.node }, line: { color: C.node } });
    box(s, 'kubelet', x + 0.08, 4.1, 0.7, 0.42, { fill: C.orange, fs: 8.5 });
    box(s, 'コンテナランタイム\n(Containerd)', x + 0.85, 4.1, 1.27, 0.42, { fill: C.orange, fs: 7 });
    label(s, n.name, x, 4.62, 2.2, 0.35, { fs: 10.5 });
    s.addShape(pres.ShapeType.ellipse, { x: x + 1.0, y: 5.1, w: 0.2, h: 0.2, fill: { color: C.arrow }, line: { color: C.arrow } });
    label(s, n.ip, x, 5.32, 2.2, 0.42, { fs: i >= 3 ? 8 : 9, bold: i >= 3 });
  });

  // --- 外部LB ---
  s.addText([
    { text: 'プロキシのルールを作っておく', options: { bold: true, breakLine: true } },
    { text: '10.1.12.81:80', options: { bold: true, breakLine: true } },
    { text: '→ 10.1.12.86:30080 / 10.1.12.87:30080', options: { bold: true, breakLine: true } },
    { text: '※転送先は Ingress Controller のみ。', options: { breakLine: true } },
    { text: '　アプリを増やしても HAProxy 設定は変えない', options: {} },
  ], {
    x: 1.3, y: 5.78, w: 3.4, h: 1.12, shape: pres.ShapeType.roundRect, rectRadius: 0.08,
    fill: { color: C.green }, line: { color: '6AA83A', width: 1 }, fontFace: FONT, fontSize: 8, color: C.text,
    align: 'left', valign: 'middle', margin: 5, isTextBox: true,
  });
  box(s, 'LoadBalancer (Rocky9)\nHAProxy', 5.6, 6.0, 3.2, 0.6, { fill: C.blue, fs: 10, shadow: true });
  label(s, 'VIP: 10.1.12.81:80', 5.6, 6.62, 2.4, 0.3, { fs: 9, align: 'left', bold: true });

  // 利用者アイコン(図形)
  s.addShape(pres.ShapeType.ellipse, { x: 12.32, y: 5.92, w: 0.34, h: 0.34, fill: { color: C.navyDark }, line: { color: C.navyDark } });
  s.addShape(pres.ShapeType.roundRect, { x: 12.2, y: 6.28, w: 0.58, h: 0.42, rectRadius: 0.12, fill: { color: C.navyDark }, line: { color: C.navyDark } });
  label(s, '利用者', 12.0, 6.72, 0.98, 0.22, { fs: 8 });
  label(s, 'http://webapp.example.com\n(DNS → VIP 10.1.12.81)', 9.6, 5.78, 2.55, 0.42, { fs: 8, align: 'right' });

  // --- 経路の矢印 ---
  arrow(s, 12.15, 6.3, 8.85, 6.3);                 // ① 利用者 → HAProxy
  numCircle(s, 1, 10.35, 6.36);
  arrow(s, 7.5, 6.0, 9.44, 5.22);                  // ② HAProxy → Worker#1
  arrow(s, 8.2, 6.0, 11.72, 5.22);                 // ② HAProxy → Worker#2
  numCircle(s, 2, 8.3, 5.55);
  arrow(s, 9.2, 3.95, 8.75, 3.76);                 // ③ Worker#1 → Ingress Service
  arrow(s, 11.2, 3.95, 9.65, 3.76);                // ③ Worker#2 → Ingress Service
  numCircle(s, 3, 7.62, 3.48);
  arrow(s, 8.9, 3.0, 8.9, 2.36);                   // ④ Service → Ingress Pod
  numCircle(s, 4, 9.0, 2.5);
  arrow(s, 9.6, 2.35, 11.0, 3.0);                  // ⑤ Ingress Pod → Web-App Service
  numCircle(s, 5, 10.5, 2.35);
  arrow(s, 10.9, 3.0, 10.87, 2.4);                 // ⑥ Web-App Service → Pod#1
  arrow(s, 12.0, 3.0, 12.25, 2.4);                 // ⑥ Web-App Service → Pod#2
  numCircle(s, 6, 12.55, 2.55);
}

// ============ スライド2: NodePort方式 と Ingress方式 の比較 ============
{
  const s = pres.addSlide();
  chrome(s, 'NodePort方式 と Ingress方式 の比較', 53);
  s.addNotes('NodePort方式は検証・小規模向け。複数アプリを公開する大規模環境ではIngress方式で入口を集約する。');

  const card = (x, title, headFill, items) => {
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.1, w: 6.0, h: 2.75, rectRadius: 0.1, fill: { color: 'F9FAFB' }, line: { color: 'D1D5DB', width: 1 } });
    s.addText(title, { x: x + 0.15, y: 1.2, w: 5.7, h: 0.45, shape: pres.ShapeType.roundRect, rectRadius: 0.06, fill: { color: headFill }, fontFace: FONT, fontSize: 14, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    s.addText(items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })),
      { x: x + 0.2, y: 1.75, w: 5.6, h: 2.0, fontFace: FONT, fontSize: 10.5, color: C.text, valign: 'top', margin: 2, paraSpaceAfter: 4, isTextBox: true });
  };
  card(0.5, 'NodePort方式(スライド51)', '6B7280', [
    'アプリ毎に NodePort(30000-32767)を1つ消費し、全ノードでポートを開ける',
    'アプリを追加するたびに HAProxy の転送ルール(backend)を追加・変更する必要がある',
    'L4(TCP)転送のみ。ホスト名やURLパスによる振り分けはできない',
    'TLS 終端はアプリ側 or HAProxy 側でアプリ毎に個別対応',
    '検証・小規模環境向け。構成が単純で理解しやすい',
  ]);
  card(6.83, 'Ingress方式(スライド52)', C.teal, [
    '外部からの入口は Ingress Controller 用の NodePort(30080/30443)1組だけ',
    'アプリ追加は Ingress リソース(YAML)の追加のみ。HAProxy 設定は変更不要',
    'L7(HTTP)ルーティング。ホスト名(webapp.example.com)や URL パスで Service へ振り分け',
    'TLS 終端・証明書(Secret)管理を Ingress に集約できる',
    '複数アプリを公開する本番・大規模環境向け。Ingress Controller の導入・運用が追加で必要',
  ]);

  // YAML 例
  label(s, 'Ingress リソース定義例(webapp.example.com → Service web-app:80)', 0.5, 4.0, 6.0, 0.3, { fs: 10.5, bold: true, align: 'left' });
  const yaml = [
    'apiVersion: networking.k8s.io/v1', 'kind: Ingress', 'metadata:', '  name: web-app', 'spec:',
    '  ingressClassName: nginx', '  rules:', '  - host: webapp.example.com', '    http:', '      paths:',
    '      - path: /', '        pathType: Prefix', '        backend:', '          service:', '            name: web-app',
    '            port:', '              number: 80',
  ];
  s.addText(yaml.map((t, i) => ({ text: t, options: { breakLine: i < yaml.length - 1 } })), {
    x: 0.5, y: 4.33, w: 6.0, h: 2.62, shape: pres.ShapeType.roundRect, rectRadius: 0.06, fill: { color: C.codeBg }, line: { color: 'D1D5DB', width: 0.75 },
    fontFace: 'Courier New', fontSize: 8, color: C.text, valign: 'top', margin: 6, isTextBox: true,
  });

  // 検証環境での導入手順
  label(s, '検証環境への導入イメージ', 6.83, 4.0, 6.0, 0.3, { fs: 10.5, bold: true, align: 'left' });
  const steps = [
    'ingress-nginx を導入(Service type: NodePort、30080/30443 を固定)',
    'HAProxy の backend を 10.1.12.86:30080 / 10.1.12.87:30080 に変更(以後は変更しない)',
    'Web-App(nginx) の Deployment と Service(ClusterIP:80)を作成',
    'Ingress リソース(左記 YAML)を適用し、host → Service の対応を登録',
    'DNS または hosts に webapp.example.com → 10.1.12.81 を登録',
    '動作確認: curl -H "Host: webapp.example.com" http://10.1.12.81/',
  ];
  s.addText(steps.map((t, i) => ({ text: t, options: { bullet: { type: 'number' }, breakLine: i < steps.length - 1 } })), {
    x: 6.83, y: 4.33, w: 6.0, h: 2.62, shape: pres.ShapeType.roundRect, rectRadius: 0.06, fill: { color: 'F9FAFB' }, line: { color: 'D1D5DB', width: 0.75 },
    fontFace: FONT, fontSize: 10, color: C.text, valign: 'top', margin: 6, paraSpaceAfter: 3, isTextBox: true,
  });
}

const out = path.join(__dirname, 'k8s_ingress_diagram.pptx');
pres.writeFile({ fileName: out }).then((f) => console.log('written:', f));
