import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { PlainCollectionMap } from "./types"

const initialState: PlainCollectionMap = {}

const collectionSlice = createSlice({
	name: "collection",
	initialState,
	reducers: {
		load: (state, { payload }: PayloadAction<PlainCollectionMap>) => ({
			...state,
			...payload,
		}),
	},
})

export const { load } = collectionSlice.actions
export default collectionSlice.reducer
