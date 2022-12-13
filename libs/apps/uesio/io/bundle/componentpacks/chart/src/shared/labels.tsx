import { wire, collection } from "@uesio/ui"
import { SeriesDefinition } from "./aggregate"

type Categories = Record<string, string>

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
	timeunitfill?: "MONTH" | "WEEK"
}

type LabelsDefinition = WireLabels | ValueLabels | DataLabels

const getMonthYearDateKey = (date: Date) =>
	`${date.getUTCFullYear()}-${(date.getUTCMonth() + "").padStart(2, "0")}`

const getDayMonthYearDateKey = (date: Date) =>
	`${date.getUTCFullYear()}-${(date.getUTCMonth() + "").padStart(2, "0")}-${(
		date.getUTCDate() + ""
	).padStart(2, "0")}`

const getDateFromMonthYearKey = (key: string) => {
	const [year, month] = key.split("-")
	return new Date(parseInt(year, 10), parseInt(month, 10))
}

const getDateFromDayMonthYearKey = (key: string) => {
	const [startyear, startmonth, startday] = key.split("-")
	return new Date(
		parseInt(startyear, 10),
		parseInt(startmonth, 10),
		parseInt(startday, 10)
	)
}

const getCategoryFunc = (
	labels: LabelsDefinition,
	categoryField: collection.Field
) => {
	const fieldType = categoryField.getType()
	const fieldId = categoryField.getId()
	switch (fieldType) {
		case "DATE":
			return (record: wire.WireRecord) => {
				const value = record.getFieldValue<string>(fieldId)
				if (!value) return ""
				const dateValue = new Date(value)
				if (labels.source === "DATA" && labels.timeunit === "MONTH") {
					return getMonthYearDateKey(dateValue)
				}
				if (labels.source === "DATA" && labels.timeunit === "DAY") {
					return getDayMonthYearDateKey(dateValue)
				}
				throw new Error("Invalid time unit")
			}
		case "REFERENCE":
		case "USER":
			return (record: wire.WireRecord) => {
				const value = record.getReferenceValue(fieldId)
				return (value && value.getIdFieldValue()) || ""
			}
		default:
			throw new Error("Invalid field type: " + fieldType)
	}
}

const getDayDataLabels = (labels: DataLabels, categories: Categories) => {
	// Loop through all our data to get a full list of categories based
	// on our category field

	const categoryKeys = Object.keys(categories)
	const sortedCategories: Categories = {}
	if (!categoryKeys.length) return sortedCategories

	// Now sort our buckets
	const sortedKeys = categoryKeys.sort()
	const firstKey = sortedKeys[0]
	let lastKey = sortedKeys[sortedKeys.length - 1]

	let currentKey = firstKey

	const getLabel = (d: Date) =>
		d.toLocaleDateString(undefined, {
			month: "short",
			day: "2-digit",
		})

	if (labels.timeunitfill === "MONTH") {
		const start = getDateFromDayMonthYearKey(currentKey)
		start.setDate(1)
		currentKey = getDayMonthYearDateKey(start)

		const end = getDateFromDayMonthYearKey(lastKey)
		end.setDate(1)
		end.setMonth(end.getMonth() + 1)
		end.setDate(end.getDate() - 1)
		lastKey = getDayMonthYearDateKey(end)
	}

	if (labels.timeunitfill === "WEEK") {
		const start = getDateFromDayMonthYearKey(currentKey)
		const startWeekDay = start.getDay()
		start.setDate(start.getDate() - startWeekDay)
		currentKey = getDayMonthYearDateKey(start)

		const end = getDateFromDayMonthYearKey(lastKey)
		const endWeekDay = end.getDay()
		end.setDate(end.getDate() + (6 - endWeekDay))
		lastKey = getDayMonthYearDateKey(end)
	}

	while (currentKey !== lastKey) {
		const d = getDateFromDayMonthYearKey(currentKey)
		sortedCategories[currentKey] = getLabel(d)
		d.setDate(d.getDate() + 1)
		currentKey = getDayMonthYearDateKey(d)
	}
	// Now add in the last key
	if (currentKey === lastKey) {
		const d = getDateFromDayMonthYearKey(currentKey)
		sortedCategories[currentKey] = getLabel(d)
	}
	return sortedCategories
}

