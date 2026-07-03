/**
 * Game - メインゲームクラス
 *
 * ゲーム全体のライフサイクルと各システムを管理
 */

import { Fleet } from './Fleet'
import { EnemyAI } from './EnemyAI'
import { EnemySpawner } from './EnemySpawner'
import { CombatSystem, CombatEvent } from './CombatSystem'
import { CollisionSystem } from './CollisionSystem'
import { LLMService } from '@/llm/LLMService'
import { CommandInterpreter } from '@/llm/CommandInterpreter'
import { GameMasterService, GameMasterState } from '@/llm/GameMasterService'
import {
  VoiceRecognitionService,
  VoiceRecognitionStatus,
} from '@/voice/VoiceRecognitionService'
import { Faction, WeaponType } from '@/types'

interface HitEffect {
  x1: number
  y1: number
  x2: number
  y2: number
  ttl: number
  maxTtl: number
  color: string
  weaponType: WeaponType
}

/** 兵器種別ごとの命中エフェクト表示時間（秒） */
const HIT_EFFECT_DURATION: Record<WeaponType, number> = {
  [WeaponType.GUN]: 0.3,
  [WeaponType.TORPEDO]: 0.5,
  [WeaponType.AIRCRAFT]: 0.6,
}

export class Game {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private running: boolean = false
  private lastTime: number = 0
  private playerFleet: Fleet
  private enemyFleet: Fleet
  private llmService: LLMService
  private commandInterpreter: CommandInterpreter
  private commandHistory: string[] = []
  private voiceService: VoiceRecognitionService
  private isProcessingCommand: boolean = false

  // 戦闘・敵AI
  private combatSystem: CombatSystem
  private enemyAI: EnemyAI
  private enemySpawner: EnemySpawner
  private collisionSystem: CollisionSystem
  private hitEffects: HitEffect[] = []

  // ゲームマスター
  private gameMaster: GameMasterService
  private waveNumber: number = 0
  private nextWaveTimer: number = Infinity
  private isSpawningWave: boolean = false
  private elapsedTime: number = 0
  private gameOver: boolean = false

  // 戦況メッセージ表示
  private messageQueue: string[] = []
  private messageTimer: number = 0
  private readonly MESSAGE_DURATION = 3.5

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
    this.enemyFleet = new Fleet('enemy', '敵艦隊')
    console.log('⚓ 艦隊を初期化しました:', this.playerFleet.ships.length, '隻')

    // 戦闘・敵AIシステムの初期化
    this.combatSystem = new CombatSystem()
    this.enemyAI = new EnemyAI()
    this.enemySpawner = new EnemySpawner()
    this.collisionSystem = new CollisionSystem()

    // LLMサービスの初期化
    this.llmService = new LLMService()
    this.commandInterpreter = new CommandInterpreter()
    this.gameMaster = new GameMasterService()
    console.log('🤖 LLMサービス・ゲームマスターを初期化しました')

