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
			const notId = shortid.generate()
			state.ids.push(notId)
			state.entities = Object.assign({}, state.entities, {
				[notId]: Object.assign({}, state.entities[notId], {
					id: notId,
					severity: "error",
					text: "ERROR",
					details: action?.error?.message,
				}),
			})
		})
	},
})

export const { add, remove } = notificationSlice.actions

export default notificationSlice.reducer
