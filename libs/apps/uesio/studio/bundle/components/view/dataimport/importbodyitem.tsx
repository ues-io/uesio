import { FunctionComponent } from "react"
import { definition, styles, collection, component } from "@uesio/ui"

interface Props extends definition.BaseProps {
	csvOptions: collection.SelectOption[]
	mapping: definition.ImportMapping | undefined
	setMapping: (mapping: definition.ImportMapping) => void
	removeMapping: () => void
	field: collection.Field
}

const TextField = component.getUtility("uesio/io.textfield")
const SelectField = component.getUtility("uesio/io.selectfield")

const ImportBodyItem: FunctionComponent<Props> = (props) => {
	const { context, csvOptions, setMapping, removeMapping, field, mapping } =
		props

	if (!field) return null
	const uesioField = field.getId()

	const classes = styles.useUtilityStyles(
		{
			gridItem: {
				display: "flex",
				justifyContent: "start",
			},
			headerItem: { width: "200px", padding: "2px" },
		},
		null
	)

	return (
		<div className={classes.gridItem}>
			<div className={classes.headerItem}>
				<TextField context={context} value={uesioField} mode="READ" />
			</div>
			<div className={classes.headerItem}>
				<SelectField
					context={context}
					label="Type"
					value={mapping ? mapping.type : ""}
					options={[
						{
							value: "",
							label: "Do Not Import",
						},
						{
							value: "IMPORT",
							label: "Map Column",
						},
						{
							value: "VALUE",
							label: "Specify Value",
						},
					]}
					setValue={(value: "IMPORT" | "VALUE") => {
						value
							? setMapping({
									...(mapping || {}),
									type: value,
							  })
							: removeMapping()
					}}
				/>
			</div>
			{mapping && mapping.type === "IMPORT" && (
				<div className={classes.headerItem}>
					<SelectField
						context={context}
						label={"Column"}
						value={mapping?.columnname}
						options={csvOptions}
						setValue={(value: string) => {
							setMapping({
								...mapping,
								columnname: value,
							})
						}}
					/>
				</div>
			)}
			{mapping && mapping.type === "VALUE" && (
				<div className={classes.headerItem}>
					{
						<TextField
							context={context}
							label={"Value"}
							value={mapping?.value}
							mode={"EDIT"}
							setValue={(value: string) => {
								setMapping({
									...mapping,
									value,
								})
							}}
						/>
					}
				</div>
			)}
		</div>
	)
}

export default ImportBodyItem
