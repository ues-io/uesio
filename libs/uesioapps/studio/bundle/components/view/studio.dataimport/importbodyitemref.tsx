import { FunctionComponent, useEffect, useState } from "react"
import { definition, hooks, component, collection } from "@uesio/ui"

interface Props extends definition.BaseProps {
	handleSelection: (
		csvField: string,
		uesioField: string,
		matchfield?: string
	) => void
	refCollectionId: string | undefined
	csvField: string
	uesioField: string
}

const SelectField = component.registry.getUtility("io.selectfield")
const addBlankSelectOption = collection.addBlankSelectOption

const ImportBodyItemRef: FunctionComponent<Props> = (props) => {
	const { context, refCollectionId, csvField, uesioField, handleSelection } =
		props
	const uesio = hooks.useUesio(props)
	if (!refCollectionId) return null

	const collection = uesio.collection.useCollection(context, refCollectionId)
	if (!collection) return null
	const collectionFields = Object.keys(collection?.source.fields)
	const options = addBlankSelectOption(
		collectionFields.map((key) => ({
			value: key,
			label: key,
		}))
	)

	const [State, setState] = useState<string>("")

	useEffect(() => {
		setState(options[0].value)
	}, [csvField])

	return (
		<SelectField
			context={context}
			value={State}
			label={"Ref. Field:"}
			options={options}
			setValue={(matchfield: string) => {
				setState(matchfield)
				handleSelection(csvField, uesioField, matchfield)
			}}
		/>
	)
}

export default ImportBodyItemRef
