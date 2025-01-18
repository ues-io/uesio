import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { UserState } from "./types"

const userSlice = createSlice({
  name: "user",
  initialState: null as UserState,
  reducers: {
    set: (state, { payload }: PayloadAction<UserState>) => payload,
  },
})

export const { set } = userSlice.actions
export default userSlice.reducer
