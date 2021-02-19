import React, { FunctionComponent } from "react"
import { HelloProps } from "./hellodefinition"
import { styles } from "@uesio/ui"

const useStyles = styles.getUseStyles(["root"], {
	root: {
		padding: "100px",
		backgroundColor: "pink",
	},
})

const Hello: FunctionComponent<HelloProps> = (props) => {
	const classes = useStyles(props)
	return (
		<div className={classes.root}>
			{props.definition.greeting || "Hello! World. Again."}
		</div>
	)
}

export default Hello
