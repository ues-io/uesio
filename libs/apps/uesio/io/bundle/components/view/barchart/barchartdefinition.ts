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
	title: "Chart",
	description: "Just a chart",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		text: "New chart",
	}),
	properties: [],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
}

export default PropertyDefinition
