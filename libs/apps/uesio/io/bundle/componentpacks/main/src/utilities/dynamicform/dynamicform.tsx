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
	currentValue?: wire.PlainWireRecord
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
		currentValue,
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

	useEffect(() => {
		if (!currentValue || !wire) return
		const record = wire.getFirstRecord()
		if (!record) return
		record.setAll(currentValue)
	}, [!!wire, JSON.stringify(currentValue)])

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
