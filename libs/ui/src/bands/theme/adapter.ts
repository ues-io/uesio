import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { ThemeState } from "./types"
import { parseKey } from "../../component/path"

const getThemeId = (themeState: ThemeState) => {
	if (themeState?.route?.workspace) {
		// split up application prefix and theme name
		const [, themeName] = parseKey(themeState.route.theme)
		if (typeof themeState.route.workspace === "string") {
			return `${themeState.route.workspace}.${themeName}`
		}

		const { app, name } = themeState.route.workspace
		return `${app}_${name}.${themeName}`
	}
	return themeState.route.theme
}

const themeAdapter = createEntityAdapter<ThemeState>({
	selectId: (theme) => getThemeId(theme),
})

const selectors = themeAdapter.getSelectors((state: RootState) => state.theme)

export { selectors, getThemeId }

export default themeAdapter
