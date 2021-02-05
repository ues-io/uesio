import { definition, builder } from "@uesio/ui"

type FormMode = "READ" | "EDIT"

type FormDefinition = {
	id: string
	wire: string
	mode: FormMode
	columns: definition.DefinitionList
}
type FormColumnDefinition = {
	components: definition.DefinitionList
}

type FormState = {
	mode: FormMode
}

interface FormProps extends definition.BaseProps {
	definition: FormDefinition
}

const FormPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Form",
	defaultDefinition: () => ({
		id: "NEW_Form",
		wire: null,
		mode: "READ",
		columns: [],
	}),
	properties: [
		{
			name: "mode",
			type: "SELECT",
			label: "Mode",
			options: [
				{
					value: "EDIT",
					label: "Edit",
				},
				{
					value: "READ",
					label: "Read",
				},
			],
		},
		{
			name: "wire",
			type: "WIRE",
			label: "Wire",
		},
	],
	sections: [],
	actions: [
		{
			label: "Add Column",
			type: "ADD",
			componentKey: "material.formcolumn",
			slot: "columns",
		},
	],
	traits: ["uesio.standalone"],
}
export { FormProps, FormState, FormDefinition, FormColumnDefinition }

export default FormPropertyDefinition
