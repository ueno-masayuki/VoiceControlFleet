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

// 艦船の状態
export interface Ship {
  id: string
  name: string
  type: ShipType
  position: Position
  velocity: Velocity
  hp: number
  maxHp: number
  speed: number
  firepower: number
  range: number
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
