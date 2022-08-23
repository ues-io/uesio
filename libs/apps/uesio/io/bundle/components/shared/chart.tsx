import { wire, collection, builder } from "@uesio/ui"

type Buckets = Record<string, number>
type Categories = Record<string, string>

type SeriesDefinition = {
	name: string
	label: string
	valueField: string // this is what determines the total value on the y axis
	categoryField: string // This is what determines what bucket the data point goes into
	wire: string
}

type WireLabels = {
	source: "WIRE"
	wire: string
	categoryField: string
}

type ValueLabels = {
	source: "VALUE"
	values: ValueLabel[]
}

type ValueLabel = {
	key: string
	value: string
}

type DataLabels = {
	source: "DATA"
	timeunit?: "YEAR" | "MONTH" | "DAY"
}

type LabelsDefinition = WireLabels | ValueLabels | DataLabels

export const CHART_COLORS = {
	red: "rgb(255, 99, 132)",
	orange: "rgb(255, 159, 64)",
	yellow: "rgb(255, 205, 86)",
	green: "rgb(75, 192, 192)",
	blue: "rgb(54, 162, 235)",
	purple: "rgb(153, 102, 255)",
	grey: "rgb(201, 203, 207)",
}

const getLabels = (
	wires: { [k: string]: wire.Wire | undefined },
	labels: LabelsDefinition,
	serieses: SeriesDefinition[]
) => {
	const categories: Categories = {}
	if (labels.source === "DATA") {
		serieses.forEach((series) => {
			const wire = wires[series.wire]
			if (!wire) return
			const categoryField = wire
				?.getCollection()
				.getField(series.categoryField)
			if (!categoryField) {
				throw new Error("Invalid Category Field")
			}
			wire?.getData().forEach((record) => {
				const category = getCategoryKey(record, labels, categoryField)
				if (!categories[category]) {
					categories[category] = ""
				}
			})
		})

		const categoryKeys = Object.keys(categories)
		const sortedCategories: Categories = {}
		if (!categoryKeys.length) return sortedCategories

		// Now sort our buckets
		const sortedKeys = categoryKeys.sort()
		const firstKey = sortedKeys[0]
		const lastKey = sortedKeys[sortedKeys.length - 1]

		let currentKey = firstKey
		if (labels.timeunit === "MONTH") {
			const getLabel = (d: Date) =>
				d.toLocaleDateString(undefined, {
					month: "short",
					year: "numeric",
				})
			while (currentKey !== lastKey) {
				const [year, month] = currentKey.split("-")
				const d = new Date(parseInt(year, 10), parseInt(month, 10))
				sortedCategories[currentKey] = getLabel(d)
				d.setMonth(d.getMonth() + 1)
				currentKey = d.getFullYear() + "-" + d.getMonth()
			}
			// Now add in the last key
			if (currentKey === lastKey) {
				const [year, month] = currentKey.split("-")
				const d = new Date(parseInt(year, 10), parseInt(month, 10))
				sortedCategories[currentKey] = getLabel(d)
			}
		}
		return sortedCategories
	}
	throw new Error("Invalid Label Source")
}

const getCategoryKey = (
	record: wire.WireRecord,
	labels: LabelsDefinition,
	categoryField: collection.Field
) => {
	const value = record.getFieldValue<string>(categoryField.getId()) || ""
	if (categoryField.getType() === "DATE") {
		if (labels.source === "DATA" && labels.timeunit === "MONTH") {
			const dateValue = new Date(value)
			return dateValue.getFullYear() + "-" + dateValue.getMonth()
		}
	}
	throw new Error("Invalid Category Field Type")
}

const getDataSets = (
	wires: { [k: string]: wire.Wire | undefined },
	categories: Categories,
	labels: LabelsDefinition,
	serieses: SeriesDefinition[]
) =>
	serieses.flatMap((series, index) => {
		const wire = wires[series.wire]
		if (!wire) return []
		const bucketField = wire?.getCollection().getField(series.categoryField)
		if (!bucketField) {
			throw new Error("Invalid Category Field")
		}

		const buckets: Buckets = Object.fromEntries(
			Object.entries(categories).map(([key]) => [key, 0])
		)

		wire?.getData().forEach((record) => {
			const category = getCategoryKey(record, labels, bucketField)
			const aggValue =
				record.getFieldValue<number>(series.valueField) || 0
			const currentValue = buckets[category]
			buckets[category] = currentValue + aggValue
		})
		return [
			{
				label: series.label,
				cubicInterpolationMode: "monotone" as const,
				data: Object.values(buckets),
				backgroundColor: Object.values(CHART_COLORS)[index],
				borderColor: Object.values(CHART_COLORS)[index],
			},
		]
	})
const seriesSection: builder.PropertySection = {
	type: "PROPLISTS",
	name: "series",
	title: "Series",
	nameTemplate: "${wire} something",
	fallbackTemplate: "empty item",
	properties: [
		{
			name: "wire",
			type: "WIRE",
			label: "Wire",
		},
	],
}
const chartProperties: builder.PropDescriptor[] = [
	{
		name: "title",
		type: "TEXT",
		label: "Title",
	},
	{
		name: "source",
		type: "SELECT",
		label: "Source",
		options: [
			{
				value: "",
				label: "Select a source",
			},
			{
				value: "WIRE",
				label: "Wire",
			},
			{
				value: "VALUE",
				label: "Value",
			},
			{
				value: "DATA",
				label: "Data",
			},
		],
	}
]


		// {
		// 	name: "CategoryField",
		// 	type: "FIELD",
		// 	wireField: "wire",
		// 	label: "Category field",
		// },
		// {
		// 	name: "valueField",
		// 	type: "FIELD",
		// 	wireField: "wire",
		// 	label: "Value field",
		// },


const chartProperties: builder.PropDescriptor[] = [
	{
		name: "title",
		type: "TEXT",
		label: "Title",
	},
	{
		name: "source",
		type: "SELECT",
		label: "Source",
		options: [
			{
				value: "",
				label: "Select a source",
			},
			{
				value: "WIRE",
				label: "Wire",
			},
			{
				value: "VALUE",
				label: "Value",
			},
			{
				value: "DATA",
				label: "Data",
			},
		],
	},

	// SOURCE: Wire
	{
		name: "wire",
		type: "WIRE",
		label: "Wire",
		display: [
			{
				property: "source",
				value: "WIRE",
			},
		],
	},
	// {
	// 	name: "categoryField",
	// 	type: "FIELD",
	// 	label: "Category Field",
	// 	wireField: "wireSomething",
	// 	display: [
	// 		{
	// 			property: "source",
	// 			value: "WIRE",
	// 		},
	// 	],
	// },

	// Source: Value
	{
		name: "values",
		type: "PROPLISTS",
		label: "Values",
		nameTemplate: "",
		properties: [
			{
				name: "key",
				type: "TEXT",
				label: "Key",
			},
			{
				name: "value",
				type: "TEXT",
				label: "Value",
			},
		],
	}
		display: [
			{
				property: "source",
				value: "VALUE",
			},
		],
	},
	// Source: Data
	{
		name: "timeunit",
		type: "SELECT",
		label: "Time Unit",
		options: [
			{
				value: "",
				label: "Select a time interval",
			},
			{
				value: "DAY",
				label: "Day",
			},
			{
				value: "MONTH",
				label: "Month",
			},
			{
				value: "YEAR",
				label: "Year",
			},
		],
		display: [
			{
				property: "source",
				value: "DATA",
			},
		],
	},
]
export {
	getDataSets,
	getLabels,
	SeriesDefinition,
	LabelsDefinition,
	chartProperties,
	seriesSection,
}
