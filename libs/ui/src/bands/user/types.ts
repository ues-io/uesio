type UserState = {
  id: string
  username: string
  site: string
  firstname: string
  lastname: string
  profile: string
  picture: UserPictureState | null
  namedPermissions: string[] | null
} | null

type UserPictureState = {
  id: string
  updatedat: number
}

export type { UserState, UserPictureState }
