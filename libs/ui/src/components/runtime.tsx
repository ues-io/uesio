import React, { useEffect, FC } from "react"

import { BaseProps } from "../definition/definition"

import { Platform } from "../platform/platform"

import { createMuiTheme, CssBaseline, ThemeProvider } from "@material-ui/core"

import { Provider, create, getPlatform } from "../store/store"
import { useUesio } from "../hooks/hooks"
import RuntimeState from "../store/types/runtimestate"
import { useScripts, depsHaveLoaded } from "../hooks/usescripts"
import { Context } from "../context/context"
import { colors } from "@material-ui/core"
import { createComponent } from "../component/component"
import Route from "./route"

type Props = BaseProps & {
	platform: Platform
	initialState: RuntimeState
}

const theme = createMuiTheme({
	palette: {
		primary: {
			light: colors.teal[100],
			main: colors.teal[500],
			dark: colors.teal[700],
		},
	},
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

function getNeededScripts(buildMode: boolean): string[] {
	return buildMode ? [getPlatform().getBuilderCoreURL()] : []
}

const RuntimeInner: FC<BaseProps> = (props: BaseProps) => {
	const uesio = useUesio(props)

	const buildMode = uesio.builder.useMode()

	const neededScripts = getNeededScripts(buildMode)
	const scriptResult = useScripts(neededScripts)
	const scriptsHaveLoaded = depsHaveLoaded(
		neededScripts,
		scriptResult.scripts
	)

	useEffect(() => {
		const toggleFunc = (event: KeyboardEvent): void => {
			if (event.altKey && event.code === "KeyU") {
				uesio.builder.toggleBuildMode()
			}
		}
		// Handle swapping between buildmode and runtime
		// Option + U
		window.addEventListener("keyup", toggleFunc)

		window.onpopstate = (event: PopStateEvent): void => {
			if (!event.state.path || !event.state.namespace) {
				// In some cases, our path and namespace aren't available in the history state.
				// If that is the case, then just punt and do a plain redirect.
				uesio.signal.run(
					{
						band: "platform",
						signal: "REDIRECT",
						path: document.location.pathname,
					},
					new Context()
				)
				return
			}
			uesio.signal.run(
				{
					band: "platform",
					signal: "NAVIGATE",
					path: event.state.path,
					namespace: event.state.namespace,
					noPushState: true,
				},
				new Context([
					{
						workspace: event.state.workspace,
					},
				])
			)
		}

		// Remove event listeners on cleanup
		return (): void => {
			window.removeEventListener("keyup", toggleFunc)
		}
	}, [])

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<Route
				{...{
					path: props.path,
					index: props.index,
					componentType: props.componentType,
					context: props.context.addFrame({
						buildMode: buildMode && scriptsHaveLoaded,
					}),
				}}
			/>
		</ThemeProvider>
	)
}

const Runtime: FC<Props> = (props: Props) => {
	const store = create(props.platform, props.initialState)
	return (
		<Provider store={store}>
			<RuntimeInner
				{...{
					path: props.path,
					index: props.index,
					componentType: props.componentType,
					context: props.context,
				}}
			/>
		</Provider>
	)
}

Runtime.displayName = "Runtime"
RuntimeInner.displayName = "RuntimeInner"

export default Runtime
