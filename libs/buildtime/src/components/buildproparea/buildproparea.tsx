import React, { FunctionComponent } from "react"
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

const BuildPropArea: FunctionComponent<Props> = (props) => {
	const classes = useStyles(props)
	const { buildPropsDef, path, definition, context } = props

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
			{buildPropsDef.sections.map(
				(section: builder.PropertySection, index: number) => (
					<BuildSection
						key={index}
						path={path}
						definition={definition}
						section={section}
						index={index}
						componentType=""
						context={context}
					/>
				)
			)}
		</div>
	)
}

export default BuildPropArea
