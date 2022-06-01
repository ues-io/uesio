import { ThunkFunc, appDispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { updateRecord } from ".."

import { FieldMetadata } from "../../field/types"
import { FieldValue } from "../../wirerecord/types"

const getFieldValidationErrors = (
	fieldMetaData: FieldMetadata,
	value: FieldValue
) => {
	const checks: { condition: boolean; msg: string }[] = [
		{
			condition: !!(
				fieldMetaData.required &&
				!value &&
				value !== false &&
				value !== 0
			),
			msg: "required",
		},
		{
			condition: value === "uesio sucks",
			msg: "Uesio doesn't suck!",
		},
		{
			condition: fieldMetaData.type === "TEXT" && value === "number",
			msg: "Expected Text, not a number",
		},
	]
	return checks.filter(({ condition }) => condition).map(({ msg }) => msg)
}

export default ({
		context,
		wirename,
		recordId,
		field,
		value,
	}: {
		context: Context
		wirename: string
		recordId: string
		field: string
		value: string
	}): ThunkFunc =>
	(dispatch) => {
		const viewId = context.getViewId()
		if (!viewId) return context
		const recordIdx = recordId
			? context.merge(recordId)
			: context.getRecordId() || ""
		if (!recordIdx) return context
		const entity = `${wirename || context.getWireId()}`
		const mergedValue = context.merge(value)

		// Validation stuff below, we might want to abstract this out later
		// Check if field is required
		const state = appDispatch()((dispatch, getState) => getState())
		const wireState = state.wire.entities[entity]
		const fieldMetadata =
			state.collection.entities[wireState?.collection || ""]?.fields[
				field
			]

		const errors = fieldMetadata
			? getFieldValidationErrors(fieldMetadata, value)
			: []

		dispatch(
			updateRecord({
				errors,
				recordId: recordIdx,
				record: mergedValue,
				entity,
				path: [field],
			})
		)

		return context
	}
