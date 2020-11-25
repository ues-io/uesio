import React, { useEffect, FC } from "react"
import { BaseProps } from "../definition/definition"
import { useUesio, Uesio } from "../hooks/hooks"
import { useScripts, depsHaveLoaded } from "../hooks/usescripts"
import Dependencies from "../store/types/dependenciesstate"
import { ViewParams } from "../view/view"
import Slot from "./slot"
import { parseKey } from "../component/path"

import { createMuiTheme, CssBaseline, ThemeProvider } from "@material-ui/core"
import { colors } from "@material-ui/core"
import { PaletteOptions } from "@material-ui/core/styles/createPalette"

function getNeededScripts(
	dependencies: Dependencies | undefined,
	uesio: Uesio,
	buildMode: boolean
): string[] {
	const componentDeps = dependencies?.componentpacks
	const dependencyScripts: string[] = []

	if (componentDeps) {
		Object.keys(componentDeps).map((key) => {
			const [namespace, name] = parseKey(key)
			const fileUrl = uesio.component.getPackURL(namespace, name, false)
			dependencyScripts.push(fileUrl)
			if (buildMode) {
				const fileUrl = uesio.component.getPackURL(
					namespace,
					name,
					true
				)
				dependencyScripts.push(fileUrl)
			}
		})
	}
	return dependencyScripts
}

interface Props extends BaseProps {
	definition: {
		name: string
		namespace: string
		params?: ViewParams
	}
}

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

const View: FC<Props> = (props: Props) => {
	const uesio = useUesio(props)
	const viewname = props.definition.name
	const viewnamespace = props.definition.namespace
	const viewparams = props.definition.params
	const path = props.path

	const view = uesio.view.useView(viewnamespace, viewname, path)

	// Currently only going into buildtime for the base view. We could change this later.
	const buildMode = !!props.context.getBuildMode() && path === ""

	const definition = uesio.view.useDefinition("", view)
	const dependencies = uesio.view.useDependencies(view)

	const neededScripts = getNeededScripts(dependencies, uesio, buildMode)
	const scriptResult = useScripts(neededScripts)
	const scriptsHaveLoaded = depsHaveLoaded(
		neededScripts,
		scriptResult.scripts
	)

	///
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

	const route = uesio.route.useRoute()
	const context = uesio.getContext()

	const [themenamespace, themename] = route.theme
		? parseKey(route.theme)
		: ["", ""]

	///

	useEffect(() => {
		const hasNewParams = viewparams !== view.source.params
		// We could think about letting this go forward before loading viewdef deps
		if ((!view.valid || hasNewParams) && scriptsHaveLoaded) {
			uesio.view.loadView(
				viewnamespace,
				viewname,
				path,
				viewparams,
				props.context
			)
			return
		}
	}, [])

	useEffect(() => {
		console.log("themenamespace", themenamespace)
		console.log("themename", themename)

		const resp = fetch(
			`https://uesio-dev.com:3000/workspace/${route?.workspace?.app}/${route?.workspace?.name}/themes/${themenamespace}/${themename}`
		)
		const simulateBackend = new Promise((resolve, reject) => {
			resolve({
				primary: "#23fa0f8",
				secondary: "#09fa0f8",
				error: "#33a20f8",
				info: "#ea9e0f8",
			})
		})
		simulateBackend.then((response) => console.log("response", response))
	}, [])

	const useRunTime =
		(!buildMode && scriptsHaveLoaded) || (buildMode && !scriptsHaveLoaded)
	const useBuildTime = buildMode && scriptsHaveLoaded
	if (
		(useRunTime || useBuildTime) &&
		definition &&
		view.valid &&
		view.source.loaded
	) {
		const slotProps = {
			definition,
			listName: "components",
			path: "", // View slots paths are always empty
			accepts: ["uesio.standalone"],
			context: props.context.addFrame({
				view: view.getId(),
				buildMode: useBuildTime,
			}),
		}
		return (
			<ThemeProvider theme={makeTheme(PaletteOptions)}>
				<CssBaseline />
				<Slot {...slotProps}></Slot>
			</ThemeProvider>
		)
	}
	return null
}

export default View
