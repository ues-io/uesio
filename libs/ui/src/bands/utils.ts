import { EntityState, PayloadAction } from "@reduxjs/toolkit"
import { Platform } from "../platform/platform"
import RuntimeState from "../store/types/runtimestate"

type EntityPayload = {
	entity: string
}

type UesioThunkAPI = {
	extra: Platform
	state: RuntimeState
}

const createEntityReducer = <T extends EntityPayload, S>(
	reducer: (state: S, payload: T) => void
) => ({ entities }: EntityState<S>, { payload }: PayloadAction<T>) => {
	const entityState = entities[payload.entity]
	entityState && reducer(entityState, payload)
}

export { createEntityReducer, EntityPayload, UesioThunkAPI }
