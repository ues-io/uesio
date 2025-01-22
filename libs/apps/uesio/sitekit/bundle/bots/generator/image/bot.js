function generate(bot) {
  const modelID = "stability.stable-image-ultra-v1:0"
  const prompt = bot.params.get("prompt")
  const name = bot.params.get("name")
  const namespace = bot.getAppName()
  let samples = bot.params.get("samples") || 1

  if (typeof samples !== "number") {
    throw new Error("Invalid samples parameter")
  }
  if (samples > 4) samples = 4

  const aspectRatio = bot.params.get("aspect_ratio")

  const requests = []

  for (let sample = 0; sample < samples; sample++) {
    requests.push({
      integration: "uesio/aikit.bedrock",
      action: "invokemodel",
      options: {
        model: modelID,
        input: prompt,
        aspect_ratio: aspectRatio,
      },
    })
  }
  const results = bot.runIntegrationActions(requests)

  bot.runGenerator("uesio/core", "file", {
    name,
    files: results.map((result, i) => ({
      path: `${name}${i ? `_${i}` : ""}.png`,
      data: result,
    })),
  })

  bot.setRedirect(`/files/${namespace}/${name}`)
}
