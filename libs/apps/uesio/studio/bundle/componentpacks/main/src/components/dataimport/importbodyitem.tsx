import { FunctionComponent } from "react"
import { definition, styles, collection, component } from "@uesio/ui"

interface Props extends definition.UtilityProps {
	csvOptions: collection.SelectOption[]
	mapping: definition.ImportMapping | undefined
	setMapping: (mapping: definition.ImportMapping) => void
	removeMapping: () => void
	field: collection.Field
}
const CheckboxField = component.getUtility("uesio/io.checkboxfield")
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
				alignItems: "center",
				background: "#f5f5f5",
				marginBottom: "0.5em",
				borderRadius: "0.5em",
				border: "1px solid #eee",
				overflow: "hidden",
				minHeight: "43px",
				cursor: mapping ? "cursor" : "pointer",
			},
			headerItem: {
				padding: "2px",
				alignItems: "center",
			},
		},
		null
	)

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
			{/* <div style={{ opacity: 0.3, fontSize: "0.8em" }}>{index}. </div> */}
			<div
				style={{
					background: "#fff",
					display: "flex",
					alignSelf: "stretch",
					alignItems: "center",
					padding: "0 6px 0 6px",
					minWidth: "200px",
					flex: 1,
					// flex: mapping ? 0 : 1,
				}}
			>
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
				<div
					style={{ opacity: mapping ? 1 : 0.5 }}
					className={classes.headerItem}
				>
					{uesioField}
				</div>
			</div>
			{mapping && (
				<div
					style={{
						display: "flex",
						flex: 1,
						padding: mapping ? "0 6px 0 6px" : 0,
					}}
				>
					<div className={classes.headerItem}>
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
					</div>

					{mapping.type === "IMPORT" && (
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
					{mapping.type === "VALUE" && (
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
			)}
		</div>
	)
}

export default ImportBodyItem
