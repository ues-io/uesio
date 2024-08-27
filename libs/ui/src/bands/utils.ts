import { EntityState, PayloadAction } from "@reduxjs/toolkit"

type EntityPayload = {
	entity: string
}

const createEntityReducer =
	<T extends EntityPayload, S>(reducer: (state: S, payload: T) => void) =>
	({ entities }: EntityState<S, string>, { payload }: PayloadAction<T>) => {
		const entityState = entities[payload.entity]
		entityState && reducer(entityState, payload)
	}

const getErrorString = (error: unknown) => {
	if (error instanceof Error) {
		return error.message
	}
	return error + ""
}

export type { EntityPayload }
export { createEntityReducer, getErrorString }