const getMonthDataLabels = (
	labels: LabelsDefinition,
	categories: Categories
) => {
	// Loop through all our data to get a full list of categories based
	// on our category field

	const categoryKeys = Object.keys(categories)
	const sortedCategories: Categories = {}
	if (!categoryKeys.length) return sortedCategories

	// Now sort our buckets
	const sortedKeys = categoryKeys.sort()
	const firstKey = sortedKeys[0]
	const lastKey = sortedKeys[sortedKeys.length - 1]

	let currentKey = firstKey

	const getLabel = (d: Date) =>
		d.toLocaleDateString(undefined, {
			month: "short",
			year: "numeric",
		})
	while (currentKey !== lastKey) {
		const d = getDateFromMonthYearKey(currentKey)
		sortedCategories[currentKey] = getLabel(d)
		d.setMonth(d.getMonth() + 1)
		currentKey = getMonthYearDateKey(d)
	}
	// Now add in the last key
	if (currentKey === lastKey) {
		const d = getDateFromMonthYearKey(currentKey)
		sortedCategories[currentKey] = getLabel(d)
	}
	return sortedCategories
}

const getReferenceDataLabels = (
	wire: wire.Wire,
	labels: DataLabels,
	categoryField: collection.Field
) => {
	const categories: Categories = {}
	const categoryFunc = getCategoryFunc(labels, categoryField)
	wire?.getData().forEach((record) => {
		const category = categoryFunc(record)
		const value = record.getReferenceValue(categoryField.getId())
		if (category && !(category in categories)) {
			categories[category] = value?.getUniqueKey() || ""
		}
	})
	return categories
}

const getDateDataLabels = (
	wire: wire.Wire,
	labels: DataLabels,
	categoryField: collection.Field
) => {
	const categories: Categories = {}
	const categoryFunc = getCategoryFunc(labels, categoryField)
	wire?.getData().forEach((record) => {
		const category = categoryFunc(record)
		if (category && !(category in categories)) {
			categories[category] = ""
		}
	})

	switch (labels.timeunit) {
		case "MONTH":
			return getMonthDataLabels(labels, categories)
		case "DAY":
			return getDayDataLabels(labels, categories)
		default:
			throw new Error("Invalid Timeunit")
	}
}

const getDataLabels = (
	wires: { [k: string]: wire.Wire | undefined },
	labels: DataLabels,
	series: SeriesDefinition
) => {
	const wire = wires[series.wire]
	if (!wire) throw new Error("Wire not found: " + series.wire)
	const categoryField = wire?.getCollection().getField(series.categoryField)
	if (!categoryField) {
		throw new Error("Invalid Category Field")
	}

	const fieldType = categoryField.getType()

	switch (fieldType) {
		case "DATE":
			return getDateDataLabels(wire, labels, categoryField)
		case "REFERENCE":
		case "USER":
			return getReferenceDataLabels(wire, labels, categoryField)
		default:
			throw new Error("Invalid Field Type: " + fieldType)
	}
}

const getLabels = (
	wires: { [k: string]: wire.Wire | undefined },
	labels: LabelsDefinition,
	serieses: SeriesDefinition[]
) =>
	serieses.reduce(
		(categories, series) => ({
			...categories,
			...getLabelsForSeries(wires, labels, series),
		}),
		{} as Categories
	)

const getLabelsForSeries = (
	wires: { [k: string]: wire.Wire | undefined },
	labels: LabelsDefinition,
	series: SeriesDefinition
) => {
	switch (labels.source) {
		case "DATA":
			return getDataLabels(wires, labels, series)
		default:
			throw new Error("Invalid Label Source")
	}
}

export { getCategoryFunc, getLabels, LabelsDefinition }
