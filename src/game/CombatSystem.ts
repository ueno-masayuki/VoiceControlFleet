/**
 * CombatSystem - 艦船同士の戦闘解決
 *
 * 各艦は保有する兵器（艦砲・魚雷・艦載機）ごとに、それぞれの射程内で
 * 最も近い敵を自動的に攻撃する。兵器種別によって射程・ダメージ・
 * 再装填時間・命中率・飛翔速度が異なり、艦種ごとの戦術的な役割を生む。
 * 発射された弾・魚雷・艦載機は Projectile として実際に飛翔し、
 * 着弾した瞬間にダメージが適用される。
 */

import { Fleet } from './Fleet'
import { Ship } from './Ship'
import { Projectile } from './Projectile'
import { WeaponType } from '@/types'

export interface CombatEvent {
  attacker: Ship
  target: Ship
  damage: number
  weaponType: WeaponType
  targetSunk: boolean
}

export class CombatSystem {
  projectiles: Projectile[] = []
  private nextProjectileId = 0

  /**
   * 2つの艦隊間の戦闘を解決する。着弾により発生した CombatEvent を返す
   */
  update(deltaTime: number, fleetA: Fleet, fleetB: Fleet): CombatEvent[] {
    this.resolveFleetAttacks(deltaTime, fleetA, fleetB)
    this.resolveFleetAttacks(deltaTime, fleetB, fleetA)

    const events: CombatEvent[] = []
    this.projectiles.forEach((projectile) => {
      const event = projectile.update(deltaTime)
      if (event) events.push(event)
    })
    this.projectiles = this.projectiles.filter((projectile) => !projectile.isDone())

    return events
  }

  /**
   * 攻撃側艦隊の各艦について、兵器ごとに射程内の目標へ発射体を撃ち出す
   */
  private resolveFleetAttacks(deltaTime: number, attackers: Fleet, targets: Fleet): void {
    const aliveTargets = targets.ships.filter((ship) => !ship.isSunk())

    attackers.ships.forEach((ship) => {
      ship.tickWeaponCooldowns(deltaTime)

      if (ship.isSunk() || aliveTargets.length === 0) return

      ship.weapons.forEach((weapon, index) => {
        const target = this.findNearestInRange(ship, aliveTargets, weapon.range)
        if (!target) return

        const result = ship.fireWeapon(index)
        if (!result) return

        this.projectiles.push(
          new Projectile(
            `proj_${this.nextProjectileId++}`,
            result.weaponType,
            ship,
            target,
            result.damage,
            result.hit
          )
        )
      })
    })
  }

  /**
   * 指定した射程内で最も近い目標を検索
   */
  private findNearestInRange(ship: Ship, candidates: Ship[], range: number): Ship | undefined {
    let nearest: Ship | undefined
    let nearestDistance = Infinity

    candidates.forEach((candidate) => {
      const distance = ship.distanceTo(candidate)
      if (distance <= range && distance < nearestDistance) {
        nearest = candidate
        nearestDistance = distance
      }
    })

    return nearest
  }

  /**
   * 描画（飛翔中の発射体・着弾フラッシュ）
   */
  render(ctx: CanvasRenderingContext2D): void {
    this.projectiles.forEach((projectile) => projectile.render(ctx))
  }
}
