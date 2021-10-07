import { FunctionComponent, useEffect } from "react"
import { definition, hooks, component } from "@uesio/ui"

interface Props extends definition.BaseProps {
	handleSelection: (
		csvField: string,
		uesioField: string,
		matchfield?: string
	) => void
	refCollectionId: string
	csvField: string
	uesioField: string
}

const SelectField = component.registry.getUtility("io.selectfield")

const ImportBodyItemRef: FunctionComponent<Props> = (props) => {
	const { context, refCollectionId, csvField, uesioField, handleSelection } =
		props
	const uesio = hooks.useUesio(props)

	const collection = uesio.collection.useCollection(context, refCollectionId)
	if (!collection) return null
	const collectionFields = Object.keys(collection?.source.fields)
	const options = collectionFields.map((key) => ({
		value: key,
		label: key,
	}))

	useEffect(() => {
		handleSelection(csvField, uesioField, options[0].value)
	}, [])

	return (
		<SelectField
			context={context}
			label={"Ref. Field:"}
			options={options}
			setValue={(matchfield: string) => {
				handleSelection(csvField, uesioField, matchfield)
			}}
		/>
	)
}

export default ImportBodyItemRef
