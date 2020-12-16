import React, { FunctionComponent } from "react"

import { definition } from "@uesio/ui"

import LeftToolbar from "./toolbar/lefttoolbar"
import RightToolbar from "./toolbar/righttoolbar"
import Canvas from "./canvas"

const Buildtime: FunctionComponent<definition.BaseProps> = ({
	context,
	path,
}) => {
	const route = context.getRoute()

	if (!route) return null

	const addView = context.addFrame({
		view: `${route.viewnamespace}.${route.viewname}(${path})`,
		viewDef: `${route.viewnamespace}.${route.viewname}`,
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
