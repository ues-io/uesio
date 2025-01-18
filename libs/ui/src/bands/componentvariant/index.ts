import { createSlice, createEntityAdapter } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"
import { ComponentVariant } from "../../definition/componentvariant"
import { RootState } from "../../store/store"
import { getKey } from "../../metadata/metadata"

const adapter = createEntityAdapter({
  selectId: (cv: ComponentVariant) => `${cv.component}:${getKey(cv)}` as string,
})

const selectors = adapter.getSelectors(
  (state: RootState) => state.componentvariant,
)

const metadataSlice = createSlice({
  name: "componentvariant",
  initialState: adapter.getInitialState(),
  reducers: {
    set: adapter.upsertOne,
    setMany: adapter.upsertMany,
  },
})

const selectId = adapter.selectId

const useComponentVariant = (key: string) =>
  useSelector((state: RootState) => selectors.selectById(state, key))

const useComponentVariants = () => useSelector(selectors.selectAll)

export {
  useComponentVariant,
  useComponentVariants,
  selectors,
  selectId,
  adapter,
}

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
