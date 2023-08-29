package datasource

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/bot"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type SystemBotNotFoundError struct {
}

func NewSystemBotNotFoundError() *SystemBotNotFoundError {
	return &SystemBotNotFoundError{}
}

func (e *SystemBotNotFoundError) Error() string {
	return "System Bot Not Found"
}

func RunRouteBots(route *meta.Route, session *sess.Session) (*meta.Route, error) {

	// For now, route bots are only available as system bots
	// So we just check if one exists. If it doesn't we just return
	// the route unchanged.

	dialect, err := bot.GetBotDialect("SYSTEM")
	if err != nil {
		return nil, err
	}
	err = dialect.RouteBot(meta.NewRouteBot(route.Namespace, route.Name), route, session)
	if err != nil {
		_, isNotFoundError := err.(*SystemBotNotFoundError)
		if isNotFoundError {
			return route, nil
		}
		return nil, err
	}

	return route, nil
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
			_, isNotFoundError := err.(*SystemBotNotFoundError)
			if isNotFoundError {
				return errors.New("could not find requested LOAD bot: " + botName)
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
		return errors.New("could not find requested SAVE bot: " + botName)
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

func CallGeneratorBot(create retrieve.WriterCreator, namespace, name string, params map[string]interface{}, connection adapt.Connection, session *sess.Session) error {

	if ok, err := canCallBot(namespace, name, session.GetContextPermissions()); !ok {
		return err
	}

	robot := meta.NewGeneratorBot(namespace, name)

	err := bundle.Load(robot, session, connection)
	if err != nil {
		return meta.NewBotNotFoundError("generator not found: " + fmt.Sprintf("%s.%s", namespace, name))
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
	if perms.AllowAllBots {
		return true, nil
	}
	if perms.BotRefs == nil {
		// For backwards compatibility, if there are no BotRefs, return true
		return true, nil
	}
	botKey := fmt.Sprintf("%s.%s", namespace, name)
	if perms.BotRefs[botKey] == true {
		return true, nil
	}
	return false, meta.NewBotAccessError(fmt.Sprintf(BotAccessErrorMessage, botKey))
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
	_, isNotFoundError := err.(*SystemBotNotFoundError)
	if !isNotFoundError {
		// If we found a system bot, we can go ahead and just return the results of
		// that bot, no need to look for another bot to run.
		return systemBotResults, err
	}

	robot := meta.NewListenerBot(namespace, name)
	err = bundle.Load(robot, session, connection)
	if err != nil {
		return nil, meta.NewBotNotFoundError("listener bot not found: " + fmt.Sprintf("%s.%s", namespace, name))
	}

	err = robot.ValidateParams(params)
	if err != nil {
		return nil, err
	}

	dialect, err := bot.GetBotDialect(robot.Dialect)
	if err != nil {
		return nil, err
	}

	return dialect.CallBot(robot, params, connection, session)

}
