import { definition, builder } from "@uesio/ui"

type ViewDefinition = {
	view: string
	params?: Record<string, string>
} & definition.BaseDefinition

export interface Props extends definition.BaseProps {
	definition: ViewDefinition
}

const ViewPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "View",
	description: "Just a view",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		viewid: "",
	}),
	properties: [
		{
			name: "view",
			type: "METADATA",
			metadataType: "VIEW",
			label: "View",
		},
	],
	sections: [
		{
			title: "Signals",
			type: "SIGNALS",
		},
	],

	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
}

export default ViewPropertyDefinition
