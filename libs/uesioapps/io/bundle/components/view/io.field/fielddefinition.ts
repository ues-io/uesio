import { definition, builder } from "@uesio/ui"

type FieldDefinition = {
	fieldId: string
	labelPosition?: LabelPosition
	label?: string
	id?: string
	displayAs?: string
} & definition.BaseDefinition

type LabelPosition = "none" | "top" | "left"

type FieldState = {
	value: string
	originalValue: string
	fieldId: string
	recordId: string
	collectionId: string
	fileName: string
	mimeType: string
}

interface FieldProps extends definition.BaseProps {
	definition: FieldDefinition
}

const FieldPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Field",
	description: "Just a Field",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "label",
			type: "TEXT",
			label: "Label",
		},
		{
			name: "labelPosition",
			type: "SELECT",
			label: "Label Position",
			options: [
				{
					label: "None",
					value: "none",
				},
				{
					label: "Top",
					value: "top",
				},
				{
					label: "Left",
					value: "left",
				},
			],
		},
	],
	sections: [],
	actions: [],
	type: "component",
	classes: ["root"],
}

export { FieldProps, FieldDefinition, FieldState, LabelPosition }

export default FieldPropertyDefinition
