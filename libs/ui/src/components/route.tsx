import { FunctionComponent, useEffect } from "react"
import { ComponentInternal } from "../component/component"
import { BaseProps } from "../definition/definition"
import { useRoute } from "../bands/route/selectors"
import { useSite } from "../bands/site/selectors"
import { useUesio } from "../hooks/hooks"
import { injectGlobal } from "@emotion/css"
import Progress from "./progress"

const Route: FunctionComponent<BaseProps> = (props) => {
	const uesio = useUesio(props)
	const site = useSite()
	const route = useRoute()
	const buildMode = props.context.getBuildMode() && !!route?.workspace
	const routeContext = props.context.addFrame({
		site,
		route,
		workspace: route?.workspace,
		buildMode,
		viewDef: route?.view,
		theme: route?.theme,
	})
	const theme = uesio.theme.useTheme(route?.theme || "", routeContext)

	// This applies the global styles
	injectGlobal({
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
	})

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

	const componentType = buildMode
		? "uesio/studio.runtime"
		: "uesio/core.runtime"

	return (
		<>
			<ComponentInternal
				componentType={componentType}
				path=""
				context={routeContext}
			/>
			<Progress isAnimating={!!route.isLoading} context={props.context} />
		</>
	)
}

export default Route
