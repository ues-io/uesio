import { api, wire, definition } from "@uesio/ui"
import { useEffect } from "react"

import Form from "../form/form"

interface FormProps extends definition.UtilityProps {
	path: string
	submitLabel?: string
	onSubmit?: (record: wire.WireRecord) => void
	fields: Record<string, wire.ViewOnlyField>
	content: definition.DefinitionList
	onUpdate?: (field: string, value: wire.FieldValue) => void
	initialValue?: wire.PlainWireRecord
}

const DynamicForm: definition.UtilityComponent<FormProps> = (props) => {
	const {
		context,
		onSubmit,
		submitLabel,
		content,
		id,
		fields,
		path,
		onUpdate,
		initialValue,
	} = props

	const wire = api.wire.useDynamicWire(
		"dynamicwire:" + id,
		{
			viewOnly: true,
			fields,
			init: {
				create: true,
			},
		},
		context
	)

	const currentValueString = JSON.stringify(initialValue)

	useEffect(() => {
		if (!initialValue || !wire) return
		const record = wire.getFirstRecord()
		if (!record) return
		if (JSON.stringify(record.source) === currentValueString) return
		record.setAll(initialValue)
	}, [!!wire, currentValueString])

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

	if (!wire) return null

	return (
		<Form
			key={id}
			content={content}
			path={path}
			onSubmit={onSubmit}
			submitLabel={submitLabel}
			context={context.addWireFrame({
				view: wire.getViewId(),
				wire: wire.getId(),
			})}
		/>
	)
}

export default DynamicForm
