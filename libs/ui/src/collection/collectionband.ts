import RuntimeState from "../store/types/runtimestate"

import { BandAction, ActionGroup } from "../store/actions/actions"
import { SignalDefinition, SignalsHandler } from "../definition/signal"
import { ThunkFunc } from "../store/store"
import { Collection, PlainCollectionMap } from "./collection"
import { LOAD, LoadAction } from "./collectionbandactions"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { Context } from "../context/context"

class CollectionBand {
	static actionGroup: ActionGroup = {
		[LOAD]: (
			action: LoadAction,
			state: PlainCollectionMap
		): PlainCollectionMap => {
			// Eventually we might want to be smart here about not just totally replacing the value with
			// the response. We'll want it to be an additive process.
			return { ...state, ...action.data.collections }
		},
	}

	static getSignalHandlers(): SignalsHandler {
		return {}
	}

	static receiveSignal(
		signal: SignalDefinition,
		context: Context
	): ThunkFunc {
		const handlers = CollectionBand.getSignalHandlers()
		const handler = handlers && handlers[signal.signal]
		if (!handler) {
			throw new Error("No Handler found for signal: " + signal.signal)
		}
		return handler.dispatcher(signal, context)
	}

	static receiveAction(
		action: BandAction,
		state: RuntimeState
	): RuntimeState {
		const handler = this.actionGroup[action.name]

		if (handler) {
			return Object.assign({}, state, {
				collection: handler(action, state.collection, state),
			})
		}
		return state
	}

	static getActor(state: RuntimeState, target: string): Collection {
		return new Collection(state?.collection?.[target] || null)
	}

	static makeId(namespace: string, name: string): string {
		return `${namespace}.${name}`
	}

	static getSignalProps(/*signal: SignalDefinition*/): PropDescriptor[] {
		return []
	}
}

export { CollectionBand }
