import { definition, builder, hooks } from "@uesio/ui"

type FormColumnDefinition = {
	components: definition.DefinitionList
}

interface FormColumnProps extends definition.BaseProps {
	definition: FormColumnDefinition
}

const FormColumnPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Form Column",
	defaultDefinition: () => ({
		components: [],
	}),
	sections: [],
	traits: ["uesio.standalone", "uesio.field"],
	handleFieldDrop: (
		dragNode: string,
		dropNode: string,
		dropIndex: number,
		propDef: builder.BuildPropertiesDefinition,
		uesio: hooks.Uesio
	) => {
		uesio.view.addDefinition(
			dropNode,
			{
				["material.field"]: {
					fieldId: propDef.namespace + "." + propDef.name,
				},
			},
			dropIndex
		)
	},
}

export { FormColumnProps, FormColumnDefinition }

export default FormColumnPropertyDefinition
