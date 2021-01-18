import React, { FunctionComponent } from "react"

import { definition } from "@uesio/ui"
import { makeStyles, createStyles } from "@material-ui/core"

import LeftToolbar from "./toolbar/lefttoolbar"
import RightToolbar from "./toolbar/righttoolbar"
import Canvas from "./canvas"

const useStyles = makeStyles(() =>
	createStyles({
		container: { display: "flex" },
	})
)

const Buildtime: FunctionComponent<definition.BaseProps> = ({
	context,
	path,
}) => {
	const classes = useStyles()
	const route = context.getRoute()

	if (!route) return null

	const addView = context.addFrame({
		view: `${route.view}(${path})`,
		viewDef: route.view,
	})

	return (
		<div className={classes.container}>
			<LeftToolbar path="" context={addView} />
			<Canvas path="" context={addView} />
			<RightToolbar path="" context={addView} />
		</div>
	)
}

export default Buildtime
