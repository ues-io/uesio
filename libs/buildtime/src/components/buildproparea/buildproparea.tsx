import React, { ReactElement } from "react"
import { makeStyles, createStyles } from "@material-ui/core"
import { definition, builder } from "@uesio/ui"
import BuildSection from "./buildsection"
import PropList from "./proplist"

interface Props extends definition.BaseProps {
	buildPropsDef: builder.BuildPropertiesDefinition
	definition: definition.DefinitionMap
}

const useStyles = makeStyles(() =>
	createStyles({
		wrapper: {
			overflow: "auto",
			flex: "1",
		},
		propList: {
			padding: "10px 6px 0px 6px",
			borderBottom: "1px solid #ccc",
		},
	})
)

function BuildPropArea(props: Props): ReactElement {
	const classes = useStyles(props)
	const propsDef = props.buildPropsDef

	return (
		<div className={classes.wrapper}>
			{propsDef.properties && (
				<div className={classes.propList}>
					<PropList
						{...{
							path: props.path,
							definition: props.definition,
							properties: propsDef.properties,
							context: props.context,
						}}
					/>
				</div>
			)}
			{propsDef.sections.map(
				(section: builder.PropertySection, index: number) => (
					<BuildSection
						key={index}
						{...{
							path: props.path,
							definition: props.definition,
							section,
							index,
							componentType: "",
							context: props.context,
						}}
					/>
				)
			)}
		</div>
	)
}

export default BuildPropArea
