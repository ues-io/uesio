import { FunctionComponent, useEffect } from "react"
import {
	hooks,
	definition,
	util,
	component,
	param,
	wire,
	collection,
} from "@uesio/ui"

type PreviewDefinition = {
	fieldId: string
}

interface Props extends definition.BaseProps {
	definition: PreviewDefinition
}

const WIRE_NAME = "paramData"

const Form = component.registry.getUtility("uesio/io.form")

const getParamDefs = (
	fieldId: string,
	record: wire.WireRecord | undefined
): Record<string, param.ParamDefinition> => {
	if (!record || !fieldId) return {}
	const viewDef = record.getFieldValue<string>(fieldId)
	const yamlDoc = util.yaml.parse(viewDef)
	const params = util.yaml.getNodeAtPath(["params"], yamlDoc.contents)
	return params?.toJSON() || {}
}

const getFieldsFromParams = (params: Record<string, param.ParamDefinition>) =>
	Object.fromEntries(
		Object.entries(params).map(([key, value]) => {
			const field =
				value.type === "RECORD"
					? {
							label: key,
							required: !!value.required,
							type: "REFERENCE" as const,
							reference: {
								collection: value.collection,
							},
					  }
					: {
							label: key,
							required: !!value.required,
							type: "TEXT" as const,
					  }

			return [`uesio/viewonly.${key}`, field]
		})
	)

const Preview: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const { fieldId } = definition
	const uesio = hooks.useUesio(props)

	const record = context.getRecord()

	const params = getParamDefs(fieldId, record)
	const hasParams = Object.keys(params).length

	const workspaceContext = context.getWorkspace()
	const appName = workspaceContext?.app
	const workspaceName = workspaceContext?.name
	const viewName = record?.getFieldValue<string>("uesio/studio.name")

	if (!workspaceContext) throw new Error("No Workspace Context Provided")

	useEffect(() => {
		if (!hasParams) {
			uesio.signal.run(
				{
					signal: "route/REDIRECT",
					path: `/workspace/${context.getWorkspace()?.app}/${
						context.getWorkspace()?.name
					}/views/${appName}/${viewName}/preview`,
				},
				context
			)
		}
	}, [])

	uesio.wire.useDynamicWire(WIRE_NAME, {
		viewOnly: true,
		fields: getFieldsFromParams(params),
		init: {
			create: true,
		},
	})

	return (
		<Form
			wire={WIRE_NAME}
			context={context}
			submitLabel="Preview"
			onSubmit={(record: wire.WireRecord) => {
				const getParams = new URLSearchParams()
				Object.entries(params).forEach(([key, paramDef]) => {
					const fieldKey = `uesio/viewonly.${key}`
					let value
					if (paramDef.type === "RECORD") {
						value = record.getFieldValue<string>(
							`${fieldKey}->${collection.ID_FIELD}`
						)
					}
					if (paramDef.type === "TEXT") {
						value = record.getFieldValue<string>(fieldKey)
					}
					if (value) getParams.append(key, value)
				})

				uesio.signal.run(
					{
						signal: "route/REDIRECT",
						path: `/workspace/${appName}/${workspaceName}/views/${appName}/${viewName}/preview?${getParams}`,
					},
					context
				)
			}}
		/>
	)
}

export default Preview
