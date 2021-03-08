import { definition, builder, signal } from "@uesio/ui"

type CardActionDefinition = {
	icon: string
	helptext?: string
	helptextposition?:
		| "bottom"
		| "bottom-end"
		| "bottom-start"
		| "left-end"
		| "left-start"
		| "left"
		| "right-end"
		| "right-start"
		| "right"
		| "top-end"
		| "top-start"
		| "top"
	size?: "inherit" | "default" | "large" | "small"
	signals?: signal.SignalDefinition[]
}

interface CardActionProps extends definition.BaseProps {
	definition: CardActionDefinition
}

const CardActionPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Card Action",
	defaultDefinition: () => ({}),
	sections: [
		{
			title: "Display",
			type: "PROPLIST",
			properties: [],
		},
	],
	traits: ["uesio.standalone"],
}
export { CardActionProps, CardActionDefinition }

export default CardActionPropertyDefinition
