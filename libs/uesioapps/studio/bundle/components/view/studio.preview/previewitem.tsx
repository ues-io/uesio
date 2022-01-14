import { FunctionComponent, useEffect, useState } from "react"
import { definition, hooks, component, collection, wire } from "@uesio/ui"
import { ParamDefinition } from "./preview"

interface Props extends definition.BaseProps {
	fieldKey: string
	item: ParamDefinition
}

const FieldWrapper = component.registry.getUtility("io.fieldwrapper")
const AutoComplete = component.registry.getUtility("io.autocomplete")

const PreviewItem: FunctionComponent<Props> = (props) => {
	const { context, fieldKey, item } = props
	const { type, collectionId, fieldId, required, defaultValue } = item
	const uesio = hooks.useUesio(props)

	if (!collectionId || !fieldId) return null

	// const collection = uesio.collection.useCollection(context, collectionId)
	// const fieldMetadata = collection && collection.getField(fieldId)

	// if (!fieldMetadata) return null

	// Get Field info
	// useEffect(() => {
	// 	// Create on-the-fly wire
	// 	if (!fieldId) return
	// 	const fields: wire.WireFieldDefinitionMap = {}
	// 	const flyWireName = "flyWireName_" + collectionId
	// 	fields[`${fieldId}`] = null

	// 	const basePath = `["viewdef"]["${context.getViewDefId()}"]["wires"]`

	// 	console.log({ collectionId, flyWireName })

	// 	uesio.builder.addDefinitionPair(
	// 		basePath,
	// 		{
	// 			collection: collectionId,
	// 			fields,
	// 		},
	// 		flyWireName
	// 	)

	// 	uesio.wire.initWires(context, [flyWireName])
	// 	uesio.wire.loadWires(context, [flyWireName])

	// 	return () => {
	// 		uesio.builder.removeDefinition(`${basePath}["${flyWireName}"]`)
	// 	}
	// }, [fieldId, collectionId])

	//
	const itemToString = (item: wire.PlainWireRecord | undefined) =>
		item ? `${item[fieldId]}` : ""
	//

	return (
		<FieldWrapper context={context} label={fieldKey} key={fieldKey}>
			<AutoComplete
				context={context}
				variant="io.default"
				value={""}
				// setValue={(value: wire.PlainWireRecord) => {
				// 	const idValue = value?.[idField]
				// 		? {
				// 				[idField]: value[idField],
				// 		  }
				// 		: null
				// 	record.update(fieldId, idValue)
				// }}
				itemToString={itemToString}
				itemRenderer={(item: wire.PlainWireRecord, index: number) => (
					<div>{itemToString(item)}</div>
				)}
				getItems={async (
					searchText: string,
					callback: (items: wire.PlainWireRecord[]) => void
				) => {
					const searchFields = [fieldId]
					const returnFields = [fieldId]
					const result = await uesio.platform.loadData(context, {
						wires: [
							{
								wire: "search",
								query: true,
								collection: collectionId,
								fields: returnFields.map((fieldName) => ({
									id: fieldName,
								})),
								conditions: [
									{
										type: "SEARCH",
										value: searchText,
										valueSource: "VALUE",
										active: true,
										fields: searchFields,
									},
								],
							},
						],
					})
					callback(result.wires[0].data || [])
				}}
			/>
		</FieldWrapper>
	)
}

export default PreviewItem
