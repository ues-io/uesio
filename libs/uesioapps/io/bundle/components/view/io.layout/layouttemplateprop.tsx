import { FC } from "react"
import { builder, component, definition, hooks, styles } from "@uesio/ui"

type ColumnArrayKey = {
	"io.column": {
		components: { [key: string]: any }[]
	}
}
const FieldLabel = component.registry.getUtility("io.fieldlabel")

interface T extends definition.UtilityProps {
	onClick: (value: string) => void
	value: string
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
			{value.split(",").map((flex: string, i: number) => (
				<div
					key={value + "," + i}
					className={classes.button}
					style={{
						flex,
						minHeight: "4em",
					}}
				/>
			))}
		</button>
	)
}

interface WrapperProps extends definition.UtilityProps {
	descriptor: builder.PropDescriptor
}
interface Props extends WrapperProps {
	template?: string[]
}

const LayoutTemplateProp: FC<Props> = (props) => {
	const valueAPI = props.valueAPI as any
	const uesio = hooks.useUesio(props)
	const { path: dirtyPath, context } = props
	const path = component.path.getParentPath(dirtyPath || "")
	const definition = valueAPI.get(path)
	const layoutPresets = ["1", "1,1", "1,2", "1,1,1", "1,4,1", "1,1,1,1"]

	const handler = (values: string) => {
		let currentColumns: ColumnArrayKey[] = definition.columns

		// If new columncount < current collumncount --> delete empty columns
		if (currentColumns && values.length < currentColumns.length) {
			const numberOfColumsToDelete = currentColumns.length - values.length
			const indexesUpForDelete = currentColumns
				.map((el: ColumnArrayKey, i: number) =>
					"components" in el["io.column"] &&
					el["io.column"].components.length > 0
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

		const columnsToSet = values.split(",").map((val: string, i: number) => {
			const columnKey = currentColumns && currentColumns[i]
			const columnDef = columnKey
				? columnKey["io.column"]
				: component.registry.getPropertiesDefinition("io.column")
						.defaultDefinition
			return {
				["io.column"]: {
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
				{(props.template || layoutPresets).map((el, i) => (
					<LayoutTemplateButton
						value={el}
						key={el.toString()}
						context={context}
						selected={definition.template === el.toString()}
						onClick={() => handler(el)}
					/>
				))}
			</div>
		</div>
	)
}

export default {
	default: (props: WrapperProps) => <LayoutTemplateProp {...props} />,
	form: (props: WrapperProps) => (
		<LayoutTemplateProp template={["1", "1,1", "1,1,1"]} {...props} />
	),
}

// export default LayoutTemplateProp
