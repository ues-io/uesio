import { EntityState, PayloadAction } from "@reduxjs/toolkit"

type EntityPayload = {
	entity: string
}

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

export { createEntityReducer, EntityPayload, getErrorString, initEntity }
