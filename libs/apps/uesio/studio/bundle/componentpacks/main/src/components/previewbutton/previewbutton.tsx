import { FunctionComponent, useState } from "react"
import {
	hooks,
	api,
	collection,
	component,
	wire,
	param,
	definition,
	util,
} from "@uesio/ui"
import { FloatingPortal } from "@floating-ui/react"

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

const getValueForParam = (
	def: param.ParamDefinition,
	record: wire.WireRecord
) => {
	const fieldKey = def.name
	switch (def.type) {
		case "RECORD":
			return (
				record.getFieldValue<string>(
					`${fieldKey}->${collection.ID_FIELD}`
				) || ""
			)
		case "METADATAMULTI": {
			const values = record.getFieldValue<string[]>(fieldKey) || []
			return values.join(",")
		}
		default:
			return record.getFieldValue<string>(fieldKey) || ""
	}
}

const getParamValues = (
	params: param.ParamDefinition[] | undefined,
	record: wire.WireRecord
) => {
	if (!params) return {}
	return Object.fromEntries(
		params.map((def) => [def.name, getValueForParam(def, record)])
	)
}

const getWireFieldFromParamDef = (
	def: param.ParamDefinition
): wire.ViewOnlyField => {
	switch (def.type) {
		case "RECORD":
			return {
				label: def.prompt || def.name,
				required: !!def.required,
				type: "REFERENCE" as const,
				reference: {
					collection: def.collection,
				},
			}
		case "METADATAMULTI":
			return {
				label: def.prompt || def.name,
				required: !!def.required,
				type: "LIST" as const,
			}
		default:
			return {
				label: def.prompt || def.name,
				required: !!def.required,
				type: "TEXT" as const,
			}
	}
}

const getWireFieldsFromParams = (
	params: param.ParamDefinition[] | undefined
) => {
	if (!params) return {}
	return Object.fromEntries(
		params.map((def) => [def.name, getWireFieldFromParamDef(def)])
	)
}

interface FormProps {
	setOpen: (value: boolean) => void
	onSubmit: (record: wire.WireRecord) => void
	params: param.ParamDefinition[]
}

const PreviewForm: definition.UtilityComponent<FormProps> = (props) => {
	const { context, params, setOpen, onSubmit } = props

	const Dialog = component.getUtility("uesio/io.dialog")
	const DynamicForm = component.getUtility("uesio/io.dynamicform")

	if (!params) return null

	return (
		<FloatingPortal>
			<Dialog
				context={context}
				width="400px"
				height="500px"
				onClose={() => setOpen(false)}
				title="Set Preview Parameters"
			>
				<DynamicForm
					id="previewform"
					fields={getWireFieldsFromParams(params)}
					context={context}
					onSubmit={onSubmit}
				/>
			</Dialog>
		</FloatingPortal>
	)
}

const PreviewButton: FunctionComponent<definition.BaseProps> = (props) => {
	const Button = component.getUtility("uesio/io.button")
	const { context } = props

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

	const togglePreview = () => (hasParams ? setOpen(true) : previewHandler())

	hooks.useHotKeyCallback("meta+p", () => {
		togglePreview()
	})

	const previewHandler = (record?: wire.WireRecord) => {
		const urlParams =
			hasParams && record
				? new URLSearchParams(getParamValues(params, record))
				: undefined
		api.signal.run(
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
				<PreviewForm
					params={params}
					onSubmit={previewHandler}
					setOpen={setOpen}
					context={context}
				/>
			)}
		</>
	)
}

export { getParamValues, getWireFieldsFromParams }

export default PreviewButton
