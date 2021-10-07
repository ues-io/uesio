import { FunctionComponent, useState } from "react"
import { definition, styles, collection, component } from "@uesio/ui"
import ImportBodyItemRef from "./importbodyitemref"

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
		matchfield?: string
	) => void
	collection: collection.Collection
}

const initialState = { display: false, refCollection: "" }
interface State {
	display: boolean
	refCollection: string
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
				return {
					display: true,
					refCollection: refCollectionId,
				}
			}
		}
		return { display: false, refCollection: "" }
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
						handleSelection(record, value)
						setSelValue(value)
					}}
				/>
			</div>
			{refField.display && (
				<div className={classes.headerItem}>
					<ImportBodyItemRef
						handleSelection={handleSelection}
						refCollectionId={refField.refCollection}
						csvField={record}
						uesioField={selValue}
						context={context}
					/>
				</div>
			)}
		</div>
	)
}

export default ImportBodyItem
