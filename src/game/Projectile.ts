/**
 * Projectile - 発射体クラス
 *
 * 艦砲弾・魚雷・艦載機が実際に発射元から目標まで飛翔する様子を描画する。
 * 命中の成否は発射時（Ship.fireWeapon）に兵器の命中率で決定済みで、
 * 外れの場合は目標付近の海面に着弾する。着弾時にはダメージを適用し、
 * 短い爆発フラッシュを表示する。
 */

import { Position, WeaponType, Faction } from '@/types'
import type { Ship } from './Ship'
import type { CombatEvent } from './CombatSystem'

/** 兵器種別ごとの飛翔速度 (px/s)。砲弾は速く、魚雷は中速、艦載機は最も遅い */
const PROJECTILE_SPEED: Record<WeaponType, number> = {
  [WeaponType.GUN]: 700,
  [WeaponType.TORPEDO]: 220,
  [WeaponType.AIRCRAFT]: 140,
}

const IMPACT_FLASH_DURATION = 0.3

export class Projectile {
  id: string
  type: WeaponType
  position: Position
  faction: Faction

  private attacker: Ship
  private target: Ship
  private damage: number
  private hit: boolean
  private speed: number
  private impactPoint: Position | null = null
  private angle = 0
  private phase: 'flying' | 'impact' = 'flying'
  private impactTtl = IMPACT_FLASH_DURATION

  constructor(
    id: string,
    type: WeaponType,
    attacker: Ship,
    target: Ship,
    damage: number,
    hit: boolean
  ) {
    this.id = id
    this.type = type
    this.faction = attacker.faction
    this.attacker = attacker
    this.target = target
    this.damage = damage
    this.hit = hit
    this.position = { ...attacker.position }
    this.speed = PROJECTILE_SPEED[type]

    if (!hit) {
      // 外れ弾は目標付近にランダムにずれて着弾する
      this.impactPoint = {
        x: target.position.x + (Math.random() - 0.5) * 70,
        y: target.position.y + (Math.random() - 0.5) * 70,
      }
    }
  }

  /**
   * 目標に向けた狙点を求める
   * 命中弾は目標艦を追尾するが、目標が撃沈済みなら最後の位置で固定する
   */
  private aimPoint(): Position {
    if (!this.hit) return this.impactPoint as Position

    if (this.target.isSunk()) {
      if (!this.impactPoint) {
        this.impactPoint = { ...this.target.position }
      }
      return this.impactPoint
    }

    return this.target.position
  }

  /**
   * 更新処理。着弾した瞬間にのみダメージ適用結果を CombatEvent として返す
   */
  update(deltaTime: number): CombatEvent | null {
    if (this.phase === 'impact') {
      this.impactTtl -= deltaTime
      return null
    }

    const aim = this.aimPoint()
    const dx = aim.x - this.position.x
    const dy = aim.y - this.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > 0.01) {
      this.angle = Math.atan2(dy, dx)
    }

    const step = this.speed * deltaTime

    if (distance <= step) {
      this.position.x = aim.x
      this.position.y = aim.y
      this.phase = 'impact'

      if (this.hit && !this.target.isSunk()) {
        this.target.takeDamage(this.damage)
        return {
          attacker: this.attacker,
          target: this.target,
          damage: this.damage,
          weaponType: this.type,
          targetSunk: this.target.isSunk(),
        }
      }
      return null
    }

    this.position.x += (dx / distance) * step
    this.position.y += (dy / distance) * step
    return null
  }

  /**
   * 描画完了（爆発フラッシュも消え切った）か
   */
  isDone(): boolean {
    return this.phase === 'impact' && this.impactTtl <= 0
  }

  /**
   * 描画
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (this.phase === 'impact') {
      this.renderImpact(ctx)
      return
    }

    ctx.save()
    ctx.translate(this.position.x, this.position.y)
    ctx.rotate(this.angle)

    switch (this.type) {
      case WeaponType.GUN:
        this.renderGunShell(ctx)
        break
      case WeaponType.TORPEDO:
        this.renderTorpedo(ctx)
        break
      case WeaponType.AIRCRAFT:
        this.renderAircraft(ctx)
        break
    }

    ctx.restore()
  }

  /** 艦砲弾: 発光する曳光弾。速く飛ぶため長めの光跡を引く */
  private renderGunShell(ctx: CanvasRenderingContext2D): void {
    ctx.shadowColor = '#ffd54f'
    ctx.shadowBlur = 8
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.9)'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(-18, 0)
    ctx.lineTo(0, 0)
    ctx.stroke()

    ctx.fillStyle = '#fff59d'
    ctx.beginPath()
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2)
    ctx.fill()
  }

  /** 魚雷: 太い航跡を引きながら進む細長い弾体 */
  private renderTorpedo(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(178, 235, 242, 0.6)'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(-24, 0)
    ctx.lineTo(-7, 0)
    ctx.stroke()

    ctx.fillStyle = '#eceff1'
    ctx.strokeStyle = '#546e7a'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  /** 艦載機: 主翼を持つ機影。輪郭を付けて視認性を高める */
  private renderAircraft(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#cfd8dc'
    ctx.strokeStyle = '#37474f'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(11, 0)
    ctx.lineTo(-4, 3)
    ctx.lineTo(-9, 9)
    ctx.lineTo(-3, 2)
    ctx.lineTo(-3, -2)
    ctx.lineTo(-9, -9)
    ctx.lineTo(-4, -3)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  /** 着弾フラッシュ（命中=橙の爆発、外れ=白い水しぶき） */
  private renderImpact(ctx: CanvasRenderingContext2D): void {
    const alpha = Math.max(0, this.impactTtl / IMPACT_FLASH_DURATION)
    const growth = 1 - alpha

    ctx.save()
    ctx.globalAlpha = alpha
    if (this.hit) {
      ctx.shadowColor = '#ff7043'
      ctx.shadowBlur = 10
    }
    ctx.strokeStyle = this.hit ? '#ff7043' : 'rgba(255, 255, 255, 0.7)'
    ctx.lineWidth = this.hit ? 3 : 1.5
    ctx.beginPath()
    ctx.arc(this.position.x, this.position.y, (this.hit ? 18 : 8) * growth + 4, 0, Math.PI * 2)
    ctx.stroke()

    if (this.hit) {
      ctx.fillStyle = '#ffca28'
      ctx.beginPath()
      ctx.arc(this.position.x, this.position.y, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }
}
