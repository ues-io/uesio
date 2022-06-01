import { ThunkFunc, appDispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { updateRecord, addError } from ".."

import { FieldMetadata } from "../../field/types"
import { FieldValue } from "../../wirerecord/types"

const checkFieldValidation = (
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
	return checks.filter(({ condition }) => condition)
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
		// Would be nice if we can get rid of context
		console.log({ context })
		const viewId = context.getViewId()
		if (!viewId) return context
		if (recordId) {
			recordId = context.merge(recordId)
		} else {
			recordId = context.getRecordId() || ""
		}
		if (!recordId) return context

		const entity = `${viewId}/${wirename || context.getWireId()}`

		const mergedValue = context.merge(value)

		appDispatch()(
			updateRecord({
				recordId,
				record: mergedValue,
				entity,
				path: [field],
			})
		)

		// Validation stuff below, we might want to abstract this out later
		// 1. Check if field is required
		const state = appDispatch()((dispatch, getState) => getState())
		const wireState = state.wire.entities[entity]
		const fieldMetadata =
			state.collection.entities[wireState?.collection || ""]?.fields[
				field
			]
		if (!fieldMetadata) return context
		const { required: isRequired } = fieldMetadata

		const isMissingButRequired = isRequired ? value !== undefined : true
		if (!isMissingButRequired)
			dispatch(
				addError({
					entity,
					recordId,
					fieldId: field,
					message: "That's required mate",
				})
			)

		// 2. Validatie field
		const errors = checkFieldValidation(fieldMetadata, value)
		errors.forEach((el) => {
			dispatch(
				addError({
					entity,
					recordId,
					fieldId: field,
					message: el.msg,
				})
			)
		})

		return context
	}
