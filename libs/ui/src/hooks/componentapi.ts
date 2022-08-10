import { appDispatch, getCurrentState } from "../store/store"
import { Uesio } from "./hooks"
import { PlainComponentState } from "../bands/component/types"
import { selectState, useComponentState } from "../bands/component/selectors"
import useScripts from "./usescripts"
import { parseKey } from "../component/path"
import { useComponentVariantKeys } from "../bands/componentvariant"
import { platform } from "../platform/platform"
import { Definition } from "../definition/definition"
import { useEffect } from "react"

class ComponentAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	getPackURL = (namespace: string, name: string, buildMode: boolean) =>
		platform.getComponentPackURL(
			this.uesio.getContext(),
			namespace,
			name,
			buildMode
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

	useState = <T extends PlainComponentState>(
		componentId: string,
		initialState?: T,
		cType?: string
	): [T | undefined, (state: T) => void] => {
		const viewId = this.uesio.getViewId()
		const componentType = cType || this.uesio.getComponentType()
		const state = useComponentState<T>(componentType, componentId, viewId)

		const setState = (state: T) => {
			appDispatch()({
				type: "component/set",
				payload: {
					id: componentId,
					componentType,
					view: viewId,
					state,
				},
			})
		}
		useEffect(() => {
			if (state === undefined && initialState !== undefined) {
				setState(initialState)
			}
		}, [])

		return [state ?? initialState, setState]
	}

	useStateSlice = <T extends Definition>(
		slice: string,
		componentId: string,
		initialState?: T,
		cType?: string
	): [T | undefined, (state: T) => void] => {
		const viewId = this.uesio.getViewId()
		const componentType = cType || this.uesio.getComponentType()
		const fullState = useComponentState<Record<string, T>>(
			componentType,
			componentId,
			viewId
		)
		const state = fullState?.[slice] ?? undefined

		const setState = (state: T) => {
			appDispatch()({
				type: "component/set",
				payload: {
					id: componentId,
					componentType,
					view: viewId,
					state: {
						...selectState<Record<string, T>>(
							getCurrentState(),
							componentType,
							componentId,
							viewId
						),
						[slice]: state,
					},
				},
			})
		}

		useEffect(() => {
			if (state === undefined && initialState !== undefined) {
				setState(initialState)
			}
		}, [])

		return [state ?? initialState, setState]
	}

	getState = <T extends PlainComponentState>(
		componentId: string
	): T | undefined => {
		const state = getCurrentState()
		const componentType = this.uesio.getComponentType()
		const viewId = this.uesio.getViewId()
		return selectState(state, componentType, componentId, viewId)
	}

	useExternalState = <T extends PlainComponentState>(
		viewId: string,
		componentType: string,
		componentId: string
	): T | undefined => useComponentState<T>(componentType, componentId, viewId)

	useAllVariants = () => useComponentVariantKeys()
}

export { ComponentAPI }
