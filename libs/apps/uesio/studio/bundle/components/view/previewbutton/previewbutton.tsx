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

type ParamMap = Record<string, param.ParamDefinition>

const getParamDefs = (record: wire.WireRecord): ParamMap => {
	const viewDef = record.getFieldValue<string>("uesio/studio.definition")
	const yamlDoc = util.yaml.parse(viewDef)
	const params = util.yaml.getNodeAtPath(["params"], yamlDoc.contents)
	return params?.toJSON() || {}
}

const getFieldsFromParams = (params: ParamMap) =>
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

const getUrlParams = (params: ParamMap, record: wire.WireRecord) => {
	const getParams = new URLSearchParams()
	const hasParams = Object.keys(params).length
	if (!hasParams) return null
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
	return getParams
}

const getRedirectSignal = (
	params: ParamMap,
	record: wire.WireRecord,
	appName: string,
	workspaceName: string,
	viewName: string
) => {
	const urlParams = getUrlParams(params, record)
	return {
		signal: "route/REDIRECT",
		path: `/workspace/${appName}/${workspaceName}/views/${appName}/${viewName}/preview${
			urlParams ? `?${urlParams}` : ""
		}`,
	}
}

const PreviewButton: FunctionComponent<Props> = (props) => {
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
								getRedirectSignal(
									params,
									record,
									appName,
									workspaceName,
									viewName
								),
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
								uesio.signal.run(
									getRedirectSignal(
										params,
										record,
										appName,
										workspaceName,
										viewName
									),
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
