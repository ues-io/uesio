import { FunctionComponent, useState } from "react"
import { definition, styles, collection, component } from "@uesio/ui"

type DataImportItemDefinition = {
	record: string
	options: collection.SelectOption[]
	selOption: string
}

interface Props extends definition.BaseProps {
	definition: DataImportItemDefinition
	handleSelection: (
		csvField: string,
		uesioField: string,
		matchfield: string
	) => void
	collection: collection.Collection
}

const initialState = { display: false, options: [] }
interface State {
	display: boolean
	options: collection.SelectOption[]
}

const TextField = component.registry.getUtility("io.textfield")
const SelectField = component.registry.getUtility("io.selectfield")

const ImportBodyItem: FunctionComponent<Props> = (props) => {
	const { context, definition, handleSelection, collection } = props
	const { record, options, selOption } = definition

	const classes = styles.useUtilityStyles(
		{
			gridItem: {
				display: "flex",
				justifyContent: "start",
			},
			headerItem: { width: "200px", paddingRight: "10px" },
		},
		null
	)

	const handleReference = (value: string): State => {
		const field = collection.getField(value)
		if (field?.getType() === "REFERENCE") {
			const refCollectionId = field.source.referencedCollection
			if (refCollectionId) {
				const refCollection =
					collection.getRefCollection(refCollectionId)

				const refCollectionFields =
					refCollection && Object.keys(refCollection?.source.fields)

				if (refCollectionFields) {
					return {
						display: true,
						options: refCollectionFields.map((key) => ({
							value: key,
							label: key,
						})),
					}
				}
			}
		}
		return { display: false, options: [] }
	}

	const [selValue, setSelValue] = useState(selOption)
	const [refField, setrefField] = useState<State>(initialState)

	return (
		<div className={classes.gridItem}>
			<div className={classes.headerItem}>
				<TextField
					context={context}
					label={"csv:"}
					value={record}
					mode={"READ"}
				/>
			</div>
			<div className={classes.headerItem}>
				<SelectField
					context={context}
					label={"uesio:"}
					value={selValue}
					options={options}
					setValue={(value: string) => {
						setrefField(handleReference(value))
						handleSelection(record, value, "")
						setSelValue(value)
					}}
				/>
			</div>
			{refField.display && (
				<div className={classes.headerItem}>
					<SelectField
						context={context}
						label={"Ref. Field:"}
						//value={selValue}
						options={refField.options}
						setValue={(value: string) => {
							handleSelection(record, selValue, value)
						}}
					/>
				</div>
			)}
		</div>
	)
}

export default ImportBodyItem
