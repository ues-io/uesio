import { definition, styles, collection, component, wire } from "@uesio/ui"

interface Props {
	csvOptions: wire.SelectOption[]
	mapping: definition.ImportMapping | undefined
	setMapping: (mapping: definition.ImportMapping) => void
	removeMapping: () => void
	field: collection.Field
}

const StyleDefaults = Object.freeze({
	gridItem: ["grid", "grid-cols-3", "items-center", "rounded", "pt-2"],
	itemNameWrapper: [
		"flex",
		"grow",
		"items-center",
		"gap-2",
		"py-2",
		"col-span-1",
	],
	itemOptionsWrapper: [
		"flex",
		"items-center",
		"gap-2",
		"bg-slate-100",
		"border-2",
		"col-span-2",
	],
})

const ImportBodyItem: definition.UtilityComponent<Props> = (props) => {
	const CheckboxField = component.getUtility("uesio/io.checkboxfield")
	const TextField = component.getUtility("uesio/io.textfield")
	const SelectField = component.getUtility("uesio/io.selectfield")
	const { context, csvOptions, setMapping, removeMapping, field, mapping } =
		props

	if (!field) return null
	const uesioField = field.getId()

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	return (
		<div
			className={classes.gridItem}
			onClick={() =>
				!mapping &&
				setMapping({
					...(mapping || {}),
					type: "IMPORT",
				})
			}
		>
			<div className={classes.itemNameWrapper}>
				<CheckboxField
					context={context}
					setValue={() =>
						mapping
							? removeMapping()
							: setMapping({
									...(mapping || {}),
									type: "IMPORT",
								})
					}
					value={!!mapping}
					mode={"EDIT"}
				/>
				{uesioField}
			</div>
			{mapping && (
				<div className={classes.itemOptionsWrapper}>
					<SelectField
						context={context}
						label="Type"
						value={mapping ? mapping.type : ""}
						options={[
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
					{mapping.type === "IMPORT" && (
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
					)}
					{mapping.type === "VALUE" && (
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
					)}
				</div>
			)}
		</div>
	)
}

export default ImportBodyItem
