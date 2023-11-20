import { LoadBotApi, FieldValue } from "@uesio/bots"

type TaskStatus = {
	name: string
	color: string
}

type Task = {
	id: number
	subject: string
	priority: number
	status: TaskStatus
}

export default function load_tasks(bot: LoadBotApi) {
	const data = [
		{
			id: 1,
			subject: "Alpha",
			priority: 1,
			status: {
				name: "Open",
				color: "green",
			},
		},
		{
			id: 2,
			subject: "Beta",
			priority: 3,
			status: {
				name: "Open",
				color: "green",
			},
		},
		{
			id: 3,
			subject: "Gamma",
			priority: 3,
			status: {
				name: "In Progress",
				color: "yellow",
			},
		},
		{
			id: 4,
			subject: "Delta",
			priority: 2,
			status: {
				name: "Completed",
				color: "purple",
			},
		},
		{
			id: 5,
			subject: "Zeta",
			priority: 1,
			status: {
				name: "Completed",
				color: "purple",
			},
		},
	] as Task[]

	const { collectionMetadata, conditions } = bot.loadRequest

	const uesioFieldsByExternalName = {
		id: "uesio/core.id",
	} as Record<string, string>
	Object.entries(collectionMetadata.getAllFieldMetadata()).forEach(
		([uesioFieldName, fieldMetadata]) => {
			// Only expose fields that have a defined external field name
			if (fieldMetadata.externalName) {
				uesioFieldsByExternalName[fieldMetadata.externalName] =
					uesioFieldName
			}
		}
	)

	const getUesioItemFromExternalRecord = (
		record: Record<string, FieldValue>
	) =>
		Object.entries(record).reduce(
			(acc: Record<string, FieldValue>, [externalField, value]) => {
				const uesioName = uesioFieldsByExternalName[externalField]
				if (!uesioName) {
					return acc
				}
				const fieldMetadata =
					collectionMetadata.getFieldMetadata(uesioName)
				if (value && fieldMetadata) {
					if (fieldMetadata.type === "TIMESTAMP") {
						const dateVal = Date.parse(value as string)
						if (dateVal) {
							value = dateVal / 1000
						} else {
							value = null
						}
					}
				}
				if (value !== undefined && value !== null) {
					acc[uesioName] = value
				}
				return acc
			},
			{}
		)

	const taskFilter = (item: Task) => {
		if (!conditions || !conditions.length) return true
		return conditions.every((condition) => {
			const { field, value, values, operator } = condition
			const fieldParts = field.split(".")
			const localField = fieldParts[1] // e.g. "priority", "status->name"
			let itemValue: FieldValue
			if (localField === "status->name") {
				itemValue = item.status.name
			} else if (localField === "status->color") {
				itemValue = item.status.color
			} else if (localField === "priority") {
				itemValue = item.priority
			} else {
				itemValue = item.subject
			}
			switch (localField) {
				case "priority":
					const numericValue =
						(typeof value === "string"
							? parseFloat(value)
							: value) || 0
					if (operator === "GT") {
						return itemValue > numericValue
					} else if (operator === "LT") {
						return itemValue < numericValue
					} else if (operator === "GTE") {
						return itemValue >= numericValue
					} else if (operator === "LTE") {
						return itemValue <= numericValue
					} else if (operator === "EQ") {
						return itemValue === numericValue
					} else if (operator === "NOT_EQ") {
						return itemValue === numericValue
					} else if (operator === "IN") {
						return values?.some(
							(value) => (itemValue as number) === value
						)
					} else if (operator === "NOT_IN") {
						return values?.every(
							(value) => (itemValue as number) !== value
						)
					}
					break
				case "subject":
				case "status->name":
				case "status->color":
					if (operator === "EQ") {
						return itemValue === value
					} else if (operator === "NOT_EQ") {
						return itemValue !== value
					} else if (operator === "IN") {
						return values?.some((value) => itemValue === value)
					} else if (operator === "NOT_IN") {
						return values?.every(
							(value) => (itemValue as number) !== value
						)
					}
					break
			}
			return true
		})
	}

	for (const item of data) {
		if (taskFilter(item)) {
			bot.addRecord(getUesioItemFromExternalRecord(item))
		}
	}
}
