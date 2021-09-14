import React, { FC } from "react"
import { builder, component, definition, hooks, styles } from "@uesio/ui"
// import ColumnPropertyDefinition, {
// 	ColumnDefinition,
// } from "../io.column/columndefinition"
type ColumnArrayKey = {
	"io.column": {
		components: any[]
	}
}
const FieldLabel = component.registry.getUtility("io.fieldlabel")

interface T extends definition.UtilityProps {
	onClick: (value: number[]) => void
	value: number[]
	selected: boolean
}
const PresetButton: FC<T> = (props) => {
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
			{value.map((value) => (
				<div
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

interface Props extends definition.UtilityProps {
	descriptor: builder.PropDescriptor
}
const layoutpresetprop: FC<Props> = (props) => {
	const valueAPI = props.valueAPI as any // TODO
	const uesio = hooks.useUesio(props)
	const { path: dirtyPath, context, descriptor } = props
	const path = component.path.getParentPath(dirtyPath || "")
	const definition = valueAPI.get(path)
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
		let currentColumns: ColumnArrayKey[] = definition.columns

		// If preset columncount < current collumncount --> delete empty columnds
		if (values.length < currentColumns.length) {
			const numberOfColumsToDelete = currentColumns.length - values.length
			const indexesUpForDelete = currentColumns
				.map((el: ColumnArrayKey, i: number) =>
					"components" in el["io.column"] &&
					el["io.column"].components.length > 0
						? null
						: i
				)
				.filter((el) => !!el)

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
				? columnKey["io.column"]
				: component.registry.getPropertiesDefinition("io.column")
						.defaultDefinition
			return {
				["io.column"]: {
					...columnDef,
					flexRatio: val,
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
			component.path.fromPath([...component.path.toPath(path), "preset"]),
			values.toString()
		)
	}
	return (
		<div>
			<FieldLabel label={props.descriptor.label} context={context} />
			<div style={{ display: "flex", flexFlow: "row wrap", gap: "5px" }}>
				{layoutPresets.map((el, i) => (
					<PresetButton
						{...el}
						context={context}
						selected={definition.preset === el.value.toString()}
						onClick={() => handler(el.value)}
					/>
				))}
			</div>
		</div>
	)
}
;[]

export default layoutpresetprop
