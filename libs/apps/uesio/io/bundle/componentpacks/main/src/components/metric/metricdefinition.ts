import { definition, builder, signal } from "@uesio/ui"

export type MetricDefinition = {
	title?: string
	unit?: string
	value: string
	signals?: signal.SignalDefinition[]
} & definition.BaseDefinition

export interface Props extends definition.BaseProps {
	definition: MetricDefinition
}

const PropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Metric",
	description: "A metric box",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		text: "New metric",
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
