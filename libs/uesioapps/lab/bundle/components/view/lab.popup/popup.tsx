import { FunctionComponent } from "react"
import { definition, hooks, component, styles } from "@uesio/ui"

const Dialog: FunctionComponent<definition.BaseProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, definition, path } = props
	const panelId = definition?.id as string

	const classes = styles.useUtilityStyles(
		{
			root: {
				position: "absolute",
				inset: "0, 0, 0, 0",
				backgroundColor: "pink",
				border: "2px solid grey",
				"&:hover": {
					border: "2px solid red",
				},
			},
		},
		props
	)
	if (!definition) return null
	return (
		<div className={classes.root}>
			<p>slot below</p>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				accepts={["uesio.standalone"]}
				context={context}
			/>
			<p>slot above</p>
		</div>
	)
}

export default Dialog
