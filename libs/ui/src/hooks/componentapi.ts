import { dispatch, getCurrentState } from "../store/store"
import { PlainComponentState } from "../bands/component/types"
import { selectState, useComponentState } from "../bands/component/selectors"
import { selectId, useComponentVariants } from "../bands/componentvariant"
import { set as setComponent } from "../bands/component"
import { BaseProps, Definition } from "../definition/definition"
import { useEffect } from "react"
import { ComponentVariant } from "../definition/componentvariant"
import { Context } from "../context/context"

const getComponentId = (
	namedId: string | undefined,
	componentType: string,
	path: string | undefined,
	context: Context
) => makeComponentId(context, componentType, namedId || path || "")

const getComponentIdFromProps = (
	namedId: string | undefined,
	props: BaseProps
) =>
	makeComponentId(
		props.context,
		props.componentType as string,
		namedId || props.path || ""
	)

const makeComponentId = (
	context: Context,
	componentType: string,
	id: string,
	noRecordContext?: boolean
) => {
	const viewId = context.getViewId()
	const recordId = context.getRecordId()
	const recordSuffix = !noRecordContext && recordId ? `:${recordId}` : ""
	return `${viewId}:${componentType}:${id}${recordSuffix}`
}

const useState = <T extends PlainComponentState>(
	componentId: string,
	initialState?: T
): [T | undefined, (state: T) => void] => {
	const state = useComponentState<T>(componentId)
	const setState = (state: T | undefined) => {
		dispatch(
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

const useStateSlice = <T extends Definition>(
	slice: string,
	componentId: string,
	initialState?: T
): [T | undefined, (state: T) => void] => {
	const fullState = useComponentState<Record<string, T>>(componentId)
	const state = fullState?.[slice] ?? undefined

	const setState = (state: T) => {
		dispatch(
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

const getExternalState = <T extends PlainComponentState>(
	componentId: string
): T | undefined => selectState<T>(getCurrentState(), componentId)

const useExternalState = <T extends PlainComponentState>(
	componentId: string
): T | undefined => useComponentState<T>(componentId)

const getVariantId = selectId as (variant: ComponentVariant) => string

const useAllVariants = useComponentVariants

export {
	getComponentId,
	getComponentIdFromProps,
	makeComponentId,
	useState,
	useStateSlice,
	useExternalState,
	getExternalState,
	getVariantId,
	useAllVariants,
}
