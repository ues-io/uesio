import React, { FunctionComponent, useEffect } from "react"
import { fetchTheme } from "../bands/theme"
import { useTheme } from "../bands/theme/selectors"
import { ComponentInternal } from "../component/component"
import { parseKey } from "../component/path"
import { getThemeId } from "../bands/theme/adapter"
import { createMuiTheme, CssBaseline, ThemeProvider } from "@material-ui/core"

import { BaseProps } from "../definition/definition"

import { Theme } from "../bands/theme/types"
import { PaletteOptions } from "@material-ui/core/styles/createPalette"

import { useRoute } from "../bands/route/selectors"
import { getDispatcher } from "../store/store"
import { RouteState } from "../bands/route/types"

const makePaletteTheme = (theme: Theme) =>
	Object.entries(theme?.definition || {}).reduce(
		(acc, [label, color]) => ({
			...acc,
			[label]: { main: color },
		}),
		{}
	)

const makeTheme = (themePalette: PaletteOptions) =>
	createMuiTheme({
		palette: { ...themePalette },
	})

const Route: FunctionComponent<BaseProps> = (props) => {
	const dispatcher = getDispatcher()
	const route = useRoute()
	if (!route) return null

	const themeState = useTheme()
	const themeId = getThemeId(route)
	console.log("themeId route", themeId)
	const theme = themeId
		? themeState.entities?.[themeId]?.routeTheme
		: undefined

	const routeContext = props.context.addFrame({
		route,
		workspace: route.workspace,
		buildMode: props.context.getBuildMode() && !!route.workspace,
	})

	useEffect(() => {
		// This makes sure that the namespace and path of the route is specified in the history.
		window.history.replaceState(
			{
				namespace: route.namespace,
				path: route.path,
				workspace: route.workspace,
			},
			""
		)
		const [namespace, name] = parseKey(route.theme)

		if (namespace && name && !theme) {
			dispatcher(
				fetchTheme({
					namespace,
					name,
					workspace: route.workspace,
					context: routeContext,
				})
			)
		}
	}, [])

	// Quit rendering early if we don't have our theme yet.
	//if (theme.isFetching || !theme.routeTheme) return null
	if (!theme) return null

	return (
		<ThemeProvider theme={makeTheme(makePaletteTheme(theme))}>
			<CssBaseline />
			<ComponentInternal
				componentType="uesio.runtime"
				path=""
				context={routeContext}
			/>
		</ThemeProvider>
	)
}

export default Route
