import { definition, component, hooks, styles } from "@uesio/ui"
import { FunctionComponent } from "react"
import { isDropAllowed } from "../../shared/dragdrop"

type SlotDefinition = {
	items: definition.DefinitionList
	accepts: string[]
	direction?: string
}

interface SlotProps extends definition.BaseProps {
	definition: SlotDefinition
}

const SlotBuilder: FunctionComponent<SlotProps> = (props) => {
	const {
		definition: { accepts, direction },
		path,
		context,
	} = props

	const items = props.definition.items || []

	const uesio = hooks.useUesio(props)

	const [dragType, dragItem, dragPath] = uesio.builder.useDragNode()
	const [dropType, dropItem, dropPath] = uesio.builder.useDropNode()
	const fullDragPath = component.path.makeFullPath(
		dragType,
		dragItem,
		dragPath
	)

	const size = items.length

	const viewDefId = context.getViewDefId()

	if (!path || !viewDefId) return null

	const classes = styles.useStyles(
		{
			root: {
				display: "contents",
			},
			placeholder: {
				...(dropPath === `${path}["0"]` && {
					border: "1px dashed #ccc",
					backgroundColor: "#e5e5e5",
				}),
				minWidth: "40px",
				minHeight: "40px",
			},
		},
		props
	)

	return (
		<div
			className={classes.root}
			data-accepts={accepts.join(",")}
			data-direction={direction}
			data-path={path}
			data-insertindex={size}
		>
			{size === 0 && isDropAllowed(accepts, fullDragPath) && (
				<div className={classes.placeholder} />
			)}
			{items.map((itemDef, index) => {
				const [componentType, unWrappedDef] =
					component.path.unWrapDefinition(itemDef)
				return (
					<component.Component
						definition={unWrappedDef}
						componentType={componentType}
						index={index}
						path={`${path}["${index}"]`}
						context={context}
					/>
				)
			})}
		</div>
	)
}

export default SlotBuilder
