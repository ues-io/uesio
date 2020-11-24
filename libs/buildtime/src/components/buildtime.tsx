import React, { FunctionComponent } from "react"

import { definition, hooks } from "@uesio/ui"

import LeftToolbar from "./toolbar/lefttoolbar"
import RightToolbar from "./toolbar/righttoolbar"
import Canvas from "./canvas"

const Buildtime: FunctionComponent<definition.BaseProps> = (props) => {
	const uesio = hooks.useUesio()
	const route = props.context.getRoute()

	if (!route) {
		return null
	}

	const view = uesio.view.useView(
		route.viewnamespace,
		route.viewname,
		props.path
	)

	const addFrame = props.context.addFrame({
		view: view.getId(),
	})

	return (
		<div style={{ display: "flex" }}>
			<LeftToolbar path="" context={addFrame} />
			<Canvas path="" context={addFrame} />
			<RightToolbar path="" context={addFrame} />
		</div>
	)
}

export default Buildtime
