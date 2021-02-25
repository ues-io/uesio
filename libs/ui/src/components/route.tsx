import React, { FunctionComponent, useEffect } from "react"
import themeOps from "../bands/theme/operations"
import { useTheme } from "../bands/theme/selectors"
import { ComponentInternal } from "../component/component"
import { parseKey } from "../component/path"

import { BaseProps } from "../definition/definition"

import { useRoute } from "../bands/route/selectors"
import { getDispatcher } from "../store/store"
import { useSite } from "../bands/site/selectors"

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
		<ComponentInternal
			componentType="uesio.runtime"
			path=""
			context={routeContext}
		/>
	)
}

export default Route
