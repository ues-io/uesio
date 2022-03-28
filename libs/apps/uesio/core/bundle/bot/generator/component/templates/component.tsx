import { FunctionComponent } from "react"
import { styles, definition } from "@uesio/ui"

type NewComponentDefinition = {}

interface NewComponentProps extends definition.BaseProps {
	definition: NewComponentDefinition
}

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
