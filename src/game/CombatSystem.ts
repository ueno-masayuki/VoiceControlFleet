/**
 * CombatSystem - 艦船同士の戦闘解決
 *
 * 各艦は射程内の最も近い敵を自動的に砲撃する
 */

import { Fleet } from './Fleet'
import { Ship } from './Ship'

export interface CombatEvent {
  attacker: Ship
  target: Ship
  damage: number
  targetSunk: boolean
}

export class CombatSystem {
  private readonly FIRE_COOLDOWN = 1.5

  /**
   * 2つの艦隊間の戦闘を解決する
   */
  update(deltaTime: number, fleetA: Fleet, fleetB: Fleet): CombatEvent[] {
    const events: CombatEvent[] = []

    events.push(...this.resolveFleetAttacks(deltaTime, fleetA, fleetB))
    events.push(...this.resolveFleetAttacks(deltaTime, fleetB, fleetA))

    return events
  }

  /**
   * 攻撃側艦隊の各艦について射程内の目標を砲撃する
   */
  private resolveFleetAttacks(deltaTime: number, attackers: Fleet, targets: Fleet): CombatEvent[] {
    const events: CombatEvent[] = []

    attackers.ships.forEach((ship) => {
      ship.tickCooldown(deltaTime)

      if (!ship.canFire()) return

      const target = this.findNearestInRange(ship, targets.ships)
      if (!target) return

      const damage = ship.fire(target, this.FIRE_COOLDOWN)
      events.push({
        attacker: ship,
        target,
        damage,
        targetSunk: target.isSunk(),
      })
    })

    return events
  }

  /**
   * 射程内で最も近い目標を検索
   */
  private findNearestInRange(ship: Ship, candidates: Ship[]): Ship | undefined {
    let nearest: Ship | undefined
    let nearestDistance = Infinity

    candidates.forEach((candidate) => {
      if (candidate.isSunk()) return
      if (!ship.isInRange(candidate)) return

      const distance = ship.distanceTo(candidate)
      if (distance < nearestDistance) {
        nearest = candidate
        nearestDistance = distance
      }
    })

    return nearest
  }
}
