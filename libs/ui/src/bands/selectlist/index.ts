import { createSlice, createEntityAdapter, EntityState } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"
import {
  SelectListMetadata,
  SelectListMetadataMap,
} from "../../definition/selectlist"
import { init as initWire, load as loadWire, WireLoadAction } from "../wire"
import { RootState } from "../../store/store"
import { getKey } from "../../metadata/metadata"

const adapter = createEntityAdapter({
  selectId: getKey<SelectListMetadata>,
})

const selectors = adapter.getSelectors((state: RootState) => state.selectlist)

const selectById = (state: RootState, id: string) =>
  selectors.selectAll(state).find((el) => id === getKey(el))

const mergeSelectLists = (
  state: EntityState<SelectListMetadata, string>,
  selectlists: SelectListMetadataMap | undefined,
) => {
  if (!selectlists) return
  const selectListsToAdd: SelectListMetadataMap = {}
  for (const [key, selectlist] of Object.entries(selectlists)) {
    selectListsToAdd[key] = {
      ...selectlist,
    }
  }
  adapter.upsertMany(state, selectListsToAdd)
}

const metadataSlice = createSlice({
  name: "selectlist",
  initialState: adapter.getInitialState(),
  reducers: {
    set: adapter.upsertOne,
    setMany: adapter.upsertMany,
  },
  extraReducers: (builder) => {
    builder.addCase(
      loadWire,
      (state, { payload: [, , selectlists] }: WireLoadAction) => {
        mergeSelectLists(state, selectlists)
      },
    )
    builder.addCase(
      initWire,
      (state, { payload: [, , selectlists] }: WireLoadAction) => {
        mergeSelectLists(state, selectlists)
      },
    )
  },
})

const useSelectList = (key: string) =>
  useSelector((state: RootState) => selectors.selectById(state, key))

const useSelectListKeys = () => useSelector(selectors.selectIds) as string[]

export { useSelectList, useSelectListKeys, selectById, selectors, adapter }

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
