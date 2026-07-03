/**
 * 兵器データ定義
 *
 * 第二次大戦期の艦隊戦を構成する三大兵装（艦砲・魚雷・艦載機）のプリセットと、
 * 艦種ごとの装備・艦体規模を定義する。艦種ごとの戦術的役割はこの装備差に
 * よって表現される。
 */

import { ShipType, Weapon, WeaponType } from '@/types'

/** 戦艦の主砲。長射程・大ダメージだが再装填が遅い */
const BATTLESHIP_MAIN_GUN: Weapon = {
  type: WeaponType.GUN,
  name: '46cm主砲',
  damage: 45,
  range: 280,
  reloadTime: 4,
  accuracy: 0.55,
}

/** 重巡洋艦の主砲。中射程・中ダメージでバランス型 */
const CRUISER_GUN: Weapon = {
  type: WeaponType.GUN,
  name: '20cm砲',
  damage: 22,
  range: 200,
  reloadTime: 1.8,
  accuracy: 0.65,
}

/** 駆逐艦の主砲。短射程・低ダメージだが連射が効く */
const DESTROYER_GUN: Weapon = {
  type: WeaponType.GUN,
  name: '12.7cm砲',
  damage: 12,
  range: 140,
  reloadTime: 1.2,
  accuracy: 0.6,
}

/** 重巡洋艦の魚雷。命中すれば大打撃だが再装填が遅い */
const CRUISER_TORPEDO: Weapon = {
  type: WeaponType.TORPEDO,
  name: '61cm魚雷',
  damage: 50,
  range: 170,
  reloadTime: 7,
  accuracy: 0.45,
}

/** 駆逐艦の魚雷。駆逐艦最大の攻撃力を持つ主兵装 */
const DESTROYER_TORPEDO: Weapon = {
  type: WeaponType.TORPEDO,
  name: '61cm魚雷',
  damage: 60,
  range: 190,
  reloadTime: 5.5,
  accuracy: 0.5,
}

/** 空母の艦載機。最長射程・最大ダメージだが出撃サイクルが非常に長い */
const CARRIER_STRIKE_WING: Weapon = {
  type: WeaponType.AIRCRAFT,
  name: '艦載機隊',
  damage: 75,
  range: 400,
  reloadTime: 18,
  accuracy: 0.6,
}

/**
 * 艦種ごとの兵装構成
 * - 戦艦: 大口径主砲のみ（長射程の砲撃戦）
 * - 空母: 艦載機のみ（最長射程の航空攻撃、艦自体は非武装に近い）
 * - 巡洋艦: 中口径砲＋魚雷（バランス型）
 * - 駆逐艦: 軽砲＋魚雷（魚雷が主兵装の近接雷撃艦）
 */
export const WEAPON_LOADOUTS: Record<ShipType, Weapon[]> = {
  [ShipType.BATTLESHIP]: [BATTLESHIP_MAIN_GUN],
  [ShipType.CARRIER]: [CARRIER_STRIKE_WING],
  [ShipType.CRUISER]: [CRUISER_GUN, CRUISER_TORPEDO],
  [ShipType.DESTROYER]: [DESTROYER_GUN, DESTROYER_TORPEDO],
}

/**
 * 艦種ごとの艦体規模（描画上のサイズ）
 * 史実の艦の全長(m)をおおよそ1/10に縮小した値とし、
 * 戦艦・空母は大型、巡洋艦は中型、駆逐艦は小型という規模差を表現する。
 */
export const SHIP_SIZES: Record<ShipType, number> = {
  [ShipType.BATTLESHIP]: 26, // 大和型全長263m相当
  [ShipType.CARRIER]: 25, // 赤城型全長260m相当
  [ShipType.CRUISER]: 20, // 高雄型全長203m相当
  [ShipType.DESTROYER]: 12, // 陽炎型全長118m相当
}
