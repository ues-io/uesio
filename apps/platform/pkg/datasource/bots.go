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

var SYSTEM_ROUTE_BOTS = map[string]bool{
	"uesio/studio.paymentsuccess": true,
}

func RunRouteBots(route *meta.Route, session *sess.Session) (*meta.Route, error) {

	_, hasSystemBot := SYSTEM_ROUTE_BOTS[route.GetKey()]
	if !hasSystemBot {
		return route, nil
	}

	dialect, err := getBotDialect("SYSTEM")
	if err != nil {
		return nil, err
	}
	err = dialect.RouteBot(meta.NewRouteBot(route.Namespace, route.Name), route, session)
	if err != nil {
		return nil, err
	}

	return route, nil
}

var SYSTEM_BEFORESAVE_BOT_COLLECTIONS = map[string]bool{
	"uesio/core.userfile":     true,
	"uesio/studio.field":      true,
	"uesio/studio.view":       true,
	"uesio/studio.theme":      true,
	"uesio/studio.route":      true,
	"uesio/studio.collection": true,
	"uesio/studio.bot":        true,
	"uesio/studio.app":        true,
	"uesio/studio.usage":      true,
	"uesio/core.user":         true,
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

	_, hasSystemBot := SYSTEM_BEFORESAVE_BOT_COLLECTIONS[collectionName]
	if hasSystemBot {
		namespace, name, err := meta.ParseKey(collectionName)
		if err != nil {
			return err
		}
		systembot := meta.NewBeforeSaveBot(namespace, name, collectionName)
		systembot.Dialect = "SYSTEM"
		robots = append(robots, systembot)
	}

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

var SYSTEM_AFTERSAVE_BOT_COLLECTIONS = map[string]bool{
	"uesio/core.user":               true,
	"uesio/core.userfile":           true,
	"uesio/studio.site":             true,
	"uesio/studio.sitedomain":       true,
	"uesio/studio.collection":       true,
	"uesio/studio.field":            true,
	"uesio/studio.workspace":        true,
	"uesio/studio.bundle":           true,
	"uesio/studio.bundledependency": true,
	"uesio/studio.license":          true,
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

	_, hasSystemBot := SYSTEM_AFTERSAVE_BOT_COLLECTIONS[collectionName]
	if hasSystemBot {
		namespace, name, err := meta.ParseKey(collectionName)
		if err != nil {
			return err
		}
		systembot := meta.NewAfterSaveBot(namespace, name, collectionName)
		systembot.Dialect = "SYSTEM"
		robots = append(robots, systembot)
	}

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

var SYSTEM_LISTENER_BOTS = map[string]bool{
	"uesio/studio.createbundle": true,
	"uesio/studio.makepayment":  true,
}

func CallListenerBot(namespace, name string, params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {

	robot := meta.NewListenerBot(namespace, name)

	_, hasSystemBot := SYSTEM_LISTENER_BOTS[namespace+"."+name]
	if !hasSystemBot {
		robot.Dialect = "SYSTEM"
	} else {
		err := bundle.Load(robot, session, connection)
		if err != nil {
			return nil, err
		}
	}

	dialect, err := getBotDialect(robot.Dialect)
	if err != nil {
		return nil, err
	}

	return dialect.CallBot(robot, params, connection, session)

}
