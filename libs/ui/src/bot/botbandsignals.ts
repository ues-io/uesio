import { BandSignal } from "../definition/signal"
import { BotParams } from "../platform/platform"

const CALL = "CALL"

interface CallBotSignal extends BandSignal {
	signal: typeof CALL
	bot: string
	params?: BotParams
}

type BotBandSignal = CallBotSignal

export { CallBotSignal, CALL, BotBandSignal }
