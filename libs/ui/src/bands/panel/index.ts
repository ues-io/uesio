import { createSlice } from "@reduxjs/toolkit"
import panelAdapter from "./adapter"
import { set as setRoute } from "../route"

const panelSlice = createSlice({
  name: "panel",
  initialState: panelAdapter.getInitialState(),
  reducers: {
    upsertOne: panelAdapter.upsertOne,
    removeAll: panelAdapter.removeAll,
    removeOne: panelAdapter.removeOne,
  },
  extraReducers: (builder) => {
    builder.addCase(setRoute, panelAdapter.removeAll)
  },
})

export const { upsertOne, removeAll, removeOne } = panelSlice.actions
export default panelSlice.reducer
