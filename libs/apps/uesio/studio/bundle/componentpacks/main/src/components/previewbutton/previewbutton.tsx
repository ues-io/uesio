import { FunctionComponent, useState } from "react"
import { hooks, component, wire, param, definition, util } from "@uesio/ui"

const Button = component.getUtility("uesio/io.button")
const Dialog = component.getUtility("uesio/io.dialog")
const Form = component.getUtility("uesio/io.form")

const WIRE_NAME = "paramData"

const getParamDefs = (record: wire.WireRecord): param.ParamDefinition[] => {
	const viewDef =
		record.getFieldValue<string>("uesio/studio.definition") || ""
	const yamlDoc = util.yaml.parse(viewDef)
	const params = util.yaml.getNodeAtPath(["params"], yamlDoc.contents)
	const paramObj = params?.toJSON() || {}

	return Object.keys(paramObj).map((key) => {
		const value = paramObj[key]
		return {
			...value,
			name: key,
		}
	})
}

const PreviewButton: FunctionComponent<definition.BaseProps> = (props) => {
	const { context } = props
	const uesio = hooks.useUesio(props)

	const record = context.getRecord()
	if (!record) throw new Error("No Record Context Provided")
	const workspaceContext = context.getWorkspace()
	if (!workspaceContext) throw new Error("No Workspace Context Provided")

	const viewName = record.getFieldValue<string>("uesio/studio.name")

	const params = getParamDefs(record)
	const hasParams = Object.keys(params).length

	const appName = workspaceContext.app
	const workspaceName = workspaceContext.name

	const [open, setOpen] = useState<boolean>(false)

	uesio.wire.useDynamicWire(
		open ? WIRE_NAME : "",
		{
			viewOnly: true,
			fields: uesio.wire.getWireFieldsFromParams(params),
			init: {
				create: true,
			},
		},
		context
	)

	const togglePreview = () => (hasParams ? setOpen(true) : previewHandler())

	hooks.useHotKeyCallback("command+p", () => {
		togglePreview()
	})

	const previewHandler = (record?: wire.WireRecord) => {
		const urlParams =
			hasParams && record
				? new URLSearchParams(uesio.wire.getParamValues(params, record))
				: undefined
		uesio.signal.run(
			{
				signal: "route/REDIRECT",
				path: `/workspace/${appName}/${workspaceName}/views/${appName}/${viewName}/preview${
					urlParams ? `?${urlParams}` : ""
				}`,
			},
			context
		)
	}

	return (
		<>
			<Button
				context={context}
				variant="uesio/io.secondary"
				label="Preview"
				onClick={togglePreview}
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
							onSubmit={previewHandler}
						/>
					</Dialog>
				</component.Panel>
			)}
		</>
	)
}

export default PreviewButton
