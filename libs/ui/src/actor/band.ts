import RuntimeState from "../store/types/runtimestate"
import { SignalDefinition } from "../definition/signal"
import Actor from "./actor"
import { ViewBand } from "../view/viewband"
import { ThunkFunc } from "../store/store"
import { BandAction } from "../store/actions/actions"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { Context } from "../context/context"

interface Band {
	receiveAction(action: BandAction, state: RuntimeState): RuntimeState
	receiveSignal(signal: SignalDefinition, context: Context): ThunkFunc
	getActor(state: RuntimeState, target: string, view?: string): Actor
	getSignalProps(signal: SignalDefinition): PropDescriptor[]
}

type BandMap = {
	[key: string]: Band
}

const bandMap: BandMap = {
	view: ViewBand,
}

const getBand = (bandName: string): Band => bandMap[bandName]

export { Band, getBand }
