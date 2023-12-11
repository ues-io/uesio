import { component, styles, definition } from "@uesio/ui"

const StyleDefaults = Object.freeze({
	root: [],
	logo: [],
	content: [],
	left: [],
	center: [],
	right: [],
	avatar: [],
})

type ViewHeaderDefinition = {
	logo?: definition.DefinitionList
	left?: definition.DefinitionList
	center?: definition.DefinitionList
	right?: definition.DefinitionList
	avatar?: definition.DefinitionList
}

const ViewHeader: definition.UC<ViewHeaderDefinition> = (props) => {
	const { definition, context, componentType } = props
	const { logo, left, center, right, avatar } = definition

	const classes = styles.useStyleTokens(StyleDefaults, props)
	return (
		<div className={classes.root}>
			<div className={classes.logo}>
				{logo && (
					<component.Slot
						definition={definition}
						listName="logo"
						path={props.path}
						context={context}
						componentType={componentType}
					/>
				)}
			</div>
			<div className={classes.content}>
				<div className={classes.left}>
					{left && (
						<component.Slot
							definition={definition}
							listName="left"
							path={props.path}
							context={context}
							componentType={componentType}
						/>
					)}
				</div>
				<div className={classes.center}>
					{center && (
						<component.Slot
							definition={definition}
							listName="center"
							path={props.path}
							context={context}
							componentType={componentType}
						/>
					)}
				</div>
				<div className={classes.right}>
					{right && (
						<component.Slot
							definition={definition}
							listName="right"
							path={props.path}
							context={context}
							componentType={componentType}
						/>
					)}
				</div>
			</div>
			<div className={classes.avatar}>
				{avatar && (
					<component.Slot
						definition={definition}
						listName="avatar"
						path={props.path}
						context={context}
						componentType={componentType}
					/>
				)}
			</div>
		</div>
	)
}

ViewHeader.displayName = "ViewHeader"

export default ViewHeader
