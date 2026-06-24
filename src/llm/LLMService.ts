/**
 * LLMService - LLMとの通信を管理
 *
 * Anthropic Claude APIを使用して音声コマンドを解釈
 */

import { CommandInterpretation, GameAction } from '@/types'

export class LLMService {
  private apiKey: string
  private model: string = 'claude-3-5-sonnet-20241022'
  private apiUrl: string = 'https://api.anthropic.com/v1/messages'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY || ''

    if (!this.apiKey) {
      console.warn('⚠️ LLM APIキーが設定されていません。デモモードで動作します。')
    }
  }

  /**
   * 音声コマンドを解釈
   */
  async interpretCommand(voiceText: string): Promise<CommandInterpretation> {
    console.log('🤖 LLMでコマンドを解釈中:', voiceText)

    // APIキーがない場合はデモモードで動作
    if (!this.apiKey) {
      return this.demoInterpret(voiceText)
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
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: this.buildPrompt(voiceText),
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`LLM API エラー: ${response.status}`)
      }

      const data = await response.json()
      const result = this.parseResponse(data.content[0].text)

      console.log('✅ LLM解釈結果:', result)
      return result
    } catch (error) {
      console.error('❌ LLM API エラー:', error)
      return this.demoInterpret(voiceText)
    }
  }

  /**
   * プロンプトを構築
   */
  private buildPrompt(voiceText: string): string {
    return `あなたは旧日本海軍の艦隊を指揮する音声コマンドシステムです。
プレイヤーの自然言語指示を解析し、具体的なゲームコマンドに変換してください。

利用可能な艦船:
- 戦艦: 大和、武蔵
- 空母: 赤城、加賀、翔鶴
- 巡洋艦: 高雄、愛宕、摩耶
- 駆逐艦: 雪風、島風

利用可能なアクション:
- MOVE: 移動
- ATTACK: 攻撃
- DEFEND: 防衛
- RETREAT: 撤退
- REPAIR: 修理
- FORMATION: 陣形変更

ユーザーの指示: "${voiceText}"

以下のJSON形式で回答してください:
{
  "command": "解釈したコマンドの簡潔な説明",
  "action": "MOVE/ATTACK/DEFEND/RETREAT/REPAIR/FORMATION のいずれか",
  "targets": ["対象艦名の配列", "全艦の場合は空配列"],
  "parameters": {
    "direction": "方向（該当する場合）",
    "target": "攻撃対象等",
    "formation": "陣形名等"
  }
}

JSONのみを返してください。説明は不要です。`
  }

  /**
   * LLMレスポンスをパース
   */
  private parseResponse(text: string): CommandInterpretation {
    try {
      // JSONブロックを抽出
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('JSON形式が見つかりません')
      }

      const json = JSON.parse(jsonMatch[0])

      return {
        command: json.command || '不明なコマンド',
        action: json.action || GameAction.MOVE,
        targets: Array.isArray(json.targets) ? json.targets : [],
        parameters: json.parameters || {},
      }
    } catch (error) {
      console.error('レスポンスのパースに失敗:', error)
      return {
        command: '解釈できませんでした',
        action: GameAction.MOVE,
        targets: [],
        parameters: {},
      }
    }
  }

  /**
   * デモモード: 簡易的なパターンマッチング
   */
  private demoInterpret(voiceText: string): CommandInterpretation {
    const text = voiceText.toLowerCase()

    // 移動コマンド
    if (text.includes('移動') || text.includes('進め')) {
      return {
        command: '移動命令',
        action: GameAction.MOVE,
        targets: this.extractTargets(voiceText),
        parameters: { direction: this.extractDirection(voiceText) },
      }
    }

    // 攻撃コマンド
    if (text.includes('攻撃') || text.includes('砲撃') || text.includes('撃て')) {
      return {
        command: '攻撃命令',
        action: GameAction.ATTACK,
        targets: this.extractTargets(voiceText),
        parameters: {},
      }
    }

    // 防衛コマンド
    if (text.includes('防衛') || text.includes('守れ') || text.includes('防御')) {
      return {
        command: '防衛命令',
        action: GameAction.DEFEND,
        targets: this.extractTargets(voiceText),
        parameters: {},
      }
    }

    // 撤退コマンド
    if (text.includes('撤退') || text.includes('後退') || text.includes('逃げろ')) {
      return {
        command: '撤退命令',
        action: GameAction.RETREAT,
        targets: this.extractTargets(voiceText),
        parameters: {},
      }
    }

    // 修理コマンド
    if (text.includes('修理')) {
      return {
        command: '修理命令',
        action: GameAction.REPAIR,
        targets: this.extractTargets(voiceText),
        parameters: {},
      }
    }

    // デフォルト: 移動
    return {
      command: '移動命令（デフォルト）',
      action: GameAction.MOVE,
      targets: [],
      parameters: {},
    }
  }

  /**
   * 対象艦船を抽出
   */
  private extractTargets(text: string): string[] {
    const ships = ['大和', '武蔵', '赤城', '加賀', '翔鶴', '高雄', '愛宕', '摩耶', '雪風', '島風']
    const targets: string[] = []

    ships.forEach((ship) => {
      if (text.includes(ship)) {
        targets.push(ship)
      }
    })

    return targets
  }

  /**
   * 方向を抽出
   */
  private extractDirection(text: string): string {
    if (text.includes('北東')) return '北東'
    if (text.includes('北西')) return '北西'
    if (text.includes('南東')) return '南東'
    if (text.includes('南西')) return '南西'
    if (text.includes('北')) return '北'
    if (text.includes('南')) return '南'
    if (text.includes('東')) return '東'
    if (text.includes('西')) return '西'
    return '前方'
  }
}
