import { createSlice, nanoid } from "@reduxjs/toolkit"
import notificationAdapter from "./adapter"
import { set as setRoute } from "../route"
import { save } from "../wire"
import { NotificationState } from "./types"

const notificationSlice = createSlice({
	name: "notification",
	initialState: notificationAdapter.getInitialState(),
	reducers: {
		add: notificationAdapter.addOne,
		remove: notificationAdapter.removeOne,
	},
	extraReducers: (builder) => {
		builder.addCase(save, (state, action) => {
			const notifications: NotificationState[] = []
			for (const wire of action.payload.wires) {
				if (wire.errors) {
					for (const error of wire.errors) {
						notifications.push({
							id: nanoid(),
							severity: "error",
							text: "ERROR",
							details: error.message,
						})
					}
				}
			}
			notificationAdapter.addMany(state, notifications)
		})
		builder.addCase(setRoute, (state) =>
			notificationAdapter.removeAll(state)
		)
	},
})

export const { add, remove } = notificationSlice.actions

export default notificationSlice.reducer
