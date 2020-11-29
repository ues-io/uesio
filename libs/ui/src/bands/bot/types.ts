import { callSignal } from "./signals"

type CallSignal = ReturnType<typeof callSignal>

// A type that describes all signals in the bot band
type BotSignal = CallSignal

export { BotSignal, CallSignal }
