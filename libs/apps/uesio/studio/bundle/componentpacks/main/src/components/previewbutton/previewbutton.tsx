import { useRef, useState } from "react"
import {
	hooks,
	api,
	collection,
	component,
	wire,
	param,
	definition,
	platform,
} from "@uesio/ui"
import { FloatingPortal } from "@floating-ui/react"

type PreviewButtonDefinition = {
	view: string
	label: string
	buildMode: boolean
	hotkey: string
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
		// TODO: SELECT properties won't work until we load Select Lists
		// when initializing View Only wires/View Only Fields.
		// Currently any View Only SELECT field is expected to have its options defined
		// inline on the field definition, so we can't reference the options.
		// case "SELECT":
		// 	return {
		// 		label: def.prompt || def.name,
		// 		required: !!def.required,
		// 		type: "SELECT" as const,

		// 		selectlist: def.selectList,
		// 	}
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
	onSubmit: (wire: wire.Wire | undefined) => void
	params: param.ParamDefinition[] | undefined
	label: string
}

const PreviewForm: definition.UtilityComponent<FormProps> = (props) => {
	const { context, params, setOpen, onSubmit, label } = props

	const Dialog = component.getUtility("uesio/io.dialog")
	const DynamicForm = component.getUtility("uesio/io.dynamicform")
	const Group = component.getUtility("uesio/io.group")
	const Button = component.getUtility("uesio/io.button")

	const wireRef = useRef<wire.Wire | undefined>()

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
					wireRef={wireRef}
				/>
				<Group justifyContent="end" context={context}>
					<Button
						context={context}
						variant="uesio/io.primary"
						label={label}
						onClick={() => onSubmit(wireRef.current)}
					/>
				</Group>
			</Dialog>
		</FloatingPortal>
	)
}

const PreviewButton: definition.UC<PreviewButtonDefinition> = (props) => {
	const Button = component.getUtility("uesio/io.button")
	const { context, definition } = props
	const { label, view, hotkey, buildMode } = definition

	const record = context.getRecord()
	if (!record) throw new Error("No Record Context Provided")
	const workspaceContext = context.getWorkspace()
	if (!workspaceContext) throw new Error("No Workspace Context Provided")

	const appName = workspaceContext.app
	const workspaceName = workspaceContext.name

	const [viewNamespace, viewName] = component.path.parseKey(
		context.mergeString(view)
	)

	const [open, setOpen] = useState<boolean>(false)
	const [params, setParams] = useState<param.ParamDefinition[]>()

	const togglePreview = async () => {
		const result = await platform.platform.getViewParams(
			context,
			viewNamespace,
			viewName
		)
		if (result.length) {
			setOpen(true)
			setParams(result)
		} else {
			previewHandler()
		}
	}

	hooks.useHotKeyCallback(
		hotkey,
		() => {
			togglePreview()
		},
		!!hotkey
	)

	const previewHandler = (wire?: wire.Wire) => {
		const record = wire?.getFirstRecord()
		const urlParams =
			params?.length && record
				? new URLSearchParams(getParamValues(params, record))
				: undefined

		const mode = buildMode ? "edit" : "preview"
		api.signal.run(
			{
				signal: "route/REDIRECT",
				path: `/workspace/${appName}/${workspaceName}/views/${viewNamespace}/${viewName}/${mode}${
					urlParams ? `?${urlParams}` : ""
				}`,
			},
			context
		)
	}

	return (
		<>
			<Button
				id={api.component.getComponentIdFromProps(props)}
				context={context}
				variant="uesio/io.secondary"
				label={label}
				onClick={togglePreview}
			/>
			{open && (
				<PreviewForm
					params={params}
					onSubmit={previewHandler}
					setOpen={setOpen}
					context={context}
					label={label}
				/>
			)}
		</>
	)
}

export { getParamValues, getWireFieldsFromParams }

export default PreviewButton
