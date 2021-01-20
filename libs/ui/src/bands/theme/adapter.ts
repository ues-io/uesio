import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { ThemeState, Theme } from "./types"

const getThemeId = (routeTheme: Theme) =>
	`${routeTheme?.workspace || routeTheme.namespace}.${routeTheme.name}`

const themeAdapter = createEntityAdapter<ThemeState>({
	selectId: (theme) => getThemeId(theme.routeTheme),
})

const selectors = themeAdapter.getSelectors((state: RootState) => state.theme)

export { selectors, getThemeId }

export default themeAdapter
