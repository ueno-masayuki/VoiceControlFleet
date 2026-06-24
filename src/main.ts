/**
 * VoiceControlFleet - メインエントリーポイント
 *
 * 音声で指揮する、Webベースのリアルタイム艦隊戦略ゲーム
 */

import './styles/main.css'
import { Game } from './game/Game'

console.log('🎮 VoiceControlFleet 起動中...')

// ゲームインスタンスの初期化
const game = new Game()

// ローディング画面を削除
const loading = document.getElementById('loading')
if (loading) {
  loading.remove()
}

// ゲーム開始
game.start()

console.log('✅ ゲームが正常に起動しました')
