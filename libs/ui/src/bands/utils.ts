import { EntityState, PayloadAction } from "@reduxjs/toolkit"
import { definition } from ".."

type EntityPayload = {
	entity: string
}

type FieldPath = {
	pathString: string
	pathArray: string[]
}

/**
#move - Moves an array item from one position in an array to another.

Note: This is an impure function so the given array will be altered, instead
of returning a new array.

Arguments:
1. array: Array in which to move an item.           (required)
2. moveIndex: The index of the item to move.        (required)
3. toIndex: The index to move item at moveIndex to. (required)
*/
const move = (arr: unknown[], fromIndex: number, toIndex: number) =>
	arr.splice(toIndex, 0, arr.splice(fromIndex, 1)[0])

const initEntity = <T>(
	state: EntityState<T>,
	action: PayloadAction<EntityState<T>>
): EntityState<T> => action.payload

const createEntityReducer =
	<T extends EntityPayload, S>(reducer: (state: S, payload: T) => void) =>
	({ entities }: EntityState<S>, { payload }: PayloadAction<T>) => {
		const entityState = entities[payload.entity]
		entityState && reducer(entityState, payload)
	}

const getErrorString = (error: unknown) => {
	if (error instanceof Error) {
		return error.message
	}
	return error + ""
}
type Field = [string, null | { fields: { [key: string]: Field } }]
const getWireFieldSelectOptions = (wireDef: definition.DefinitionMap) => {
	if (!wireDef || !wireDef.fields) return null

	const getFields = (field: Field): string | string[] => {
		const [key, value] = field
		if (!value) return key
		return Object.entries(value.fields)
			.map(([key2, value2]) => [`${key}->${key2}`, value2])
			.flatMap((el) => getFields(el as Field))
	}

	return Object.entries(wireDef.fields)
		.flatMap((el) => getFields(el as Field))
		.map((el) => ({ value: el, label: el }))
}

const getFieldPath = (path: string | string[]): FieldPath => ({
	pathString: Array.isArray(path) ? path.join("->") : path,
	pathArray: Array.isArray(path) ? path : path.split("->"),
})

export {
	createEntityReducer,
	EntityPayload,
	getErrorString,
	getWireFieldSelectOptions,
	move,
	initEntity,
	getFieldPath,
	FieldPath,
}
