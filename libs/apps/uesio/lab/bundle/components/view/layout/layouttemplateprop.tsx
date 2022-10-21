import { FC } from "react"
import { builder, component, definition, hooks, styles } from "@uesio/ui"
import { LayoutDefinition } from "./layoutdefinition"

type ColumnArrayKey = {
	"lab.column": {
		components: definition.DefinitionList
	}
}
const FieldLabel = component.getUtility("uesio/io.fieldlabel")

interface T extends definition.UtilityProps {
	onClick: (value: number[]) => void
	value: number[]
	selected: boolean
}
const LayoutTemplateButton: FC<T> = (props) => {
	const { value, onClick, selected } = props
	const uesio = hooks.useUesio(props)

	const theme = uesio.getTheme()
	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "flex",
				gap: "1px",
				minWidth: "31%",
				background: "none",
				border: "none",
				cursor: "pointer",
				opacity: 0.9,

				"&:hover": {
					opacity: 1,
				},
			},
			button: {
				backgroundColor: selected
					? theme.definition.palette.primary
					: "#74a5f0",
			},
		},
		props
	)

	return (
		<button className={classes.root} onClick={() => onClick(value)}>
			{value.map((value, i) => (
				<div
					key={value + i}
					className={classes.button}
					style={{
						flex: value,
						minHeight: "4em",
					}}
				/>
			))}
		</button>
	)
}

const LayoutTemplateProp: builder.PropComponent<builder.CustomProp> = (
	props
) => {
	const valueAPI = props.valueAPI
	const uesio = hooks.useUesio(props)
	const { path: dirtyPath, context } = props
	const path = component.path.getParentPath(dirtyPath || "")
	const definition = valueAPI.get(path) as LayoutDefinition
	const layoutPresets = [
		{
			value: [1, 1],
		},
		{
			value: [1, 2],
		},
		{
			value: [1, 4],
		},
		{
			value: [1, 1, 1],
		},
		{
			value: [1, 4, 1],
		},
		{
			value: [1, 1, 1, 1],
		},
	]

	const handler = (values: number[]) => {
		let currentColumns = definition.columns

		// If new columncount < current collumncount --> delete empty columns
		if (values.length < currentColumns.length) {
			const numberOfColumsToDelete = currentColumns.length - values.length
			const indexesUpForDelete = currentColumns
				.map((el: ColumnArrayKey, i: number) =>
					"components" in el["lab.column"] &&
					el["lab.column"].components.length > 0
						? null
						: i
				)
				.filter((el) => el !== null)

			// Stop if We need to delete more columns then we can
			if (numberOfColumsToDelete > indexesUpForDelete.length) {
				uesio.notification.addError(
					"Cannot delete columns with nested components",
					context,
					""
				)
				return
			}
			currentColumns = currentColumns.filter(
				(el, i) => !indexesUpForDelete.includes(i)
			)
		}

		const columnsToSet = values.map((val: number, i: number) => {
			const columnKey = currentColumns[i]
			const columnDef = columnKey
				? (columnKey["lab.column"] as definition.DefinitionMap)
				: (component.registry
						.getPropertiesDefinition("uesio/lab.column")
						.defaultDefinition() as definition.DefinitionMap)
			return {
				["lab.column"]: {
					...columnDef,
					"uesio.styles": {
						root: {
							flex: val,
						},
					},
				},
			}
		})

		// Set the columns def
		valueAPI.set(
			component.path.fromPath([
				...component.path.toPath(path),
				"columns",
			]),
			columnsToSet
		)
		// Save the preset to the layout defq
		valueAPI.set(
			component.path.fromPath([
				...component.path.toPath(path),
				"template",
			]),
			values.toString()
		)
	}
	return (
		<div>
			<FieldLabel label={props.descriptor.label} context={context} />
			<div style={{ display: "flex", flexFlow: "row wrap", gap: "5px" }}>
				{layoutPresets.map((el) => (
					<LayoutTemplateButton
						{...el}
						key={el.value.toString()}
						context={context}
						selected={definition?.template === el.value.toString()}
						onClick={() => handler(el.value)}
					/>
				))}
			</div>
		</div>
	)
}
;[]

export default LayoutTemplateProp
