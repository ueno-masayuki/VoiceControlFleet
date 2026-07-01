/**
 * GameMasterService - LLMによるゲームマスター機能
 *
 * 戦況を分析し、プレイヤーを飽きさせないよう敵艦隊のウェーブを動的に決定する
 */

import { ShipType } from '@/types'

export interface GameMasterState {
  waveNumber: number
  elapsedSeconds: number
  playerActive: number
  playerTotal: number
  playerHpPercent: number
  enemiesRemaining: number
}

export interface EnemyWaveComposition {
  type: ShipType
  count: number
}

export interface EnemyWaveDecision {
  message: string
  ships: EnemyWaveComposition[]
  nextWaveDelay: number
}

interface RawWaveComposition {
  type?: unknown
  count?: unknown
}

interface RawWaveDecision {
  message?: unknown
  ships?: unknown
  nextWaveDelay?: unknown
}

const VALID_SHIP_TYPES: string[] = Object.values(ShipType)

export class GameMasterService {
  private apiKey: string
  private model: string = 'claude-3-5-sonnet-20241022'
  private apiUrl: string = 'https://api.anthropic.com/v1/messages'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY || ''

    if (!this.apiKey) {
      console.warn('⚠️ GameMaster APIキーが設定されていません。デモモードで動作します。')
    }
  }

  /**
   * 次の敵ウェーブを決定
   */
  async decideNextWave(state: GameMasterState): Promise<EnemyWaveDecision> {
    console.log('🎬 ゲームマスター: 次の展開を検討中...', state)

    if (!this.apiKey) {
      return this.demoDecide(state)
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 512,
          messages: [
            {
              role: 'user',
              content: this.buildPrompt(state),
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`GameMaster API エラー: ${response.status}`)
      }

      const data = await response.json()
      const decision = this.parseResponse(data.content[0].text)

      console.log('✅ ゲームマスター決定:', decision)
      return decision
    } catch (error) {
      console.error('❌ GameMaster API エラー:', error)
      return this.demoDecide(state)
    }
  }

  /**
   * プロンプトを構築
   */
  private buildPrompt(state: GameMasterState): string {
    return `あなたは旧日本海軍を指揮するプレイヤーと戦う海戦ゲームのゲームマスターです。
プレイヤーを飽きさせないよう、戦況に応じて次に出現させる敵艦隊を決定してください。

現在の戦況:
- これまでのウェーブ数: ${state.waveNumber}
- 経過時間: ${Math.round(state.elapsedSeconds)}秒
- プレイヤー艦: ${state.playerActive}/${state.playerTotal}隻 生存（艦隊HP ${state.playerHpPercent}%）
- 現在残っている敵艦: ${state.enemiesRemaining}隻

利用可能な艦種:
- DESTROYER: 駆逐艦（弱いが速い）
- CRUISER: 巡洋艦（中堅）
- BATTLESHIP: 戦艦（強力、低速）
- CARRIER: 空母（遠距離火力）

方針: プレイヤーが優勢（HP高め・艦数維持）なら難易度を上げ、劣勢（HP低め・艦数減少）なら手加減してください。
毎回同じ構成にせず、変化をつけてください。

以下のJSON形式のみで回答してください（説明文は不要）:
{
  "message": "プレイヤーに表示する短い状況説明や煽り文句（日本語、40文字以内）",
  "ships": [{"type": "DESTROYER", "count": 2}],
  "nextWaveDelay": 25
}`
  }

  /**
   * LLMレスポンスをパース
   */
  private parseResponse(text: string): EnemyWaveDecision {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('JSON形式が見つかりません')
      }

      const json = JSON.parse(jsonMatch[0]) as RawWaveDecision
      const rawShips = Array.isArray(json.ships) ? (json.ships as RawWaveComposition[]) : []

      const ships: EnemyWaveComposition[] = rawShips
        .filter((s) => typeof s.type === 'string' && VALID_SHIP_TYPES.includes(s.type))
        .map((s) => ({
          type: s.type as ShipType,
          count: Math.max(1, Math.min(6, Math.round(Number(s.count) || 1))),
        }))

      return {
        message: typeof json.message === 'string' ? json.message : '新たな敵艦隊が接近中...',
        ships: ships.length > 0 ? ships : [{ type: ShipType.DESTROYER, count: 2 }],
        nextWaveDelay: this.clampDelay(json.nextWaveDelay),
      }
    } catch (error) {
      console.error('ゲームマスターレスポンスのパースに失敗:', error)
      return this.fallbackDecision()
    }
  }

  /**
   * 遅延秒数の範囲を制限
   */
  private clampDelay(value: unknown): number {
    const n = typeof value === 'number' ? value : 25
    return Math.max(12, Math.min(60, Math.round(n)))
  }

  /**
   * パース失敗時のフォールバック
   */
  private fallbackDecision(): EnemyWaveDecision {
    return {
      message: '敵艦隊が接近中...',
      ships: [{ type: ShipType.DESTROYER, count: 2 }],
      nextWaveDelay: 25,
    }
  }

  /**
   * デモモード: ルールベースの難易度調整
   */
  private demoDecide(state: GameMasterState): EnemyWaveDecision {
    const wave = state.waveNumber + 1
    let baseCount = 2 + Math.floor(wave / 2)

    // プレイヤーが優勢なら増強、劣勢なら手加減
    if (state.playerHpPercent >= 80 && state.playerActive === state.playerTotal) {
      baseCount += 1
    } else if (state.playerHpPercent < 40) {
      baseCount = Math.max(1, baseCount - 1)
    }
    baseCount = Math.max(1, Math.min(7, baseCount))

    const ships: EnemyWaveComposition[] = []
    let remaining = baseCount

    // 強力な艦種を波数に応じて混入
    if (wave % 4 === 0) {
      ships.push({ type: ShipType.BATTLESHIP, count: 1 })
      remaining -= 1
    } else if (wave % 3 === 0) {
      ships.push({ type: ShipType.CARRIER, count: 1 })
      remaining -= 1
    }

    const cruiserCount = Math.min(remaining, Math.floor(wave / 3))
    if (cruiserCount > 0) {
      ships.push({ type: ShipType.CRUISER, count: cruiserCount })
      remaining -= cruiserCount
    }

    if (remaining > 0) {
      ships.push({ type: ShipType.DESTROYER, count: remaining })
    }

    const messages = [
      `第${wave}波: 敵艦隊が水平線に出現！`,
      `敵増援だ！第${wave}波が接近中`,
      `索敵完了 — 第${wave}波の敵艦隊を確認`,
      `油断するな、第${wave}波が来るぞ！`,
    ]
    const message = messages[wave % messages.length]

    return {
      message,
      ships,
      nextWaveDelay: Math.max(15, 26 - wave),
    }
  }
}
