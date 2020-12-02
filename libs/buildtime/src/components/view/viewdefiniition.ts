import { builder } from "@uesio/ui"

const ViewPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "View",
	defaultDefinition: () => ({
		color: "primary",
		variant: "contained",
		text: "New Button",
	}),
	properties: [
		{
			name: "name",
			type: "KEY",
			label: "Name",
		},
		{
			name: "collection",
			type: "METADATA",
			metadataType: "COLLECTION",
			label: "Collection",
		},
	],
	sections: [],
	actions: [],
}
export { ViewPropertyDefinition }
