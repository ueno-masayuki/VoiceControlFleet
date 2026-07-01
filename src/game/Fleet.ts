/**
 * Fleet - 艦隊クラス
 *
 * 複数の艦船をグループとして管理
 */

import { Fleet as IFleet, Position, Faction } from '@/types'
import { Ship } from './Ship'
import { SHIP_DATABASE, ShipTemplate } from './ShipData'

export class Fleet implements IFleet {
  id: string
  name: string
  ships: Ship[]

  constructor(id: string, name: string) {
    this.id = id
    this.name = name
    this.ships = []
  }

  /**
   * 艦隊の初期化（旧日本海軍の艦船10隻）
   */
  initializePlayerFleet(startX: number, startY: number): void {
    const spacing = 80
    const cols = 5

    SHIP_DATABASE.forEach((template, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)

      const x = startX + col * spacing
      const y = startY + row * spacing

      const ship = this.createShipFromTemplate(template, { x, y }, index)
      this.ships.push(ship)
    })
  }

  /**
   * テンプレートから艦船を作成
   */
  private createShipFromTemplate(
    template: ShipTemplate,
    position: Position,
    index: number
  ): Ship {
    return new Ship(
      `ship_${index}`,
      template.name,
      template.type,
      position,
      template.maxHp,
      template.speed,
      template.firepower,
      template.range,
      Faction.PLAYER
    )
  }

  /**
   * 艦船を1隻追加
   */
  addShip(ship: Ship): void {
    this.ships.push(ship)
  }

  /**
   * 艦船を複数追加
   */
  addShips(ships: Ship[]): void {
    this.ships.push(...ships)
  }

  /**
   * 更新処理
   */
  update(deltaTime: number): void {
    this.ships.forEach((ship) => ship.update(deltaTime))

    // 撃沈された艦船を除去
    this.ships = this.ships.filter((ship) => !ship.isSunk())
  }

  /**
   * 描画
   */
  render(ctx: CanvasRenderingContext2D): void {
    this.ships.forEach((ship) => ship.render(ctx))
  }

  /**
   * 艦名で艦船を検索
   */
  findShipByName(name: string): Ship | undefined {
    return this.ships.find((ship) => ship.name === name)
  }

  /**
   * IDで艦船を検索
   */
  findShipById(id: string): Ship | undefined {
    return this.ships.find((ship) => ship.id === id)
  }

  /**
   * クリック位置の艦船を取得
   */
  getShipAtPosition(x: number, y: number): Ship | undefined {
    // 逆順で検索（上に描画された艦船を優先）
    for (let i = this.ships.length - 1; i >= 0; i--) {
      if (this.ships[i].containsPoint(x, y)) {
        return this.ships[i]
      }
    }
    return undefined
  }

  /**
   * 全艦船の選択を解除
   */
  deselectAll(): void {
    this.ships.forEach((ship) => (ship.isSelected = false))
  }

  /**
   * 選択中の艦船を取得
   */
  getSelectedShips(): Ship[] {
    return this.ships.filter((ship) => ship.isSelected)
  }

  /**
   * 全艦船に目標位置を設定
   */
  setAllTargets(position: Position): void {
    this.ships.forEach((ship) => ship.setTarget(position))
  }

  /**
   * 選択中の艦船に目標位置を設定
   */
  setSelectedTargets(position: Position): void {
    this.getSelectedShips().forEach((ship) => ship.setTarget(position))
  }

  /**
   * 艦隊の中心位置を取得
   */
  getCenterPosition(): Position | null {
    if (this.ships.length === 0) return null

    const sum = this.ships.reduce(
      (acc, ship) => ({
        x: acc.x + ship.position.x,
        y: acc.y + ship.position.y,
      }),
      { x: 0, y: 0 }
    )

    return {
      x: sum.x / this.ships.length,
      y: sum.y / this.ships.length,
    }
  }

  /**
   * 艦隊の状態サマリー
   */
  getSummary(): {
    total: number
    active: number
    totalHp: number
    maxHp: number
  } {
    const active = this.ships.filter((ship) => ship.hp > 0).length
    const totalHp = this.ships.reduce((sum, ship) => sum + ship.hp, 0)
    const maxHp = this.ships.reduce((sum, ship) => sum + ship.maxHp, 0)

    return {
      total: this.ships.length,
      active,
      totalHp,
      maxHp,
    }
  }
}
