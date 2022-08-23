import { definition, builder } from "@uesio/ui"
import {
	LabelsDefinition,
	SeriesDefinition,
	chartProperties,
	seriesSection,
} from "../../shared/chart"

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
	description: "Just a chart",
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
}

export default PropertyDefinition
