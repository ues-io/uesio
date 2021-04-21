import { definition, builder } from "@uesio/ui"
import ButtonPropertyDefinition from "../material.button/buttondefinition"

type ButtonSetDefinition = {
	buttons: definition.DefinitionList
}

interface ButtonSetProps extends definition.BaseProps {
	definition: ButtonSetDefinition
}

const ButtonSetPropertyDefinition: builder.BuildPropertiesDefinition = {
	defaultDefinition: () => ({
		buttons: [
			{
				"material.button": ButtonPropertyDefinition.defaultDefinition(),
			},
		],
	}),
	title: "ButtonSet",
	sections: [],
	traits: ["uesio.standalone"],
	actions: [
		{
			label: "Add Button",
			type: "ADD",
			componentKey: "material.button",
			slot: "buttons",
		},
	],
}
export { ButtonSetProps, ButtonSetDefinition }

export default ButtonSetPropertyDefinition
