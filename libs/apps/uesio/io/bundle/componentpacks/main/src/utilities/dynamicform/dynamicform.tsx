import { api, wire, definition } from "@uesio/ui"

import Form from "../form/form"

interface FormProps extends definition.UtilityProps {
	path: string
	submitLabel?: string
	onSubmit?: (record: wire.WireRecord) => void
	fields: Record<string, wire.ViewOnlyField>
	content: definition.DefinitionList
}

const DynamicForm: definition.UtilityComponent<FormProps> = (props) => {
	const { context, onSubmit, submitLabel, content, id, fields, path } = props

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
