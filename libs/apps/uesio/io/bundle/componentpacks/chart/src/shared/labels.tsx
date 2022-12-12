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

const getCategoryKey = (
	record: wire.WireRecord,
	labels: LabelsDefinition,
	categoryField: collection.Field
) => {
	const value = record.getFieldValue<string>(categoryField.getId()) || ""
	if (categoryField.getType() === "DATE") {
		const dateValue = new Date(value)
		if (labels.source === "DATA" && labels.timeunit === "MONTH") {
			return getMonthYearDateKey(dateValue)
		}
		if (labels.source === "DATA" && labels.timeunit === "DAY") {
			return getDayMonthYearDateKey(dateValue)
		}
	}
	throw new Error("Invalid Category Field Type")
}

const getDataCategories = (
	wires: { [k: string]: wire.Wire | undefined },
	labels: LabelsDefinition,
	serieses: SeriesDefinition[]
) => {
	const categories: Categories = {}

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

	return categories
}

const getDayDataLabels = (
	wires: { [k: string]: wire.Wire | undefined },
	labels: DataLabels,
	serieses: SeriesDefinition[]
) => {
	const categories = getDataCategories(wires, labels, serieses)
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
	wires: { [k: string]: wire.Wire | undefined },
	labels: DataLabels,
	serieses: SeriesDefinition[]
) => {
	const categories = getDataCategories(wires, labels, serieses)
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

const getDataLabels = (
	wires: { [k: string]: wire.Wire | undefined },
	labels: DataLabels,
	serieses: SeriesDefinition[]
) => {
	switch (labels.timeunit) {
		case "MONTH":
			return getMonthDataLabels(wires, labels, serieses)
		case "DAY":
			return getDayDataLabels(wires, labels, serieses)
		default:
			throw new Error("Invalid Timeunit")
	}
}

const getLabels = (
	wires: { [k: string]: wire.Wire | undefined },
	labels: LabelsDefinition,
	serieses: SeriesDefinition[]
) => {
	switch (labels.source) {
		case "DATA":
			return getDataLabels(wires, labels, serieses)
		default:
			throw new Error("Invalid Label Source")
	}
}

export { getCategoryKey, getLabels, LabelsDefinition }
