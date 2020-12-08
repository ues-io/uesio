import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { PlainCollectionMap } from "./types"
import wireLoadOp from "../wire/operations/load"
import { LoadResponseBatch } from "../../load/loadresponse"

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
				{ payload }: PayloadAction<[LoadResponseBatch, string]>
			) => {
				const [response] = payload
				return {
					...state,
					...response.collections,
				}
			}
		)
	},
})

export default collectionSlice.reducer
