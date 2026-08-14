================================================================================
zerto_rhel8_prework.yml 解説
================================================================================

■ 概要
本Playbookは、RHEL8サーバをZerto(仮想マシンレプリケーション/移行ツール)で
移行する前に必要な事前設定を、対象ホスト(inventory_rhel.ini の rhel グループ、
1台のみを想定)に対して自動適用・検証するものです。
以下の4項目を順にチェック・設定し、最後に結果をレポートします。

  1. VirtIOドライバがinitramfsに組み込まれているか(なければ組み込む)
  2. qemu-guest-agentのRPCブラックリスト解除
  3. SELinuxの状態(既定はpermissiveへ変更、disabledも選択可)
  4. qemu-guest-agent / open-vm-toolsパッケージの導入、および
     qemu-guest-agent / vmtoolsdサービスの有効化(enabled)状態の最終確認

実行例:
  疎通確認    : ansible rhel -i inventory_rhel.ini -m ping
  ドライラン  : ansible-playbook -i inventory_rhel.ini zerto_prework.yml --check --diff
  本実行      : ansible-playbook -i inventory_rhel.ini zerto_prework.yml
  SELinux無効 : 上記に -e selinux_state=disabled を追加

事前準備(初回のみ): ansible-galaxy collection install ansible.posix

主な変数:
  virtio_drivers : 確認・登録対象のVirtIOドライバ (virtio_blk / virtio_scsi / virtio_net)
  selinux_state  : SELinuxの目標状態。既定値 permissive (disabled も指定可)

--------------------------------------------------------------------------------
■ 初期化
--------------------------------------------------------------------------------
[結果フラグ初期化]
  virtio_failed / qemuga_failed / selinux_failed / install_failed の
  4つの判定フラグをすべて false で初期化する。これらのフラグは各チェック
  工程の最後でOK/NGを判定するために使われ、最終的な合否判定([6/6])で
  参照される。

--------------------------------------------------------------------------------
■ [1/6] パッケージ導入
--------------------------------------------------------------------------------
[qemu-guest-agent と open-vm-tools を導入]
  package モジュールで qemu-guest-agent と open-vm-tools をインストールする
  (state: present)。Zertoが仮想マシンの状態を把握するために必要なエージェント。

[サービスを有効化]
  systemd モジュールで qemu-guest-agent と vmtoolsd の2サービスを
  enabled: true(自動起動有効)に設定する。
  ※ state: started は指定していないため、サービスの「即時起動」は行わず
    自動起動設定のみを行う点に注意。

--------------------------------------------------------------------------------
■ [2/6] initramfsへのVirtIOドライバ登録
--------------------------------------------------------------------------------
[現行initramfs内のVirtIOドライバを確認]
  lsinitrd コマンドで現在稼働中カーネルのinitramfsイメージ
  (/boot/initramfs-{{ ansible_kernel }}.img)の内容を取得する。
  changed_when: false で状態確認のみ扱い、check_mode: false により
  --check(ドライラン)実行時でも必ず実コマンドを実行する
  (確認だけなので副作用がないため)。

[不足ドライバの有無を判定]
  virtio_drivers(virtio_blk/virtio_scsi/virtio_net)のうち、
  直前に取得したinitramfsの内容に含まれないものが1つでもあれば
  virtio_missing を true にする(reject('in', ...)で「含まれる」ものを除外し、
  残った=不足しているドライバの数が0より大きいかを判定)。

[dracut設定ファイルを配置]
  virtio_missing が true の場合のみ実行。
  /etc/dracut.conf.d/zerto-vme-drivers.conf に
  add_drivers+=" virtio_blk virtio_scsi virtio_net " を書き込み、
  dracutでinitramfs再生成時にこれらのドライバが必ず組み込まれるようにする。

[initramfsをバックアップ]
  virtio_missing が true の場合のみ実行。
  再生成前の現行initramfsを .img.bak として複製(remote_src: true)。
  force: false のため、既にバックアップが存在する場合は上書きしない
  (2回目以降の実行で最初のバックアップを保護する)。

