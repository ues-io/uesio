import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { PanelState } from "./types"

const panelAdapter = createEntityAdapter<PanelState>()

const selectors = panelAdapter.getSelectors((state: RootState) => state.panel)

export { selectors }

export default panelAdapter
