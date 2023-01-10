import { component, styles, context, definition } from "@uesio/ui"
import { MarkDownFieldProps } from "../../utilities/markdownfield/markdownfield"

const MarkDownField = component.getUtility<MarkDownFieldProps>(
	"uesio/io.markdownfield"
)

type MarkDownDefinition = {
	markdown?: string
	mode: context.FieldMode
}

const MarkDown: definition.UC<MarkDownDefinition> = (props) => {
	const { definition, context } = props

	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)

	return (
		<MarkDownField
			classes={classes}
			variant={definition["uesio.variant"]}
			context={context}
			value={definition.markdown || ""}
			mode={"READ"}
		/>
	)
}

/*
const MarkDownPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "MarkDown",
	description: "Display formatted markdown text.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		markdown: "MarkDown Goes Here",
	}),
	properties: [
		{
			name: "markdown",
			type: "TEXT_AREA",
			label: "Markdown",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
	category: "CONTENT",
}
*/

export default MarkDown
