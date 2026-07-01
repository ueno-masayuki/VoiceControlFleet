/**
 * VoiceRecognitionService - Web Speech APIによる音声認識
 *
 * ブラウザ標準の音声認識APIをラップし、
 * 日本語音声コマンドをテキストに変換する
 */

// Web Speech API の型定義（TypeScript標準ライブラリに含まれないため独自定義）
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
  onend: ((this: SpeechRecognition, ev: Event) => void) | null
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export type VoiceRecognitionStatus = 'idle' | 'listening' | 'processing' | 'error' | 'unsupported'

export interface VoiceRecognitionCallbacks {
  onResult: (text: string, isFinal: boolean) => void
  onStatusChange: (status: VoiceRecognitionStatus) => void
  onError?: (message: string) => void
}

export class VoiceRecognitionService {
  private recognition: SpeechRecognition | null = null
  private callbacks: VoiceRecognitionCallbacks
  private isListening: boolean = false
  private status: VoiceRecognitionStatus = 'idle'

  constructor(callbacks: VoiceRecognitionCallbacks) {
    this.callbacks = callbacks
    this.initRecognition()
  }

  /**
   * 音声認識の初期化
   */
  private initRecognition(): void {
    const SpeechRecognitionImpl =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognitionImpl) {
      console.warn('⚠️ このブラウザは音声認識に対応していません')
      this.setStatus('unsupported')
      return
    }

    this.recognition = new SpeechRecognitionImpl()
    this.recognition.lang = 'ja-JP'
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.maxAlternatives = 1

    this.recognition.onstart = () => {
      console.log('🎤 音声認識開始')
      this.isListening = true
      this.setStatus('listening')
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex]
      const text = result[0].transcript
      const isFinal = result.isFinal

      if (isFinal) {
        console.log('🎤 音声認識結果（確定）:', text)
        this.setStatus('processing')
      }

      this.callbacks.onResult(text, isFinal)
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('❌ 音声認識エラー:', event.error)
      this.setStatus('error')

      if (this.callbacks.onError) {
        this.callbacks.onError(this.getErrorMessage(event.error))
      }
    }

    this.recognition.onend = () => {
      console.log('🎤 音声認識終了')

      // continuous モードでも自動的に終了することがあるため、
      // リスニング中であれば再開する
      if (this.isListening) {
        try {
          this.recognition?.start()
        } catch (error) {
          console.warn('音声認識の再開に失敗:', error)
          this.isListening = false
          this.setStatus('idle')
        }
      } else {
        this.setStatus('idle')
      }
    }
  }

  /**
   * 音声認識を開始
   */
  start(): void {
    if (!this.recognition) {
      console.warn('⚠️ 音声認識が利用できません')
      return
    }

    if (this.isListening) return

    try {
      this.isListening = true
      this.recognition.start()
    } catch (error) {
      console.error('音声認識の開始に失敗:', error)
      this.isListening = false
      this.setStatus('error')
    }
  }

  /**
   * 音声認識を停止
   */
  stop(): void {
    if (!this.recognition) return

    this.isListening = false
    this.recognition.stop()
    this.setStatus('idle')
  }

  /**
   * 音声認識のトグル
   */
  toggle(): void {
    if (this.isListening) {
      this.stop()
    } else {
      this.start()
    }
  }

  /**
   * 対応状況の確認
   */
  isSupported(): boolean {
    return this.status !== 'unsupported'
  }

  /**
   * 現在リスニング中か
   */
  getIsListening(): boolean {
    return this.isListening
  }

  /**
   * ステータス更新
   */
  private setStatus(status: VoiceRecognitionStatus): void {
    this.status = status
    this.callbacks.onStatusChange(status)
  }

  /**
   * エラーメッセージの取得
   */
  private getErrorMessage(error: string): string {
    const messages: Record<string, string> = {
      'no-speech': '音声が検出されませんでした',
      'audio-capture': 'マイクにアクセスできません',
      'not-allowed': 'マイクの使用が許可されていません',
      network: 'ネットワークエラーが発生しました',
      aborted: '音声認識が中断されました',
    }

    return messages[error] || `音声認識エラー: ${error}`
  }
}
