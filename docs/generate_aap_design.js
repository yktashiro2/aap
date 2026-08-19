// RedHat Ansible Automation Platform 基本設計書 生成スクリプト
// 実行方法: NODE_PATH=<docxパッケージのnode_modules> node generate_aap_design.js
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, ShadingType, BorderStyle,
  TableOfContents, PageBreak, Footer, Header, PageNumber, LevelFormat,
  VerticalAlign,
} = require('docx');
const fs = require('fs');

// ---------- 基本設定 ----------
const FONT_BODY = { ascii: 'Times New Roman', hAnsi: 'Times New Roman', eastAsia: 'ＭＳ 明朝' };
const FONT_GOTHIC = { ascii: 'Arial', hAnsi: 'Arial', eastAsia: 'ＭＳ ゴシック' };
const SZ_BODY = 21;   // 10.5pt
const SZ_TABLE = 18;  // 9pt
const TABLE_WIDTH = 9026; // A4本文幅(DXA)

// ---------- ヘルパー ----------
const P = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text, font: FONT_BODY, size: opts.size || SZ_BODY, bold: opts.bold })],
  alignment: opts.align,
  spacing: { after: opts.after ?? 60 },
  indent: opts.indent,
});

const EMPTY = (n = 1) => Array.from({ length: n }, () => new Paragraph({ children: [] }));

const H1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  numbering: { reference: 'heading-numbering', level: 0 },
  children: [new TextRun({ text: '　' + text })],
});
const H2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  numbering: { reference: 'heading-numbering', level: 1 },
  children: [new TextRun({ text: '　' + text })],
});
const H3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  numbering: { reference: 'heading-numbering', level: 2 },
  children: [new TextRun({ text: '　' + text })],
});

const BULLET = (text) => new Paragraph({
  children: [new TextRun({ text, font: FONT_BODY, size: SZ_BODY })],
  numbering: { reference: 'bullet-list', level: 0 },
  spacing: { after: 60 },
});

// ラベル段落(■見出し等)
const LABEL = (text) => new Paragraph({
  children: [new TextRun({ text, font: FONT_GOTHIC, size: SZ_BODY, bold: true })],
  spacing: { before: 120, after: 60 },
});

const cell = (text, { width, fill, bold } = {}) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  shading: fill ? { fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
  verticalAlign: VerticalAlign.CENTER,
  margins: { top: 40, bottom: 40, left: 80, right: 80 },
  children: [new Paragraph({
    children: [new TextRun({ text: String(text), font: FONT_BODY, size: SZ_TABLE, bold })],
  })],
});

// headers: string[], rows: string[][], widths: number[] (合計 = TABLE_WIDTH)
const tbl = (headers, rows, widths) => new Table({
  columnWidths: widths,
  width: { size: TABLE_WIDTH, type: WidthType.DXA },
  rows: [
    new TableRow({
      tableHeader: true,
      children: headers.map((h, i) => cell(h, { width: widths[i], fill: 'D9E2F3', bold: true })),
    }),
    ...rows.map(r => new TableRow({
      children: r.map((c, i) => cell(c, { width: widths[i] })),
    })),
  ],
});

const SP = () => new Paragraph({ children: [], spacing: { after: 120 } });

