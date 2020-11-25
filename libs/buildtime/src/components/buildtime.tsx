import React, { FunctionComponent } from "react"

import { definition, hooks } from "@uesio/ui"

import LeftToolbar from "./toolbar/lefttoolbar"
import RightToolbar from "./toolbar/righttoolbar"
import Canvas from "./canvas"

const Buildtime: FunctionComponent<definition.BaseProps> = ({
	context,
	path,
}) => {
	const uesio = hooks.useUesio()
	const route = context.getRoute()

	if (!route) {
		return null
	}

	const view = uesio.view.useView(route.viewnamespace, route.viewname, path)

	const addView = context.addFrame({
		view: view.getId(),
	})

	return (
		<div style={{ display: "flex" }}>
			<LeftToolbar path="" context={addView} />
			<Canvas path="" context={addView} />
			<RightToolbar path="" context={addView} />
		</div>
	)
}

export default Buildtime
