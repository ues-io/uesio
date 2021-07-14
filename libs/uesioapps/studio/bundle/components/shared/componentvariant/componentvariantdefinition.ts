import { builder } from "@uesio/ui"

const ComponentVariantDefinition: builder.BuildPropertiesDefinition = {
	title: "",
	defaultDefinition: () => ({
		color: "primary",
		variant: "contained",
		text: "New Button",
	}),
	properties: [
		{
			name: "componentvariant",
			type: "COMPONENTVARIANT",
			label: "Component Variant",
		},
	],
	sections: [],
	actions: [],
}
export { ComponentVariantDefinition }