// ---------- 表紙 ----------
const cover = [
  new Table({
    columnWidths: [2600, 3200],
    width: { size: 5800, type: WidthType.DXA },
    alignment: AlignmentType.RIGHT,
    rows: [
      new TableRow({ children: [cell('文書管理番号', { width: 2600, fill: 'F2F2F2' }), cell('xxxx-xxxx-xxxx', { width: 3200 })] }),
      new TableRow({ children: [cell('版数', { width: 2600, fill: 'F2F2F2' }), cell('0.1版', { width: 3200 })] }),
    ],
  }),
  ...EMPTY(2),
  P('xxxxxx様 御中', { size: 24 }),
  ...EMPTY(6),
  new Paragraph({
    children: [new TextRun({ text: 'RedHat Ansible Automation Platform', font: FONT_GOTHIC, size: 40, bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: '基本設計書', font: FONT_GOTHIC, size: 48, bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }),
  ...EMPTY(8),
  P('2026年xx月xx日', { align: AlignmentType.CENTER, size: 24 }),
  ...EMPTY(4),
  P('双日テックイノベーション株式会社', { align: AlignmentType.CENTER, size: 24 }),
  P('ネットワークインテグレーション事業本部', { align: AlignmentType.CENTER, size: 24 }),
  P('第二技術部', { align: AlignmentType.CENTER, size: 24 }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- 目次 ----------
const toc = [
  new Paragraph({
    children: [new TextRun({ text: '目次', font: FONT_GOTHIC, size: 28, bold: true })],
    spacing: { after: 240 },
  }),
  new TableOfContents('目次', { hyperlink: true, headingStyleRange: '1-3' }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- はじめに ----------
const introduction = [
  new Paragraph({
    children: [new TextRun({ text: 'はじめに', font: FONT_GOTHIC, size: 28, bold: true })],
    spacing: { after: 240 },
  }),
  LABEL('本書の目的と概要'),
  P('本書は、xxxxxx様(以下、xxxxxx様)と双日テックイノベーション株式会社(以下、Stech I)がxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx運用自動化基盤(RedHat Ansible Automation Platform)の基本設計を行った資料である。'),
  SP(),
  LABEL('本書の位置づけ'),
  P('＜その他設計書との位置づけの相関を表現＞'),
  SP(),
  LABEL('用語の定義'),
  tbl(
    ['No', '用語', '意味'],
    [
      ['1', 'AAP', 'RedHat Ansible Automation Platformの略称。Ansibleによる自動化をエンタープライズ向けに統合したプラットフォーム製品。'],
      ['2', 'Platform Gateway', 'AAP 2.5より導入された、各コンポーネントへのアクセスを一元化する統合Web UI/API/認証の入口となるコンポーネント。'],
      ['3', 'Automation Controller', 'ジョブ実行の管理・制御を行うAAPの中核コンポーネント。旧Ansible Tower。'],
      ['4', 'Automation Hub', 'Ansibleコンテンツ(Collection)およびコンテナイメージを管理・配布するプライベートリポジトリ。'],
      ['5', 'EDA', 'Event-Driven Ansibleの略称。外部イベントを契機に自動化処理を実行する仕組み。'],
      ['6', 'EE', 'Execution Environmentの略称。Ansible実行環境をパッケージ化したコンテナイメージ。'],
      ['7', 'DE', 'Decision Environmentの略称。EDAのRulebookを実行するためのコンテナイメージ。'],
      ['8', 'Playbook', 'Ansibleの自動化処理をYAML形式で記述した定義ファイル。'],
      ['9', 'Rulebook', 'EDAにおけるイベントソース・条件・アクションをYAML形式で記述した定義ファイル。'],
      ['10', 'Inventory', 'Ansibleの管理対象ホストの一覧を定義したもの。'],
      ['11', 'Collection', 'Ansibleのモジュール・ロール・プラグイン等をまとめた配布単位。'],
      ['12', 'Podman', 'RedHat社が開発するデーモンレスのコンテナ実行エンジン。'],
      ['13', 'Receptor', 'Automation Meshを構成するノード間通信のオーバーレイネットワークソフトウェア。'],
    ],
    [700, 2400, 5926],
  ),
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({
    children: [new TextRun({ text: '改訂の履歴', font: FONT_GOTHIC, size: 28, bold: true })],
    spacing: { after: 240 },
  }),
  tbl(
    ['版数', '改訂日', '作成者', '承認者', '改訂内容'],
    [
      ['0.1', '2026/xx/xx', 'xxxx', 'xxxx', '初版作成'],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
    ],
    [1000, 1600, 1600, 1600, 3226],
  ),
  ...EMPTY(2),
  P('＜著作権通知＞'),
  P('＜本書の取り扱いについて＞'),
  P('本書は双日テックイノベーション株式会社の著作物であり、同社の営業秘密を含みます。'),
  P('同社の許可なく、本書の全部または一部について、方法、形態を問わず、複製、公衆送信、頒布、改変、切除等の行為を行うこと、および第三者に開示することはできません。Copyright ©2026 Sojitz Tech-Innovation Co., Ltd All Rights Reserved.'),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- 1. システム概要 ----------
const chapter1 = [
  H1('システム概要'),
  P('本章では、本システムの機能概要について記載する。'),
  H2('システム概要'),
  P('本システムは、システム運用の自動化を実現するための自動化実行基盤としてRedHat Ansible Automation Platform(以下、AAP)を構築するものである。'),
  P('物理サーバ上にOS(RedHat Enterprise Linux)を導入し、その上にAAP 2.5をContainerized形式(Podmanコンテナ)で構築することで、定型運用作業の自動実行、およびZabbix監視イベントを契機としたイベント駆動型の自動復旧を実現する運用自動化基盤を提供する。'),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- 2. AAP基盤構成要素 ----------
const comp = (title, lines) => [H3(title), ...lines.map(l => P(l))];

const chapter2 = [
  H1('AAP基盤構成要素'),
  P('本章では本システムで導入するAAPの構成要素について記載する。'),
  P('各構成要素にはAAPを構成する上で必須のコンポーネントと、要件に応じて導入を選択するOptionalのコンポーネントが存在するため、その区分についても併せて記載する。'),
  H2('AAP構成要素'),

  ...comp('Platform Gateway', [
    'Platform GatewayはAAP 2.5より導入された、AAPの各コンポーネント(Automation Controller/Automation Hub/EDA Controller)へのアクセスを一元化するコンポーネントとなります。【必須コンポーネント】',
    '利用者はPlatform Gatewayが提供する統合Web UIにアクセスすることで、単一のURL・単一の認証(シングルサインオン)で各コンポーネントを利用することが出来ます。',
    'また、ユーザー・チーム・Organizationといった認証認可情報はPlatform Gatewayで一元管理され、各コンポーネントへ連携されるものとなります。',
  ]),
  ...comp('Automation Controller', [
    'Automation ControllerはPlaybookの実行管理を担うAAPの中核コンポーネントとなります(旧称:Ansible Tower)。【必須コンポーネント】',
    'Web UI/REST APIを提供し、Job Templateによるジョブの定義・実行、実行結果の記録、スケジュール実行、RBACによる権限制御等の機能を提供します。',
    'Playbookの実行自体はExecution Environment(コンテナ)内で行われ、Automation Controllerはその実行制御・管理を担うものとなります。',
  ]),
  ...comp('Private Automation Hub', [
    'Private Automation HubはAnsibleコンテンツを組織内で一元管理・配布するためのプライベートリポジトリとなります。【Optionalコンポーネント】',
    'Ansible Content Collectionのリポジトリ機能と、Execution Environment/Decision Environment等のコンテナイメージを格納するコンテナレジストリ機能を提供します。',
    'インターネットへの接続が制限された環境や、組織内で独自開発したCollectionを配布する場合に導入するものとなります。',
  ]),
  ...comp('Event-Driven Ansible Controller', [
    'Event-Driven Ansible Controller(以下、EDA Controller)は、外部システムからのイベントを受信し、あらかじめ定義された条件に合致した場合に自動的にアクション(ジョブ実行等)を行うイベント駆動自動化のコンポーネントとなります。【Optionalコンポーネント】',
    'イベントソース・条件・アクションはRulebookとしてYAML形式で定義し、EDA ControllerにてRulebook Activationとして有効化することで動作します。',
    '本システムではZabbixからのWebhookイベントを受信し、障害復旧ジョブを自動起動するために利用します。',
  ]),
  ...comp('PostgreSQLデータベース', [
    'AAPの各コンポーネント(Platform Gateway/Automation Controller/Automation Hub/EDA Controller)の構成情報・ジョブ実行履歴等を格納するデータベースとなります。【必須コンポーネント】',
    'Containerized形式ではインストーラ同梱のPostgreSQLコンテナとしてデプロイする構成(Managed Database)と、外部の既存PostgreSQLデータベースを利用する構成が選択出来ます。',
    '本システムではインストーラ同梱のPostgreSQLコンテナを利用するものとします。',
  ]),
  ...comp('Redis', [
    'RedisはPlatform GatewayおよびEDA Controllerがキャッシュおよびメッセージング処理に利用するインメモリデータストアとなります。【必須コンポーネント】',
    'Containerized形式ではインストーラによりRedisコンテナとして自動的にデプロイされるものとなります。',
  ]),
  ...comp('Ansible Core', [
    'Ansible Coreは自動化処理を実行するAnsibleのエンジン本体となります。【必須コンポーネント】',
    'Playbookの解釈・実行、モジュールの管理対象ノードへの転送・実行を担います。',
    'AAP環境においてはExecution Environmentコンテナイメージ内に同梱される形で提供・実行されるものとなります。',
  ]),
  ...comp('Execution Environment(EE)', [
    'Execution Environment(EE)は、Ansible Core・Python・依存ライブラリ・Ansible Content Collectionを1つにパッケージ化したPlaybook実行用のコンテナイメージとなります。【必須コンポーネント】',
    '従来のvirtualenvによる実行環境管理と異なり、実行環境そのものをコンテナイメージとして管理することで、環境差異のない再現性の高いPlaybook実行を実現するものとなります。',
    'ジョブ実行時にはJob Templateに紐づけられたEEイメージからコンテナが起動され、その中でPlaybookが実行されます。',
  ]),
  ...comp('Decision Environment(DE)', [
    'Decision Environment(DE)は、EDAのRulebookを実行するためのansible-rulebookエンジンおよび依存コンポーネントをパッケージ化したコンテナイメージとなります。【EDA利用時に必須】',
    'Rulebook Activationを有効化すると、DEイメージからコンテナが起動されイベントの受信・評価が行われるものとなります。',
  ]),
  ...comp('Control Node / Execution Node / Hop Node', [
    'AAPのジョブ実行基盤を構成するノードには役割に応じて以下の種別が存在します。',
    'Control Node:Automation Controllerが稼働し、ジョブの制御・プロジェクト更新・管理ジョブを実行するノードとなります。',
    'Execution Node:ジョブ(Playbook)の実行のみを担うノードとなります。ジョブ実行キャパシティを拡張する際に追加するものとなります。【Optionalコンポーネント】',
    'Hop Node:ネットワークセグメントを跨いでExecution Nodeへジョブを中継するためのノードとなります。【Optionalコンポーネント】',
    '本システムは単一ノード構成のため、Control Nodeがジョブ実行も兼ねるHybrid構成として動作するものとなります。',
  ]),
  ...comp('Automation Mesh(Receptor)', [
    'Automation Meshは、Control Node・Execution Node・Hop Node間を接続しジョブを配送するオーバーレイネットワークの仕組みとなります。実体はReceptorと呼ばれるソフトウェアにより実現されます。【必須コンポーネント(単一ノード構成でも内部的に利用)】',
    'ノード間はTCP(デフォルト27199番ポート)で相互接続され、ジョブの配送・実行結果の回収が行われるものとなります。',
    '将来的にExecution Nodeを追加してスケールアウトする場合には、本Automation Meshに新規ノードを参加させる構成となります。',
  ]),
  ...comp('Podman(コンテナランタイム)', [
    '直接的にはAAPのコンポーネントではありませんが、Containerized形式のAAPの土台として必須となるソフトウェアコンポーネントとなります。【必須コンポーネント】',
    'PodmanはRedHat社が開発するデーモンレスのコンテナ実行エンジンであり、AAPの各コンポーネントはPodman上のコンテナとして稼働します。',
    'AAPの各コンテナは専用ユーザーによるRootlessコンテナとして稼働し、systemd(Quadlet)によりサービスとして管理されるものとなります。',
  ]),
  ...comp('Project', [
    'ProjectはPlaybook等の自動化コンテンツの取得元を定義するAutomation Controllerのリソースとなります。',
    '通常はGitリポジトリと連携し、リポジトリ上のPlaybookをジョブ実行時に取得する構成とすることで、自動化コンテンツのバージョン管理を実現します。',
  ]),
  ...comp('Inventory', [
    'Inventoryは自動化の対象となる管理対象ホストの一覧を定義するリソースとなります。',
    'ホストはグループとしてまとめて管理することができ、Playbook実行対象の指定に利用されます。',
    '静的な定義のほか、外部システム(仮想化基盤・クラウド・CMDB等)から動的にホスト情報を取得するDynamic Inventoryの構成も可能となります。',
  ]),
  ...comp('Credential', [
    'Credentialは管理対象ノードへの接続認証情報(SSH秘密鍵、パスワード等)や外部サービスの認証情報を管理するリソースとなります。',
    '認証情報はAutomation Controllerのデータベース内に暗号化されて格納され、利用者からは参照出来ない形でジョブ実行時にのみ利用されるため、認証情報の安全な一元管理を実現するものとなります。',
  ]),
  ...comp('Job Template', [
    'Job Templateは「どのPlaybookを」「どのInventoryに対して」「どのCredentialとEEを用いて」実行するかを定義したジョブの実行定義となります。',
    '利用者はJob Templateを実行することで、あらかじめ管理者が定義した安全な組み合わせでのみ自動化処理を実行出来るものとなります。',
  ]),
  ...comp('Workflow Job Template', [
    'Workflow Job Templateは複数のJob Templateを成功/失敗の条件分岐を含めて連結し、一連のワークフローとして実行するための定義となります。',
    '本システムではZabbix障害イベントを契機とした復旧処理のワークフロー実行に利用します。',
  ]),
  ...comp('Playbook', [
    'PlaybookはAnsibleにおける自動化処理の内容をYAML形式で記述した定義ファイルとなります。',
    '対象ホストに対して実行するタスクを宣言的に記述するものであり、Ansible自動化の中心となる成果物となります。',
  ]),
  ...comp('Rulebook', [
    'RulebookはEDAにおける自動化の定義ファイルであり、イベントソース(どこからイベントを受けるか)、条件(どのようなイベントに反応するか)、アクション(何を実行するか)をYAML形式で記述するものとなります。',
    '本システムではZabbixからのWebhookをイベントソースとし、特定の障害イベント発生時にWorkflow Job Templateを起動するRulebookを定義します。',
  ]),
  ...comp('Ansible Content Collections', [
    'Ansible Content Collectionsは、Ansibleのモジュール・ロール・プラグイン等をまとめてパッケージ化した配布単位となります。',
    'RedHat社およびパートナー認定のCollectionはRedHat社のAutomation Hub(console.redhat.com)から、コミュニティのCollectionはAnsible Galaxyから取得可能となります。',
  ]),
  ...comp('Organization・RBAC', [
    'OrganizationはAAPにおけるリソース管理の最上位の論理単位であり、ユーザー・チーム・Project・Inventory等のリソースはOrganization配下で管理されます。',
    'RBAC(Role Based Access Control)により、ユーザーおよびチームに対してリソース単位のロール(管理者/実行者/参照者等)を割り当てることで、最小権限の原則に基づいたアクセス制御を実現するものとなります。',
  ]),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- 3. AAP設計 ----------
const ifTable = (rows) => tbl(
  ['No', '連携元/NWカテゴリ', '連携先/NWカテゴリ', '連携タイミング'],
  rows,
  [700, 3000, 3000, 2326],
);

const chapter3 = [
  H1('AAP設計'),
  P('本章では本システムで導入するAAPの設計内容について記載する。'),

  H2('全体構成図'),
  P('本システムのAAP構成イメージ図を記載します。'),
  P('本システムは単一の物理サーバ上のRHELにAAP 2.5をContainerized形式で導入し、Platform Gateway/Automation Controller/Private Automation Hub/EDA Controller/PostgreSQL/Redisの全コンポーネントを同一ノード上のPodmanコンテナとして稼働させる構成(Growthトポロジー)とします。'),
  P('＜全体構成図を記載＞'),
  SP(),

  H2('ハードウェア設計'),
  H3('サーバーリソース設計'),
  P('AAPノードに必要とされるリソース設計について記載します。'),
  P('AAP 2.5 Containerized形式のGrowthトポロジー(全コンポーネント同居)におけるRedHat社推奨要件を基に、本システムでは将来のジョブ同時実行数増加を考慮したリソースを確保するものとします。'),
  tbl(
    ['No.', '区分', '必要リソース量(合計)'],
    [
      ['1', 'RedHat社最小要件', 'CPU:8vCPU以上 / メモリ:16GB以上 / ディスク:60GB以上(/var領域40GB以上)'],
      ['2', '本システム設計値', 'CPU:16vCPU / メモリ:32GB / ディスク:480GB(SSD)'],
    ],
    [700, 2800, 5526],
  ),
  SP(),
  H3('サーバーハードウェアスペック設計'),
  P('AAPノードのハードウェアスペックについて記載いたします。'),
  tbl(
    ['No.', '項目', 'スペック'],
    [
      ['1', '筐体', 'xxxxxxxx'],
      ['2', 'CPU', 'xxGHz xxCore x 1CPU(16スレッド以上)'],
      ['3', 'メモリ', '32GB'],
      ['4', 'ディスク', 'SSD 480GB x 2本(RAID1構成)'],
      ['5', 'RAIDコントローラ', 'xxxxxxxx'],
      ['6', 'NIC', '10GBASE-T x 2ポート(Teaming構成)'],
      ['7', '電源', '冗長電源(2系統)'],
      ['8', 'リモート管理', 'iLO/iDRAC等の管理ポート x 1'],
    ],
    [700, 2800, 5526],
  ),
  SP(),

  H2('ソフトウェア設計'),
  H3('ソフトウェア設計'),
  P('■AAPノード'),
  tbl(
    ['No.', '項目', '概要'],
    [
      ['1', 'RedHat Enterprise Linux 9.x(x86_64)', 'ホストOS。RedHat社サポートポリシーに基づき本番構築時点の最新マイナーバージョンを利用する。'],
      ['2', 'RedHat Ansible Automation Platform 2.5(Containerized)', '自動化プラットフォーム本体。Containerized Installerにより導入する。'],
      ['3', 'Podman 4.x以降', 'コンテナランタイム。AAP各コンポーネントのコンテナ実行基盤。'],
      ['4', 'PostgreSQL 15(コンテナ)', 'AAP構成情報格納用データベース。インストーラ同梱のコンテナを利用。'],
      ['5', 'Redis(コンテナ)', 'Platform Gateway/EDAが利用するキャッシュ・メッセージング。インストーラ同梱のコンテナを利用。'],
      ['6', 'ansible-core 2.16系(EE内)', '自動化エンジン。Execution Environmentイメージに同梱。'],
      ['7', 'chrony', 'NTP時刻同期クライアント。'],
    ],
    [700, 3400, 4926],
  ),
  SP(),

  H2('ネットワーク設計'),
  H3('物理ネットワーク構成'),
  P('本AAPノードの物理ネットワーク構成を記載します。'),
  P('AAPノードのNICは2ポートをTeaming(active-backup)構成とし、物理ネットワーク経路の冗長化を行うものとします。'),
  P('＜物理ネットワーク構成図を記載＞'),
  H3('論理ネットワーク構成'),
  P('本AAPノードの論理ネットワーク構成を記載します。'),
  P('AAPノードは運用管理セグメントに配置し、管理対象ノード・Zabbixサーバー・利用者端末との通信を行うものとします。'),
  P('＜論理ネットワーク構成図を記載＞'),
  H3('通信ポート設計'),
  P('AAPの各コンポーネントが利用する主要な通信ポートを記載します。利用者および外部システムからのアクセスはPlatform Gateway(443/TCP)およびEDA Webhook受信ポートに集約されるものとなります。'),
  tbl(
    ['No', 'ポート/プロトコル', '用途', 'アクセス元'],
    [
      ['1', '443/TCP', 'Platform Gateway(統合Web UI/API)', '利用者端末、外部システム'],
      ['2', '5000/TCP', 'EDA Webhookイベント受信', 'Zabbixサーバー'],
      ['3', '8443/TCP', 'Automation Controller(内部通信)', 'ノード内部(Gateway経由)'],
      ['4', '8444/TCP', 'Private Automation Hub(内部通信)', 'ノード内部(Gateway経由)'],
      ['5', '8445/TCP', 'EDA Controller(内部通信)', 'ノード内部(Gateway経由)'],
      ['6', '5432/TCP', 'PostgreSQL', 'ノード内部'],
      ['7', '6379/TCP', 'Redis', 'ノード内部'],
      ['8', '27199/TCP', 'Receptor(Automation Mesh)', 'Execution Node追加時のノード間通信'],
      ['9', '22/TCP', '管理対象ノードへのSSH接続', 'AAPノード → Linux管理対象ノード'],
      ['10', '5985・5986/TCP', '管理対象ノードへのWinRM接続', 'AAPノード → Windows管理対象ノード'],
    ],
    [700, 1800, 3800, 2726],
  ),
  SP(),

  H2('外部インタフェース設計'),
  H3('NTP時刻同期'),
  ifTable([['1', 'AAPノード/運用管理セグメント', 'NTPサーバー(xxxxxx)/運用管理セグメント', '常時(chronyによる定期同期)']]),
  H3('DNS名前解決'),
  ifTable([['1', 'AAPノード/運用管理セグメント', 'DNSサーバー(xxxxxx)/運用管理セグメント', '名前解決発生時(随時)']]),
  H3('RedHat社CDN・コンテナレジストリ連携'),
  P('AAPのインストールおよびアップデートの際には、RedHat社CDN(サブスクリプション/RPMパッケージ)およびコンテナレジストリ(registry.redhat.io)への接続が必要となります。'),
  ifTable([
    ['1', 'AAPノード/運用管理セグメント', 'RedHat CDN(cdn.redhat.com等)/インターネット', 'インストール時・アップデート時'],
    ['2', 'AAPノード/運用管理セグメント', 'registry.redhat.io/インターネット', 'インストール時・EE/DEイメージ取得時'],
  ]),
  H3('管理対象ノード連携'),
  ifTable([
    ['1', 'AAPノード/運用管理セグメント', 'Linux管理対象ノード(SSH:22)/各業務セグメント', 'ジョブ実行時'],
    ['2', 'AAPノード/運用管理セグメント', 'Windows管理対象ノード(WinRM:5985・5986)/各業務セグメント', 'ジョブ実行時'],
  ]),
  H3('Zabbix監視連携(EDA)'),
  ifTable([
    ['1', 'Zabbixサーバー/運用管理セグメント', 'AAPノード EDA Webhook(5000)/運用管理セグメント', '監視イベント(障害トリガー)発生時'],
    ['2', 'Zabbixサーバー/運用管理セグメント', 'AAPノード(監視対象として)/運用管理セグメント', '常時(監視ポーリング)'],
  ]),
  H3('Git リポジトリ連携'),
  ifTable([['1', 'AAPノード/運用管理セグメント', 'Gitリポジトリ(xxxxxx)/xxxxセグメント', 'Project同期時(ジョブ実行時・定期)']]),
  H3('SMTP通知連携'),
  ifTable([['1', 'AAPノード/運用管理セグメント', 'SMTPサーバー(xxxxxx)/運用管理セグメント', 'ジョブ実行結果通知時']]),
  SP(),

  H2('ジョブ実行設計'),
  P('本AAP上でのジョブ実行に関する方針を以下の通りとします。'),
  BULLET('ジョブはすべてAutomation ControllerのJob Template/Workflow Job Templateとして定義し、Playbookの直接実行は行わないものとします。'),
  BULLET('本システムは単一ノード構成のため、ジョブはデフォルトInstance Group(controlplane/default)上で実行するものとします。'),
  BULLET('ジョブの同時実行数はノードのメモリ・CPUリソースに基づきAutomation Controllerが自動算出するキャパシティに準ずるものとし、個別のジョブにはフォーク数(デフォルト:5)を必要に応じて設定します。'),
  BULLET('PlaybookはGitリポジトリでバージョン管理し、Project経由でジョブ実行時に最新リビジョンを取得する構成とします。'),
  BULLET('長時間実行ジョブによるリソース枯渇を防止するため、Job Templateにはジョブタイムアウト値を設定するものとします。'),
  SP(),

  H2('EDA設計'),
  P('本システムにおけるイベント駆動自動化(EDA)の設計方針を記載します。'),
  BULLET('ZabbixサーバーからのWebhook通知をEDAのイベントソース(ansible.eda.webhook、受信ポート5000/TCP)として受信する構成とします。'),
  BULLET('RulebookはGitリポジトリで管理し、EDA ControllerのProjectとして取り込みRulebook Activationとして有効化します。'),
  BULLET('Rulebookの条件(condition)にはZabbixのトリガー名・イベント値を指定し、条件合致時のアクションとしてAutomation ControllerのWorkflow Job Templateを起動(run_workflow_template)する構成とします。'),
  BULLET('イベントペイロードから対象ホスト名を抽出し、extra_varsとして復旧ジョブへ連携することで、障害が発生したホストに対してのみ復旧処理を実行するものとします。'),
  BULLET('Rulebook実行に利用するDecision Environmentは、RedHat社提供の標準DEイメージ(de-supported)を利用するものとします。'),
  SP(),

  H2('ストレージ設計'),
  H3('ローカルストレージ設計'),
  P('AAPノードのローカルディスクで構成するストレージ設計について記載します。'),
  P('AAPノードのローカルストレージは、OS領域、コンテナイメージ格納領域、PostgreSQLデータ領域、およびログ領域として利用する。'),
  P('AAPの各コンポーネントデータおよびコンテナイメージはAAP実行ユーザーのホームディレクトリ配下(~/aap)およびコンテナストレージ領域に格納されるため、当該領域には十分な空き容量を確保する。'),
  P('また、ローカルストレージ障害時の可用性を考慮し、RAID1の構成で冗長化を行う。'),
  tbl(
    ['No', '領域', '用途', 'サイズ'],
    [
      ['1', '/(OS領域)', 'OSおよびミドルウェア', 'xxGB'],
      ['2', '/home/(AAP実行ユーザー)', 'AAP構成データ・PostgreSQLデータ・コンテナストレージ', 'xxxGB'],
      ['3', '/var', 'ログ・一時領域', 'xxGB'],
    ],
    [700, 2600, 4000, 1726],
  ),
  H3('外部ストレージ設計'),
  P('本システムのAAPノードは外部ストレージを利用しない構成とします。'),
  P('バックアップデータの退避先としてのみ外部ストレージ(NFS領域:xxxxxx)を利用するものとし、詳細は「4.2 バックアップ・リストア設計」に記載します。'),
  SP(),

  H2('セキュリティ設計'),
  H3('認証設計'),
  P('AAPへの認証はPlatform Gatewayによる統合認証を利用する。'),
  P('本システムではPlatform Gatewayのローカル認証(ローカルユーザー)を利用する構成とし、外部認証基盤(LDAP/Active Directory/SAML等)との連携はOptionalとして将来の拡張要件とする。'),
  P('パスワードポリシーおよびアカウント管理はxxxxxx様のセキュリティポリシーに準ずるものとする。'),
  H3('RBAC設計'),
  P('AAPの認可制御にはRBAC(Role Based Access Control)を利用する。'),
  P('ユーザーおよびチームに対しては、業務上必要な最小限の権限のみ付与する構成とし、過剰権限を防止する。'),
  P('Organization単位・リソース単位のロール割り当てを基本とし、システム全体の管理権限(Platform Administrator)はAAP管理者のみに付与し、一般利用者への付与は禁止する。'),
  tbl(
    ['No', '利用者', '役割'],
    [
      ['1', 'AAP管理者', 'Platform Administrator。AAP全体の構成管理・ユーザー管理・全リソースの管理を行う。'],
      ['2', '自動化開発者', 'Organization配下でのProject/Job Template/Rulebookの作成・編集・実行を行う。'],
      ['3', '運用オペレータ', 'あらかじめ許可されたJob Template/Workflowの実行のみを行う(Execute権限のみ)。'],
      ['4', '監査担当者', 'Auditor。全リソース・実行履歴の参照のみを行う(変更権限なし)。'],
    ],
    [700, 2400, 5926],
  ),
  H3('認証情報管理設計'),
  P('管理対象ノードへの接続認証情報(SSH秘密鍵・パスワード等)はすべてAutomation ControllerのCredentialとして登録し、データベース内に暗号化して格納する。'),
  P('Credentialは登録後に利用者から参照出来ない仕様であり、ジョブ実行時にのみ内部的に利用されるため、認証情報の漏洩リスクを低減する。'),
  P('Playbook・Rulebook等のGit管理対象ファイルには認証情報を一切記載しないものとする。'),
  SP(),

  H2('コンテンツ管理設計'),
  H3('コンテンツ管理設計'),
  P('AAPで利用する自動化コンテンツ(Collection/EEイメージ/DEイメージ)はPrivate Automation Hubにて一元管理する。'),
  P('Ansible Content CollectionはRedHat社認定コンテンツ(console.redhat.com)およびコミュニティコンテンツ(Ansible Galaxy)からPrivate Automation Hubへ同期し、AAP内の各コンポーネントはPrivate Automation Hubからコンテンツを取得する構成とします。'),
  P('EE/DEコンテナイメージの管理で利用するタグは"latest"タグは利用せず、固定バージョンタグを利用することとします。'),
  P('"latest"タグを利用した場合には、タイミングによって同一のJob Template定義から異なるバージョンの実行環境が起動する可能性があり、環境再現性の低下、障害調査困難化、およびRollback不可等の運用上の問題が発生するケースを回避する為となります。'),
  P('Playbook/Rulebookのソースコード管理はGitリポジトリにて行い、ブランチ運用・レビュープロセスはxxxxxx様の開発規約に準ずるものとします。'),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- 4. システム非機能設計 ----------
const chapter4 = [
  H1('システム非機能設計'),
  P('本章では本システムの非機能設計について記載する。'),

  H2('可用性設計'),
  H3('AAPノード可用性設計'),
  P('本システムのAAPは単一ノード構成(Growthトポロジー)とします。'),
  P('ノードレベルの冗長化は行わないため、ハードウェア障害時は「4.2 バックアップ・リストア設計」に基づくリストアにより復旧する方針とします。'),
  P('ハードウェアレベルでは、ディスクRAID1・NIC Teaming・冗長電源により単一部品障害での停止を防止する構成とします。'),
  P('なお、AAPは自動化基盤であり業務システムそのものではないため、AAP停止中も管理対象システムの稼働には影響しないものとなります。'),
  H3('コンテナサービス可用性設計'),
  P('AAPの各コンポーネントコンテナはsystemd(Quadlet)配下のサービスとして管理され、プロセス異常終了時にはsystemdにより自動再起動される構成とします。'),
  P('また、ノード再起動時にはsystemdにより各コンテナが自動起動され、AAPサービスが自動復旧するものとします。'),
  H3('ジョブ実行可用性設計'),
  P('ジョブ実行中にノード障害等でジョブが中断した場合、当該ジョブはError状態として記録され、復旧後に再実行(Relaunch)が可能となります。'),
  P('Playbookは再実行しても同一の結果となるよう冪等性(べきとうせい)を考慮して作成する方針とし、ジョブの再実行による二重処理等の問題が発生しないものとします。'),
  H3('将来のHA構成拡張'),
  P('将来的に高可用性が必要となった場合には、AAPのEnterpriseトポロジー(Gateway/Controller/Hub/EDAの複数ノード冗長化+外部ロードバランサ+外部データベース構成)へ拡張が可能となります。'),
  P('その際の詳細設計は別途実施するものとします。'),
  SP(),

  H2('バックアップ・リストア設計'),
  H3('AAPバックアップ設計'),
  P('■AAPプラットフォームバックアップ設計'),
  P('AAPの構成情報(PostgreSQLデータベース・各コンポーネント設定・暗号化キー)は、Containerized Installerが提供するバックアップ用Playbook(ansible.containerized_installer.backup)により定期取得するものとします。'),
  P('バックアップは毎日00:00に取得し、取得したバックアップデータは外部ストレージ(NFS領域:xxxxxx)へ退避することで、不具合によりリストアが必要となった際には最低でも1日以内の状態まで復旧が出来ることとします。'),
  P('■ホストOSバックアップ設計'),
  P('AAPノードのホストOS領域については外部バックアップソフトウェア「XXXXX」による定期システムバックアップにて取得するものとします。'),
  P('■自動化コンテンツバックアップ設計'),
  P('Playbook/Rulebook等の自動化コンテンツはGitリポジトリをマスタとして管理されるため、Gitリポジトリ側のバックアップ設計に依存するものとします。詳細は別紙Gitリポジトリ設計書を参照することとします。'),
  H3('AAPリストア設計'),
  P('■AAPプラットフォームリストア設計'),
  P('AAPのリストアについては、「4.2.1 AAPバックアップ設計」に基づいて取得したバックアップを用いて、Containerized Installerが提供するリストア用Playbook(ansible.containerized_installer.restore)によりリストアする方針とします。'),
  P('■ホストOSリストア設計'),
  P('ホストOSのリストアについては、外部バックアップソフトウェア「XXXXX」により取得したシステムバックアップを用いてリストアする方針とします。'),
  P('OS障害等によりノード全体の再構築が必要な場合は、OSリストア実施後にAAPプラットフォームリストアを実施する手順となります。'),
  SP(),

  H2('拡張性設計'),
  H3('ジョブ実行キャパシティ拡張性設計'),
  P('ジョブ同時実行数が増加しノードリソースが不足した場合には、Execution Nodeを追加しAutomation Meshへ参加させることでジョブ実行キャパシティをスケールアウト可能な構成となります。'),
  P('Execution NodeはContainerized Installerのインベントリへノードを追記しインストーラを再実行することで追加出来るものとなります。'),
  H3('コンポーネント分散拡張性設計'),
  P('利用規模の拡大に応じて、単一ノードに同居しているAAP各コンポーネント(Controller/Hub/EDA/データベース)を複数ノードへ分散配置するEnterpriseトポロジーへの移行が可能となります。'),
  P('移行の際は「4.2 バックアップ・リストア設計」のバックアップデータを利用した移行が可能となります。'),
  H3('ストレージ拡張性設計'),
  P('ジョブ実行履歴およびコンテナイメージの増加によりローカルストレージが不足した場合には、ディスク増設およびLVMによる領域拡張が可能な構成とします。'),
  P('また、Automation Controllerのジョブ実行履歴クリーンアップ(定期実行のManagement Job)により、古い実行履歴を定期削除しストレージ使用量の増加を抑制する方針とします。'),
  SP(),

  H2('監視設計'),
  H3('AAP監視設計'),
  P('本システムのAAPはZabbixサーバーによる監視を行う方針とし、以下の監視項目を設定するものとします。'),
  tbl(
    ['No', '監視分類', '監視内容'],
    [
      ['1', '死活監視', 'AAPノードへのPing監視、およびPlatform Gateway URL(https://xxxxxx/)への外形監視を行う。'],
      ['2', 'サービス監視', 'AAP各コンポーネントのsystemdサービス(コンテナ)の稼働状態を監視する。'],
      ['3', 'API監視', 'Automation ControllerのヘルスチェックAPI(/api/v2/ping/)の応答を監視し、コンポーネント内部状態の正常性を確認する。'],
      ['4', 'リソース監視', 'CPU使用率・メモリ使用率・ディスク使用率・プロセス数をZabbixエージェントにより監視する。'],
      ['5', 'ジョブ監視', 'ジョブ実行失敗時はAutomation Controllerの通知機能(Notification)によりメール通知を行う。'],
      ['6', 'ログ監視', 'OSログ(/var/log/messages等)の重要メッセージをZabbixエージェントにより監視する。'],
    ],
    [700, 2000, 6326],
  ),
  P('なお、Automation ControllerはPrometheus形式のメトリクスAPI(/api/v2/metrics/)を提供しており、将来的にメトリクス収集基盤と連携した詳細性能監視への拡張が可能となります。'),
];

// ---------- ドキュメント組み立て ----------
const doc = new Document({
  features: { updateFields: true },
  styles: {
    default: {
      document: { run: { font: FONT_BODY, size: SZ_BODY } },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT_GOTHIC, size: 28, bold: true, color: '000000' },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT_GOTHIC, size: 24, bold: true, color: '000000' },
        paragraph: { spacing: { before: 300, after: 180 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT_GOTHIC, size: 22, bold: true, color: '000000' },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullet-list',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '・', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 420, hanging: 210 } } },
        }],
      },
      {
        reference: 'heading-numbering',
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: '%1', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 0, hanging: 0 } }, run: { font: FONT_GOTHIC } } },
          { level: 1, format: LevelFormat.DECIMAL, text: '%1.%2', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 0, hanging: 0 } }, run: { font: FONT_GOTHIC } } },
          { level: 2, format: LevelFormat.DECIMAL, text: '%1.%2.%3', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 0, hanging: 0 } }, run: { font: FONT_GOTHIC } } },
        ],
      },
    ],
  },
  sections: [{
    properties: {},
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Copyright ©2026 Sojitz Tech-Innovation Co., Ltd All Rights Reserved.', font: FONT_BODY, size: 16 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ children: [PageNumber.CURRENT], font: FONT_BODY, size: 18 }),
            ],
          }),
        ],
      }),
    },
    children: [
      ...cover,
      ...toc,
      ...introduction,
      ...chapter1,
      ...chapter2,
      ...chapter3,
      ...chapter4,
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(__dirname + '/AAP基本設計書_rev0.1.docx', buf);
  console.log('generated:', __dirname + '/AAP基本設計書_rev0.1.docx', buf.length, 'bytes');
});
