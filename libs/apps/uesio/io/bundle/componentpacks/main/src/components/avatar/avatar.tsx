import { component, definition } from "@uesio/ui"

import { default as IOAvatar } from "../../utilities/avatar/avatar"

type AvatarDefinition = {
  image?: string
  text?: string
}

const Avatar: definition.UC<AvatarDefinition> = (props) => {
  const { definition, context } = props

  return (
    <IOAvatar
      image={definition.image}
      text={definition.text}
      styleTokens={definition[component.STYLE_TOKENS]}
      variant={definition[component.STYLE_VARIANT]}
      context={context}
    />
  )
}

export default Avatar
