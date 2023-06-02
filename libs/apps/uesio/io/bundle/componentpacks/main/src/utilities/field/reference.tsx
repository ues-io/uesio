import {
	wire,
	api,
	collection,
	definition,
	context,
	component,
} from "@uesio/ui"

import debounce from "lodash/debounce"
import { useState } from "react"
import CustomSelect from "../customselect/customselect"
import ReadOnlyField from "./readonly"

export type ReferenceFieldOptions = {
	searchFields?: string[]
	returnFields?: string[]
	components?: definition.DefinitionList
	template?: string
	requirewriteaccess?: boolean
	conditions?: wire.WireConditionState[]
}

interface ReferenceFieldProps {
	path: string
	fieldId: string
	fieldMetadata: collection.Field
	mode: context.FieldMode
	record: wire.WireRecord
	options?: ReferenceFieldOptions
	placeholder?: string
}

const isValueCondition = wire.isValueCondition

const ReferenceField: definition.UtilityComponent<ReferenceFieldProps> = (
	props
) => {
	const {
		fieldId,
		fieldMetadata,
		mode,
		record,
		context,
		options,
		path,
		placeholder,
		variant,
		id,
	} = props

	const referencedCollection = api.collection.useCollection(
		context,
		fieldMetadata.source.reference?.collection || ""
	)

	const nameField = referencedCollection?.getNameField()?.getId()

	const [items, setItems] = useState<wire.PlainWireRecord[]>([])

	if (!referencedCollection || !nameField) return null

	const renderer = (item: wire.PlainWireRecord) => {
		if (options?.components) {
			const recordid = item[collection.ID_FIELD]
			return (
				<component.Slot
					definition={options}
					listName="components"
					path={`${path}["reference"]["${recordid}"]`}
					context={context.addRecordDataFrame(item)}
				/>
			)
		}
		if (options?.template) {
			return context
				.addRecordDataFrame(item)
				.mergeString(options?.template)
		}
		return (
			item[nameField] ||
			item[collection.UNIQUE_KEY_FIELD] ||
			item[collection.ID_FIELD]
		)
	}

	const value = record.getFieldValue<wire.PlainWireRecord>(fieldId)

	const onSearch = debounce(async (search: string) => {
		if (!wire) return
		const searchFields = options?.searchFields || [nameField]
		const returnFields = options?.returnFields || [nameField]

		// Loop over the conditions and merge their values
		const conditions: wire.WireConditionState[] = (
			options?.conditions || []
		).map((condition) => {
			if (!isValueCondition(condition)) return condition

			return {
				...condition,
				value: condition.value
					? context.merge(condition.value)
					: condition.value,
			}
		})

		const result = await api.platform.loadData(context, {
			wires: [
				{
					name: "search",
					batchnumber: 0,
					batchid: "",
					view: context.getViewId() || "",
					query: true,
					collection: referencedCollection.getFullName(),
					fields: returnFields.map((fieldName) => ({
						id: fieldName,
					})),
					conditions: [
						...conditions,
						{
							type: "SEARCH",
							value: search,
							fields: searchFields,
						},
					],
					requirewriteaccess: options?.requirewriteaccess,
				},
			],
		})
		setItems(Object.values(result.wires[0].data) || [])
	}, 200)

	if (mode === "READ") {
		return (
			<ReadOnlyField variant={variant} context={context}>
				{value ? renderer(value) : ""}
			</ReadOnlyField>
		)
	} else {
		return (
			<CustomSelect
				id={id}
				items={items}
				itemRenderer={renderer}
				variant={"uesio/io.customselectfield:uesio/io.default"}
				context={context}
				selectedItems={value ? [value] : []}
				isSelected={() => false}
				onSearch={onSearch}
				placeholder={placeholder}
				onSelect={(item: wire.PlainWireRecord) => {
					record.update(fieldId, item, context)
				}}
				onUnSelect={() => {
					record.update(fieldId, null, context)
				}}
				getItemKey={(item: wire.PlainWireRecord) =>
					item[collection.ID_FIELD] as string
				}
			/>
		)
	}
}

export default ReferenceField
