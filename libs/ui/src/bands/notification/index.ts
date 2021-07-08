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
		addMany: notificationAdapter.addMany,
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
		builder.addCase(saveOp.fulfilled, (state, action) => {
			console.log("saveOp.fulfilled")
			const wires = action?.payload?.wires
			console.log("action", action)
			console.log("wires", wires)
			if (wires) {
				wires.forEach((wire) => {
					const error = wire.error
					console.log("error", error)
					notificationAdapter.addOne(state, {
						id: shortid.generate(),
						severity: "error",
						text: "ERROR",
						details: error,
					})
				})
			}
		})
	},
})

export const { add, remove } = notificationSlice.actions

export default notificationSlice.reducer
