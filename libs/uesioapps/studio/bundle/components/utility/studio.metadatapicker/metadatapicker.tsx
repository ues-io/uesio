import { FunctionComponent, useState, useEffect } from "react"
import { definition, component, hooks, metadata, collection } from "@uesio/ui"

interface MetadataPickerProps extends definition.UtilityProps {
	value: string
	setValue: (value: string) => void
	metadataType: metadata.MetadataType
	label: string
	grouping?: string
	defaultNamespace?: string
}

const Grid = component.registry.getUtility("io.grid")
const SelectField = component.registry.getUtility("io.selectfield")

const addBlankSelectOption = collection.addBlankSelectOption
type UseNamespaceInputs = {
	metadataType: string
	defaultNamespace: string | undefined
	currentNamespace: string
	setValue: (arg1: string) => void
}

const useNamespace = ({
	metadataType,
	defaultNamespace,
	currentNamespace,
	setValue,
}: UseNamespaceInputs) => {
	const isVariantLogic = metadataType === "COMPONENTVARIANT" && true
	const initialValue = !isVariantLogic
		? defaultNamespace || currentNamespace
		: ""

	const [namespace, setNamespace] = useState(initialValue)

	useEffect(() => {
		if (isVariantLogic) return setValue(`${namespace}.`)
	}, [namespace])

	return { namespace, setNamespace }
}

const MetadataPicker: FunctionComponent<MetadataPickerProps> = (props) => {
	const {
		value,
		setValue,
		label,
		metadataType,
		context,
		grouping,
		defaultNamespace,
	} = props
	const uesio = hooks.useUesio(props)
	const namespaces = uesio.builder.useAvailableNamespaces(context)

	const [currentNamespace, name] = component.path.parseKey(value)

	const { namespace, setNamespace } = useNamespace({
		metadataType,
		defaultNamespace,
		currentNamespace,
		setValue,
	})

	const metadata = () => {
		const isVariantLogic = metadataType === "COMPONENTVARIANT"
		const variants = Object.values(context.getComponentVariants()).filter(
			(el: any) => el.namespace === namespace
		)
		console.log("variants", variants)
		return !isVariantLogic
			? uesio.builder.useMetadataList(
					context,
					metadataType,
					namespace,
					grouping
			  )
			: {
					option1: {
						name: "one",
					},
					option2: {
						name: "two",
					},
			  }
	}

	console.log("metadata", metadata())

	const getMetadataName = (key: string) => {
		const isVariantLogic = metadataType === "COMPONENTVARIANT" && true
		if (isVariantLogic) {
			return key
		}
		if (metadataType === "COMPONENTVARIANT") {
			const [, , , name] = component.path.parseVariantKey(key)
			return name
		}
		const [, name] = component.path.parseKey(key)
		return name
	}

	const nbsp = "\u00A0"

	return (
		<Grid
			context={context}
			styles={{
				root: {
					gridTemplateColumns: defaultNamespace ? "1fr" : "1fr 1fr",
					columnGap: "10px",
				},
			}}
		>
			{!defaultNamespace && (
				<SelectField
					context={context}
					label={label}
					value={namespace}
					options={addBlankSelectOption(
						Object.keys(namespaces || {}).map((key) => ({
							value: key,
							label: key,
						}))
					)}
					setValue={(value: string) => setNamespace(value)}
				/>
			)}
			<SelectField
				context={context}
				label={defaultNamespace ? label : label && nbsp}
				value={name}
				options={addBlankSelectOption(
					Object.keys(metadata() || {}).map((key) => {
						const name = getMetadataName(key)
						return {
							value: name,
							label: name,
						}
					})
				)}
				setValue={(value: string) => {
					setValue(`${namespace}.${value}`)
				}}
			/>
		</Grid>
	)
}

MetadataPicker.displayName = "MetadataPicker"

export default MetadataPicker