[initramfsを再生成]
  virtio_missing が true の場合のみ実行。
  dracut -f コマンドで現在のカーネル用initramfsを強制再生成する。
  changed_when: true としているため、実行されれば常に「変更あり」として扱う。

[dracut未実行時のダミー結果作成]
  virtio_missing が false(=既にドライバが揃っている)の場合のみ実行。
  後続タスクの when 条件で「dracutを実行したかどうか」を判定できるよう、
  dracut_run 変数に skipped: true をダミーとしてセットする。

[再生成後のinitramfsを検証]
  dracut_run が skipped でない(=dracutを実行した)場合のみ実行。
  再生成後のinitramfsに対して再度 lsinitrd を実行し、内容を確認する。

[VirtIO結果判定(dracut実施時)]
  dracutを実行した場合、再生成後のinitramfsにまだ不足ドライバが
  残っていないかを再判定し、virtio_failed に反映する
  (再生成してもドライバが組み込まれていなければ失敗=true)。

[VirtIO結果判定(dracut不要時)]
  dracutが不要だった(=元々ドライバが揃っていた)場合は
  virtio_failed を false(成功)に確定する。

--------------------------------------------------------------------------------
■ [3/6] qemu-ga(BLACKLIST_RPC解除)
--------------------------------------------------------------------------------
[/etc/sysconfig/qemu-ga のBLACKLIST_RPC行を削除]
  lineinfile で /etc/sysconfig/qemu-ga から "BLACKLIST_RPC=" で始まる行を
  削除する(state: absent)。このブラックリストが設定されていると、
  ZertoがQEMUゲストエージェント経由で必要なRPCコマンドを実行できないため、
  制限を解除する目的。

[BLACKLIST削除確認]
  grep '^BLACKLIST_RPC=' で該当行が本当に消えたかを確認する。
  failed_when: false により、grepがマッチせず終了コード1を返しても
  Playbook自体は失敗させない(「見つからない=削除成功」を正常系として扱うため)。

[qemu-ga結果判定]
  grepの終了コード(rc)が0、つまり該当行がまだ残っている場合は
  qemuga_failed を true(削除失敗)にする。

--------------------------------------------------------------------------------
※ 補足: 番号が [3/6] の次に [5/6] へ飛んでおり、Playbook内に「4/6」に相当する
  タスク(コメント上想定される再起動処理など)は存在しません。ヘッダーコメントの
  「再起動込み: -e allow_reboot=true」という実行例に対応する再起動タスクは
  本ファイルには実装されていない点に注意してください。
  また、ヘッダーコメントには「失敗したらrescueでホスト名を記録して異常終了」と
  記載がありますが、本ファイルには block/rescue 構造は存在せず、
  失敗判定は [6/6] の fail タスクでのみ行われています(コメントと実装に差異あり)。
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
■ [5/6] SELinux
--------------------------------------------------------------------------------
[SELinux設定確認]
  grep '^SELINUX=' /etc/selinux/config で変更前のSELinux設定行を取得する。

[SELinuxを{{ selinux_state }}へ変更]
  ansible.posix.selinux モジュールで、SELinuxの状態を変数 selinux_state
  (既定: permissive。-e selinux_state=disabled で disabled も指定可能)
  に、ポリシーを targeted に設定する。
  ただし、変更前の設定が既に "SELINUX=disabled" だった場合はこのタスクを
  スキップする(disabledから意図せずpermissiveへ戻してしまうことを防止)。

[SELinux設定再確認]
  変更後の /etc/selinux/config を再度grepし、実際の設定値を取得する。

[SELinux結果判定]
  再確認した設定が "permissive" でも "disabled" でもない場合
  (=enforcingのまま等、意図した状態になっていない場合)に
  selinux_failed を true にする。

--------------------------------------------------------------------------------
■ [6/6] レポート出力
--------------------------------------------------------------------------------
[qemu-guest-agent / open-vm-tools の導入状態を確認]
  command モジュールで対象ホスト上の rpm -q qemu-guest-agent / rpm -q
  open-vm-tools をそれぞれ実行し(loop)、結果を install_pkg_check に格納する。
  changed_when: false / failed_when: false のため、未導入(rpm -qが非0終了)
  でもPlaybook自体は失敗させず、後続タスクでrcを見て判定する。

