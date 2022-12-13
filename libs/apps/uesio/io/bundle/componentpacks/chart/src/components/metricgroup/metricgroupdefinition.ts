import { definition, builder, signal } from "@uesio/ui"
import { SeriesDefinition } from "../../shared/aggregate"
import { LabelsDefinition } from "../../shared/labels"

export type MetricGroupDefinition = {
	labels: LabelsDefinition
	title?: string
	series: SeriesDefinition[]
	signals?: signal.SignalDefinition[]
} & definition.BaseDefinition

export interface Props extends definition.BaseProps {
	definition: MetricGroupDefinition
}

const PropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Metric Group",
	description: "Visualized data with numbers.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		text: "New metric group",
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
