import { wire, collection } from "@uesio/ui"

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
	timeunitfill?: "MONTH"
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

const getMonthYearDateKey = (year: number, month: number) =>
	`${year}-${(month + "").padStart(2, "0")}`

const getDayMonthYearDateKey = (year: number, month: number, day: number) =>
	`${year}-${(month + "").padStart(2, "0")}-${(day + "").padStart(2, "0")}`

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
		let lastKey = sortedKeys[sortedKeys.length - 1]

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
				currentKey = getMonthYearDateKey(d.getFullYear(), d.getMonth())
			}
			// Now add in the last key
			if (currentKey === lastKey) {
				const [year, month] = currentKey.split("-")
				const d = new Date(parseInt(year, 10), parseInt(month, 10))
				sortedCategories[currentKey] = getLabel(d)
			}
		}

		if (labels.timeunit === "DAY") {
			const getLabel = (d: Date) =>
				d.toLocaleDateString(undefined, {
					month: "short",
					day: "2-digit",
				})

			if (labels.timeunitfill === "MONTH") {
				const [startyear, startmonth, startday] = currentKey.split("-")
				const start = new Date(
					parseInt(startyear, 10),
					parseInt(startmonth, 10),
					parseInt(startday, 10)
				)
				start.setDate(1)
				currentKey = getDayMonthYearDateKey(
					start.getFullYear(),
					start.getMonth(),
					start.getDate()
				)

				const [endyear, endmonth, endday] = currentKey.split("-")
				const end = new Date(
					parseInt(endyear, 10),
					parseInt(endmonth, 10),
					parseInt(endday, 10)
				)
				end.setDate(1)
				end.setMonth(end.getMonth() + 1)
				end.setDate(end.getDate() - 1)
				lastKey = getDayMonthYearDateKey(
					end.getFullYear(),
					end.getMonth(),
					end.getDate()
				)
			}

			while (currentKey !== lastKey) {
				const [year, month, day] = currentKey.split("-")
				const d = new Date(
					parseInt(year, 10),
					parseInt(month, 10),
					parseInt(day, 10)
				)
				sortedCategories[currentKey] = getLabel(d)
				d.setDate(d.getDate() + 1)
				currentKey = getDayMonthYearDateKey(
					d.getFullYear(),
					d.getMonth(),
					d.getDate()
				)
			}
			// Now add in the last key
			if (currentKey === lastKey) {
				const [year, month, day] = currentKey.split("-")
				const d = new Date(
					parseInt(year, 10),
					parseInt(month, 10),
					parseInt(day, 10)
				)
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
			return getMonthYearDateKey(
				dateValue.getFullYear(),
				dateValue.getMonth()
			)
		}
		if (labels.source === "DATA" && labels.timeunit === "DAY") {
			const dateValue = new Date(value)
			return getDayMonthYearDateKey(
				dateValue.getFullYear(),
				dateValue.getMonth(),
				dateValue.getDate()
			)
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

export { getDataSets, getLabels, SeriesDefinition, LabelsDefinition }
