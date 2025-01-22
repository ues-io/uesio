import { AfterSaveBotApi, InsertApi, FieldValue } from "@uesio/bots"

export default function afterbundlelisting(bot: AfterSaveBotApi) {
  const historyChanges: Record<string, FieldValue>[] = []

  const getHistoryItem = (change: InsertApi) => {
    const historyItem: Record<string, FieldValue> = {}
    const status = change.get("uesio/studio.status")
    const app = change.get("uesio/studio.app")
    historyItem["uesio/studio.actiontype"] = status
    historyItem["uesio/studio.app"] = app
    return historyItem
  }

  bot.inserts.get().forEach((change) => {
    const status = change.get("uesio/studio.status") as string
    if (status === "") {
      change.set("uesio/studio.status", "OPEN")
    }
    historyChanges.push(getHistoryItem(change))
  })

  bot.updates.get().forEach((change) => {
    const NewStatus = change.get("uesio/studio.status") as string
    const OldStatus = change.getOld("uesio/studio.status")

    // If the status is not changing, we're good
    if (NewStatus === OldStatus) {
      return
    }

    if (!OldStatus) {
      // If there's not an old status, allow the new status to be set without recording any history.
      // Most likely this is an old listing, or we are running seeds.
      return
    }

    if (OldStatus === "OPEN" && NewStatus === "SUBMITTED") {
      historyChanges.push(getHistoryItem(change))
      return
    }

    if (OldStatus === "SUBMITTED" && NewStatus === "IN_REVIEW") {
      return
    }

    if (
      OldStatus === "IN_REVIEW" &&
      (NewStatus === "REJECTED" || NewStatus === "APPROVED")
    ) {
      return
    }

    if (OldStatus === "APPROVED" && NewStatus === "PUBLISHED") {
      //check if app has a default pricing
      const appID = change.get("uesio/studio.app->uesio/core.id")
      const records = bot.load({
        collection: "uesio/studio.licensetemplate",
        fields: [{ id: "uesio/studio.app" }],
        conditions: [
          {
            operator: "EQ",
            field: "uesio/studio.app",
            value: appID,
          },
        ],
      })

      if (records.length === 0) {
        bot.addError(`Cannot publish bundle listing without a default pricing`)
        return
      }

      historyChanges.push(getHistoryItem(change))
      return
    }

    if (OldStatus === "PUBLISHED" && NewStatus === "REJECTED") {
      return
    }

    bot.addError(
      `Cannot change bundle listing status from ${OldStatus} to ${NewStatus}`,
    )
  })

  if (historyChanges.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: Revisit types used for bot methods (see https://github.com/ues-io/uesio/issues/4483)
    bot.save("uesio/studio.bundlelistinghistory", historyChanges as any)
  }
}
