import { definition, builder } from "@uesio/ui"
import { LabelsDefinition, SeriesDefinition } from "../../shared/chart"

export type BarChartDefinition = {
	labels: LabelsDefinition
	title?: string
	series: SeriesDefinition[]
} & definition.BaseDefinition

export interface Props extends definition.BaseProps {
	definition: BarChartDefinition
}

const PropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Bar Chart",
	description: "Visualize data with bars.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		text: "New chart",
	}),
	properties: [
		{
			name: "title",
			type: "TEXT",
			label: "Title",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
	category: "VISUALIZATION",
}

export default PropertyDefinition
