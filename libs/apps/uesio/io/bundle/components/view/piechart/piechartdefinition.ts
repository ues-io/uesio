import { definition, builder } from "@uesio/ui"
import { ChartDefinition } from "../../shared/chartutils"

export interface Props extends definition.BaseProps {
	definition: ChartDefinition
}

const PropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Pie Chart",
	description: "Hmmmm pie...",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		text: "New chart",
	}),
	properties: [
		{
			name: "text",
			type: "TEXT",
			label: "Text",
		},
		{
			name: "icon",
			type: "ICON",
			label: "Icon",
		},
	],
	sections: [
		{
			title: "Signals",
			type: "SIGNALS",
		},
	],
	actions: [
		{
			label: "Run Signals",
			type: "RUN_SIGNALS",
			slot: "signals",
		},
	],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
}

export default PropertyDefinition
