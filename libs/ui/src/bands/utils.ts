import { EntityState, PayloadAction } from "@reduxjs/toolkit"
import { definition } from ".."

type EntityPayload = {
	entity: string
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

export {
	createEntityReducer,
	EntityPayload,
	getErrorString,
	getWireFieldSelectOptions,
}
