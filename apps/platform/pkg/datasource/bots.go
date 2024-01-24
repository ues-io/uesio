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
	_, isNotFoundError := err.(*exceptions.SystemBotNotFoundException)
	if !isNotFoundError {
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
	routeBot = meta.NewRouteBot(botNamespace, botName)
	// TODO: Why does connection have to be nil
	if err = bundle.Load(routeBot, session, nil); err != nil {
		return nil, exceptions.NewNotFoundException("route bot not found: " + routeBot.GetKey())
	}

	// route.Params will contain the composite of path and query string parameters
	if err = routeBot.ValidateParams(route.Params); err != nil {
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

	collectionName := request.Metadata.GetFullName()

	var robots meta.BotCollection

	// TODO why does connection have to be nil
	err := bundle.LoadAllFromAny(&robots, meta.BundleConditions{
		"uesio/studio.collection": collectionName,
		"uesio/studio.type":       "BEFORESAVE",
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
	namespace, name, err := meta.ParseKey(op.Metadata.GetFullName())
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
	// TODO: Figure out why connection has to be nil
	err = bundle.Load(loadBot, session, nil)
	// See if there is a SYSTEM bot instead
	if err != nil {
		systemDialect, err2 := bot.GetBotDialect("SYSTEM")
		if err2 != nil {
			return err2
		}
		// Try running a Load bot using the System dialect.
		err = systemDialect.LoadBot(loadBot, op, connection, session)
		if err != nil {
			_, isNotFoundError := err.(*exceptions.SystemBotNotFoundException)
			if isNotFoundError {
				return exceptions.NewNotFoundException("could not find requested LOAD bot: " + botName)
			}
			return err
		}
		return nil
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
	err = bundle.Load(saveBot, session, nil)
	if err != nil {
		return exceptions.NewNotFoundException("could not find requested SAVE bot: " + botName)
	}
	dialect, err := bot.GetBotDialect(saveBot.Dialect)
	if err != nil {
		return err
	}

	return dialect.SaveBot(saveBot, op, connection, session)

}

func runAfterSaveBots(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	collectionName := request.Metadata.GetFullName()

	var robots meta.BotCollection

	// TODO: Figure out why connection has to be nil
	err := bundle.LoadAllFromAny(&robots, meta.BundleConditions{
		"uesio/studio.collection": collectionName,
		"uesio/studio.type":       "AFTERSAVE",
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

func CallGeneratorBot(create bundlestore.FileCreator, namespace, name string, params map[string]interface{}, connection wire.Connection, session *sess.Session) error {

	if ok, err := canCallBot(namespace, name, session.GetContextPermissions()); !ok {
		return err
	}

	robot := meta.NewGeneratorBot(namespace, name)

	err := bundle.Load(robot, session, connection)
	if err != nil {
		return exceptions.NewNotFoundException("generator not found: " + fmt.Sprintf("%s.%s", namespace, name))
	}

	err = robot.ValidateParams(params)
	if err != nil {
		return err
	}

	dialect, err := bot.GetBotDialect(robot.Dialect)
	if err != nil {
		return err
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

func CallListenerBotInTransaction(namespace, name string, params map[string]interface{}, session *sess.Session) (map[string]interface{}, error) {

	connection, err := GetPlatformConnection(nil, session, nil)
	if err != nil {
		return nil, err
	}

	err = connection.BeginTransaction()
	if err != nil {
		return nil, err
	}

	result, err := CallListenerBot(namespace, name, params, connection, session)
	if err != nil {
		rollbackError := connection.RollbackTransaction()
		if rollbackError != nil {
			return nil, rollbackError
		}
		return nil, err
	}

	err = connection.CommitTransaction()
	if err != nil {
		return nil, err
	}
	return result, nil
}

func CallListenerBot(namespace, name string, params map[string]interface{}, connection wire.Connection, session *sess.Session) (map[string]interface{}, error) {

	if ok, err := canCallBot(namespace, name, session.GetContextPermissions()); !ok {
		return nil, err
	}

	// First try to run a system bot
	systemListenerBot := meta.NewListenerBot(namespace, name)
	systemListenerBot.Dialect = "SYSTEM"

	systemDialect, err := bot.GetBotDialect(systemListenerBot.Dialect)
	if err != nil {
		return nil, err
	}

	systemBotResults, err := systemDialect.CallBot(systemListenerBot, params, connection, session)
	_, isNotFoundError := err.(*exceptions.SystemBotNotFoundException)
	if !isNotFoundError {
		// If we found a system bot, we can go ahead and just return the results of
		// that bot, no need to look for another bot to run.
		return systemBotResults, err
	}

	robot := meta.NewListenerBot(namespace, name)
	// TODO: WHY DOES connection have to be nil here
	err = bundle.Load(robot, session, nil)
	if err != nil {
		return nil, exceptions.NewNotFoundException("listener bot not found: " + fmt.Sprintf("%s.%s", namespace, name))
	}

	if err = robot.ValidateParams(params); err != nil {
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

func RunIntegrationAction(ic *wire.IntegrationConnection, actionKey string, requestOptions interface{}, connection wire.Connection) (interface{}, error) {
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
	params, isMap := requestOptions.(map[string]interface{})
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
	_, isNotFoundError := err.(*exceptions.SystemBotNotFoundException)
	if !isNotFoundError {
		// If we found a system bot, we can go ahead and just return the results of
		// that bot, no need to look for another bot to run.
		return systemBotResults, err
	}

	// Otherwise, since it is NOT a system bot, parse the bot's name
	actionBot, err := GetIntegrationActionBotName(action, integrationType)
	if err != nil {
		return nil, exceptions.NewNotFoundException(fmt.Sprintf("no bot name could be determined for integration action %s:%s", integrationKey, actionKey))
	}
	botNamespace, botName, err := meta.ParseKey(actionBot)
	if err != nil {
		return nil, exceptions.NewNotFoundException(fmt.Sprintf("invalid bot name %s for integration action %s:%s", actionBot, integrationKey, actionKey))
	}

	robot := meta.NewRunActionBot(botNamespace, botName)
	err = bundle.Load(robot, session, connection)
	if err != nil {
		return nil, exceptions.NewNotFoundException("integration run action bot not found: " + actionBot)
	}

	// TODO: Make sure that Bot params and Action Params match up!

	if err = robot.ValidateParams(params); err != nil {
		// This error will already be a BotParamError strongly typed
		return nil, err
	}

	dialect, err := bot.GetBotDialect(robot.Dialect)
	if err != nil {
		return nil, err
	}

	return dialect.RunIntegrationActionBot(robot, ic, action.Name, params)

}
