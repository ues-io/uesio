import { Dispatcher } from "../store/store"
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
		this.dispatcher((dispatch, getState, platform) =>
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
		const viewId = this.uesio.getViewId()
		const componentType = this.uesio.getComponentType()
		const state = useComponentState(componentType, componentId, viewId)

		useEffect(() => {
			if (!state && viewId) {
				this.dispatcher({
					type: "component/set",
					payload: {
						id: componentId,
						componentType,
						view: viewId,
						state: initialState,
					},
				})
			}
		})

		return state
	}
}

export { ComponentAPI }
