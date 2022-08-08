import { Fragment, FunctionComponent } from "react"

import { styles, component, definition, hooks, builder } from "@uesio/ui"

const TitleBar = component.getUtility("uesio/io.titlebar")
const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")
const SelectField = component.getUtility("uesio/io.selectfield")

const ColumnSection: FunctionComponent<builder.SectionRendererProps> = (
	props
) => {
	const { path, context, valueAPI } = props
	const uesio = hooks.useUesio(props)
	const viewDefId = uesio.getViewDefId()

	if (!viewDefId) return null
	const columns = valueAPI.get(
		`${path}["columns"]`
	) as definition.DefinitionList

	const wireId = valueAPI.get(`${path}["wire"]`)
	const fieldsDef = valueAPI.get(
		`["wires"]["${wireId}"]["fields"]`
	) as definition.DefinitionMap

	type Field = [string, null | { fields: { [key: string]: Field } }]

	const getFields = (field: Field): string | string[] => {
		const [key, value] = field
		if (!value) return key
		return Object.entries(value.fields)
			.map(([key2, value2]) => [`${key}->${key2}`, value2])
			.flatMap((el) => getFields(el as Field))
	}

	const fieldSelectOptions = Object.entries(fieldsDef)
		.flatMap((el) => getFields(el as Field))
		.map((el) => ({ value: el, label: el }))

	const moveButtonClasses = styles.useStyles(
		{
			root: {
				padding: "0 0.75em",
				opacity: 0.6,
				transition: "all 0.3s ease",
				"&:hover": {
					opacity: 1,
				},
			},
			label: {},
			selected: {},
			icon: {},
		},
		props
	)
	return (
		<>
			<TitleBar
				variant="uesio/studio.propsubsection"
				title={""}
				context={context}
				actions={
					<Button
						context={context}
						variant="uesio/studio.actionbutton"
						icon={
							<Icon
								context={context}
								icon="add"
								variant="uesio/studio.actionicon"
							/>
						}
						label="New Column"
						onClick={() => {
							valueAPI.add((path || "") + ["columns"], {
								["uesio/io.column"]: {
									field: "",
								},
							})
						}}
					/>
				}
			/>

			{/* Loop over columns */}
			<div style={{ padding: "5px" }}>
				{columns.map((column, i) => {
					const localPath = `${path}["columns"]["${i}"]["uesio/io.column"]`
					return (
						<Fragment key={i}>
							<div
								style={{
									display: "flex",
									padding: "0.5em 8px",
									alignItems: "center",
									margin: "0.5em 0",
									borderRadius: "4px",
									border: "1px solid #eee",
								}}
							>
								<span
									style={{
										fontSize: "0.8em",
										opacity: 0.8,
									}}
								>
									{i}
								</span>
								<div
									style={{
										alignItems: "center",
										justifyContent: "center",
										display: "flex",
										flexFlow: "column",
									}}
								>
									{/* Move Up */}
									<Button
										classes={moveButtonClasses}
										context={context}
										disabled={i === 0}
										variant="uesio/studio.actionbutton"
										icon={
											<Icon
												context={context}
												icon="expand_less"
												variant="uesio/studio.actionicon"
											/>
										}
										onClick={() => {
											const newIndex =
												i - 1 < 0 ? 0 : i - 1
											newIndex !== i &&
												uesio.builder.moveDefinition(
													`["viewdef"]["${viewDefId}"]${path}["columns"]["${i}"]`,
													`["viewdef"]["${viewDefId}"]${path}["columns"]["${newIndex}"]`
												)
										}}
									/>
									{/* Move Down */}
									<Button
										classes={moveButtonClasses}
										context={context}
										variant="uesio/studio.actionbutton"
										disabled={i + 1 >= columns.length - 1}
										icon={
											<Icon
												context={context}
												icon="expand_more"
												variant="uesio/studio.actionicon"
											/>
										}
										onClick={() => {
											const newIndex =
												i + 1 < columns.length - 1
													? i + 1
													: null
											newIndex &&
												uesio.builder.moveDefinition(
													`["viewdef"]["${viewDefId}"]${path}["columns"]["${i}"]`,
													`["viewdef"]["${viewDefId}"]${path}["columns"]["${newIndex}"]`
												)
										}}
									/>
								</div>

								{/* Select field */}
								<SelectField
									value={valueAPI.get(
										localPath + "['field']"
									)}
									setValue={(value: string) =>
										valueAPI.set(
											localPath + "['field']",
											value
										)
									}
									options={[
										{
											label: "Pick a field",
											value: "",
											disabled: true,
										},
										...fieldSelectOptions,
									]}
									context={context}
									variant="uesio/studio.propfield"
								/>

								{/* Delete */}
								<Button
									classes={moveButtonClasses}
									context={context}
									variant="uesio/studio.actionbutton"
									icon={
										<Icon
											context={context}
											icon="delete"
											variant="uesio/studio.actionicon"
										/>
									}
									onClick={() => {
										uesio.builder.removeDefinition(
											`["viewdef"]["${viewDefId}"]${path}["columns"]["${i}"]`
										)
									}}
								/>
							</div>
						</Fragment>
					)
				})}
			</div>
		</>
	)
}

export default ColumnSection
