import { wire, collection, context } from "@uesio/ui"
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
	timeunitfill?: "YEAR" | "MONTH" | "WEEK"
	timeunitdefaultvalue?: string
	format?: {
		month?: "long" | "short" | "numeric" | "narrow" | "2-digit"
		year?: "numeric" | "2-digit"
	}
}

type LabelsDefinition = WireLabels | ValueLabels | DataLabels

const getDayMonthYearDateKeyFromDateString = (dateValue: string) => {
	if (dateValue === "THIS_MONTH" || dateValue === "THIS_WEEK") {
		return getDayMonthYearDateKey(new Date())
	}
	return dateValue
}

const getMonthYearDateKey = (date: Date) =>
	`${date.getUTCFullYear()}-${(date.getUTCMonth() + "").padStart(2, "0")}`

const getDayMonthYearDateKey = (date: Date) =>
	`${getMonthYearDateKey(date)}-${(date.getUTCDate() + "").padStart(2, "0")}`

const getDateFromMonthYearKey = (key: string) => {
	const [year, month] = key.split("-")
	return new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10)))
}

const getDateFromDayMonthYearKey = (key: string) => {
	const [startyear, startmonth, startday] = key.split("-")
	return new Date(
		Date.UTC(
			parseInt(startyear, 10),
			parseInt(startmonth, 10),
			parseInt(startday, 10)
		)
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
		case "TIMESTAMP":
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
		case "TEXT":
		case "SELECT":
			return (record: wire.WireRecord) =>
				record.getFieldValue<string>(fieldId) || ""
		default:
			throw new Error("Invalid field type: " + fieldType)
	}
}

const getDayDataLabels = (
	labels: DataLabels,
	categories: Categories,
	context: context.Context
) => {
	// Loop through all our data to get a full list of categories based
	// on our category field

	const categoryKeys = Object.keys(categories)
	const sortedCategories: Categories = {}
	if (!categoryKeys.length) {
		if (!labels.timeunitdefaultvalue) {
			return sortedCategories
		}

		categoryKeys.push(
			getDayMonthYearDateKeyFromDateString(
				context.mergeString(labels.timeunitdefaultvalue)
			)
		)
	}

	// Now sort our buckets
	const sortedKeys = categoryKeys.sort()
	const firstKey = sortedKeys[0]
	let lastKey = sortedKeys[sortedKeys.length - 1]

	let currentKey = firstKey

	const getLabel = (d: Date) =>
		d.toLocaleDateString(undefined, {
			month: "short",
			day: "2-digit",
			timeZone: "UTC",
		})

	if (labels.timeunitfill === "MONTH") {
		const start = getDateFromDayMonthYearKey(currentKey)
		start.setUTCDate(1)
		currentKey = getDayMonthYearDateKey(start)

		const end = getDateFromDayMonthYearKey(lastKey)
		end.setUTCDate(1)
		end.setUTCMonth(end.getUTCMonth() + 1)
		end.setUTCDate(end.getUTCDate() - 1)
		lastKey = getDayMonthYearDateKey(end)
	}

	if (labels.timeunitfill === "WEEK") {
		const start = getDateFromDayMonthYearKey(currentKey)
		const startWeekDay = start.getUTCDay()
		start.setUTCDate(start.getUTCDate() - startWeekDay)
		currentKey = getDayMonthYearDateKey(start)

		const end = getDateFromDayMonthYearKey(lastKey)
		const endWeekDay = end.getUTCDay()
		end.setUTCDate(end.getUTCDate() + (6 - endWeekDay))
		lastKey = getDayMonthYearDateKey(end)
	}

	while (currentKey <= lastKey) {
		const d = getDateFromDayMonthYearKey(currentKey)
		sortedCategories[currentKey] = getLabel(d)
		d.setUTCDate(d.getUTCDate() + 1)
		currentKey = getDayMonthYearDateKey(d)
	}

	return sortedCategories
}

