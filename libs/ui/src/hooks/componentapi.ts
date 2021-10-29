import { Dispatcher, getStore } from "../store/store"
import { Uesio } from "./hooks"
import { PlainComponentState } from "../bands/component/types"
import { selectState, useComponentState } from "../bands/component/selectors"
import { useEffect } from "react"
import { AnyAction } from "@reduxjs/toolkit"
import useScripts from "./usescripts"
import { parseKey } from "../component/path"
import { useAllVariants } from "../bands/componentvariant/selectors"
import { FieldValue, PlainWireRecord } from "../bands/wirerecord/types"

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

	usePacks = (packs: string[] | undefined, buildMode: boolean) =>
		useScripts(
			packs?.flatMap((key) => {
				const [namespace, name] = parseKey(key)
				const result = [this.getPackURL(namespace, name, false)]
				if (buildMode) {
					result.push(this.getPackURL(namespace, name, true))
				}
				return result
			}) || []
		)

	useState = <T extends FieldValue>(
		componentId: string,
		initialState?: T,
		slice?: string
	): [T | undefined, (state: T) => void] => {
		const viewId = this.uesio.getViewId()
		const componentType = this.uesio.getComponentType()
		const fullState = useComponentState<T>(
			componentType,
			componentId,
			viewId
		)
		const state = slice
			? ((fullState as PlainWireRecord)?.[slice] as T) || undefined
			: fullState

		const setState = (state: T) => {
			this.dispatcher({
				type: "component/set",
				payload: {
					id: componentId,
					componentType,
					view: viewId,
					state: slice
						? {
								...(selectState<T>(
									getStore().getState(),
									componentType,
									componentId,
									viewId
								) as PlainWireRecord),
								[slice]: state,
						  }
						: state,
				},
			})
		}

		useEffect(() => {
			if (state === undefined && initialState !== undefined && viewId) {
				setState(initialState)
			}
		})

		return [state, setState]
	}

	getState = <T extends PlainComponentState>(
		componentId: string
	): T | undefined => {
		const state = getStore().getState()
		const componentType = this.uesio.getComponentType()
		const viewId = this.uesio.getViewId()
		return selectState(state, componentType, componentId, viewId)
	}

	useExternalState = <T extends PlainComponentState>(
		viewId: string,
		componentType: string,
		componentId: string
	): T | undefined => useComponentState<T>(componentType, componentId, viewId)

	useAllVariants = useAllVariants
}

export { ComponentAPI }
