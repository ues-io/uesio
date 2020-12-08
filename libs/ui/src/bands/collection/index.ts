import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { PlainCollection, PlainCollectionMap } from "./types"
import wireLoadOp from "../wire/operations/load"
import { PlainWire } from "../wire/types"

const initialState: PlainCollectionMap = {}

const collectionSlice = createSlice({
	name: "collection",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(
			wireLoadOp.fulfilled,
			(
				state,
				{
					payload: [, collections],
				}: PayloadAction<[PlainWire[], Record<string, PlainCollection>]>
			) => ({
				...state,
				...collections,
			})
		)
	},
})

export default collectionSlice.reducer
