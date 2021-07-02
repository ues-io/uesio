import { createSlice } from "@reduxjs/toolkit"
import notificationAdapter from "./adapter"

const notificationSlice = createSlice({
	name: "notification",
	initialState: notificationAdapter.getInitialState(),
	reducers: {
		add: notificationAdapter.addOne,
		remove: notificationAdapter.removeOne,
	},
})

export const { add, remove } = notificationSlice.actions

export default notificationSlice.reducer
