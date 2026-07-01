/**
 * EnemyAI - 敵艦隊の簡易AI
 *
 * 最も近いプレイヤー艦に接近し、射程内に入ったら距離を保って砲撃態勢を取る
 */

import { Fleet } from './Fleet'
import { Ship } from './Ship'

export class EnemyAI {
  /**
   * 射程の何割まで近づいたら接近をやめるか（近づきすぎて密集するのを防ぐ）
   */
  private readonly STANDOFF_RATIO = 0.7

  update(enemyFleet: Fleet, playerFleet: Fleet): void {
    if (playerFleet.ships.length === 0) return

    enemyFleet.ships.forEach((ship) => {
      if (ship.isSunk()) return

      const nearest = this.findNearestShip(ship, playerFleet.ships)
      if (!nearest) return

      const standoffDistance = ship.range * this.STANDOFF_RATIO

      if (ship.distanceTo(nearest) > standoffDistance) {
        // 射程外なら接近
        ship.setTarget(nearest.position)
      } else {
        // 射程内なら現在地で停止して砲撃に専念
        ship.setTarget(ship.position)
      }
    })
  }

  /**
   * 最も近い艦船を検索
   */
  private findNearestShip(ship: Ship, candidates: Ship[]): Ship | undefined {
    let nearest: Ship | undefined
    let nearestDistance = Infinity

    candidates.forEach((candidate) => {
      if (candidate.isSunk()) return

      const distance = ship.distanceTo(candidate)
      if (distance < nearestDistance) {
        nearest = candidate
        nearestDistance = distance
      }
    })

    return nearest
  }
}
