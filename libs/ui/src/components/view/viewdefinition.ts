import { BaseProps, BaseDefinition } from "../../definition/definition"
import { BuildPropertiesDefinition } from "../../buildmode/buildpropdefinition"
type ViewDefinition = {
	view: string
	params?: Record<string, string>
} & BaseDefinition

export interface Props extends BaseProps {
	definition: ViewDefinition
}

const ViewPropertyDefinition: BuildPropertiesDefinition = {
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
