import React, { FunctionComponent, useEffect } from "react"
import themeOps from "../bands/theme/operations"
import { useTheme } from "../bands/theme/selectors"
import { ComponentInternal } from "../component/component"
import { parseKey } from "../component/path"
import { createMuiTheme, CssBaseline, ThemeProvider } from "@material-ui/core"

import { BaseProps, DefinitionMap } from "../definition/definition"

import { PaletteOptions } from "@material-ui/core/styles/createPalette"

import { useRoute } from "../bands/route/selectors"
import { getDispatcher } from "../store/store"
import { ThemeState } from "../bands/theme/types"
import { useSite } from "../bands/site/selectors"

const makeOverridesTheme = (theme: ThemeState) => {
	const variantOverrides = theme?.definition?.variantOverrides
	if (!variantOverrides) return {}
	const componentNames = Object.keys(variantOverrides)
	const overrides: Record<string, DefinitionMap> = {}
	componentNames.forEach((c) => {
		const variantNames = Object.keys(variantOverrides[c] || {})
		const variants = variantOverrides[c] as DefinitionMap
		variantNames.forEach((v) => {
			overrides[c + "." + v] = (variants?.[v] as DefinitionMap) || {}
		})
	})
	return overrides
}
const makePaletteTheme = (theme: ThemeState): PaletteOptions =>
	Object.entries(theme?.definition?.palette || {}).reduce(
		(acc, [label, color]) => ({
			...acc,
			[label]: { main: color },
		}),
		{}
	)

const makeTheme = (theme: ThemeState) => {
	const themePalette = makePaletteTheme(theme)
	const themeOverrides = makeOverridesTheme(theme)
	return createMuiTheme({
		palette: { ...themePalette },
		overrides: themeOverrides,
	})
}

const Route: FunctionComponent<BaseProps> = (props) => {
	const dispatcher = getDispatcher()
	const site = useSite()
	const route = useRoute()
	const theme = useTheme(route?.theme || "")
	if (!route) return null

	const routeContext = props.context.addFrame({
		site,
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
				themeOps.fetchTheme({
					namespace,
					name,
					context: routeContext,
				})
			)
		}
	}, [theme])

	// Quit rendering early if we don't have our theme yet.
	if (!theme) return null

	return (
		<ThemeProvider theme={makeTheme(theme)}>
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
