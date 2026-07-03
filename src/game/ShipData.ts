/**
 * 艦船データ定義
 * 旧日本海軍の艦名と性能データ
 *
 * 兵装（艦砲・魚雷・艦載機）と艦体規模(size)は艦種(type)に応じて
 * WeaponData.ts で一括定義されており、艦種ごとの戦術的な役割を表す。
 */

import { ShipType } from '@/types'

export interface ShipTemplate {
  name: string
  type: ShipType
  maxHp: number
  speed: number
  description: string
}

/**
 * 旧日本海軍艦船データベース
 */
export const SHIP_DATABASE: ShipTemplate[] = [
  // 戦艦 - 46cm主砲による長射程の砲撃戦が主任務
  {
    name: '大和',
    type: ShipType.BATTLESHIP,
    maxHp: 1000,
    speed: 27,
    description: '世界最大の戦艦。46cm主砲を装備',
  },
  {
    name: '武蔵',
    type: ShipType.BATTLESHIP,
    maxHp: 1000,
    speed: 27,
    description: '大和型戦艦2番艦',
  },

  // 空母 - 艦載機による最長射程の航空攻撃が主任務
  {
    name: '赤城',
    type: ShipType.CARRIER,
    maxHp: 600,
    speed: 31,
    description: '一航戦の旗艦。艦載機による航空攻撃が主力',
  },
  {
    name: '加賀',
    type: ShipType.CARRIER,
    maxHp: 600,
    speed: 28,
    description: '一航戦所属の大型空母',
  },
  {
    name: '翔鶴',
    type: ShipType.CARRIER,
    maxHp: 550,
    speed: 34,
    description: '五航戦の精鋭空母',
  },

  // 巡洋艦 - 砲と魚雷を併用する中距離のバランス型
  {
    name: '高雄',
    type: ShipType.CRUISER,
    maxHp: 450,
    speed: 35,
    description: '重巡洋艦。砲撃と雷撃を併用',
  },
  {
    name: '愛宕',
    type: ShipType.CRUISER,
    maxHp: 450,
    speed: 35,
    description: '高雄型重巡2番艦',
  },
  {
    name: '摩耶',
    type: ShipType.CRUISER,
    maxHp: 430,
    speed: 35,
    description: '対空装備を強化した重巡',
  },

  // 駆逐艦 - 魚雷を主兵装とする小型・高速の雷撃艦
  {
    name: '雪風',
    type: ShipType.DESTROYER,
    maxHp: 250,
    speed: 40,
    description: '奇跡の駆逐艦。魚雷による雷撃が主力',
  },
  {
    name: '島風',
    type: ShipType.DESTROYER,
    maxHp: 230,
    speed: 42,
    description: '史上最速の駆逐艦',
  },
]

/**
 * 艦種ごとの表示色
 */
export const SHIP_COLORS: Record<ShipType, string> = {
  [ShipType.BATTLESHIP]: '#ef5350', // 赤 - 戦艦
  [ShipType.CARRIER]: '#4fc3f7', // 青 - 空母
  [ShipType.CRUISER]: '#66bb6a', // 緑 - 巡洋艦
  [ShipType.DESTROYER]: '#ffa726', // オレンジ - 駆逐艦
}

/**
 * 艦種の日本語名
 */
export const SHIP_TYPE_NAMES: Record<ShipType, string> = {
  [ShipType.BATTLESHIP]: '戦艦',
  [ShipType.CARRIER]: '空母',
  [ShipType.CRUISER]: '巡洋艦',
  [ShipType.DESTROYER]: '駆逐艦',
}
