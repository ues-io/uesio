import { definition, builder } from "@uesio/ui"
import { SeriesDefinition } from "../../shared/aggregate"
import { LabelsDefinition } from "../../shared/labels"

export type LineChartDefinition = {
	labels: LabelsDefinition
	title?: string
	series: SeriesDefinition[]
} & definition.BaseDefinition

export interface Props extends definition.BaseProps {
	definition: LineChartDefinition
}

const PropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Line Chart",
	description: "Visualized data with lines.",
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
