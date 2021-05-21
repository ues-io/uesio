import { FunctionComponent } from "react"

import { definition, builder, styles } from "@uesio/ui"
import BuildSection from "./buildsection"
import PropList from "./proplist"

interface Props extends definition.BaseProps {
	buildPropsDef: builder.BuildPropertiesDefinition
}

const BuildPropArea: FunctionComponent<Props> = (props) => {
	const { buildPropsDef, path, definition, context } = props
	const classes = styles.useStyles(
		{
			wrapper: {
				overflow: "auto",
				flex: 1,
			},
			propList: {
				padding: "10px 6px 0 6px",
				borderBottom: "1px solid #ccc",
			},
		},
		props
	)
	return (
		<div className={classes.wrapper}>
			{buildPropsDef?.properties && (
				<div className={classes.propList}>
					<PropList
						path={path}
						definition={definition}
						properties={buildPropsDef.properties}
						context={context}
					/>
				</div>
			)}
			{buildPropsDef.sections.map((section, index) => (
				<BuildSection
					key={index}
					path={path}
					definition={definition}
					section={section}
					index={index}
					context={context}
				/>
			))}
		</div>
	)
}

export default BuildPropArea