const getMonthDataLabels = (
	labels: DataLabels,
	categories: Categories,
	context: context.Context
) => {
	// Loop through all our data to get a full list of categories based
	// on our category field

	const categoryKeys = Object.keys(categories)
	const sortedCategories: Categories = {}
	if (!categoryKeys.length) {
		if (!labels.timeunitdefaultvalue) {
			return sortedCategories
		}

		categoryKeys.push(
			getDayMonthYearDateKeyFromDateString(
				context.mergeString(labels.timeunitdefaultvalue)
			)
		)
	}

	// Now sort our buckets
	const sortedKeys = categoryKeys.sort()
	const firstKey = sortedKeys[0]
	let lastKey = sortedKeys[sortedKeys.length - 1]

	let currentKey = firstKey

	const format = labels.format || {
		month: "short",
		year: "numeric",
	}

	const getLabel = (d: Date) =>
		d.toLocaleDateString(undefined, {
			month: format.month,
			year: format.year,
			timeZone: "UTC",
		})

	if (labels.timeunitfill === "YEAR") {
		const start = getDateFromMonthYearKey(currentKey)
		start.setUTCMonth(0)
		start.setUTCDate(1)
		currentKey = getMonthYearDateKey(start)

		const end = getDateFromMonthYearKey(lastKey)
		end.setUTCMonth(0)
		end.setUTCDate(1)
		end.setFullYear(end.getFullYear() + 1)
		end.setUTCDate(end.getUTCDate() - 1)
		lastKey = getMonthYearDateKey(end)
	}

	while (currentKey <= lastKey) {
		const d = getDateFromMonthYearKey(currentKey)
		sortedCategories[currentKey] = getLabel(d)
		d.setUTCMonth(d.getUTCMonth() + 1)
		currentKey = getMonthYearDateKey(d)
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

const getTextDataLabels = (
	wire: wire.Wire,
	labels: DataLabels,
	categoryField: collection.Field
) => {
	const categories: Categories = {}
	const categoryFunc = getCategoryFunc(labels, categoryField)
	wire?.getData().forEach((record) => {
		const category = categoryFunc(record)
		const value = record.getFieldValue<string>(categoryField.getId())
		if (category && !(category in categories)) {
			categories[category] = value || ""
		}
	})
	const sortedCategories: Categories = {}
	Object.keys(categories)
		.sort()
		.forEach((k) => {
			sortedCategories[k] = categories[k]
		})
	return sortedCategories
}

const getDateDataLabels = (
	wire: wire.Wire,
	labels: DataLabels,
	categoryField: collection.Field,
	context: context.Context
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
			return getMonthDataLabels(labels, categories, context)
		case "DAY":
			return getDayDataLabels(labels, categories, context)
		default:
			throw new Error("Invalid Timeunit")
	}
}

const getDataLabels = (
	wires: { [k: string]: wire.Wire | undefined },
	labels: DataLabels,
	series: SeriesDefinition,
	context: context.Context
) => {
	const wire = wires[series.wire]
	if (!wire) throw new Error("Wire not found: " + series.wire)
	const categoryField = wire?.getCollection().getField(series.categoryField)
	if (!categoryField) {
		return {}
	}

	const fieldType = categoryField.getType()

	switch (fieldType) {
		case "DATE":
		case "TIMESTAMP":
			return getDateDataLabels(wire, labels, categoryField, context)
		case "REFERENCE":
		case "USER":
			return getReferenceDataLabels(wire, labels, categoryField)
		case "TEXT":
		case "SELECT":
			return getTextDataLabels(wire, labels, categoryField)
		default:
			throw new Error("Invalid Field Type: " + fieldType)
	}
}

const getLabels = (
	wires: { [k: string]: wire.Wire | undefined },
	labels: LabelsDefinition,
	serieses: SeriesDefinition[],
	context: context.Context
) =>
	serieses.reduce(
		(categories, series) => ({
			...categories,
			...getLabelsForSeries(wires, labels, series, context),
		}),
		{} as Categories
	)

const getLabelsForSeries = (
	wires: { [k: string]: wire.Wire | undefined },
	labels: LabelsDefinition,
	series: SeriesDefinition,
	context: context.Context
) => {
	switch (labels.source) {
		case "DATA":
			return getDataLabels(wires, labels, series, context)
		default:
			return {}
	}
}

export { getCategoryFunc, getLabels }
export type { LabelsDefinition }
