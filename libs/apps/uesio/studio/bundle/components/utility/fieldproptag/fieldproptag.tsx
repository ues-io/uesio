import PropNodeTag from "../../shared/buildpropitem/propnodetag"
import { builder, component, definition, styles } from "@uesio/ui"

const IconButton = component.getUtility("uesio/io.iconbutton")
const NamespaceLabel = component.getUtility("uesio/io.namespacelabel")

import { FC } from "react"

export type FieldProp = {
	fieldId: string
	fields: FieldProp[]
	fieldPath: string
	collectionKey: string
}

interface T extends definition.UtilityProps, FieldProp {
	// removeField: (e: React.MouseEvent<HTMLButtonElement>) => void
	togglePopper: () => void
	valueAPI: builder.ValueAPI
}
const FieldPropTag: FC<T> = (props) => {
	const {
		fieldId,
		fields,
		collectionKey,
		context,
		togglePopper,
		valueAPI,
		fieldPath,
	} = props
	const classes = styles.useStyles(
		{
			fieldTag: {
				".trashIcon": {
					opacity: 0,
					transition: "opacity 0.1s ease",
				},
				"&:hover .trashIcon": {
					opacity: 0.8,
				},
			},
		},
		null
	)

	return (
		<PropNodeTag
			draggable={`${collectionKey}:${fieldId}`}
			key={fieldId}
			context={context}
		>
			<div
				className={classes.fieldTag}
				style={{ display: "flex", justifyContent: "space-between" }}
			>
				<NamespaceLabel context={context} metadatakey={fieldId} />
				<div className="trashIcon">
					<IconButton
						context={context}
						icon="delete"
						onClick={() => valueAPI.remove(`${fieldPath}`)}
						title="delete"
					/>
				</div>
			</div>
			{fields?.map((el) => (
				<FieldPropTag
					{...el}
					context={context}
					key={el.fieldId}
					togglePopper={togglePopper}
					valueAPI={valueAPI}
				/>
			))}
		</PropNodeTag>
	)
}

export default FieldPropTag
