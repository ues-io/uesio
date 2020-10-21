import { definition, builder, signal, styles } from "uesio"

import { CardActionDefinition } from "../cardaction/cardactiondefinition"

type CardDefinition = {
	margin: styles.MarginDefinition
	media?: {
		height: string
		background: styles.BackgroundDefinition
	}
	signals?: signal.ComponentSignal[]
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
}
export { CardProps, CardDefinition }

export default CardPropertyDefinition
