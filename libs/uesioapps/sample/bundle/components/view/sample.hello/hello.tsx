import { FunctionComponent } from "react"
import { HelloProps } from "./hellodefinition"
import { styles } from "@uesio/ui"

const Hello: FunctionComponent<HelloProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {
				padding: "100px",
				backgroundColor: props.definition.pink ? "pink" : "lightblue",
			},
		},
		props
	)
	return (
		<div className={classes.root}>
			{props.definition.greeting || "Hello! World. Again."}
		</div>
	)
}

export default Hello
