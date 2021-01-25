import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { ThemeState } from "./types"

const themeAdapter = createEntityAdapter<ThemeState>({
	selectId: (theme) => `${theme.namespace}.${theme.name}`,
})

const selectors = themeAdapter.getSelectors((state: RootState) => state.theme)

export { selectors }

export default themeAdapter
