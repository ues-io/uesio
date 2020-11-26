import { definition, signal, styles } from "@uesio/ui"

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

export { CardProps, CardDefinition }
