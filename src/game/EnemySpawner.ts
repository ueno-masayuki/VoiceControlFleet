/**
 * EnemySpawner - 敵艦船の生成
 */

import { Position, ShipType, Faction } from '@/types'
import { Ship } from './Ship'
import { SHIP_TYPE_NAMES } from './ShipData'

export interface EnemyShipStats {
  maxHp: number
  speed: number
  firepower: number
  range: number
}

export interface EnemyWaveComposition {
  type: ShipType
  count: number
}

export interface SpawnArea {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 敵艦の基本性能
 * プレイヤーの旗艦（旧日本海軍艦）よりやや控えめに設定し、数で押し寄せる構成にする
 */
export const ENEMY_SHIP_STATS: Record<ShipType, EnemyShipStats> = {
  [ShipType.DESTROYER]: { maxHp: 200, speed: 36, firepower: 40, range: 140 },
  [ShipType.CRUISER]: { maxHp: 380, speed: 30, firepower: 70, range: 200 },
  [ShipType.BATTLESHIP]: { maxHp: 900, speed: 24, firepower: 130, range: 280 },
  [ShipType.CARRIER]: { maxHp: 500, speed: 26, firepower: 60, range: 360 },
}

export class EnemySpawner {
  private counter: number = 0

  /**
   * 敵艦を1隻生成
   */
  spawnShip(type: ShipType, position: Position): Ship {
    this.counter += 1
    const stats = ENEMY_SHIP_STATS[type]
    const name = `敵${SHIP_TYPE_NAMES[type]}${this.counter}`

    return new Ship(
      `enemy_${this.counter}`,
      name,
      type,
      position,
      stats.maxHp,
      stats.speed,
      stats.firepower,
      stats.range,
      Faction.ENEMY
    )
  }

  /**
   * 指定した構成で敵艦隊のウェーブを生成
   */
  spawnWave(composition: EnemyWaveComposition[], area: SpawnArea): Ship[] {
    const spawned: Ship[] = []

    composition.forEach(({ type, count }) => {
      for (let i = 0; i < count; i++) {
        const position: Position = {
          x: area.x + Math.random() * area.width,
          y: area.y + Math.random() * area.height,
        }
        spawned.push(this.spawnShip(type, position))
      }
    })

    return spawned
  }
}
