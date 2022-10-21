import { definition, builder } from "@uesio/ui"
import {
	LabelsDefinition,
	SeriesDefinition,
	chartProperties,
	seriesSection,
} from "../../shared/chart"
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
	properties: chartProperties,
	sections: [seriesSection],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
	category: "VISUALIZATION",
}

export default PropertyDefinition
