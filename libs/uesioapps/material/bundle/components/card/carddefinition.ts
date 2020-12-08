import { definition, builder, signal, styles, hooks } from "@uesio/ui"

import { CardActionDefinition } from "../cardaction/cardactiondefinition"

type CardDefinition = {
	margin: styles.MarginDefinition
	media?: {
		height: string
		background: styles.BackgroundDefinition
	}
	signals?: signal.SignalDefinition[]
	actions?: CardActionDefinition[]
}

interface CardProps extends definition.BaseProps {
	definition: CardDefinition
}

const CardPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Card",
	defaultDefinition: () => ({}),
	sections: [
		{
			title: "Display",
			type: "PROPLIST",
			properties: [],
		},
	],
	traits: ["uesio.standalone"],
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
export { CardProps, CardDefinition }

export default CardPropertyDefinition
