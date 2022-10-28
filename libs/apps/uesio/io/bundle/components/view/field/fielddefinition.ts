import { definition, builder, metadata } from "@uesio/ui"

type ReferenceGroupFieldOptions = {
	components?: definition.DefinitionList
	template?: string
}

type ReferenceFieldOptions = {
	searchFields?: string[]
	returnFields?: string[]
	components?: definition.DefinitionList
	template?: string
	requirewriteaccess?: boolean
}

type ListFieldOptions = {
	components?: definition.DefinitionList
}

type UserFieldOptions = {
	subtitle?: string
}

type FieldDefinition = {
	fieldId: string
	labelPosition?: LabelPosition
	label?: string
	id?: string
	displayAs?: string
	reference?: ReferenceFieldOptions
	list?: ListFieldOptions
	user?: UserFieldOptions
	placeholder: string
	wrapperVariant: metadata.MetadataKey
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
		{
			name: "displayAs",
			type: "SELECT",
			label: "Display as",
			options: [
				{
					label: "MARKDOWN",
					value: "MARKDOWN",
				},
				{
					label: "PASSWORD",
					value: "PASSWORD",
				},
				{
					label: "RADIO",
					value: "RADIO",
				},
				{
					label: "TOGGLE",
					value: "TOGGLE",
				},
				{
					label: "TEXT",
					value: "TEXT",
				},
				{
					label: "IMAGE",
					value: "IMAGE",
				},
				{
					label: "PREVIEW",
					value: "PREVIEW",
				},
			],
		},
		{
			name: "id",
			type: "TEXT",
			label: "ID",
		},
	],
	sections: [],
	actions: [],
	type: "component",
	classes: ["root"],
}

export {
	FieldProps,
	FieldDefinition,
	FieldState,
	LabelPosition,
	ListFieldOptions,
	ReferenceFieldOptions,
	ReferenceGroupFieldOptions,
	UserFieldOptions,
}

export default FieldPropertyDefinition
