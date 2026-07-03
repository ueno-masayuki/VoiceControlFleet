/**
 * 型定義
 */

// 位置
export interface Position {
  x: number
  y: number
}

// 速度
export interface Velocity {
  x: number
  y: number
}

// 艦種
export enum ShipType {
  DESTROYER = 'DESTROYER',      // 駆逐艦
  CRUISER = 'CRUISER',          // 巡洋艦
  BATTLESHIP = 'BATTLESHIP',    // 戦艦
  CARRIER = 'CARRIER',          // 空母
}

// 陣営
export enum Faction {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY',
}

// 兵器種別（第二次大戦期の艦隊戦兵装）
export enum WeaponType {
  GUN = 'GUN',           // 艦砲
  TORPEDO = 'TORPEDO',   // 魚雷
  AIRCRAFT = 'AIRCRAFT', // 艦載機
}

// 兵器
export interface Weapon {
  type: WeaponType
  name: string
  damage: number     // 命中時のダメージ
  range: number       // 射程
  reloadTime: number // 再装填（発射間隔）秒
  accuracy: number   // 命中率 (0-1)
}

// 艦船の状態
export interface Ship {
  id: string
  name: string
  type: ShipType
  faction: Faction
  position: Position
  velocity: Velocity
  hp: number
  maxHp: number
  speed: number
  size: number
  weapons: Weapon[]
  isSelected: boolean
}

// 艦隊
export interface Fleet {
  id: string
  name: string
  ships: Ship[]
}

// 音声コマンド
export interface VoiceCommand {
  rawText: string
  timestamp: number
  confidence: number
}

// LLM解析結果
export interface CommandInterpretation {
  command: string
  targets: string[]
  action: GameAction
  parameters: Record<string, unknown>
}

// ゲームアクション
export enum GameAction {
  MOVE = 'MOVE',
  ATTACK = 'ATTACK',
  DEFEND = 'DEFEND',
  RETREAT = 'RETREAT',
  REPAIR = 'REPAIR',
  FORMATION = 'FORMATION',
}

// ゲーム状態
export interface GameState {
  playerFleet: Fleet
  enemyFleets: Fleet[]
  time: number
  score: number
}
