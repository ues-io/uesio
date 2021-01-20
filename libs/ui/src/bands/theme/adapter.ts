import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { ThemeState, Theme } from "./types"
import { parseKey } from "../../component/path"
import { RouteState } from "../route/types"

const getThemeId = (
	route: (Theme & { theme: string }) | NonNullable<RouteState>
) => {
	if (route?.workspace) {
		// split up application prefix and theme name
		const [, themeName] = parseKey(route.theme)
		if (typeof route.workspace === "string") {
			return `${route.workspace}.${themeName}`
		}

		const { app, name } = route.workspace
		return `${app}_${name}.${themeName}`
	}
	return route.theme
}

const themeAdapter = createEntityAdapter<ThemeState>({
	selectId: (theme) =>
		getThemeId(theme.routeTheme as Theme & { theme: string }),
})

const selectors = themeAdapter.getSelectors((state: RootState) => state.theme)

export { selectors, getThemeId }

export default themeAdapter
