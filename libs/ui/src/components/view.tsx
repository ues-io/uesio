import React, { useEffect, FC, useState } from "react"
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
	})

const View: FC<Props> = (props: Props) => {
	const uesio = useUesio(props)
	const [materialTheme, setMaterialTheme] = useState<PaletteOptions>({})
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
	const route = uesio.route.useRoute()

	const [themenamespace, themename] = route.theme
		? parseKey(route.theme)
		: ["", ""]

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
				primary: "#4791db",
				secondary: "#e33371",
				error: "#e57373",
				warning: "#ffb74d",
				info: "#64b5f6",
				success: "#81c784",
			})
		})
		simulateBackend.then(
			(response: {
				primary: string
				secondary: string
				error: string
				warning: string
				info: string
				success: string
			}) =>
				setMaterialTheme({
					primary: {
						main: response.primary,
					},
					secondary: {
						main: response.secondary,
					},
					error: {
						main: response.error,
					},
					warning: {
						main: response.warning,
					},
					info: {
						main: response.info,
					},
					success: {
						main: response.success,
					},
				})
		)
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
		return (
			<ThemeProvider theme={makeTheme(materialTheme)}>
				<CssBaseline />
				<Slot
					definition={definition}
					listName="components"
					path="" // View slots paths are always empty
					accepts={["uesio.standalone"]}
					context={props.context.addFrame({
						view: view.getId(),
						buildMode: useBuildTime,
					})}
				></Slot>
			</ThemeProvider>
		)
	}
	return null
}

export default View
