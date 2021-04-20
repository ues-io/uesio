import { FunctionComponent } from "react"
import { definition, component, hooks, metadata } from "@uesio/ui"

type MetadataFieldDefinition = {
	fieldId: string
	metadataType: metadata.MetadataType
	label: string
}

interface Props extends definition.BaseProps {
	definition: MetadataFieldDefinition
}

const Grid = component.registry.getUtility("io.grid")
const SelectField = component.registry.getUtility("io.selectfield")

const MetadataField: FunctionComponent<Props> = (props) => {
	const {
		context,
		definition: { fieldId, label, metadataType },
	} = props
	const uesio = hooks.useUesio(props)
	const record = context.getRecord()
	const wire = context.getWire()
	const view = context.getView()
	const workspaceName = view?.params?.workspacename
	const appName = view?.params?.appname

	if (!wire || !record || !workspaceName || !appName) {
		return null
	}

	const workspaceContext = context.addFrame({
		workspace: {
			name: workspaceName,
			app: appName,
		},
	})

	const collection = wire.getCollection()
	const fieldMetadata = collection.getField(fieldId)
	const mode = context.getFieldMode() || "READ"
	const value = record.getFieldValue(fieldId) as string
	const namespaces = uesio.builder.useAvailableNamespaces(workspaceContext)
	const [namespace, name] = component.path.parseKey(value)
	const metadata = uesio.builder.useMetadataList(
		workspaceContext,
		metadataType,
		namespace
	)

	if (!fieldMetadata) return null

	if (mode === "READ") {
		return <component.Component {...props} componentType="io.field" />
	}

	const options = Object.keys(metadata || {}).map((key) => {
		const [, name] = component.path.parseKey(key)
		return {
			value: name,
			label: name,
		}
	})

	return (
		<Grid
			context={context}
			styles={{
				root: {
					gridTemplateColumns: "1fr 1fr",
					columnGap: "10px",
				},
			}}
		>
			<SelectField
				context={context}
				label={label}
				value={namespace}
				options={[
					{
						value: "",
						label: "<No Value>",
					},
				].concat(
					Object.keys(namespaces || {}).map((key) => ({
						value: key,
						label: key,
					}))
				)}
				setValue={(value: string) => {
					record.update(fieldId, value ? `${value}.` : "")
				}}
			/>
			<SelectField
				context={context}
				label="&nbsp;"
				value={name}
				options={options}
				setValue={(value: string) => {
					record.update(fieldId, `${namespace}.${value}`)
				}}
			/>
		</Grid>
	)
}

export default MetadataField
