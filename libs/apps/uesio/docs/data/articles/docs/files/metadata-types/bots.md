# Bots

ues.io bots allow you to write custom server-side logic with TypeScript. There are a variety of different bot types:

-   **Listener bots**: Can be run on-demand in response to user interaction (e.g. a button click), can be called by other bots, or can be invoked via the REST API.
-   **Before-save / after-save bots**: Run before/after a collection record is saved to the ues.io database. Each of these bots is collection-specific, and has access to the record(s) being inserted/updated/deleted as part of the bot context.
-   **Generator bots**: Used to define the logic for [generators](concepts/generators)

Bots are not yet generally available. If you'd like to give bots a try, please reach out to a ues.io representative in the ues.io community, and we can enable this feature for you in the Studio.
