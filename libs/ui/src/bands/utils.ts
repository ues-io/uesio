import { EntityState, PayloadAction } from "@reduxjs/toolkit"
import { Platform } from "../platform/platform"
import { RootState } from "../store/store"

type EntityPayload = {
	entity: string
}

type UesioThunkAPI = {
	extra: Platform
	state: RootState
}

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

export { createEntityReducer, EntityPayload, UesioThunkAPI, getErrorString }
