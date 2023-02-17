import { EntityState, PayloadAction } from "@reduxjs/toolkit"

type EntityPayload = {
	entity: string
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

export { createEntityReducer, EntityPayload, getErrorString, move, initEntity }
