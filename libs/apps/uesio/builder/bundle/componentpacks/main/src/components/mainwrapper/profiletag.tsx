import { definition, component } from "@uesio/ui"

const ProfileTag: definition.UtilityComponent = (props) => {
  const { context } = props
  const TitleBar = component.getUtility("uesio/io.titlebar")
  const Avatar = component.getUtility("uesio/io.avatar")

  return (
    <TitleBar
      context={context}
      variant="uesio/appkit.item_small"
      title="$User{username}"
      subtitle="$User{profileLabel}"
      avatar={
        <Avatar
          image="$User{picture}"
          text="$User{initials}"
          context={context}
        />
      }
    />
  )
}

export default ProfileTag
