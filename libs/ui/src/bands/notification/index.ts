import { createSlice } from "@reduxjs/toolkit"
import notificationAdapter from "./adapter"
import { set as setRoute } from "../route"

const notificationSlice = createSlice({
  name: "notification",
  initialState: notificationAdapter.getInitialState(),
  reducers: {
    add: notificationAdapter.addOne,
    remove: notificationAdapter.removeOne,
  },
  extraReducers: (builder) => {
    builder.addCase(setRoute, notificationAdapter.removeAll)
  },
})

export const { add, remove } = notificationSlice.actions

export default notificationSlice.reducer
