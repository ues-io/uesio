package datasource

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bot"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func RunRouteBots(route *meta.Route, request *http.Request, session *sess.Session, connection wire.Connection) (*meta.Route, error) {

	namespace := route.GetNamespace()
	name := route.Name

	// First try to run a system bot
	routeBot := meta.NewRouteBot(namespace, name)
	routeBot.Dialect = "SYSTEM"

	systemDialect, err := bot.GetBotDialect(routeBot.Dialect)
	if err != nil {
		return nil, err
	}

	modifiedRoute, err := systemDialect.RouteBot(routeBot, route, request, connection, session)
	if !exceptions.IsType[*exceptions.SystemBotNotFoundException](err) {
		// If we found a system bot, we can go ahead and just return the results of
		// that bot, no need to look for another bot to run.
		return modifiedRoute, err
	}
	// If not found, check if this is a "bot" type Route, and that it has an associated Bot
	if route.Type != "bot" || route.BotRef == "" {
		// Nothing else to do, just return the original route unchanged
		return route, nil
	}
	// Otherwise, we need to look up the Route bot
	botNamespace, botName, err := meta.ParseKey(route.BotRef)
	if err != nil {
		return nil, exceptions.NewNotFoundException("invalid bot specified for route: " + route.GetKey())
	}

	bundleLoader := func(item meta.BundleableItem) error {
		// TODO: WHY DOES connection have to be nil here
		return bundle.Load(item, nil, session, nil)
	}

	routeBot = meta.NewRouteBot(botNamespace, botName)
	if err = bundleLoader(routeBot); err != nil {
		return nil, fmt.Errorf("unable to load route '%s': %w", routeBot.GetKey(), err)
	}
	// route.Params will contain the composite of path and query string parameters
	if err = routeBot.ValidateParams(route.Params, bundleLoader); err != nil {
		// This will already be a typed ParamError, so no need to convert the error type here
		return nil, err
	}

	// Verify the dialect
	dialect, err := bot.GetBotDialect(routeBot.Dialect)
	if err != nil {
		return nil, err
	}

	// Enter a version context for the bot being called
	versionSession, err := EnterVersionContext(botNamespace, session, connection)
	if err != nil {
		return nil, exceptions.NewExecutionException("unable to invoke bot in context of app " + botNamespace)
	}
	modifiedRoute, err = dialect.RouteBot(routeBot, route, request, connection, versionSession)
	if err != nil {
		return nil, exceptions.NewExecutionException("error while running route bot: " + err.Error())
	}
	return modifiedRoute, nil
}

func runBeforeSaveBots(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	collectionName := request.CollectionName

	var robots meta.BotCollection

	// TODO why does connection have to be nil
	err := bundle.LoadAllFromAny(&robots, &bundlestore.GetAllItemsOptions{
		Conditions: meta.BundleConditions{
			"uesio/studio.collection": collectionName,
			"uesio/studio.type":       "BEFORESAVE",
		},
	}, session, nil)
	if err != nil {
		return err
	}

	// Always add a systembot, it will be a no-op if no corresponding
	// system bot is found
	namespace, name, err := meta.ParseKey(collectionName)
	if err != nil {
		return err
	}
	systembot := meta.NewBeforeSaveBot(namespace, name, collectionName)
	systembot.Dialect = "SYSTEM"
	robots = append(robots, systembot)

	for _, robot := range robots {

		dialect, err := bot.GetBotDialect(robot.Dialect)
		if err != nil {
			return err
		}

		err = dialect.BeforeSave(robot, request, connection, session)
		if err != nil {
			return err
		}
	}

	return nil
}

