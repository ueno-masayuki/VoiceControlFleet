/**
 * CollisionSystem - 艦船同士の重なりを解消する
 *
 * 複数の艦が同一地点に集結できてしまうと、事実上1隻の場所に
 * 全火力が乗る「重ね合わせ」が発生し不当に強力になる。
 * 移動更新後に艦同士を押し離すことでこれを防ぐ。
 */

import { Ship } from './Ship'

export class CollisionSystem {
  /**
   * 艦体の外側に確保する最低の隙間
   */
  private readonly MIN_GAP = 4

  /**
   * 分離の収束を安定させるための反復回数
   */
  private readonly ITERATIONS = 2

  /**
   * 全艦（陣営を問わず）を対象に重なりを解消する
   */
  resolve(ships: Ship[]): void {
    for (let iteration = 0; iteration < this.ITERATIONS; iteration++) {
      for (let i = 0; i < ships.length; i++) {
        const shipA = ships[i]
        if (shipA.isSunk()) continue

        for (let j = i + 1; j < ships.length; j++) {
          const shipB = ships[j]
          if (shipB.isSunk()) continue

          this.separate(shipA, shipB)
        }
      }
    }
  }

  /**
   * 2隻が最低離隔距離を下回っていれば、互いに押し離す
   */
  private separate(shipA: Ship, shipB: Ship): void {
    let dx = shipB.position.x - shipA.position.x
    let dy = shipB.position.y - shipA.position.y
    let distance = Math.sqrt(dx * dx + dy * dy)

    const minDistance = shipA.getCollisionRadius() + shipB.getCollisionRadius() + this.MIN_GAP

    if (distance >= minDistance) return

    if (distance < 0.001) {
      // 完全に同一座標の場合はランダムな方向へ分離させる
      const angle = Math.random() * Math.PI * 2
      dx = Math.cos(angle)
      dy = Math.sin(angle)
      distance = 0.001
    }

    const normalX = dx / distance
    const normalY = dy / distance
    const overlap = minDistance - distance

    shipA.position.x -= normalX * overlap * 0.5
    shipA.position.y -= normalY * overlap * 0.5
    shipB.position.x += normalX * overlap * 0.5
    shipB.position.y += normalY * overlap * 0.5
  }
}