    // 音声認識サービスの初期化
    this.voiceService = new VoiceRecognitionService({
      onResult: (text, isFinal) => this.handleVoiceResult(text, isFinal),
      onStatusChange: (status) => this.handleVoiceStatusChange(status),
      onError: (message) => this.displayCommand(`❌ ${message}`),
    })
    console.log('🎤 音声認識サービスを初期化しました')

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
      <div id="voice-indicator" class="voice-indicator" style="cursor: pointer;">
        <span id="voice-icon">🎤</span>
        <span id="voice-status">音声認識: 準備中</span>
      </div>
    `
    app.appendChild(header)

    // 音声認識トグルのイベント設定
    const voiceIndicator = document.getElementById('voice-indicator')
    voiceIndicator?.addEventListener('click', () => {
      this.voiceService.toggle()
    })

    // ゲームマスターのアナウンス欄
    const gmBanner = document.createElement('div')
    gmBanner.id = 'gm-banner'
    gmBanner.className = 'gm-banner'
    gmBanner.style.display = 'none'
    app.appendChild(gmBanner)

    // フッター（コマンド入力）の作成
    const footer = document.createElement('div')
    footer.className = 'game-footer'
    footer.innerHTML = `
      <div style="display: flex; gap: 1rem; align-items: center;">
        <input
          type="text"
          id="command-input"
          placeholder="音声コマンドを入力... 例: 「全艦、北東に移動」"
          style="
            flex: 1;
            padding: 0.7rem;
            background: rgba(26, 41, 64, 0.8);
            border: 2px solid #4fc3f7;
            border-radius: 5px;
            color: #90caf9;
            font-size: 1rem;
            font-family: 'Segoe UI', sans-serif;
          "
        />
        <button
          id="command-submit"
          class="btn"
          style="padding: 0.7rem 1.5rem;"
        >
          🎯 実行
        </button>
      </div>
      <div id="command-display" class="command-display" style="margin-top: 0.5rem; min-height: 1.5rem;">
        準備完了
      </div>
    `
    app.appendChild(footer)

    // コマンド入力のイベント設定
    this.setupCommandInput()

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

    // 敵艦隊パネルの作成
    const enemyPanel = document.createElement('div')
    enemyPanel.className = 'fleet-panel enemy-panel'
    enemyPanel.innerHTML = `
      <h3>敵艦隊情報</h3>
      <div id="enemy-list">
        <p>索敵中...</p>
      </div>
    `
    app.appendChild(enemyPanel)
  }

  /**
   * コマンド入力のイベント設定
   */
  private setupCommandInput(): void {
    const input = document.getElementById('command-input') as HTMLInputElement
    const submit = document.getElementById('command-submit') as HTMLButtonElement

    if (!input || !submit) return

    const executeCommand = async () => {
      const text = input.value.trim()
      if (!text) return

      input.value = ''
      await this.processCommand(text)
    }

    // ボタンクリック
    submit.addEventListener('click', executeCommand)

    // Enterキー
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        executeCommand()
      }
    })
  }

  /**
   * テキスト・音声共通のコマンド処理
   */
  private async processCommand(text: string): Promise<void> {
    if (!text || this.isProcessingCommand) return

    const input = document.getElementById('command-input') as HTMLInputElement | null
    const submit = document.getElementById('command-submit') as HTMLButtonElement | null

    this.isProcessingCommand = true
    this.displayCommand(`📝 入力: ${text}`)

    if (input) input.disabled = true
    if (submit) submit.disabled = true

    try {
      // LLMで解釈
      const interpretation = await this.llmService.interpretCommand(text)

      // コマンド表示を更新
      this.displayCommand(`🤖 解釈: ${interpretation.command}`)

      // コマンドを実行
      this.commandInterpreter.executeCommand(
        interpretation,
        this.playerFleet,
        this.canvas.width,
        this.canvas.height,
        this.enemyFleet
      )

      // 履歴に追加
      this.commandHistory.push(text)

      // 艦隊パネルを更新
      this.updateFleetPanel()
    } catch (error) {
      console.error('コマンド実行エラー:', error)
      this.displayCommand('❌ コマンドの実行に失敗しました')
    } finally {
      this.isProcessingCommand = false
      if (input) {
        input.disabled = false
        input.focus()
      }
      if (submit) submit.disabled = false
    }
  }

  /**
   * 音声認識結果のハンドリング
   */
  private handleVoiceResult(text: string, isFinal: boolean): void {
    if (isFinal) {
      // 確定した音声をコマンドとして実行
      void this.processCommand(text)
    } else {
      // 認識中のテキストを暫定表示
      this.displayCommand(`🎤 認識中: ${text}`)
    }
  }

  /**
   * 音声認識ステータスのハンドリング
   */
  private handleVoiceStatusChange(status: VoiceRecognitionStatus): void {
    const icon = document.getElementById('voice-icon')
    const statusText = document.getElementById('voice-status')
    const indicator = document.getElementById('voice-indicator')

    const statusConfig: Record<VoiceRecognitionStatus, { icon: string; text: string }> = {
      idle: { icon: '🎤', text: '音声認識: 停止中（クリックで開始）' },
      listening: { icon: '🔴', text: '音声認識: 聞き取り中...' },
      processing: { icon: '⏳', text: '音声認識: 処理中...' },
      error: { icon: '⚠️', text: '音声認識: エラー' },
      unsupported: { icon: '🚫', text: '音声認識: 非対応ブラウザ' },
    }

    const config = statusConfig[status]
    if (icon) icon.textContent = config.icon
    if (statusText) statusText.textContent = config.text

    if (indicator) {
      indicator.classList.toggle('active', status === 'listening')
    }
  }

  /**
   * コマンド表示を更新
   */
  private displayCommand(text: string): void {
    const display = document.getElementById('command-display')
    if (display) {
      display.textContent = text
    }
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
    this.updateEnemyPanel()

    // 最初の敵ウェーブを要求
    void this.triggerNextWave()

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
    this.elapsedTime += deltaTime

    if (!this.gameOver) {
      // 敵AIの行動更新
      this.enemyAI.update(this.enemyFleet, this.playerFleet)

      // 戦闘解決（射程内の艦は自動的に交戦する）
      const events = this.combatSystem.update(deltaTime, this.playerFleet, this.enemyFleet)
      this.handleCombatEvents(events)

      // 艦隊の移動更新・撃沈艦の除去
      this.playerFleet.update(deltaTime)
      this.enemyFleet.update(deltaTime)

      // 艦船同士の重なりを解消（複数艦が同一地点に集結するのを防ぐ）
      this.collisionSystem.resolve([...this.playerFleet.ships, ...this.enemyFleet.ships])

      // 次ウェーブのタイマー管理
      this.nextWaveTimer -= deltaTime
      if (this.nextWaveTimer <= 0 && !this.isSpawningWave) {
        this.nextWaveTimer = Infinity
        void this.triggerNextWave()
      }

      // 敗北判定
      if (this.playerFleet.getSummary().active === 0) {
        this.handleGameOver()
      }
    }

    this.updateHitEffects(deltaTime)
    this.updateBattleMessages(deltaTime)
  }

  /**
   * 戦闘イベントの処理（エフェクト・撃沈メッセージ・パネル更新）
   */
  private handleCombatEvents(events: CombatEvent[]): void {
    if (events.length === 0) return

    events.forEach((event) => {
      const duration = HIT_EFFECT_DURATION[event.weaponType]
      this.hitEffects.push({
        x1: event.attacker.position.x,
        y1: event.attacker.position.y,
        x2: event.target.position.x,
        y2: event.target.position.y,
        ttl: duration,
        maxTtl: duration,
        color: event.attacker.faction === Faction.ENEMY ? '#ef5350' : '#4fc3f7',
        weaponType: event.weaponType,
      })

      if (event.targetSunk) {
        // 敵艦名は生成時点で「敵」を含むため、味方艦にのみラベルを付与する
        const label = event.target.faction === Faction.ENEMY ? '' : '味方'
        this.pushBattleMessage(`💥 ${label}${event.target.name} 撃沈！`)
      }
    })

    this.updateFleetPanel()
    this.updateEnemyPanel()
  }

  /**
   * 次の敵ウェーブをゲームマスターに問い合わせて生成
   */
  private async triggerNextWave(): Promise<void> {
    if (this.isSpawningWave) return
    this.isSpawningWave = true

    const summary = this.playerFleet.getSummary()
    const state: GameMasterState = {
      waveNumber: this.waveNumber,
      elapsedSeconds: this.elapsedTime,
      playerActive: summary.active,
      playerTotal: summary.total,
      playerHpPercent: summary.maxHp > 0 ? Math.round((summary.totalHp / summary.maxHp) * 100) : 0,
      enemiesRemaining: this.enemyFleet.ships.filter((ship) => !ship.isSunk()).length,
    }

    try {
      const decision = await this.gameMaster.decideNextWave(state)
      this.waveNumber += 1

      const spawnArea = {
        x: this.canvas.width - 150,
        y: 80,
        width: 120,
        height: Math.max(100, this.canvas.height - 200),
      }
      const newShips = this.enemySpawner.spawnWave(decision.ships, spawnArea)
      this.enemyFleet.addShips(newShips)

      this.pushBattleMessage(`⚔️ ${decision.message}`)
      this.nextWaveTimer = decision.nextWaveDelay
      this.updateEnemyPanel()
    } catch (error) {
      console.error('ウェーブ生成エラー:', error)
      this.nextWaveTimer = 20
    } finally {
      this.isSpawningWave = false
    }
  }

  /**
   * ゲームオーバー処理
   */
  private handleGameOver(): void {
    this.gameOver = true
    this.pushBattleMessage('☠️ 全艦喪失… 作戦失敗')
    console.log('💀 ゲームオーバー')
  }

  /**
   * 戦況メッセージをキューに追加
   */
  private pushBattleMessage(text: string): void {
    this.messageQueue.push(text)
  }

  /**
   * 戦況メッセージバナーの更新
   */
  private updateBattleMessages(deltaTime: number): void {
    const banner = document.getElementById('gm-banner')
    if (!banner) return

    if (this.messageTimer > 0) {
      this.messageTimer -= deltaTime
      return
    }

    if (this.messageQueue.length > 0) {
      banner.textContent = this.messageQueue.shift() ?? ''
      banner.style.display = 'block'
      this.messageTimer = this.MESSAGE_DURATION
    } else {
      banner.style.display = 'none'
    }
  }

  /**
   * 命中エフェクトの経過更新
   */
  private updateHitEffects(deltaTime: number): void {
    this.hitEffects.forEach((effect) => {
      effect.ttl -= deltaTime
    })
    this.hitEffects = this.hitEffects.filter((effect) => effect.ttl > 0)
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

    // 命中エフェクト（艦船の下に描画）
    this.renderHitEffects()

    // 艦隊の描画
    this.playerFleet.render(this.ctx)
    this.enemyFleet.render(this.ctx)

    // 操作ヘルプ
    this.drawHelp()
  }

  /**
   * 命中エフェクトの描画
   */
  private renderHitEffects(): void {
    this.hitEffects.forEach((effect) => {
      const alpha = Math.max(0, Math.min(1, effect.ttl / effect.maxTtl))
      this.ctx.save()
      this.ctx.globalAlpha = alpha
      this.ctx.strokeStyle = effect.color

      // 兵器種別ごとに線種を変え、砲撃・雷撃・航空攻撃を視覚的に区別する
      switch (effect.weaponType) {
        case WeaponType.GUN:
          this.ctx.lineWidth = 2
          this.ctx.setLineDash([])
          break
        case WeaponType.TORPEDO:
          this.ctx.lineWidth = 3
          this.ctx.setLineDash([])
          break
        case WeaponType.AIRCRAFT:
          this.ctx.lineWidth = 2
          this.ctx.setLineDash([6, 4])
          break
      }

      this.ctx.beginPath()
      this.ctx.moveTo(effect.x1, effect.y1)
      this.ctx.lineTo(effect.x2, effect.y2)
      this.ctx.stroke()
      this.ctx.restore()
    })
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
      '🎤アイコン: 音声認識ON/OFF',
    ]

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(10, this.canvas.height - 100, 220, 90)

    this.ctx.fillStyle = '#90caf9'
    this.ctx.font = '12px "Segoe UI"'
    this.ctx.textAlign = 'left'

    help.forEach((text, index) => {
      this.ctx.fillText(text, 20, this.canvas.height - 80 + index * 20)
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
      const weaponIcons = ship.weapons.map((w) => this.getWeaponIcon(w.type)).join(' ')

      html += `
        <div style="
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          background: rgba(26, 41, 64, 0.5);
          border-radius: 5px;
          border-left: 3px solid ${color};
        ">
          <div style="display: flex; justify-content: space-between;">
            <span>${selected} ${ship.name} ${weaponIcons}</span>
            <span style="color: ${color};">${Math.round(hpRatio)}%</span>
          </div>
        </div>
      `
    })

    fleetList.innerHTML = html
  }

  /**
   * 兵器種別に応じたアイコンを取得
   */
  private getWeaponIcon(type: WeaponType): string {
    switch (type) {
      case WeaponType.GUN:
        return '🔫'
      case WeaponType.TORPEDO:
        return '🐟'
      case WeaponType.AIRCRAFT:
        return '✈️'
      default:
        return ''
    }
  }

  /**
   * 敵艦隊パネルの更新
   */
  private updateEnemyPanel(): void {
    const enemyList = document.getElementById('enemy-list')
    if (!enemyList) return

    const activeShips = this.enemyFleet.ships.filter((ship) => !ship.isSunk())

    if (activeShips.length === 0) {
      enemyList.innerHTML = `
        <div style="color: #90caf9;">ウェーブ: ${this.waveNumber}</div>
        <p style="color: #90caf9; margin-top: 0.5rem;">敵影なし。次の艦隊を索敵中...</p>
      `
      return
    }

    let html = `
      <div style="margin-bottom: 1rem;">
        <div style="color: #ef9a9a;">ウェーブ: ${this.waveNumber}</div>
        <div style="color: #ef9a9a;">敵艦数: ${activeShips.length}隻</div>
      </div>
    `

    activeShips.forEach((ship) => {
      const hpRatio = (ship.hp / ship.maxHp) * 100
      const color = hpRatio > 50 ? '#66bb6a' : hpRatio > 25 ? '#ffa726' : '#ef5350'
      const weaponIcons = ship.weapons.map((w) => this.getWeaponIcon(w.type)).join(' ')

      html += `
        <div style="
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          background: rgba(26, 41, 64, 0.5);
          border-radius: 5px;
          border-left: 3px solid ${color};
        ">
          <div style="display: flex; justify-content: space-between;">
            <span>${ship.name} ${weaponIcons}</span>
            <span style="color: ${color};">${Math.round(hpRatio)}%</span>
          </div>
        </div>
      `
    })

    enemyList.innerHTML = html
  }

  /**
   * ゲーム停止
   */
  public stop(): void {
    this.running = false
    console.log('⏸️ ゲームループ停止')
  }
}
