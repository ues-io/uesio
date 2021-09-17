import { definition, builder } from "@uesio/ui"
import FormActionBarProp from "./formActionBarProp"

type FormDefinition = {
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
		components: [
			{
				"io.layout": {
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
			type: "CUSTOM",
			name: "template",
			label: "Default Actions Bar",
			renderFunc: FormActionBarProp,
		},
		{
			name: "defaultActionsBar",
			type: "BOOLEAN",
			label: "Default Save & Submit",
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
	sections: [],
	actions: [],
	type: "component",
	traits: ["uesio.standalone"],
}
export { FormProps, FormDefinition }

export default FormPropertyDefinition
