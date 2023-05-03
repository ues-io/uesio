import { FunctionComponent } from "react"
import { styles, definition } from "@uesio/ui"

type ComponentDefinition = {
	text: string
}

interface Props extends definition.BaseProps {
	definition: ComponentDefinition
}

const Component: FunctionComponent<Props> = (props) => {
	const { text } = props.definition
	const classes = styles.useStyles(
		{
			root: {
				color: "green",
			},
		},
		props
	)
	return <div className={classes.root}>{text}</div>
}

export default Component
