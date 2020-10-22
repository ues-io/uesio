import React, { ReactElement } from "react"
import { HelloProps } from "./hellodefinition"
import { material } from "uesio"

const useStyles = material.makeStyles(() =>
	material.createStyles({
		root: {
			padding: "100px",
			backgroundColor: "pink",
		},
	})
)

function Hello(props: HelloProps): ReactElement {
	const classes = useStyles(props)
	return (
		<div className={classes.root}>
			{props.definition.greeting || "Hello! World. Again."}
		</div>
	)
}

export default Hello
