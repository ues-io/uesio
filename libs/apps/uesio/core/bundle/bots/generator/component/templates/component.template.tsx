import { styles, definition } from "@uesio/ui"

type ComponentDefinition = {
	text: string
}

const Component: definition.UC<ComponentDefinition> = (props) => {
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
