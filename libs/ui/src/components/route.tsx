import React, { FC, useEffect } from "react"
import { createComponent } from "../component/component"
import { parse } from "yaml"

import { BaseProps } from "../definition/definition"

import { useUesio } from "../hooks/hooks"

import { createMuiTheme, CssBaseline, ThemeProvider } from "@material-ui/core"
import { colors } from "@material-ui/core"
import { PaletteOptions } from "@material-ui/core/styles/createPalette"

const makeTheme = (theme: PaletteOptions) =>
	createMuiTheme({
		palette: { ...theme },
		/*
	palette: {
		primary: colors.purple,
		secondary: colors.deepPurple,
	},
	typography: {
		fontFamily: [
			"Montserrat",
			"Roboto",
			"Arial",
			"sans-serif",
		].join(","),
	},
	*/
	})

const Route: FC<BaseProps> = (props: BaseProps) => {
	const uesio = useUesio(props)
	const route = uesio.route.useRoute()

	const PaletteOptions = {
		primary: {
			// light: will be calculated from palette.primary.main,
			main: "#ff4400",
			// dark: will be calculated from palette.primary.main,
			// contrastText: will be calculated to contrast with palette.primary.main
		},
		secondary: {
			light: "#0066ff",
			main: "#0044ff",
			// dark: will be calculated from palette.secondary.main,
			contrastText: "#ffcc00",
		},
		// Used by `getContrastText()` to maximize the contrast between
		// the background and the text.
		contrastThreshold: 3,
		// Used by the functions below to shift a color's luminance by approximately
		// two indexes within its tonal palette.
		// E.g., shift from Red 500 to Red 300 or Red 700.
		tonalOffset: 0.2,
	}

	console.log("ROUTE Theme", route.theme)

	console.log("ROUTE", route)

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
	}, [])

	return (
		<ThemeProvider theme={makeTheme(PaletteOptions)}>
			<CssBaseline></CssBaseline>
			{createComponent(
				"uesio",
				"runtime",
				{},
				0,
				"",
				props.context.addFrame({
					route: route,
					workspace: route.workspace,
					buildMode:
						props.context.getBuildMode() && !!route.workspace,
				})
			)}
		</ThemeProvider>
	)
}

export default Route
