import { createSlice } from "@reduxjs/toolkit"

const builderSlice = createSlice({
	name: "builder",
	initialState: {},
	reducers: {
		setDefinition: (state, { payload }) => {
			console.log("SET", payload)
		},
		cloneDefinition: (state, { payload }) => {
			console.log("CLONE", payload)
		},
		cloneKeyDefinition: (state, { payload }) => {
			console.log("CLONEKEY", payload)
		},
		addDefinition: (state, { payload }) => {
			console.log("ADD", payload)
		},
		removeDefinition: (state, { payload }) => {
			console.log("REMOVE", payload)
		},
		changeDefinitionKey: (state, { payload }) => {
			console.log("CHANGE DEF KEY", payload)
		},
		moveDefinition: (state, { payload }) => {
			console.log("MOVE", payload)
		},
		save: () => {
			console.log("SAVING")
		},
		cancel: () => {
			console.log("CANCELLING")
		},
		setDefinitionContent: (state, { payload }) => {
			console.log("SETCONTENT", payload)
		},
	},
})

export const {
	setDefinition,
	cloneDefinition,
	cloneKeyDefinition,
	addDefinition,
	removeDefinition,
	moveDefinition,
	changeDefinitionKey,
	setDefinitionContent,
	save,
	cancel,
} = builderSlice.actions

export default builderSlice.reducer
