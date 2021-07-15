import { createSlice } from "@reduxjs/toolkit"
import notificationAdapter from "./adapter"
import saveOp from "../wire/operations/save"
import shortid from "shortid"
import callBot from "../bot/operations/call"
import { NotificationState } from "./types"

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
				text: "ERROR",
				details: action?.error?.message,
			})
		})
		builder.addCase(saveOp.fulfilled, (state, action) => {
			const notifications: NotificationState[] = []
			for (const wire of action.payload.wires) {
				if (wire.errors) {
					for (const error of wire.errors) {
						notifications.push({
							id: shortid.generate(),
							severity: "error",
							text: "ERROR",
							details: error.message,
						})
					}
				}
			}
			notificationAdapter.addMany(state, notifications)
		})
		builder.addCase(callBot.rejected, (state, action) => {
			notificationAdapter.addOne(state, {
				id: shortid.generate(),
				severity: "error",
				text: "ERROR",
				details: action?.error?.message,
			})
		})
		builder.addCase(callBot.fulfilled, (state, action) => {
			const success = action?.payload?.success
			if (!success) {
				notificationAdapter.addOne(state, {
					id: shortid.generate(),
					severity: "error",
					text: "ERROR",
					details: action?.payload?.error,
				})
			}
		})
	},
})

export const { add, remove } = notificationSlice.actions

export default notificationSlice.reducer
