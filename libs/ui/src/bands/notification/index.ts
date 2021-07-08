import { createSlice } from "@reduxjs/toolkit"
import notificationAdapter from "./adapter"
import saveOp from "../wire/operations/save"
import shortid from "shortid"

const notificationSlice = createSlice({
	name: "notification",
	initialState: notificationAdapter.getInitialState(),
	reducers: {
		add: notificationAdapter.addOne,
		remove: notificationAdapter.removeOne,
	},
	extraReducers: (builder) => {
		builder.addCase(saveOp.rejected, (state, action) => {
			notificationAdapter.addOne(state, {
				id: shortid.generate(),
				severity: "error",
				text: "FATAL ERROR",
				details: action?.error?.message,
			})
		})
	},
})

export const { add, remove } = notificationSlice.actions

export default notificationSlice.reducer
