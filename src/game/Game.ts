/**
 * Game - メインゲームクラス
 *
 * ゲーム全体のライフサイクルと各システムを管理
 */

import { Fleet } from './Fleet'

export class Game {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private running: boolean = false
  private lastTime: number = 0
  private playerFleet: Fleet

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

    // 艦隊の初期化
    this.playerFleet = new Fleet('player', 'プレイヤー艦隊')
    this.playerFleet.initializePlayerFleet(200, 200)
    console.log('⚓ 艦隊を初期化しました:', this.playerFleet.ships.length, '隻')

    // マウスイベントの設定
    this.setupMouseEvents()
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
   * マウスイベントの設定
   */
  private setupMouseEvents(): void {
    // クリックで艦船を選択
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const ship = this.playerFleet.getShipAtPosition(x, y)

      if (ship) {
        // Shiftキーで複数選択
        if (!e.shiftKey) {
          this.playerFleet.deselectAll()
        }
        ship.isSelected = !ship.isSelected
        console.log(`🎯 ${ship.name} を選択`)
      } else {
        this.playerFleet.deselectAll()
      }

      this.updateFleetPanel()
    })

    // 右クリックで移動命令
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault()

      const rect = this.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const selectedShips = this.playerFleet.getSelectedShips()

      if (selectedShips.length > 0) {
        selectedShips.forEach((ship) => ship.setTarget({ x, y }))
        console.log(`🎯 選択艦 ${selectedShips.length} 隻に移動命令`)
      }
    })
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

    // 艦隊パネルの初期表示
    this.updateFleetPanel()

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
  private update(deltaTime: number): void {
    // 艦隊の更新
    this.playerFleet.update(deltaTime)
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

    // 艦隊の描画
    this.playerFleet.render(this.ctx)

    // 操作ヘルプ
    this.drawHelp()
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
   * 操作ヘルプの描画
   */
  private drawHelp(): void {
    const help = [
      '左クリック: 艦船を選択',
      '右クリック: 移動命令',
      'Shift+クリック: 複数選択',
    ]

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(10, this.canvas.height - 80, 200, 70)

    this.ctx.fillStyle = '#90caf9'
    this.ctx.font = '12px "Segoe UI"'
    this.ctx.textAlign = 'left'

    help.forEach((text, index) => {
      this.ctx.fillText(text, 20, this.canvas.height - 60 + index * 20)
    })
  }

  /**
   * 艦隊パネルの更新
   */
  private updateFleetPanel(): void {
    const fleetList = document.getElementById('fleet-list')
    if (!fleetList) return

    const summary = this.playerFleet.getSummary()
    const hpPercent = Math.round((summary.totalHp / summary.maxHp) * 100)

    let html = `
      <div style="margin-bottom: 1rem;">
        <div style="color: #90caf9;">艦船数: ${summary.active}/${summary.total}</div>
        <div style="color: #90caf9;">総HP: ${hpPercent}%</div>
      </div>
    `

    this.playerFleet.ships.forEach((ship) => {
      const selected = ship.isSelected ? '✓' : ''
      const hpRatio = (ship.hp / ship.maxHp) * 100
      const color = hpRatio > 50 ? '#66bb6a' : hpRatio > 25 ? '#ffa726' : '#ef5350'

      html += `
        <div style="
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          background: rgba(26, 41, 64, 0.5);
          border-radius: 5px;
          border-left: 3px solid ${color};
        ">
          <div style="display: flex; justify-content: space-between;">
            <span>${selected} ${ship.name}</span>
            <span style="color: ${color};">${Math.round(hpRatio)}%</span>
          </div>
        </div>
      `
    })

    fleetList.innerHTML = html
  }

  /**
   * ゲーム停止
   */
  public stop(): void {
    this.running = false
    console.log('⏸️ ゲームループ停止')
  }
}
