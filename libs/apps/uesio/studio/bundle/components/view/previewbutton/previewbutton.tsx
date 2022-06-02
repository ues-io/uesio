import { FunctionComponent, useState } from "react"
import { hooks, component, wire, param, definition, util } from "@uesio/ui"

const Button = component.registry.getUtility("uesio/io.button")
const Dialog = component.registry.getUtility("uesio/io.dialog")
const Form = component.registry.getUtility("uesio/io.form")

const getParamDefs = (record: wire.WireRecord): param.ParamDefinitionMap => {
	const viewDef = record.getFieldValue<string>("uesio/studio.definition")
	const yamlDoc = util.yaml.parse(viewDef)
	const params = util.yaml.getNodeAtPath(["params"], yamlDoc.contents)
	return params?.toJSON() || {}
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
	const fields = uesio.wire.getFieldsFromParams(params)
	const viewId = context.getRecord()?.getFieldValue("uesio/core.id")
	const WIRE_NAME = `${viewId}/paramData`

	uesio.wire.useDynamicWire(open ? WIRE_NAME : "", {
		viewOnly: true,
		fields,
		init: {
			create: true,
		},
		defaults: Object.keys(fields).map((field) => {
			const localStorageKey = `${viewId}-paramData-${field}`
			const savedValue = localStorage.getItem(localStorageKey)
			return {
				field,
				valueSource: "VALUE",
				value: savedValue ? JSON.parse(savedValue) : "",
			}
		}),
	})

	const previewHandler = (record?: wire.WireRecord) => {
		const urlParams =
			hasParams && record
				? new URLSearchParams(uesio.wire.getParamValues(params, record))
				: undefined

		urlParams?.forEach((value, key) => {
			const localStorageKey = `${viewId}-paramData-uesio/viewonly.${key}`
			value
				? localStorage.setItem(localStorageKey, JSON.stringify(value))
				: localStorage.removeItem(localStorageKey)
		})
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
				onClick={() => (hasParams ? setOpen(true) : previewHandler())}
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
