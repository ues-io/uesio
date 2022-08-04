import { appDispatch, getCurrentState } from "../store/store"
import { Uesio } from "./hooks"
import { PlainComponentState } from "../bands/component/types"
import {
	selectComponent,
	useComponentState,
} from "../bands/component/selectors"
import useScripts from "./usescripts"
import { parseKey } from "../component/path"
import { FieldValue, PlainWireRecord } from "../bands/wirerecord/types"
import { useComponentVariantKeys } from "../bands/componentvariant"
import { platform } from "../platform/platform"

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

	useState = <T extends FieldValue>(
		componentId: string,
		initialState?: T,
		slice?: string,
		cType?: string
	): [T | undefined, (state: T) => void] => {
		const viewId = this.uesio.getViewId()
		const componentType = cType || this.uesio.getComponentType()
		const fullState = useComponentState<T>(
			componentType,
			componentId,
			viewId
		)
		console.log({ fullState })
		const state = slice
			? ((fullState as PlainWireRecord)?.[slice] as T) ?? undefined
			: fullState

		const setState = (state: T) => {
			appDispatch()({
				type: "component/set",
				payload: {
					id: componentId,
					componentType,
					view: viewId,
					state: slice
						? {
								...(selectComponent<T>(
									getCurrentState(),
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

		return [state ?? initialState, setState]
	}

	getState = <T extends PlainComponentState>(
		componentId: string
	): T | undefined => {
		const state = getCurrentState()
		const componentType = this.uesio.getComponentType()
		const viewId = this.uesio.getViewId()
		return selectComponent(state, componentType, componentId, viewId)
	}

	useExternalState = <T extends PlainComponentState>(
		viewId: string,
		componentType: string,
		componentId: string
	): T | undefined => useComponentState<T>(componentType, componentId, viewId)

	useAllVariants = () => useComponentVariantKeys()
}

export { ComponentAPI }
