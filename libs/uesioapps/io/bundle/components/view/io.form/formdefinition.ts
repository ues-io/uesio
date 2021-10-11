import { definition, builder } from "@uesio/ui"
import LayoutPropertyDefinition, {
	LayoutDefinition,
	LayoutTemplateProp,
} from "../io.layout/layoutdefinition"

type FormAction = "save" | "delete" | "cancel" | "edit"
type FormMode = "READ" | "EDIT"
type FormState = {
	mode: FormMode
}
interface FormDefinition extends LayoutDefinition {
	icon: string
	id: string
	wire?: string
	defaultButtons: FormAction[]
	buttonVariant?: string
	mode: FormMode
	[key: string]: definition.Definition
}
interface FormProps extends definition.BaseProps {
	definition: FormDefinition
}
interface FormProps extends definition.BaseProps {
	definition: FormDefinition
}

const formActions = ["Save", "Edit", "Delete", "Cancel"]

const FormPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Form",
	description: "Form",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		wire: "",
		sections: [
			{
				"io.formsection": {
					template: "1,1",
					columns: [
						{
							"io.column": {
								components: [],
							},
						},
						{
							"io.column": {
								components: [],
							},
						},
					],
				},
			},
		],
	}),
	properties: [
		{
			type: "TEXT",
			name: "id",
			label: "ID",
		},
		{
			type: "TEXT",
			name: "title",
			label: "Title",
		},
		{
			name: "wire",
			type: "WIRE",
			label: "Wire",
		},
		{
			name: "mode",
			type: "SELECT",
			label: "Mode",
			options: [
				{
					value: "READ",
					label: "Read",
				},
				{
					value: "EDIT",
					label: "Edit",
				},
			],
		},
	],
	sections: [
		{
			title: "layout",
			type: "PROPLIST",
			properties:
				LayoutPropertyDefinition.properties?.map(
					(el: builder.PropDescriptor) => {
						if (el.type === "CUSTOM")
							return {
								...el,
								renderFunc: LayoutTemplateProp.form,
							}
						return el
					}
				) || [],
		},
		{
			title: "Actions bar",
			type: "PROPLIST",
			properties: [
				{
					name: "buttonVariant",
					type: "METADATA",
					metadataType: "COMPONENTVARIANT",
					label: "Variant",
					groupingValue: "io.button",
				},
				{
					name: "defaultButtons",
					label: "Buttons",
					type: "MULTISELECT",
					options: formActions.map((label) => ({
						value: label.toLowerCase(),
						label,
					})) as builder.PropertySelectOption[],
				},

				{
					name: "actionsBarPosition",
					type: "SELECT",
					label: "Position",
					options: [
						{
							value: "top",
							label: "Top",
						},
						{
							value: "bottom",
							label: "Bottom",
						},
					],
				},
			],
		},
	],
	actions: [
		{
			label: "Add Section",
			type: "ADD",
			componentKey: "io.formsection",
			slot: "sections",
		},
	],
	type: "component",
	traits: [""],
}
export { FormProps, FormDefinition, FormState, FormAction }

export default FormPropertyDefinition
