import { useRef, useState } from "react"
import {
	api,
	collection,
	component,
	context,
	definition,
	hooks,
	metadata,
	param,
	platform,
	wire,
} from "@uesio/ui"
import { FloatingPortal } from "@floating-ui/react"
const {
	platform: { getViewParams, getRouteParams },
} = platform

type PreviewButtonDefinition = {
	view?: metadata.MetadataKey
	route?: metadata.MetadataKey
	label: string
	icon?: string
	buildMode: boolean
	buttonVariant?: metadata.MetadataKey
	hotkey: string
}

const getValueForParam = (
	def: param.ParamDefinition,
	context: context.Context,
	record?: wire.WireRecord
) => {
	const fieldKey = def.name
	const fieldKeyMerge = "${" + fieldKey + "}"
	switch (def.type) {
		case "RECORD":
			return (
				record?.getFieldValue<string>(
					`${fieldKey}->${collection.ID_FIELD}`
				) ??
				context.mergeString(fieldKeyMerge) ??
				""
			)
		case "MULTIMETADATA": {
			const values = record?.getFieldValue<string[]>(fieldKey) || []
			return values.join(",")
		}
		default:
			return (
				record?.getFieldValue<string>(fieldKey) ??
				context.mergeString(fieldKeyMerge) ??
				""
			)
	}
}

const getParamValues = (
	params: param.ParamDefinition[] | undefined,
	context: context.Context,
	record?: wire.WireRecord
) => {
	if (!params) return {}
	return Object.fromEntries(
		params.map((def) => [def.name, getValueForParam(def, context, record)])
	)
}

const getWireFieldFromParamDef = (
	def: param.ParamDefinition
): wire.ViewOnlyField => {
	const baseField = {
		label: def.prompt || def.label || def.name,
		required: !!def.required,
		default: def.default,
		type: def.type || "TEXT",
	}
	switch (def.type) {
		case "RECORD":
			return {
				...baseField,
				type: "REFERENCE" as const,
				reference: {
					collection: def.collection,
				},
			}
		case "METADATA":
		case "MULTIMETADATA":
			return {
				...baseField,
				type: def.type,
				metadata: {
					type: def.metadataType,
					grouping: def.grouping,
				},
			}
		case "CHECKBOX":
			return {
				...baseField,
				type: def.type,
			}
		case "SELECT":
			return {
				...baseField,
				type: def.type,
				selectlist: {
					name: def.selectList,
				},
			}
		case "LONGTEXT":
			return {
				...baseField,
				type: def.type,
			}
		case "NUMBER":
			return {
				...baseField,
				type: def.type,
			}
		default:
			return {
				...baseField,
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

const getInitialValueFromParams = (
	params: param.ParamDefinition[] | undefined
) => {
	if (!params || !params.length) return {}
	return Object.fromEntries(
		params
			.filter((def) => def.default !== undefined)
			.map((def) => [def.name, def.default])
	)
}

interface FormProps {
	setOpen: (value: boolean) => void
	onSubmit: (wire: wire.Wire | undefined) => void
	params: param.ParamDefinition[] | undefined
	label: string
}

const PreviewForm: definition.UtilityComponent<FormProps> = (props) => {
	const {
		context,
		params,
		setOpen,
		onSubmit,
		label,
		id = "previewform",
	} = props

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
				actions={
					<Group justifyContent="end" context={context}>
						<Button
							context={context}
							variant={"uesio/appkit.primary"}
							id={`launch-preview`}
							label={label}
							onClick={() => onSubmit(wireRef.current)}
						/>
					</Group>
				}
			>
				<DynamicForm
					id={id}
					fields={getWireFieldsFromParams(params)}
					initialValue={getInitialValueFromParams(params)}
					context={context}
					wireRef={wireRef}
				/>
			</Dialog>
		</FloatingPortal>
	)
}

const PreviewButton: definition.UC<PreviewButtonDefinition> = (props) => {
	const Button = component.getUtility("uesio/io.button")
	const Icon = component.getUtility("uesio/io.icon")
	const { context, definition } = props
	const {
		label,
		icon,
		view,
		route,
		hotkey,
		buildMode,
		buttonVariant = "uesio/appkit.secondary",
	} = definition

	const record = context.getRecord()
	if (!record) throw new Error("No Record Context Provided")
	const workspaceContext = context.getWorkspace()
	if (!workspaceContext) throw new Error("No Workspace Context Provided")

	const appName = workspaceContext.app
	const workspaceName = workspaceContext.name

	let viewNamespace: string, viewName: string, routeKey: string

	if (view) {
		;[viewNamespace, viewName] = component.path.parseKey(
			context.mergeString(view)
		)
	} else if (route) {
		routeKey = context.mergeString(route.replace(".", "/"))
	} else {
		throw new Error("No View or Route Provided")
	}

	const [open, setOpen] = useState<boolean>(false)
	const [params, setParams] = useState<param.ParamDefinition[]>()

	const togglePreview = async () => {
		let result
		if (viewNamespace && viewName) {
			result = await getViewParams(context, viewNamespace, viewName)
		} else {
			result = await getRouteParams(context, routeKey)
		}

		if (result && result.length) {
			setOpen(true)
			setParams(result)
		} else {
			previewHandler(context)
		}
	}

	hooks.useHotKeyCallback(
		hotkey,
		() => {
			togglePreview()
		},
		!!hotkey
	)

	const previewHandler = (context: context.Context, wire?: wire.Wire) => {
		const record = context.getRecord(wire?.getId())
		const urlParams = params?.length
			? new URLSearchParams(getParamValues(params, context, record))
			: undefined

		const mode = buildMode ? "edit" : "preview"
		const prefix = `/workspace/${appName}/${workspaceName}`
		const queryString = urlParams ? `?${urlParams}` : ""
		const path = `${prefix}/${
			routeKey
				? `r/${routeKey}`
				: `views/${viewNamespace}/${viewName}/${mode}`
		}${queryString}`
		api.signal.run(
			{
				signal: "route/REDIRECT",
				path,
			},
			context
		)
	}

	return (
		<>
			<Button
				id={api.component.getComponentIdFromProps(props)}
				icon={icon ? <Icon context={context} icon={icon} /> : undefined}
				context={context}
				variant={buttonVariant}
				label={label}
				onClick={togglePreview}
			/>
			{open && (
				<PreviewForm
					params={params}
					onSubmit={(wire: wire.Wire) =>
						previewHandler(context, wire)
					}
					id={api.component.getComponentIdFromProps(props)}
					setOpen={setOpen}
					context={context}
					label={label}
				/>
			)}
		</>
	)
}

export { getInitialValueFromParams, getParamValues, getWireFieldsFromParams }

export default PreviewButton
