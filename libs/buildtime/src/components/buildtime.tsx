import React, { FC } from "react"

import { definition, hooks } from "@uesio/ui"

import LeftToolbar from "./toolbar/lefttoolbar"
import RightToolbar from "./toolbar/righttoolbar"
import Canvas from "./canvas"

const Buildtime: FC<definition.BaseProps> = (props: definition.BaseProps) => {
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

	const toolbarProps = {
		path: "",
		context: props.context.addFrame({
			view: view.getId(),
		}),
	}

	return (
		<div
			style={{
				display: "flex",
			}}
		>
			<LeftToolbar {...toolbarProps} />
			<Canvas {...toolbarProps} />
			<RightToolbar {...toolbarProps} />
		</div>
	)
}

export default Buildtime
