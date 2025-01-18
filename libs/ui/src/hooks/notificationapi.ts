import { Context } from "../context/context"
import { run } from "../signals/signals"

const addError = (text: string | Error, context: Context, path?: string) => {
  let msg = text
  if (typeof text === "object" && text.message) {
    msg = text.message
  }
  run(
    {
      signal: "notification/ADD",
      severity: "error",
      text: msg,
      path,
      duration: 10,
    },
    context,
  )
}

const addNotification = (
  text: string,
  severity: string,
  context: Context,
  path?: string,
) =>
  run(
    {
      signal: "notification/ADD",
      severity,
      text,
      path,
    },
    context,
  )

export { addError, addNotification }
