import { FunctionComponent } from "react"
import { definition, styles, collection, component } from "@uesio/ui"
import ImportBodyItemRef from "./importbodyitemref"

interface Props extends definition.BaseProps {
	csvOptions: collection.SelectOption[]
	mapping: definition.ImportMapping | undefined
	setMapping: (mapping: definition.ImportMapping) => void
	removeMapping: () => void
	field: collection.Field
}

const TextField = component.registry.getUtility("uesio/io.textfield")
const SelectField = component.registry.getUtility("uesio/io.selectfield")

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
			headerItem: { width: "200px", paddingRight: "10px" },
		},
		null
	)

	return (
		<div className={classes.gridItem}>
			<div className={classes.headerItem}>
				<TextField
					context={context}
					label="Field"
					value={uesioField}
					mode="READ"
				/>
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
				<>
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
					{field.getType() === "REFERENCE" && (
						<div className={classes.headerItem}>
							<ImportBodyItemRef
								setMapping={setMapping}
								mapping={mapping}
								field={field}
								context={context}
							/>
						</div>
					)}
				</>
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
