package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type BotDialect interface {
	BeforeSave(bot *meta.Bot, request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error
	AfterSave(bot *meta.Bot, request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error
	CallBot(bot *meta.Bot, params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error)
	CallGeneratorBot(bot *meta.Bot, create retrieve.WriterCreator, params map[string]interface{}, connection adapt.Connection, session *sess.Session) error
	RouteBot(bot *meta.Bot, route *meta.Route, session *sess.Session) error
	LoadBot(bot *meta.Bot, op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error
}

type SystemBotNotFoundError struct {
}

func NewSystemBotNotFoundError() *SystemBotNotFoundError {
	return &SystemBotNotFoundError{}
}

func (e *SystemBotNotFoundError) Error() string {
	return "System Bot Not Found"
}

var botDialectMap = map[string]BotDialect{}

func RegisterBotDialect(name string, dialect BotDialect) {
	botDialectMap[name] = dialect
}

func getBotDialect(botDialectName string) (BotDialect, error) {
	dialectKey, ok := meta.GetBotDialects()[botDialectName]
	if !ok {
		return nil, errors.New("Invalid bot dialect name: " + botDialectName)
	}
	dialect, ok := botDialectMap[dialectKey]
	if !ok {
		return nil, errors.New("No dialect found for this bot: " + botDialectName)
	}
	return dialect, nil
}

func RunRouteBots(route *meta.Route, session *sess.Session) (*meta.Route, error) {

	// For now, route bots are only available as system bots
	// So we just check if one exists. If it doesn't we just return
	// the route unchanged.

	dialect, err := getBotDialect("SYSTEM")
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

	for _, bot := range robots {

		dialect, err := getBotDialect(bot.Dialect)
		if err != nil {
			return err
		}

		err = dialect.BeforeSave(bot, request, connection, session)
		if err != nil {
			return err
		}
	}

	return nil
}

func runDynamicCollectionLoadBots(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	// Currently, all dynamic collections are routed to
	// the system bot dialect.
	dialect, err := getBotDialect("SYSTEM")
	if err != nil {
		return err
	}
	namespace, name, err := meta.ParseKey(op.CollectionName)
	if err != nil {
		return err
	}
	return dialect.LoadBot(meta.NewLoadBot(namespace, name), op, connection, session)

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

	for _, bot := range robots {

		dialect, err := getBotDialect(bot.Dialect)
		if err != nil {
			return err
		}

		err = dialect.AfterSave(bot, request, connection, session)
		if err != nil {
			return err
		}
	}

	return nil
}

func CallGeneratorBot(create retrieve.WriterCreator, namespace, name string, params map[string]interface{}, connection adapt.Connection, session *sess.Session) error {
	robot := meta.NewGeneratorBot(namespace, name)

	err := bundle.Load(robot, session, connection)
	if err != nil {
		return err
	}

	dialect, err := getBotDialect(robot.Dialect)
	if err != nil {
		return err
	}

	return dialect.CallGeneratorBot(robot, create, params, connection, session)

}

func CallListenerBot(namespace, name string, params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {

	// First try to run a system bot
	sysrobot := meta.NewListenerBot(namespace, name)
	sysrobot.Dialect = "SYSTEM"

	sysdialect, err := getBotDialect(sysrobot.Dialect)
	if err != nil {
		return nil, err
	}

	sysresults, err := sysdialect.CallBot(sysrobot, params, connection, session)
	_, isNotFoundError := err.(*SystemBotNotFoundError)
	if !isNotFoundError {
		// If we found a system bot, we can go ahead and just return the results of
		// that bot, no need to look for another bot to run.
		return sysresults, err
	}

	robot := meta.NewListenerBot(namespace, name)
	err = bundle.Load(robot, session, connection)
	if err != nil {
		return nil, err
	}

	dialect, err := getBotDialect(robot.Dialect)
	if err != nil {
		return nil, err
	}

	return dialect.CallBot(robot, params, connection, session)

}
