import { component, styles, api, signal, definition } from "@uesio/ui"

type BoxDefinition = {
	signals?: signal.SignalDefinition[]
}

interface BoxProps extends definition.BaseProps {
	definition: BoxDefinition
}

const Box: definition.UesioComponent<BoxProps> = (props) => {
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
				accepts={["uesio.standalone"]}
				context={context}
			/>
		</div>
	)
}

/*
// Old definition
const BoxPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Box",
	description:
		"A container that can group other components and apply styles around them.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
	category: "LAYOUT",
}
*/

export default Box
