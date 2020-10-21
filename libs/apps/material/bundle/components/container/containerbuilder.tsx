import React, { ReactElement } from "react"
import { hooks } from "uesio"
import { ContainerProps, ContainerDefinition } from "./containerdefinition"
import Container from "./container"

function ContainerBuilder(props: ContainerProps): ReactElement | null {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as ContainerDefinition
	return <Container {...props} definition={definition}></Container>
}

export default ContainerBuilder
