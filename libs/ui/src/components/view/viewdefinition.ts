import { BaseProps, BaseDefinition } from "../../definition/definition"
import { BuildPropertiesDefinition } from "../../buildmode/buildpropdefinition"
type ViewDefinition = {
	view: string
	params?: Record<string, string>
} & BaseDefinition

export interface ViewProps extends BaseProps {
	definition: ViewDefinition
}

const ViewPropertyDefinition: BuildPropertiesDefinition = {
	title: "View",
	description: "Just a view",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		view: "",
	}),
	properties: [
		{
			name: "view",
			type: "METADATA",
			metadataType: "VIEW",
			label: "View",
		},
		{
			name: "params",
			type: "PARAMS",
			label: "Params",
		},
	],
	sections: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
	category: "MIXED",
}

export default ViewPropertyDefinition
