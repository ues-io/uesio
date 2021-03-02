import { definition, builder, styles } from "@uesio/ui"
import * as material from "@material-ui/core"
type GridItemDefinition = {
	xs: material.GridSize
	sm: material.GridSize
	md: material.GridSize
	lg: material.GridSize
	xl: material.GridSize
	background: styles.BackgroundDefinition
	height: string
	align: "center" | "left" | "right"
}

interface GridItemProps extends definition.BaseProps {
	definition: GridItemDefinition
}

const GridItemPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Grid Item",
	defaultDefinition: () => ({
		components: [],
	}),
	sections: [],
}
export { GridItemProps, GridItemDefinition }

export default GridItemPropertyDefinition
