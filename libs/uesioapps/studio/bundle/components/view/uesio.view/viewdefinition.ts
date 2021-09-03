import { builder } from "@uesio/ui"

const ViewPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "View",
	description: "View",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		color: "primary",
		variant: "contained",
		text: "New Button",
	}),
	properties: [
		{
			name: "view",
			type: "METADATA",
			metadataType: "VIEW",
			label: "",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
}
export default ViewPropertyDefinition
