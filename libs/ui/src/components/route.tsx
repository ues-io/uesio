import { FunctionComponent, useEffect } from "react"
import { ComponentInternal } from "../component/component"
import { BaseProps } from "../definition/definition"
import { useRoute } from "../bands/route/selectors"
import { useSite } from "../bands/site/selectors"
import { createUseStyles, JssProvider } from "react-jss"
import { useUesio } from "../hooks/hooks"

const useStyles = createUseStyles({
	"@global": {
		body: {
			margin: 0,
			fontFamily: "Roboto, Helvetica, Arial, sans-serif",
			fontWeight: 400,
		},
		/* apply a natural box layout model to all elements, but allowing components to change */
		html: {
			boxSizing: "border-box",
		},
		"*": {
			boxSizing: "inherit",
		},
		"@keyframes lineshighlight": {
			from: {
				opacity: 1,
			},
			to: {
				opacity: 0,
			},
		},
	},
})

const Route: FunctionComponent<BaseProps> = (props) => {
	const uesio = useUesio(props)
	const site = useSite()
	const route = useRoute()
	const routeContext = props.context.addFrame({
		site,
		route,
		workspace: route?.workspace,
		buildMode: props.context.getBuildMode() && !!route?.workspace,
		viewDef: route?.view,
		theme: route?.theme,
	})
	const theme = uesio.theme.useTheme(route?.theme || "", routeContext)

	// This applies the global styles
	useStyles(props)

	useEffect(() => {
		if (!route) return
		// This makes sure that the namespace and path of the route is specified in the history.
		window.history.replaceState(
			{
				namespace: route.namespace,
				path: route.path,
				workspace: route.workspace,
			},
			""
		)
	})

	// Quit rendering early if we don't have our theme yet.
	if (!theme || !route) return null

	// We add the key here so that the JSS provider fully refreshes after a navigation.
	return (
		<JssProvider key={route.namespace + route.path}>
			<ComponentInternal
				componentType="uesio.runtime"
				path=""
				context={routeContext}
			/>
		</JssProvider>
	)
}

export default Route
