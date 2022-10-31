import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { NotificationState } from "./types"

const notificationAdapter = createEntityAdapter<NotificationState>({
	selectId: (notification) => notification.id,
})

const selectors = notificationAdapter.getSelectors(
	(state: RootState) => state.notification
)

export { selectors }

export default notificationAdapter
