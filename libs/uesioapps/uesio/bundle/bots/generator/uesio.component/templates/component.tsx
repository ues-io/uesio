import { FunctionComponent } from "react"
import { styles } from "@uesio/ui"
import { NewComponentProps } from "./componentdefinition"

const NewComponentTag: FunctionComponent<NewComponentProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {
				color: "green",
			},
		},
		props
	)
	return <div className={classes.root}>Hello World</div>
}

export default NewComponentTag
