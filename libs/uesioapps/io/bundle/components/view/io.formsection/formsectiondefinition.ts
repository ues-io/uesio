import { definition, builder } from "@uesio/ui"

import LayoutPropertyDefinition, {
	LayoutDefinition,
	LayoutTemplateProp,
} from "../io.layout/layoutdefinition"

interface FormSectionDefinition extends LayoutDefinition {
	icon: string
	[key: string]: any
}
interface FormSectionProps extends definition.BaseProps {
	definition: FormSectionDefinition
}

const FormSectionPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Section",
	description: "Form",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		template: "1,1",
		columns: [{ "io.column": {} }, { "io.column": {} }],
	}),
	properties: [
		{
			type: "TEXT",
			name: "title",
			label: "Title",
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
	],
	type: "component",
	traits: ["uesio.standalone"],
}
export { FormSectionProps, FormSectionDefinition }

export default FormSectionPropertyDefinition
