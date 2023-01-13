import { component, definition } from "@uesio/ui"
import { default as IOTitleBar } from "../../utilities/titlebar/titlebar"

type TitleBarDefinition = {
	title: string
	subtitle: string
}

const TitleBar: definition.UC<TitleBarDefinition> = (props) => {
	const { definition, path, context } = props

	return (
		<IOTitleBar
			context={context}
			variant={definition["uesio.variant"]}
			title={definition.title}
			subtitle={definition.subtitle}
			actions={
				<component.Slot
					definition={definition}
					listName="actions"
					path={path}
					context={context}
				/>
			}
		/>
	)
}

/*
const TitleBarPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Title Bar",
	description: "A section description with a main title and subtitle.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({ title: "New Title" }),
	properties: [
		{
			name: "title",
			type: "TEXT",
			label: "Title",
		},
		{
			name: "subtitle",
			type: "TEXT",
			label: "Subtitle",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	type: "component",
	category: "CONTENT",
}
*/

export default TitleBar
