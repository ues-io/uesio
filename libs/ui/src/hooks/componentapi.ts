import { Dispatcher } from "../store/store"
import RuntimeState from "../store/types/runtimestate"
import { Platform } from "../platform/platform"
import { Uesio } from "./hooks"
import { PlainComponentState } from "../bands/component/types"
import { useComponentState } from "../bands/component/selectors"
import { useEffect } from "react"
import { AnyAction } from "@reduxjs/toolkit"

class ComponentAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<AnyAction>

	getPackURL = (namespace: string, name: string, buildMode: boolean) =>
		this.dispatcher(
			(dispatch, getState: () => RuntimeState, platform: Platform) =>
				platform.getComponentPackURL(
					this.uesio.getContext(),
					namespace,
					name,
					buildMode
				)
		)

	useState = (
		componentId: string,
		initialState: PlainComponentState
	): PlainComponentState | undefined => {
		const view = this.uesio.getView()
		const componentType = this.uesio.getComponentType()
		const state = useComponentState(
			componentType,
			componentId,
			view?.getId()
		)

		useEffect(() => {
			if (!state && view) {
				this.dispatcher({
					type: "component/set",
					payload: {
						id: componentId,
						componentType,
						view: view.getId(),
						state: initialState,
					},
				})
			}
		})

		return state
	}
}

export { ComponentAPI }
