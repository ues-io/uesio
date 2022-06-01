import { FunctionComponent, useState } from "react"
import { hooks, component, wire, param, definition, util } from "@uesio/ui"

const Button = component.registry.getUtility("uesio/io.button")
const Dialog = component.registry.getUtility("uesio/io.dialog")
const Form = component.registry.getUtility("uesio/io.form")

const WIRE_NAME = "paramData"

const getParamDefs = (record: wire.WireRecord): param.ParamDefinitionMap => {
	const viewDef = record.getFieldValue<string>("uesio/studio.definition")
	const yamlDoc = util.yaml.parse(viewDef)
	const params = util.yaml.getNodeAtPath(["params"], yamlDoc.contents)
	return params?.toJSON() || {}
}

type PreviewButtonDefinition = {
	build: boolean
}

interface Props extends definition.BaseProps {
	definition: PreviewButtonDefinition
}

const PreviewButton: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const build = definition.build
	const label = build ? "Build" : "Preview"

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

	uesio.wire.useDynamicWire(open ? WIRE_NAME : "", {
		viewOnly: true,
		fields: uesio.wire.getFieldsFromParams(params),
		init: {
			create: true,
		},
	})

	const previewHandler = (record?: wire.WireRecord) => {
		const urlParams =
			hasParams && record
				? new URLSearchParams(uesio.wire.getParamValues(params, record))
				: undefined
		uesio.signal.run(
			{
				signal: "route/REDIRECT",
				path: `/workspace/${appName}/${workspaceName}/views/${appName}/${viewName}/${
					build ? "edit" : "preview"
				}${urlParams ? `?${urlParams}` : ""}`,
			},
			context
		)
	}

	return (
		<>
			<Button
				context={context}
				variant="uesio/io.secondary"
				label={label}
				onClick={() => (hasParams ? setOpen(true) : previewHandler())}
			/>
			{open && (
				<component.Panel key="previewpanel" context={context}>
					<Dialog
						context={context}
						width="400px"
						height="500px"
						onClose={() => setOpen(false)}
						title={`Set ${label} Parameters`}
					>
						<Form
							wire={WIRE_NAME}
							context={context}
							submitLabel={label}
							onSubmit={previewHandler}
						/>
					</Dialog>
				</component.Panel>
			)}
		</>
	)
}

export default PreviewButton
