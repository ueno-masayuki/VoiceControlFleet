/**
 * Game - メインゲームクラス
 *
 * ゲーム全体のライフサイクルと各システムを管理
 */

export class Game {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private running: boolean = false
  private lastTime: number = 0

  constructor() {
    // キャンバスの作成と設定
    this.canvas = document.createElement('canvas')
    this.canvas.id = 'game-canvas'

    const app = document.getElementById('app')
    if (!app) {
      throw new Error('アプリケーションコンテナが見つかりません')
    }

    app.appendChild(this.canvas)

    const ctx = this.canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Canvas 2D コンテキストの取得に失敗しました')
    }
    this.ctx = ctx

    // UIの初期化
    this.initUI()

    // ウィンドウリサイズ対応
    this.resizeCanvas()
    window.addEventListener('resize', () => this.resizeCanvas())
  }

  /**
   * UIの初期化
   */
  private initUI(): void {
    const app = document.getElementById('app')
    if (!app) return

    // ヘッダーの作成
    const header = document.createElement('div')
    header.className = 'game-header'
    header.innerHTML = `
      <div class="game-title">⚓ VoiceControlFleet</div>
      <div class="voice-indicator">
        <span>🎤</span>
        <span>音声認識: 準備中</span>
      </div>
    `
    app.appendChild(header)

    // フッター（コマンド表示）の作成
    const footer = document.createElement('div')
    footer.className = 'game-footer'
    footer.innerHTML = `
      <div class="command-display">
        音声コマンドを待機中... 例: 「全艦、北東に移動」
      </div>
    `
    app.appendChild(footer)

    // 艦隊パネルの作成
    const fleetPanel = document.createElement('div')
    fleetPanel.className = 'fleet-panel'
    fleetPanel.innerHTML = `
      <h3>艦隊状況</h3>
      <div id="fleet-list">
        <p>艦隊を初期化中...</p>
      </div>
    `
    app.appendChild(fleetPanel)
  }

  /**
   * キャンバスのリサイズ
   */
  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  /**
   * ゲーム開始
   */
  public start(): void {
    if (this.running) return

    this.running = true
    console.log('🎮 ゲームループ開始')

    this.lastTime = performance.now()
    this.gameLoop(this.lastTime)
  }

  /**
   * ゲームループ
   */
  private gameLoop(currentTime: number): void {
    if (!this.running) return

    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime

    // 更新
    this.update(deltaTime)

    // 描画
    this.render()

    // 次のフレーム
    requestAnimationFrame((time) => this.gameLoop(time))
  }

  /**
   * ゲーム状態の更新
   */
  private update(_deltaTime: number): void {
    // ゲームロジックの更新
    // TODO: 艦隊の更新、敵の更新、衝突判定等
  }

  /**
   * 描画
   */
  private render(): void {
    // 画面クリア
    this.ctx.fillStyle = '#0a1929'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // 海のグラデーション背景
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height)
    gradient.addColorStop(0, '#0a1929')
    gradient.addColorStop(1, '#1a2940')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // グリッド描画（海面）
    this.drawGrid()

    // テスト: 中央にメッセージ表示
    this.ctx.fillStyle = '#4fc3f7'
    this.ctx.font = '24px "Segoe UI"'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(
      'ゲームシステム初期化完了',
      this.canvas.width / 2,
      this.canvas.height / 2
    )
    this.ctx.font = '16px "Segoe UI"'
    this.ctx.fillStyle = '#90caf9'
    this.ctx.fillText(
      '艦隊システムを実装中...',
      this.canvas.width / 2,
      this.canvas.height / 2 + 40
    )
  }

  /**
   * グリッド描画（海面）
   */
  private drawGrid(): void {
    const gridSize = 50
    this.ctx.strokeStyle = 'rgba(79, 195, 247, 0.1)'
    this.ctx.lineWidth = 1

    // 縦線
    for (let x = 0; x < this.canvas.width; x += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.canvas.height)
      this.ctx.stroke()
    }

    // 横線
    for (let y = 0; y < this.canvas.height; y += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(this.canvas.width, y)
      this.ctx.stroke()
    }
  }

  /**
   * ゲーム停止
   */
  public stop(): void {
    this.running = false
    console.log('⏸️ ゲームループ停止')
  }
}