[qemu-guest-agent / vmtoolsd の有効化状態を確認]
  command モジュールで systemctl is-enabled qemu-guest-agent /
  systemctl is-enabled vmtoolsd をそれぞれ実行し(loop)、結果を
  install_svc_check に格納する。こちらも changed_when: false /
  failed_when: false により、無効化(disabled等でrcが非0)でも
  Playbookを失敗させない。

[パッケージ導入/サービス有効化 結果判定]
  install_pkg_check.results と install_svc_check.results それぞれについて、
  selectattr('rc', 'ne', 0) で「終了コードが0でない(=パッケージ未導入、
  または有効化されていない)」項目を抽出し、1件でも該当すれば install_failed
  を true(NG)にする。これは[1/6]でインストール・有効化した内容が、
  最終的に本当に反映されているかを確認するための工程。

[result_report_rhel.txt 出力]
  delegate_to: localhost により、実行元(Ansible制御ノード)側の
  ./result/result_report_rhel.txt に、対象ホスト名と
  VirtIO/QEMU-GA/SELinux/Installそれぞれの OK・NG判定を1行追記する
  (create: true でファイルがなければ新規作成)。

[result_ng_rhel.txt 出力]
  4項目のいずれかが失敗(NG)している場合のみ、
  ./result/result_ng_rhel.txt に対象ホスト名を追記する。
  複数台に対して実行した際、NGだったホストだけを一覧できるようにするための
  ファイル(このPlaybook自体は1台のみが対象だが、複数実行の集計を想定した作り)。

[結果表示]
  debug モジュールで、VirtIO/QEMU-GA/SELinux/Installそれぞれの
  OK/NG判定結果を標準出力に表示する。

[総合判定]
  4項目のいずれかがNGの場合、fail モジュールでPlaybookを異常終了させる。
  メッセージには各項目の判定結果と、詳細はresult_report_rhel.txtを
  参照するよう案内が表示される。

[設定完了メッセージ]
  4項目すべてがOKの場合のみ、debug モジュールで
  「Zerto移行前設定が正常に完了しました」という完了メッセージを表示する。

================================================================================
■ 全体の処理フロー まとめ
================================================================================
  1. 判定フラグ初期化
  2. [1/6] qemu-guest-agent / open-vm-tools導入・サービス自動起動設定
  3. [2/6] initramfs内のVirtIOドライバ有無を確認し、不足していればdracut設定を
     追加してinitramfsを再生成、再生成後に再確認してOK/NG判定
  4. [3/6] qemu-gaのBLACKLIST_RPC設定を削除し、削除できたかをOK/NG判定
     ※ ヘッダーコメントが想定する「4/6」の処理(再起動等)は本ファイルに実装なし
  5. [5/6] SELinuxを指定状態(既定permissive)へ変更し、OK/NG判定
  6. [6/6] qemu-guest-agent/open-vm-toolsの導入状態とqemu-guest-agent/
     vmtoolsdの有効化状態を確認してOK/NG判定した上で、4項目まとめて
     結果をファイル出力・画面表示し、いずれかNGなら異常終了、
     すべてOKなら完了メッセージを表示

================================================================================
■ 気になる点・確認事項
================================================================================
  ・[4/6]に相当するタスクが存在しない(ヘッダーコメントの「再起動込み」実行例に
    対応する再起動処理が未実装)。
  ・ヘッダーコメントの「rescueでホスト名を記録して異常終了」という記述に対し、
    実際にはblock/rescue構造がなく、失敗時の記録はresult_ng_rhel.txtへの
    追記([6/6])のみで行われている。
  ・allow_reboot 変数はコメントの実行例にのみ登場し、vars/tasks内では
    一切参照・利用されていない。
  ・./result/ ディレクトリは事前に作成しておく必要がある
    (lineinfileのcreate: trueはファイルは作るがディレクトリは作らないため)。
