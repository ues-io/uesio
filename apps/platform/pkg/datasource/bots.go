package datasource

import (
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bot"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func RunRouteBots(route *meta.Route, session *sess.Session) (*meta.Route, error) {

	// For now, route bots are only available as system bots
	// So we just check if one exists. If it doesn't we just return
	// the route unchanged.

	dialect, err := bot.GetBotDialect("SYSTEM")
	if err != nil {
		return nil, err
	}
	modifiedRoute, err := dialect.RouteBot(meta.NewRouteBot(route.Namespace, route.Name), route, session)
	if err != nil {
		_, isNotFoundError := err.(*exceptions.SystemBotNotFoundException)
		if isNotFoundError {
			return route, nil
		}
		return nil, err
	}

	return modifiedRoute, nil
}

func runBeforeSaveBots(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	collectionName := request.Metadata.GetFullName()

	var robots meta.BotCollection

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

func runDynamicCollectionLoadBots(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

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

func runDynamicCollectionSaveBots(op *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

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

func runExternalDataSourceLoadBot(botName string, op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

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

func runExternalDataSourceSaveBot(botName string, op *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

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

func runAfterSaveBots(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	collectionName := request.Metadata.GetFullName()

	var robots meta.BotCollection

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

func CallGeneratorBot(create bundlestore.FileCreator, namespace, name string, params map[string]interface{}, connection adapt.Connection, session *sess.Session) error {

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

func CallListenerBot(namespace, name string, params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {

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
	err = bundle.Load(robot, session, connection)
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

func RunIntegrationAction(ic *adapt.IntegrationConnection, actionKey string, requestOptions interface{}, connection adapt.Connection) (interface{}, error) {
	integration := ic.GetIntegration()
	integrationType := ic.GetIntegrationType()
	session := ic.GetSession()
	integrationKey := integration.GetKey()
	actionKey = strings.ToLower(actionKey)
	action, err := meta.NewIntegrationAction(integration.GetType(), actionKey)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(action, session, nil)
	if err != nil {
		return nil, exceptions.NewNotFoundException(fmt.Sprintf("could not find integration action with name %s for integration %s", actionKey, integrationKey))
	}
	// Use the action's associated BotRef, if defined, otherwise use the Integration Type's RunActionBot
	var botNamespace, botName string
	if action.BotRef != "" {
		botNamespace, botName, err = meta.ParseKey(action.BotRef)
		if err != nil {
			return nil, exceptions.NewNotFoundException(fmt.Sprintf("invalid Bot name '%s' for Integration Action: %s", action.BotRef, actionKey))
		}
	} else if integrationType.RunActionBot != "" {
		botNamespace, botName, err = meta.ParseKey(integrationType.RunActionBot)
		if err != nil {
			return nil, exceptions.NewNotFoundException(fmt.Sprintf("invalid Bot name '%s' for Integration: %s", integrationType.RunActionBot, integrationKey))
		}
	}

	// convert requestOptions into a params map
	params, isMap := requestOptions.(map[string]interface{})
	if !isMap {
		return nil, fmt.Errorf("invalid request options provided to integrationConnection action with name %s for integrationConnection %s - must be a map", actionKey, integrationKey)
	}

	botKey := fmt.Sprintf("%s.%s", botNamespace, botName)

	fullyQualifiedActionKey := fmt.Sprintf("%s.%s", action.Namespace, action.Name)

	if !session.GetContextPermissions().CanRunIntegrationAction(integrationKey, fullyQualifiedActionKey) {
		return nil, exceptions.NewForbiddenException(fmt.Sprintf("you do not have permission to run action %s for integration %s", fullyQualifiedActionKey, integrationKey))
	}

	// First try to run a system bot
	systemListenerBot := meta.NewListenerBot(botNamespace, botName)
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

	robot := meta.NewRunActionBot(botNamespace, botName)
	err = bundle.Load(robot, session, connection)
	if err != nil {
		return nil, exceptions.NewNotFoundException("integration run action bot not found: " + botKey)
	}

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
