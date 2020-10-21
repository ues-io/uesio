import { builder } from "@uesio/ui"

const WirePropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Wire",
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
	sections: [
		{
			title: "Fields",
			type: "FIELDS",
		},
		{
			title: "Conditions",
			type: "CONDITIONS",
		},
	],
	actions: [
		{
			type: "LOAD_WIRE",
			label: "Refresh Wire",
		},
	],
}
export { WirePropertyDefinition }
