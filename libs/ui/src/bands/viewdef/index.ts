import { createSlice, createEntityAdapter } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"

import { ViewMetadata } from "../../definition/definition"

import { RootState, getCurrentState } from "../../store/store"
import { getKey } from "../../metadata/metadata"

const adapter = createEntityAdapter({
  selectId: getKey<ViewMetadata>,
})

const selectors = adapter.getSelectors((state: RootState) => state.viewdef)

const metadataSlice = createSlice({
  name: "viewdef",
  initialState: adapter.getInitialState(),
  reducers: {
    upsertOne: adapter.upsertOne,
    upsertMany: adapter.upsertMany,
  },
})

const useViewDef = (key: string | undefined) =>
  useSelector((state: RootState) => selectors.selectById(state, key || ""))
    ?.definition

// This function doesn't run a selector so it will only get the current
// state of the store and not update with changes
const getViewDef = (key: string) =>
  selectors.selectById(getCurrentState(), key)?.definition

export { useViewDef, selectors, getViewDef, adapter }

export const { upsertOne, upsertMany } = metadataSlice.actions
export default metadataSlice.reducer
