import { FunctionComponent } from "react"
import { HelloProps } from "./hellodefinition"
import { material } from "@uesio/ui"

const useStyles = material.makeStyles(() =>
	material.createStyles({
		root: {
			padding: "100px",
			backgroundColor: "pink",
		},
	})
)

const Hello: FunctionComponent<HelloProps> = (props) => {
	const classes = useStyles(props)
	return (
		<div className={classes.root}>
			{props.definition.greeting || "Hello! World. Again."}
		</div>
	)
}

export default Hello
