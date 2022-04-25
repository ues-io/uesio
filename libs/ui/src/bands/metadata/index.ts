import { createSlice } from "@reduxjs/toolkit"
import metadataAdapter from "./adapter"

const metadataSlice = createSlice({
	name: "metadata",
	initialState: metadataAdapter.getInitialState(),
	reducers: {
		set: metadataAdapter.upsertOne,
		setMany: metadataAdapter.upsertMany,
	},
})

export const { set, setMany } = metadataSlice.actions

export default metadataSlice.reducer
