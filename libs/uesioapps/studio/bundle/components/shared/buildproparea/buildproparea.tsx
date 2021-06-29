import { FunctionComponent, useState, useEffect } from "react"

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

	const sections =
		buildPropsDef.type === "component"
			? buildPropsDef.sections.concat([
					{
						title: "Styles",
						type: "STYLES",
					},
			  ])
			: buildPropsDef.sections

	return (
		<div className={classes.wrapper}>
			{buildPropsDef?.properties && (
				<div className={classes.propList}>
					<PropList
						path={path}
						definition={definition}
						propsDef={buildPropsDef}
						properties={buildPropsDef.properties}
						context={context}
					/>
				</div>
			)}
			{sections.map((section, index) => (
				<BuildSection
					key={index}
					path={path}
					definition={definition}
					propsDef={buildPropsDef}
					section={section}
					index={index}
					context={context}
				/>
			))}
		</div>
	)
}

export default BuildPropArea
