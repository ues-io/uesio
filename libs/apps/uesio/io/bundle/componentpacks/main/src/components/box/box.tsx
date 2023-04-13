import { component, styles, api, signal, definition } from "@uesio/ui"

type BoxDefinition = {
	signals?: signal.SignalDefinition[]
}

const Box: definition.UC<BoxDefinition> = (props) => {
	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)

	const { definition, context, path } = props
	return (
		<div
			className={classes.root}
			onClick={api.signal.getHandler(definition.signals, context)}
		>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				context={context}
			/>
		</div>
	)
}

export default Box
