import { appDispatch, getCurrentState } from "../store/store"
import { Uesio } from "./hooks"
import { PlainComponentState } from "../bands/component/types"
import { selectState, useComponentState } from "../bands/component/selectors"
import { selectId, useComponentVariants } from "../bands/componentvariant"
import { makeComponentId, set as setComponent } from "../bands/component"
import { Definition } from "../definition/definition"
import { useEffect } from "react"
import { ComponentVariant } from "../definition/componentvariant"

class ComponentAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	getId = (namedId?: string, componentType?: string) => {
		const context = this.uesio.getContext()
		const cType = componentType || this.uesio.getComponentType()
		const id = namedId || this.uesio.getPath()
		return makeComponentId(context, cType, id)
	}

	useState = <T extends PlainComponentState>(
		componentId: string,
		initialState?: T
	): [T | undefined, (state: T) => void] => {
		const state = useComponentState<T>(componentId)
		const setState = (state: T | undefined) => {
			appDispatch()(
				setComponent({
					id: componentId,
					state,
				})
			)
		}
		useEffect(() => {
			if (state === undefined) {
				setState(initialState)
			}
		}, [componentId])

		return [state ?? initialState, setState]
	}

	useStateSlice = <T extends Definition>(
		slice: string,
		componentId: string,
		initialState?: T
	): [T | undefined, (state: T) => void] => {
		const fullState = useComponentState<Record<string, T>>(componentId)
		const state = fullState?.[slice] ?? undefined

		const setState = (state: T) => {
			appDispatch()(
				setComponent({
					id: componentId,
					state: {
						...selectState<Record<string, T>>(
							getCurrentState(),
							componentId
						),
						[slice]: state,
					},
				})
			)
		}

		useEffect(() => {
			if (state === undefined && initialState !== undefined) {
				setState(initialState)
			}
		}, [componentId])

		return [state ?? initialState, setState]
	}

	useExternalState = <T extends PlainComponentState>(
		componentId: string
	): T | undefined => useComponentState<T>(componentId)

	getVariantId = selectId as (variant: ComponentVariant) => string

	useAllVariants = () => useComponentVariants()
}

export { ComponentAPI }
