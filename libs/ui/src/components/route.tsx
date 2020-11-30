import { FC, useEffect } from "react"
import { createComponent } from "../component/component"

import { BaseProps } from "../definition/definition"

import { useUesio } from "../hooks/hooks"

const Route: FC<BaseProps> = (props: BaseProps) => {
	const uesio = useUesio(props)
	const route = uesio.route.useRoute()

	if (!route) return null

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

	return createComponent(
		"uesio",
		"runtime",
		{},
		0,
		"",
		props.context.addFrame({
			route: route,
			workspace: route.workspace,
			buildMode: props.context.getBuildMode() && !!route.workspace,
		})
	)
}

export default Route
