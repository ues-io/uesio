import { Context } from "../../context/context"
import { dispatch } from "../../store/store"
import { set as setUser } from "."
import { redirect } from "../../bands/route/operations"
import { getErrorString } from "../utils"
import { LoginResponse, platform } from "../../platform/platform"
type Payload = Record<string, string> | undefined
async function responseRedirect(response: LoginResponse, context: Context) {
  // All login responses will return a redirectPath barring any failure server side. If we don't
  // have a redirectPath, there is nothing we can do here other than try to go to site root or
  // take user to an error page as trying to query for the "home" route will result in the same
  // as what login response should contain.
  // TODO: Consider going to an error page here instead of site root
  return redirect(context, response.redirectPath || "/")
}

const signup = async (
  context: Context,
  signupMethod: string,
  payload: Payload,
) => {
  if (!payload) return context
  const mergedPayload = context.mergeStringMap(payload)
  const mergedSignupMethod = context.mergeString(signupMethod)
  const response = await platform.signup(
    context,
    mergedSignupMethod,
    mergedPayload,
  )
  dispatch(setUser(response.user))

  // Cancel any google account popups if they exist
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any)?.google?.accounts?.id?.cancel()

  return responseRedirect(response, context)
}

const login = async (
  context: Context,
  authSource: string,
  payload: Payload,
) => {
  if (!payload) throw new Error("No credentials were provided for login.")
  const mergedPayload = context.mergeStringMap(payload)
  try {
    const response = await platform.login(context, authSource, mergedPayload)
    dispatch(setUser(response.user))

    // Cancel any google account popups if they exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any)?.google?.accounts?.id?.cancel()

    return responseRedirect(response, context)
  } catch (error) {
    //CAST the error and decide what error message show to the user, for this operation.
    const message = getErrorString(error)
    return context.addErrorFrame([message])
  }
}

const logout = async (context: Context) => {
  const response = await platform.logout(context)
  dispatch(setUser(response.user))
  return responseRedirect(response, context)
}

const resetPassword = async (
  context: Context,
  authSource: string,
  payload: Payload,
) => {
  if (!payload)
    throw new Error("No credentials were provided for reset password.")
  const mergedPayload = context.mergeStringMap(payload)
  const mergedAuthSource = context.mergeString(authSource)
  try {
    await platform.resetPassword(context, mergedAuthSource, mergedPayload)
    return context
  } catch (error) {
    const message = getErrorString(error)
    return context.addErrorFrame([message])
  }
}

const resetPasswordConfirm = async (
  context: Context,
  authSource: string,
  payload: Payload,
) => {
  if (!payload)
    throw new Error(
      "No credentials were provided for reset password confirmation.",
    )
  const mergedPayload = context.mergeStringMap(payload)
  const mergedAuthSource = context.mergeString(authSource)
  try {
    const response = await platform.resetPasswordConfirm(
      context,
      mergedAuthSource,
      mergedPayload,
    )
    dispatch(setUser(response.user))
    return responseRedirect(response, context)
  } catch (error) {
    const message = getErrorString(error)
    return context.addErrorFrame([message])
  }
}

const createLogin = async (
  context: Context,
  signupMethod: string,
  payload: Payload,
) => {
  if (!payload) return context
  const mergedPayload = context.mergeStringMap(payload)
  const mergedSignupMethod = context.mergeString(signupMethod)
  try {
    await platform.createLogin(context, mergedSignupMethod, mergedPayload)
    return context
  } catch (error) {
    const message = getErrorString(error)
    return context.addErrorFrame([message])
  }
}

export default {
  login,
  logout,
  signup,
  resetPassword,
  resetPasswordConfirm,
  createLogin,
}
