import { createSlice } from "@reduxjs/toolkit"
import notificationAdapter from "./adapter"
import saveOp from "../wire/operations/save"
import shortid from "shortid"
import callBot from "../bot/operations/call"

const notificationSlice = createSlice({
	name: "notification",
	initialState: notificationAdapter.getInitialState(),
	reducers: {
		add: notificationAdapter.addOne,
		remove: notificationAdapter.removeOne,
		addMany: notificationAdapter.addMany,
	},
	extraReducers: (builder) => {
		builder.addCase(saveOp.rejected, (state, action) => {
			notificationAdapter.addOne(state, {
				id: shortid.generate(),
				severity: "error",
				text: "ERROR",
				details: action?.error?.message,
			})
		})
		builder.addCase(callBot.rejected, (state, action) => {
			notificationAdapter.addOne(state, {
				id: shortid.generate(),
				severity: "error",
				text: "ERROR",
				details: action?.error?.message,
			})
		})
	},
})

export const { add, remove } = notificationSlice.actions

export default notificationSlice.reducer
