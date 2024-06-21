import { dispatch, getCurrentState } from "../store/store"
import { PlainComponentState } from "../bands/component/types"
import {
	selectEntity,
	selectState,
	selectTarget,
	useComponentEntity,
	useComponentState,
	useComponentStates,
	useComponentStatesCount,
} from "../bands/component/selectors"
import { selectId, useComponentVariants } from "../bands/componentvariant"
import { removeOne, set as setComponent } from "../bands/component"
import {
	getAllComponentTypes,
	getComponentType,
} from "../bands/componenttype/selectors"
import { BaseProps, Definition } from "../definition/definition"
import { useEffect } from "react"
import { ComponentVariant } from "../definition/componentvariant"
import {
	Context,
	FieldMode,
	hasViewContext,
	isRecordContextFrame,
} from "../context/context"
import { MetadataKey } from "../metadata/types"
import { COMPONENT_ID } from "../componentexports"
import { hash } from "@twind/core"

const getComponentIdFromProps = (props: BaseProps) => {
	const { componentType, context, definition, path } = props
	// "props.definition.id" here is TEMPORARY - for backwards compatibility
	// on components like Table/List/Deck that initially had "id"
	// Once morandi / timetracker / etc. are migrated to using "uesio.id"
	// in their metadata, we can remove this affordance.
	let userDefinedId = definition[COMPONENT_ID] || definition.id
	// Optimization --- IF and only if we KNOW that the id for this component is user-defined (vs the path)
	// then run mergeString() to resolve any merge variables that may be present in the id
	if (userDefinedId) {
		userDefinedId = context.mergeString(userDefinedId)
	}
	return makeComponentId(
		context,
		componentType as string,
		userDefinedId || (path && hash(path)) || ""
	)
}

const makeComponentId = (
	context: Context,
	componentType: string,
	id: string,
	noRecordContext?: boolean
) => {
	// Iterate over context frames to serialize ALL parent View Ids, in order in which they were encountered
	const viewPrefix = context.stack
		.filter(hasViewContext)
		.reverse()
		.map((frame) => frame.view)
		.join(":")
	// Unless explicitly requested NOT to, suffix the component ids with all record ids in context in order in which they were encountered
	// Generally this will be only one record id but it's possible there will be multiple.
	// Target selectors (see "selectors.ts") may choose to exclude record context when constructing component ids.
	let recordSuffix = ""
	if (!noRecordContext) {
		const recordIds = context.stack
			.filter(isRecordContextFrame)
			.filter((frame) => frame.record)
			.reverse()
			.map((frame) => frame.record)
		if (recordIds.length) {
			recordSuffix = ":" + recordIds.join(":")
		}
	}
	return `${viewPrefix}:${componentType}:${id}${recordSuffix}`
}

const setState = <T extends PlainComponentState>(
	componentId: string,
	state: T | undefined
) => {
	dispatch(
		setComponent({
			id: componentId,
			state,
		})
	)
}

const useState = <T extends PlainComponentState>(
	componentId: string,
	initialState?: T
): [T | undefined, (state: T) => void] => {
	const state = useComponentState<T>(componentId)
	const stateSetter = (state: T | undefined) => {
		setState(componentId, state)
	}
	useEffect(() => {
		if (state === undefined) {
			stateSetter(initialState)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [componentId])

	return [state ?? initialState, stateSetter]
}

const useStateSlice = <T extends Definition>(
	slice: string,
	componentId: string,
	initialState?: T
): [T | undefined, (state: T) => void] => {
	const fullState = useComponentState<Record<string, T>>(componentId)
	const state = fullState?.[slice] ?? undefined

	const stateSetter = (state: T) => {
		setState(componentId, {
			...getExternalState<Record<string, T>>(componentId),
			[slice]: state,
		})
	}

	useEffect(() => {
		if (state === undefined && initialState !== undefined) {
			stateSetter(initialState)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [componentId])

	return [state ?? initialState, stateSetter]
}

const getExternalState = <T extends PlainComponentState>(
	componentId: string
): T | undefined => selectState<T>(getCurrentState(), componentId)

const getExternalStates = (target: string) =>
	selectTarget(getCurrentState(), target)

const getExternalEntity = (componentId: string) =>
	selectEntity(getCurrentState(), componentId)

const useExternalState = useComponentState

const useExternalStates = useComponentStates

const useExternalStatesCount = useComponentStatesCount

const useExternalEntity = useComponentEntity

const removeState = (componentId: string) => dispatch(removeOne(componentId))

const getVariantId = selectId as (variant: ComponentVariant) => MetadataKey

const useAllVariants = useComponentVariants

const useMode = (id: string, initialMode: FieldMode | undefined) =>
	useStateSlice<FieldMode>("mode", id, initialMode)

export {
	getComponentIdFromProps,
	getAllComponentTypes,
	getComponentType,
	makeComponentId,
	useMode,
	useState,
	setState,
	useStateSlice,
	useExternalState,
	useExternalStates,
	useExternalStatesCount,
	useExternalEntity,
	getExternalState,
	getExternalStates,
	getExternalEntity,
	removeState,
	getVariantId,
	useAllVariants,
}
