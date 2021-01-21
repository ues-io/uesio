import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { ThemeState, Theme } from "./types"
import { parseKey } from "../../component/path"
import { RouteState } from "../route/types"

const getThemeId = (themeState: ThemeState) => {
	if (themeState?.routeWorkspace) {
		// split up application prefix and theme name
		const [, themeName] = parseKey(themeState.theme)
		if (typeof themeState?.routeWorkspace === "string") {
			return `${themeState?.routeWorkspace}.${themeName}`
		}

		const { app, name } = themeState?.routeWorkspace
		return `${app}_${name}.${themeName}`
	}
	return themeState.theme
}

const themeAdapter = createEntityAdapter<ThemeState>({
	selectId: (theme) => getThemeId(theme),
})

const selectors = themeAdapter.getSelectors((state: RootState) => state.theme)

export { selectors, getThemeId }

export default themeAdapter
