import { definition, builder } from "@uesio/ui"
import LayoutPropertyDefinition, {
	LayoutDefinition,
	LayoutTemplateProp,
} from "../io.layout/layoutdefinition"

interface FormDefinition extends LayoutDefinition {
	icon: string
	[key: string]: any
}
interface FormProps extends definition.BaseProps {
	definition: FormDefinition
}

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
			title: "submit",
			type: "PROPLIST",
			properties: [
				{
					name: "defaultActionsBar",
					type: "BOOLEAN",
					label: "Default Save & Submit",
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
	traits: ["uesio.standalone"],
}
export { FormProps, FormDefinition }

export default FormPropertyDefinition
