import { definition, builder, material } from "@uesio/ui"

type TypographyDefinition = {
	text: string
	variant: material.TypographyVariant
	textTransform?: "capitalize" | "lowercase" | "uppercase"
	color?: "primary" | "secondary" | "textPrimary" | "textSecondary" | "error"
}

interface TypographyProps extends definition.BaseProps {
	definition: TypographyDefinition
}

const TypographyPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Text",
	defaultDefinition: () => ({
		text: "Text Goes Here",
	}),
	properties: [
		{
			name: "text",
			type: "TEXT",
			label: "Text",
		},
		{
			name: "variant",
			type: "SELECT",
			label: "Variant",
			options: [
				{
					value: "h1",
					label: "Big",
				},
				{
					value: "h2",
					label: "Medium",
				},
				{
					value: "h3",
					label: "Small",
				},
			],
		},
		{
			name: "color",
			type: "SELECT",
			label: "Color",
			options: [
				{
					value: "primary",
					label: "Primary",
				},
				{
					value: "secondary",
					label: "Secondary",
				},
				{
					value: "textPrimary",
					label: "Text Primary",
				},
				{
					value: "textSecondary",
					label: "Text Secondary",
				},
				{
					value: "error",
					label: "Error",
				},
			],
		},
	],
	sections: [],
	traits: ["uesio.standalone"],
}
export { TypographyProps, TypographyDefinition }

export default TypographyPropertyDefinition
