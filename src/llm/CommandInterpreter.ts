/**
 * CommandInterpreter - LLMの解釈結果を実際のゲームアクションに変換
 */

import { CommandInterpretation, GameAction, Position } from '@/types'
import { Fleet } from '@/game/Fleet'

export class CommandInterpreter {
  /**
   * コマンドを実行
   */
  executeCommand(
    interpretation: CommandInterpretation,
    fleet: Fleet,
    canvasWidth: number,
    canvasHeight: number,
    enemyFleet?: Fleet
  ): void {
    console.log('🎯 コマンド実行:', interpretation)

    switch (interpretation.action) {
      case GameAction.MOVE:
        this.executeMove(interpretation, fleet, canvasWidth, canvasHeight)
        break

      case GameAction.ATTACK:
        this.executeAttack(interpretation, fleet, enemyFleet)
        break

      case GameAction.DEFEND:
        this.executeDefend(interpretation, fleet)
        break

      case GameAction.RETREAT:
        this.executeRetreat(interpretation, fleet, canvasWidth, canvasHeight)
        break

      case GameAction.REPAIR:
        this.executeRepair(interpretation, fleet)
        break

      case GameAction.FORMATION:
        this.executeFormation(interpretation, fleet)
        break

      default:
        console.warn('⚠️ 不明なアクション:', interpretation.action)
    }
  }

  /**
   * 移動コマンドを実行
   */
  private executeMove(
    interpretation: CommandInterpretation,
    fleet: Fleet,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const direction = interpretation.parameters.direction as string
    const targetPosition = this.getDirectionPosition(direction, canvasWidth, canvasHeight)

    if (interpretation.targets.length === 0) {
      // 全艦移動
      fleet.setAllTargets(targetPosition)
      console.log('📍 全艦を', direction, 'に移動')
    } else {
      // 指定艦移動
      interpretation.targets.forEach((shipName) => {
        const ship = fleet.findShipByName(shipName)
        if (ship) {
          ship.setTarget(targetPosition)
          console.log(`📍 ${shipName} を`, direction, 'に移動')
        }
      })
    }
  }

  /**
   * 攻撃コマンドを実行
   *
   * 指定艦を敵艦隊の中心に向けて前進させる。射程内に入った艦は
   * CombatSystem により自動的に交戦する。
   */
  private executeAttack(
    interpretation: CommandInterpretation,
    fleet: Fleet,
    enemyFleet?: Fleet
  ): void {
    const ships = this.getTargetShips(interpretation, fleet)

    if (ships.length === 0) {
      console.warn('⚠️ 攻撃対象の艦船が見つかりません')
      return
    }

    const advancePosition = enemyFleet?.getCenterPosition()

    ships.forEach((ship) => {
      if (advancePosition) {
        ship.setTarget(advancePosition)
      }
      console.log(`⚔️ ${ship.name} 攻撃態勢で前進`)
    })
  }

  /**
   * 防衛コマンドを実行
   */
  private executeDefend(interpretation: CommandInterpretation, fleet: Fleet): void {
    const ships = this.getTargetShips(interpretation, fleet)

    ships.forEach((ship) => {
      // 現在位置で停止
      ship.setTarget(ship.position)
      console.log(`🛡️ ${ship.name} 防衛態勢`)
    })
  }

  /**
   * 撤退コマンドを実行
   */
  private executeRetreat(
    interpretation: CommandInterpretation,
    fleet: Fleet,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const ships = this.getTargetShips(interpretation, fleet)
    const retreatPosition: Position = {
      x: canvasWidth / 4,
      y: canvasHeight - 100,
    }

    ships.forEach((ship) => {
      ship.setTarget(retreatPosition)
      console.log(`🏃 ${ship.name} 撤退`)
    })
  }

  /**
   * 修理コマンドを実行
   */
  private executeRepair(interpretation: CommandInterpretation, fleet: Fleet): void {
    const ships = this.getTargetShips(interpretation, fleet)

    ships.forEach((ship) => {
      ship.repair(ship.maxHp * 0.3) // 最大HPの30%を回復
      console.log(`🔧 ${ship.name} 修理 (HP: ${Math.round(ship.hp)}/${ship.maxHp})`)
    })
  }

  /**
   * 陣形コマンドを実行
   */
  private executeFormation(interpretation: CommandInterpretation, fleet: Fleet): void {
    const formation = interpretation.parameters.formation as string
    console.log(`📐 陣形変更: ${formation}`)

    // TODO: 陣形システムを実装
    const ships = this.getTargetShips(interpretation, fleet)
    console.log(`${ships.length}隻を${formation}陣形に配置`)
  }

  /**
   * 対象艦船を取得
   */
  private getTargetShips(interpretation: CommandInterpretation, fleet: Fleet) {
    if (interpretation.targets.length === 0) {
      // 全艦
      return fleet.ships
    }

    // 指定艦
    const ships = interpretation.targets
      .map((name) => fleet.findShipByName(name))
      .filter((ship) => ship !== undefined)

    return ships
  }

  /**
   * 方向から目標位置を計算
   */
  private getDirectionPosition(
    direction: string,
    canvasWidth: number,
    canvasHeight: number
  ): Position {
    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2

    const positions: Record<string, Position> = {
      北: { x: centerX, y: 100 },
      北東: { x: canvasWidth - 100, y: 100 },
      東: { x: canvasWidth - 100, y: centerY },
      南東: { x: canvasWidth - 100, y: canvasHeight - 100 },
      南: { x: centerX, y: canvasHeight - 100 },
      南西: { x: 100, y: canvasHeight - 100 },
      西: { x: 100, y: centerY },
      北西: { x: 100, y: 100 },
      中央: { x: centerX, y: centerY },
      前方: { x: centerX, y: centerY - 200 },
    }

    return positions[direction] || { x: centerX, y: centerY }
  }
}
