import { FunctionComponent, useState } from "react"
import {
	hooks,
	definition,
	component,
	wire,
	collection,
	param,
	util,
} from "@uesio/ui"

type PreviewDefinition = {
	fieldId: string
}

interface Props extends definition.BaseProps {
	definition: PreviewDefinition
}

const Button = component.registry.getUtility("uesio/io.button")
const Dialog = component.registry.getUtility("uesio/io.dialog")
const Form = component.registry.getUtility("uesio/io.form")

const WIRE_NAME = "paramData"

const getParamDefs = (
	record: wire.WireRecord
): Record<string, param.ParamDefinition> => {
	const viewDef = record.getFieldValue<string>("uesio/studio.definition")
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

const PreviewButton: FunctionComponent<Props> = (props) => {
	const { context } = props
	const uesio = hooks.useUesio(props)

	const record = context.getRecord()
	if (!record) throw new Error("No Record Context Provided")
	const workspaceContext = context.getWorkspace()
	if (!workspaceContext) throw new Error("No Workspace Context Provided")

	const params = getParamDefs(record)
	const hasParams = Object.keys(params).length

	const appName = workspaceContext.app
	const workspaceName = workspaceContext.name
	const viewName = record?.getFieldValue<string>("uesio/studio.name")

	const [open, setOpen] = useState<boolean>(false)

	uesio.wire.useDynamicWire(open ? WIRE_NAME : "", {
		viewOnly: true,
		fields: getFieldsFromParams(params),
		init: {
			create: true,
		},
	})

	return (
		<>
			<Button
				context={context}
				variant="uesio/io.secondary"
				label="Preview"
				onClick={() =>
					hasParams
						? setOpen(true)
						: uesio.signal.run(
								{
									signal: "route/REDIRECT",
									path: `/workspace/${appName}/${workspaceName}/views/${appName}/${viewName}/preview`,
								},
								context
						  )
				}
			/>
			{open && (
				<component.Panel key="previewpanel" context={context}>
					<Dialog
						context={context}
						width="400px"
						height="500px"
						onClose={() => setOpen(false)}
						title="Set Preview Parameters"
					>
						<Form
							wire={WIRE_NAME}
							context={context}
							submitLabel="Preview"
							onSubmit={(record: wire.WireRecord) => {
								const getParams = new URLSearchParams()
								Object.entries(params).forEach(
									([key, paramDef]) => {
										const fieldKey = `uesio/viewonly.${key}`
										let value
										if (paramDef.type === "RECORD") {
											value =
												record.getFieldValue<string>(
													`${fieldKey}->${collection.ID_FIELD}`
												)
										}
										if (paramDef.type === "TEXT") {
											value =
												record.getFieldValue<string>(
													fieldKey
												)
										}
										if (value) getParams.append(key, value)
									}
								)

								uesio.signal.run(
									{
										signal: "route/REDIRECT",
										path: `/workspace/${appName}/${workspaceName}/views/${appName}/${viewName}/preview?${getParams}`,
									},
									context
								)
							}}
						/>
					</Dialog>
				</component.Panel>
			)}
		</>
	)
}

export default PreviewButton
