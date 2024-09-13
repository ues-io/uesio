function view_home(bot) {
	const namespace = bot.getAppName()
	const tagline = bot.params.get("tagline")
	const tagline_sub = bot.params.get("tagline_sub")
	const testimonials = bot.params.get("testimonials")

	const mainTestimonial = testimonials.pop()

	const mainTestimonialYaml = bot.mergeYamlTemplate(
		{
			quote: mainTestimonial.quote,
			name: mainTestimonial.name,
			title: mainTestimonial.title,
		},
		"templates/maintestimonial.yaml"
	)

	const testimonialsYaml = testimonials
		.map((testimonial) =>
			bot.mergeYamlTemplate(
				{
					quote: testimonial.quote,
					name: testimonial.name,
					title: testimonial.title,
				},
				"templates/testimonial.yaml"
			)
		)
		.join("")

	var definition = bot.mergeYamlTemplate(
		{
			namespace,
			tagline,
			tagline_sub,
			mainTestimonialYaml,
			testimonialsYaml,
		},
		"templates/home.yaml"
	)
	bot.runGenerator("uesio/core", "view", {
		name: "home",
		definition,
	})
	bot.runGenerator("uesio/core", "route", {
		name: "home",
		path: "home",
		view: "home",
		theme: "uesio/core.default",
		title: "Home",
	})
}
