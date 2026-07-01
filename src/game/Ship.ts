/**
 * Ship - 艦船クラス
 *
 * 個別の艦船の状態と振る舞いを管理
 */

import { Ship as IShip, Position, Velocity, ShipType, Faction } from '@/types'
import { SHIP_COLORS } from './ShipData'

const FACTION_OUTLINE_COLOR: Record<Faction, string> = {
  [Faction.PLAYER]: '#01579b',
  [Faction.ENEMY]: '#b71c1c',
}

export class Ship implements IShip {
  id: string
  name: string
  type: ShipType
  faction: Faction
  position: Position
  velocity: Velocity
  hp: number
  maxHp: number
  speed: number
  firepower: number
  range: number
  isSelected: boolean

  private targetPosition: Position | null = null
  private attackCooldownRemaining: number = 0

  constructor(
    id: string,
    name: string,
    type: ShipType,
    position: Position,
    maxHp: number,
    speed: number,
    firepower: number,
    range: number,
    faction: Faction = Faction.PLAYER
  ) {
    this.id = id
    this.name = name
    this.type = type
    this.faction = faction
    this.position = { ...position }
    this.velocity = { x: 0, y: 0 }
    this.hp = maxHp
    this.maxHp = maxHp
    this.speed = speed
    this.firepower = firepower
    this.range = range
    this.isSelected = false
  }

  /**
   * 更新処理
   */
  update(deltaTime: number): void {
    // 目標位置への移動
    if (this.targetPosition) {
      const dx = this.targetPosition.x - this.position.x
      const dy = this.targetPosition.y - this.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 5) {
        // 目標に到達
        this.targetPosition = null
        this.velocity.x = 0
        this.velocity.y = 0
      } else {
        // 目標に向かって移動
        const dirX = dx / distance
        const dirY = dy / distance
        this.velocity.x = dirX * this.speed
        this.velocity.y = dirY * this.speed
      }
    }

    // 位置の更新
    this.position.x += this.velocity.x * deltaTime
    this.position.y += this.velocity.y * deltaTime
  }

  /**
   * 描画
   */
  render(ctx: CanvasRenderingContext2D): void {
    const color = SHIP_COLORS[this.type]

    // 選択状態の表示
    if (this.isSelected) {
      ctx.strokeStyle = '#ffeb3b'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(this.position.x, this.position.y, 25, 0, Math.PI * 2)
      ctx.stroke()
    }

    // 艦船本体（三角形で表現）
    const size = this.getSize()
    ctx.fillStyle = color
    ctx.beginPath()

    // 進行方向を向くように回転
    const angle = Math.atan2(this.velocity.y, this.velocity.x)
    ctx.save()
    ctx.translate(this.position.x, this.position.y)
    ctx.rotate(angle || 0)

    // 三角形の描画
    ctx.moveTo(size, 0)
    ctx.lineTo(-size / 2, size / 2)
    ctx.lineTo(-size / 2, -size / 2)
    ctx.closePath()
    ctx.fill()

    // 陣営を示す輪郭線
    ctx.lineWidth = 2
    ctx.strokeStyle = FACTION_OUTLINE_COLOR[this.faction]
    ctx.stroke()

    ctx.restore()

    // HP バー
    this.renderHealthBar(ctx)

    // 艦名
    this.renderName(ctx)
  }

  /**
   * HP バーの描画
   */
  private renderHealthBar(ctx: CanvasRenderingContext2D): void {
    const barWidth = 40
    const barHeight = 5
    const x = this.position.x - barWidth / 2
    const y = this.position.y - 30

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(x, y, barWidth, barHeight)

    // HP
    const hpRatio = this.hp / this.maxHp
    ctx.fillStyle = hpRatio > 0.5 ? '#66bb6a' : hpRatio > 0.25 ? '#ffa726' : '#ef5350'
    ctx.fillRect(x, y, barWidth * hpRatio, barHeight)

    // 枠
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, barWidth, barHeight)
  }

  /**
   * 艦名の描画
   */
  private renderName(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px "Segoe UI"'
    ctx.textAlign = 'center'
    ctx.fillText(this.name, this.position.x, this.position.y + 35)
  }

  /**
   * 衝突判定用の半径（他艦との最低離隔距離の基準）
   */
  getCollisionRadius(): number {
    return this.getSize() + 6
  }

  /**
   * 艦種に応じたサイズ
   */
  private getSize(): number {
    switch (this.type) {
      case ShipType.BATTLESHIP:
        return 20
      case ShipType.CARRIER:
        return 18
      case ShipType.CRUISER:
        return 15
      case ShipType.DESTROYER:
        return 12
      default:
        return 15
    }
  }

  /**
   * 目標位置を設定
   */
  setTarget(position: Position): void {
    this.targetPosition = { ...position }
  }

  /**
   * クリック判定
   */
  containsPoint(x: number, y: number): boolean {
    const dx = x - this.position.x
    const dy = y - this.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance < this.getSize() + 10
  }

  /**
   * ダメージを受ける
   */
  takeDamage(damage: number): void {
    this.hp = Math.max(0, this.hp - damage)
  }

  /**
   * 対象との距離
   */
  distanceTo(target: Ship): number {
    const dx = target.position.x - this.position.x
    const dy = target.position.y - this.position.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * 対象が射程内か
   */
  isInRange(target: Ship): boolean {
    return this.distanceTo(target) <= this.range
  }

  /**
   * 攻撃クールダウンの経過
   */
  tickCooldown(deltaTime: number): void {
    if (this.attackCooldownRemaining > 0) {
      this.attackCooldownRemaining = Math.max(0, this.attackCooldownRemaining - deltaTime)
    }
  }

  /**
   * 射撃可能か（撃沈済みでなく、クールダウンが解けている）
   */
  canFire(): boolean {
    return !this.isSunk() && this.attackCooldownRemaining <= 0
  }

  /**
   * 対象を砲撃する。実際に与えたダメージを返す
   */
  fire(target: Ship, cooldownSeconds: number): number {
    const variance = 0.8 + Math.random() * 0.4
    const damage = Math.round(this.firepower * variance)
    target.takeDamage(damage)
    this.attackCooldownRemaining = cooldownSeconds
    return damage
  }

  /**
   * 修理
   */
  repair(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount)
  }

  /**
   * 撃沈されたか
   */
  isSunk(): boolean {
    return this.hp <= 0
  }
}
