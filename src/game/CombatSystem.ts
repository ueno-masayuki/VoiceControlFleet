/**
 * CombatSystem - 艦船同士の戦闘解決
 *
 * 各艦は保有する兵器（艦砲・魚雷・艦載機）ごとに、それぞれの射程内で
 * 最も近い敵を自動的に攻撃する。兵器種別によって射程・ダメージ・
 * 再装填時間・命中率が異なり、艦種ごとの戦術的な役割を生む。
 */

import { Fleet } from './Fleet'
import { Ship } from './Ship'
import { WeaponType } from '@/types'

export interface CombatEvent {
  attacker: Ship
  target: Ship
  damage: number
  weaponType: WeaponType
  targetSunk: boolean
}

export class CombatSystem {
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
   * 攻撃側艦隊の各艦について、兵器ごとに射程内の目標を攻撃する
   */
  private resolveFleetAttacks(deltaTime: number, attackers: Fleet, targets: Fleet): CombatEvent[] {
    const events: CombatEvent[] = []
    const aliveTargets = targets.ships.filter((ship) => !ship.isSunk())

    attackers.ships.forEach((ship) => {
      ship.tickWeaponCooldowns(deltaTime)

      if (ship.isSunk() || aliveTargets.length === 0) return

      ship.weapons.forEach((weapon, index) => {
        const target = this.findNearestInRange(ship, aliveTargets, weapon.range)
        if (!target) return

        const result = ship.fireWeapon(index, target)
        if (!result) return

        events.push({
          attacker: ship,
          target,
          damage: result.damage,
          weaponType: result.weaponType,
          targetSunk: target.isSunk(),
        })
      })
    })

    return events
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
}
