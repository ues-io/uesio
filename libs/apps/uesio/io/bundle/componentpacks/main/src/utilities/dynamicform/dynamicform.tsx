import { api, wire, definition } from "@uesio/ui"
import { MutableRefObject, useEffect } from "react"
import List from "../../components/list/list"

interface FormProps extends definition.UtilityProps {
	path: string
	fields: Record<string, wire.ViewOnlyField>
	content?: definition.DefinitionList
	onUpdate?: (field: string, value: wire.FieldValue) => void
	initialValue?: wire.PlainWireRecord
	wireRef?: MutableRefObject<wire.Wire | undefined>
}

const DynamicForm: definition.UtilityComponent<FormProps> = (props) => {
	const {
		context,
		content,
		id,
		fields,
		path,
		onUpdate,
		initialValue,
		wireRef,
	} = props

	const wireId = "dynamicwire:" + id
	const wire = api.wire.useDynamicWire(
		wireId,
		{
			viewOnly: true,
			fields,
			init: {
				create: true,
			},
		},
		context
	)

	// Set the passed in ref to the wire, so our
	// parent component can use this wire.
	if (wireRef) wireRef.current = wire

	useEffect(() => {
		if (!initialValue || !wire) return
		const record = wire.getFirstRecord()
		if (!record) return
		if (JSON.stringify(record.source) === JSON.stringify(initialValue))
			return
		record.setAll(initialValue)
	}, [wire, initialValue])

	api.event.useEvent(
		"wire.record.updated",
		(e) => {
			if (!onUpdate || !e.detail || !wire) return
			const { wireId, recordId, field, value } = e.detail
			if (wireId !== wire?.getFullId()) return
			if (recordId !== wire?.getFirstRecord().getId()) return
			onUpdate?.(field, value)
		},
		[wire]
	)

	return (
		<List
			path={path}
			definition={{
				mode: "EDIT",
				wire: wireId,
				components:
					content ||
					wire?.getFields().map((field) => ({
						"uesio/io.field": {
							fieldId: field.id,
						},
					})) ||
					[],
			}}
			context={
				wire
					? context.addWireFrame({
							view: wire.getViewId(),
							wire: wire.getId(),
					  })
					: context
			}
		/>
	)
}

export default DynamicForm
