import { BandSignal } from "../definition/signal"
import { ViewParams } from "./view"

const LOAD = "LOAD"

interface LoadSignal extends BandSignal {
	signal: typeof LOAD
	name: string
	namespace: string
	path: string
	params?: ViewParams
}

export { LoadSignal, LOAD }
