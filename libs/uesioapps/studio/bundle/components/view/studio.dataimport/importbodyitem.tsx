import { FunctionComponent, useState } from "react"
import { definition, styles, collection, component } from "@uesio/ui"
import ImportBodyItemRef from "./importbodyitemref"
import ImportBodyItemHardCoded from "./importbodyitemhardcoded"

interface Props extends definition.BaseProps {
	csvOptions: collection.SelectOption[]
	handleSelection: (
		columnname: string,
		uesioField: string,
		matchfield?: string
	) => void
	field: collection.Field | undefined
	match: string
}

const TextField = component.registry.getUtility("io.textfield")
const SelectField = component.registry.getUtility("io.selectfield")

const ImportBodyItem: FunctionComponent<Props> = (props) => {
	const { context, csvOptions, handleSelection, field, match } = props

	if (!field) return null
	const uesioField = field?.getId()

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

	const [selValue, setSelValue] = useState(match)
	return (
		<div className={classes.gridItem}>
			<div className={classes.headerItem}>
				<TextField
					context={context}
					label={"uesio:"}
					value={uesioField}
					mode={"READ"}
				/>
			</div>
			<div className={classes.headerItem}>
				<SelectField
					context={context}
					label={"along with:"}
					value={selValue}
					options={csvOptions}
					setValue={(value: string) => {
						handleSelection(value, uesioField)
						setSelValue(value)
					}}
				/>
			</div>
			{field &&
				field.getType() === "REFERENCE" &&
				selValue !== "" &&
				selValue !== "hardcoded" && (
					<div className={classes.headerItem}>
						<ImportBodyItemRef
							handleSelection={handleSelection}
							refCollectionId={field.source.referencedCollection}
							columnname={selValue}
							uesioField={uesioField}
							context={context}
						/>
					</div>
				)}
			{selValue === "hardcoded" && (
				<div className={classes.headerItem}>
					<ImportBodyItemHardCoded
						handleSelection={handleSelection}
						columnname={selValue}
						uesioField={uesioField}
						context={context}
					/>
				</div>
			)}
		</div>
	)
}

export default ImportBodyItem
