import { component, definition } from "@uesio/ui"

const IOTitleBar = component.getUtility("uesio/io.titlebar")

type TitleBarDefinition = {
	title: string
	subtitle: string
} & definition.BaseDefinition

interface TitleBarProps extends definition.BaseProps {
	definition: TitleBarDefinition
}

const TitleBar: definition.UtilityComponent<TitleBarProps> = (props) => {
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
					accepts={["uesio.standalone"]}
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
