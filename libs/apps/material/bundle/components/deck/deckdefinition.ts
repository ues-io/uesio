import { definition, builder, styles, material } from "uesio"

type DeckMode = "READ" | "EDIT"

type DeckDefinition = {
	id: string
	margin: styles.MarginDefinition
	wire: string
	mode: DeckMode
	xs: material.GridSize
	sm: material.GridSize
	md: material.GridSize
	lg: material.GridSize
	xl: material.GridSize
}

type DeckState = {
	mode: DeckMode
}

interface DeckProps extends definition.BaseProps {
	definition: DeckDefinition
}

const DeckPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Deck",
	defaultDefinition: () => ({
		id: "NEW_DECK",
		wire: null,
		mode: "READ",
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
	traits: ["uesio.standalone"],
}
export { DeckProps, DeckState, DeckDefinition }

export default DeckPropertyDefinition