func runDynamicCollectionLoadBots(op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {

	// Currently, all dynamic collections are routed to
	// the system bot dialect.
	dialect, err := bot.GetBotDialect("SYSTEM")
	if err != nil {
		return err
	}
	namespace, name, err := meta.ParseKey(op.CollectionName)
	if err != nil {
		return err
	}
	return dialect.LoadBot(meta.NewLoadBot(namespace, name), op, connection, session)

}

func runDynamicCollectionSaveBots(op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	// Currently, all dynamic collections are routed to
	// the system bot dialect.
	dialect, err := bot.GetBotDialect("SYSTEM")
	if err != nil {
		return err
	}
	namespace, name, err := meta.ParseKey(op.CollectionName)
	if err != nil {
		return err
	}
	return dialect.SaveBot(meta.NewSaveBot(namespace, name), op, connection, session)

}

func runExternalDataSourceLoadBot(botName string, op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {

	namespace, name, err := meta.ParseKey(botName)
	if err != nil {
		return err
	}

	loadBot := &meta.Bot{
		BundleableBase: meta.BundleableBase{
			Name:      name,
			Namespace: namespace,
		},
		Type: "LOAD",
	}

	// Try to load SYSTEM bot first because we never want to allow non-SYSTEM bot to override a SYSTEM bot
	systemDialect, err := bot.GetBotDialect("SYSTEM")
	if err != nil {
		return err
	}
	err = systemDialect.LoadBot(loadBot, op, connection, session)
	if err != nil && !exceptions.IsType[*exceptions.SystemBotNotFoundException](err) {
		return err
	} else if err == nil {
		return nil
	}

	// TODO: Figure out why connection has to be nil
	err = bundle.Load(loadBot, nil, session, nil)
	if err != nil {
		return err
	}
	// We found a custom LOAD bot, so check to see if it has a valid dialect.
	dialect, err := bot.GetBotDialect(loadBot.Dialect)
	if err != nil {
		return err
	}

	// Finally - run the load bot!
	return dialect.LoadBot(loadBot, op, connection, session)
}

func runExternalDataSourceSaveBot(botName string, op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	namespace, name, err := meta.ParseKey(botName)
	if err != nil {
		return err
	}

	saveBot := &meta.Bot{
		BundleableBase: meta.BundleableBase{
			Name:      name,
			Namespace: namespace,
		},
		Type: "SAVE",
	}
	// TODO: Figure out why connection has to be nil
	err = bundle.Load(saveBot, nil, session, nil)
	if err != nil {
		return fmt.Errorf("unable to load requested SAVE bot '%s': %w", botName, err)
	}
	dialect, err := bot.GetBotDialect(saveBot.Dialect)
	if err != nil {
		return err
	}

	return dialect.SaveBot(saveBot, op, connection, session)

}

func runAfterSaveBots(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	collectionName := request.CollectionName

	var robots meta.BotCollection

	// TODO: Figure out why connection has to be nil
	err := bundle.LoadAllFromAny(&robots, &bundlestore.GetAllItemsOptions{
		Conditions: meta.BundleConditions{
			"uesio/studio.collection": collectionName,
			"uesio/studio.type":       "AFTERSAVE",
		},
	}, session, nil)
	if err != nil {
		return err
	}

	// Always add a systembot, it will be a no-op if no corresponding
	// system bot is found
	namespace, name, err := meta.ParseKey(collectionName)
	if err != nil {
		return err
	}
	systembot := meta.NewAfterSaveBot(namespace, name, collectionName)
	systembot.Dialect = "SYSTEM"
	robots = append(robots, systembot)

	for _, robot := range robots {

		dialect, err := bot.GetBotDialect(robot.Dialect)
		if err != nil {
			return err
		}

		err = dialect.AfterSave(robot, request, connection, session)
		if err != nil {
			return err
		}
	}

	return nil
}

func CallGeneratorBot(create bundlestore.FileCreator, namespace, name string, params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error) {

	if ok, err := canCallBot(namespace, name, session.GetContextPermissions()); !ok {
		return nil, err
	}

	robot := meta.NewGeneratorBot(namespace, name)
	bundleLoader := func(item meta.BundleableItem) error {
		// TODO: WHY DOES connection have to be nil here
		return bundle.Load(item, nil, session, nil)
	}

	if err := bundleLoader(robot); err != nil {
		return nil, fmt.Errorf("unable to load generator '%s.%s': %w", namespace, name, err)
	}
	if err := robot.ValidateParams(params, bundleLoader); err != nil {
		return nil, err
	}

	dialect, err := bot.GetBotDialect(robot.Dialect)
	if err != nil {
		return nil, err
	}

	return dialect.CallGeneratorBot(robot, create, params, connection, session)

}

const BotAccessErrorMessage = "you do not have permission to call bot: %s"

func canCallBot(namespace, name string, perms *meta.PermissionSet) (bool, error) {
	botKey := fmt.Sprintf("%s.%s", namespace, name)
	if perms.CanCallBot(botKey) {
		return true, nil
	}
	return false, exceptions.NewForbiddenException(fmt.Sprintf(BotAccessErrorMessage, botKey))
}

func CallListenerBotInTransaction(namespace, name string, params map[string]any, session *sess.Session) (map[string]any, error) {
	return WithTransactionResult(session, nil, func(conn wire.Connection) (map[string]any, error) {
		return CallListenerBot(namespace, name, params, conn, session)
	})
}

func CallListenerBot(namespace, name string, params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error) {

	if ok, err := canCallBot(namespace, name, session.GetContextPermissions()); !ok {
		return nil, err
	}

	bundleLoader := func(item meta.BundleableItem) error {
		// TODO: WHY DOES connection have to be nil here
		return bundle.Load(item, nil, session, nil)
	}

	// First try to run a system bot
	systemListenerBot := meta.NewListenerBot(namespace, name)
	systemListenerBot.Dialect = "SYSTEM"

	systemDialect, err := bot.GetBotDialect(systemListenerBot.Dialect)
	if err != nil {
		return nil, err
	}

	systemBotResults, err := systemDialect.CallBot(systemListenerBot, params, connection, session)
	if !exceptions.IsType[*exceptions.SystemBotNotFoundException](err) {
		// If we found a system bot, we can go ahead and just return the results of
		// that bot, no need to look for another bot to run.
		return systemBotResults, err
	}

	robot := meta.NewListenerBot(namespace, name)
	if err = bundleLoader(robot); err != nil {
		return nil, fmt.Errorf("unable to load listener bot '%s.%s': %w", namespace, name, err)
	}

	if err = robot.ValidateParams(params, bundleLoader); err != nil {
		// This will already be a typed ParamError, so no need to convert the error type here
		return nil, err
	}

	dialect, err := bot.GetBotDialect(robot.Dialect)
	if err != nil {
		return nil, err
	}

	// Call the bot in the version context of the bot being called
	versionSession, err := EnterVersionContext(namespace, session, connection)
	if err != nil {
		return nil, exceptions.NewExecutionException("unable to invoke bot in context of app " + namespace)
	}

	return dialect.CallBot(robot, params, connection, versionSession)

}

// GetIntegrationActionBotName resolves the name of the Bot associated with an integration action,
// which can either come from the integration action itself, or from the integration type
func GetIntegrationActionBotName(integrationAction *meta.IntegrationAction, integrationType *meta.IntegrationType) (string, error) {
	// Use the action's associated BotRef, if defined, otherwise use the Integration Type's RunActionBot
	if integrationAction.BotRef != "" {
		return integrationAction.BotRef, nil
	}
	if integrationType.RunActionBot != "" {
		return integrationType.RunActionBot, nil
	}
	return "", exceptions.NewNotFoundException("could not find bot for this integration action")
}

func RunIntegrationAction(ic *wire.IntegrationConnection, actionKey string, requestOptions any, connection wire.Connection) (any, error) {
	integration := ic.GetIntegration()
	integrationType := ic.GetIntegrationType()
	session := ic.GetSession()
	integrationKey := integration.GetKey()
	actionKey = strings.ToLower(actionKey)
	action, err := GetIntegrationAction(integrationType.GetKey(), actionKey, session, connection)
	if err != nil {
		return nil, err
	}

	// convert requestOptions into a params map
	params, isMap := requestOptions.(map[string]any)
	if !isMap {
		return nil, fmt.Errorf("invalid request options provided to integrationConnection action with name %s for integrationConnection %s - must be a map", actionKey, integrationKey)
	}

	fullyQualifiedActionKey := fmt.Sprintf("%s.%s", action.Namespace, action.Name)

	if !session.GetContextPermissions().CanRunIntegrationAction(integrationKey, fullyQualifiedActionKey) {
		return nil, exceptions.NewForbiddenException(fmt.Sprintf("you do not have permission to run action %s for integration %s", fullyQualifiedActionKey, integrationKey))
	}

	// First try to run a system bot
	systemListenerBot := meta.NewListenerBot(action.Namespace, actionKey)
	systemListenerBot.Dialect = "SYSTEM"

	systemDialect, err := bot.GetBotDialect(systemListenerBot.Dialect)
	if err != nil {
		return nil, err
	}

	systemBotResults, err := systemDialect.RunIntegrationActionBot(systemListenerBot, ic, action.Name, params)
	if !exceptions.IsType[*exceptions.SystemBotNotFoundException](err) {
		// If we found a system bot, we can go ahead and just return the results of
		// that bot, no need to look for another bot to run.
		return systemBotResults, err
	}

	// Otherwise, since it is NOT a system bot, parse the bot name
	actionBot, err := GetIntegrationActionBotName(action, integrationType)
	if err != nil {
		return nil, exceptions.NewNotFoundException(fmt.Sprintf("no bot name could be determined for integration action %s:%s", integrationKey, actionKey))
	}
	botNamespace, botName, err := meta.ParseKey(actionBot)
	if err != nil {
		return nil, exceptions.NewNotFoundException(fmt.Sprintf("invalid bot name %s for integration action %s:%s", actionBot, integrationKey, actionKey))
	}

	bundleLoader := func(item meta.BundleableItem) error {
		// TODO: WHY DOES connection have to be nil here
		return bundle.Load(item, nil, session, nil)
	}
	robot := meta.NewRunActionBot(botNamespace, botName)
	if err = bundleLoader(robot); err != nil {
		return nil, fmt.Errorf("unable to load run action bot '%s': %w", actionBot, err)
	}

	if err = meta.ValidateParams(action.Params, params, bundleLoader); err != nil {
		// This error will already be a BotParamError strongly typed
		return nil, err
	}

	dialect, err := bot.GetBotDialect(robot.Dialect)
	if err != nil {
		return nil, err
	}

	return dialect.RunIntegrationActionBot(robot, ic, action.Name, params)

}
