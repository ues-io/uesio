import { FunctionComponent, useEffect } from "react"
import { definition, styles, collection, hooks, component } from "@uesio/ui"

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

	console.log("refCollectionId", refCollectionId)
	console.log("XXX", { csvField, uesioField })

	const collection = uesio.collection.useCollection(context, refCollectionId)
	if (!collection) return null
	const collectionFields = Object.keys(collection?.source.fields)
	const options = collectionFields.map((key) => ({
		value: key,
		label: key,
	}))

	useEffect(() => {
		//This select is mandatory, so this forces the first option
		handleSelection(csvField, uesioField, options[0].value)
	}, [])

	return (
		<SelectField
			context={context}
			label={"Ref. Field:"}
			//value={selValue}
			options={options}
			setValue={(matchfield: string) => {
				handleSelection(csvField, uesioField, matchfield)
			}}
		/>
	)
}

export default ImportBodyItemRef
