import RuntimeState from "../store/types/runtimestate"
import { SignalDefinition } from "../definition/signal"
import Actor from "./actor"
import { WireBand } from "../wire/wireband"
import { ComponentBand } from "../componentactor/componentband"
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
	component: ComponentBand,
	view: ViewBand,
	wire: WireBand,
}

const getBand = (bandName: string): Band => {
	return bandMap[bandName]
}

export { Band, getBand }
