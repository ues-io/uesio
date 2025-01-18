import { ListenerBotApi } from "@uesio/bots"

export default function summarize_thread(bot: ListenerBotApi) {
  const thread = bot.params.get("thread") as string

  // Get the previous messages
  const messagesResult = bot.load({
    collection: "uesio/aikit.thread_item",
    fields: [
      {
        id: "uesio/aikit.content",
      },
      {
        id: "uesio/aikit.type",
      },
    ],
    conditions: [
      {
        field: "uesio/aikit.thread",
        operator: "EQ",
        value: thread,
      },
    ],
  })

  // Loop over the messages and put them in the right format
  const messages = messagesResult
    .map((message) => ({
      role: message["uesio/aikit.type"] === "USER" ? "user" : "assistant",
      content: message["uesio/aikit.content"],
    }))
    .concat({
      role: "user",
      content: "Please summarize the conversation in less than 8 words.",
    })

  const result = bot.runIntegrationAction(
    "uesio/aikit.bedrock",
    "invokemodel",
    {
      //model: "anthropic.claude-3-sonnet-20240229-v1:0",
      model: "anthropic.claude-3-haiku-20240307-v1:0",
      messages,
      system:
        "You are an assistant who summarizes chat threads. Please bring out the important points of the conversation into a title. Try to be brief and only respond with the title.",
    },
  ) as {
    text: string
  }[]

  if (!result.length) {
    throw new Error("Invalid Result")
  }

  bot.addResult("summary", result[0].text)
}
