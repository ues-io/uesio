import { EntityState, PayloadAction } from "@reduxjs/toolkit"

type EntityPayload = {
	entity: string
}

const createEntityReducer = <T extends EntityPayload, S>(
	reducer: (state: S, payload: T) => void
) => ({ entities }: EntityState<S>, { payload }: PayloadAction<T>) => {
	const entityState = entities[payload.entity]
	return entityState && reducer(entityState, payload)
}

export { createEntityReducer, EntityPayload }
