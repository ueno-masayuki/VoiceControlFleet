/**
 * 艦船データ定義
 * 旧日本海軍の艦名と性能データ
 */

import { ShipType } from '@/types'

export interface ShipTemplate {
  name: string
  type: ShipType
  maxHp: number
  speed: number
  firepower: number
  range: number
  description: string
}

/**
 * 旧日本海軍艦船データベース
 */
export const SHIP_DATABASE: ShipTemplate[] = [
  // 戦艦
  {
    name: '大和',
    type: ShipType.BATTLESHIP,
    maxHp: 1000,
    speed: 27,
    firepower: 150,
    range: 300,
    description: '世界最大の戦艦。46cm主砲を装備',
  },
  {
    name: '武蔵',
    type: ShipType.BATTLESHIP,
    maxHp: 1000,
    speed: 27,
    firepower: 150,
    range: 300,
    description: '大和型戦艦2番艦',
  },

  // 空母
  {
    name: '赤城',
    type: ShipType.CARRIER,
    maxHp: 600,
    speed: 31,
    firepower: 80,
    range: 400,
    description: '一航戦の旗艦。航空攻撃が主力',
  },
  {
    name: '加賀',
    type: ShipType.CARRIER,
    maxHp: 600,
    speed: 28,
    firepower: 80,
    range: 400,
    description: '一航戦所属の大型空母',
  },
  {
    name: '翔鶴',
    type: ShipType.CARRIER,
    maxHp: 550,
    speed: 34,
    firepower: 75,
    range: 380,
    description: '五航戦の精鋭空母',
  },

  // 巡洋艦
  {
    name: '高雄',
    type: ShipType.CRUISER,
    maxHp: 450,
    speed: 35,
    firepower: 90,
    range: 220,
    description: '重巡洋艦。高速で強力な砲撃力',
  },
  {
    name: '愛宕',
    type: ShipType.CRUISER,
    maxHp: 450,
    speed: 35,
    firepower: 90,
    range: 220,
    description: '高雄型重巡2番艦',
  },
  {
    name: '摩耶',
    type: ShipType.CRUISER,
    maxHp: 430,
    speed: 35,
    firepower: 85,
    range: 210,
    description: '対空装備を強化した重巡',
  },

  // 駆逐艦
  {
    name: '雪風',
    type: ShipType.DESTROYER,
    maxHp: 250,
    speed: 40,
    firepower: 50,
    range: 150,
    description: '奇跡の駆逐艦。高速で機動力に優れる',
  },
  {
    name: '島風',
    type: ShipType.DESTROYER,
    maxHp: 230,
    speed: 42,
    firepower: 55,
    range: 160,
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
