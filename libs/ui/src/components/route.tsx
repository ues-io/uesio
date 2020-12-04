import React, { FC, useEffect } from "react"
import { fetchTheme } from "../bands/theme"
import { useTheme } from "../bands/theme/selectors"
import { ComponentInternal } from "../component/component"
import { parseKey } from "../component/path"
import { createMuiTheme, CssBaseline, ThemeProvider } from "@material-ui/core"

import { BaseProps } from "../definition/definition"

import { ThemeState } from "../bands/theme/types"
import { PaletteOptions } from "@material-ui/core/styles/createPalette"

import { useUesio } from "../hooks/hooks"

const makePaletteTheme = (theme: ThemeState) =>
	Object.entries(theme?.routeTheme?.definition || {}).reduce(
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

const Route: FC<BaseProps> = (props) => {
	const uesio = useUesio(props)
	const route = uesio.route.useRoute()
	const theme = useTheme()

	if (!route) return null

	const routeContext = props.context.addFrame({
		route: route,
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

		if (namespace && name && !theme.routeTheme) {
			uesio.getDispatcher()(
				fetchTheme({
					namespace,
					name,
					context: routeContext,
				})
			)
		}
	}, [])

	// Quit rendering early if we don't have our theme yet.
	if (theme.isFetching || !theme.routeTheme) return null

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
