package datasource

import (
	"errors"
	"io/ioutil"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// BotDialect interface
type BotDialect interface {
	BeforeSave(bot *meta.Bot, botAPI *BeforeSaveAPI, session *sess.Session) error
	AfterSave(bot *meta.Bot, botAPI *AfterSaveAPI, session *sess.Session) error
	CallBot(bot *meta.Bot, botAPI *CallBotAPI, session *sess.Session) error
	CallGeneratorBot(bot *meta.Bot, botAPI *GeneratorBotAPI, session *sess.Session) error
}

type BotFunc func(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error

var botDialectMap = map[string]BotDialect{}

// RegisterBotDialect function
func RegisterBotDialect(name string, dialect BotDialect) {
	botDialectMap[name] = dialect
}

// GetBotDialect function
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

func hydrateBot(bot *meta.Bot, session *sess.Session) error {
	stream, err := bundle.GetBotStream(bot, session)
	if err != nil {
		return err
	}
	content, err := ioutil.ReadAll(stream)
	if err != nil {
		return err
	}
	bot.FileContents = string(content)
	return nil
}

func runBot(botType string, collectionName string, dialectFunc func(BotDialect, *meta.Bot) error, session *sess.Session) error {
	var robots meta.BotCollection

	err := bundle.LoadAllFromAny(&robots, meta.BundleConditions{
		"uesio/studio.collection": collectionName,
		"uesio/studio.type":       botType,
	}, session)
	if err != nil {
		return err
	}

	for _, bot := range robots {
		err := hydrateBot(&bot, session)
		if err != nil {
			return err
		}

		dialect, err := getBotDialect(bot.Dialect)
		if err != nil {
			return err
		}

		err = dialectFunc(dialect, &bot)
		if err != nil {
			return err
		}
	}

	return nil

}

func runBeforeSaveBots(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	// System bot triggers
	// These are some actions we want to take for specific types, but don't want
	// to use regular bots here

	var botFunction BotFunc

	switch request.CollectionName {
	case "uesio/core.userfile":
		botFunction = runUserFileBeforeSaveBot
	case "uesio/studio.field":
		botFunction = runFieldBeforeSaveBot
	case "uesio/studio.view":
		botFunction = runViewBeforeSaveBot
	case "uesio/studio.route":
		botFunction = runRouteBeforeSaveBot
	case "uesio/studio.collection":
		botFunction = runCollectionBeforeSaveBot
	case "uesio/studio.bot":
		botFunction = runBotBeforeSaveBot
	case "uesio/core.usage":
		botFunction = runUsageBeforeSaveBot
	}

	if botFunction != nil {
		err := botFunction(request, connection, session)
		if err != nil {
			return err
		}
	}

	botAPI := NewBeforeSaveAPI(request, connection, session)

	err := runBot("BEFORESAVE", request.CollectionName, func(dialect BotDialect, bot *meta.Bot) error {
		return dialect.BeforeSave(bot, botAPI, session)
	}, session)
	if err != nil {
		return err
	}

	return nil
}

func runAfterSaveBots(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	// System bot triggers
	// These are some actions we want to take for specific types, but don't want
	// to use regular bots here

	var botFunction BotFunc

	switch request.CollectionName {
	case "uesio/core.user":
		botFunction = runUserAfterSaveBot
	case "uesio/studio.site":
		botFunction = runSiteAfterSaveBot
	case "uesio/studio.sitedomain":
		botFunction = runDomainAfterSaveSiteBot
	case "uesio/studio.collection":
		botFunction = runCollectionAfterSaveBot
	}

	if botFunction != nil {
		err := botFunction(request, connection, session)
		if err != nil {
			return err
		}
	}

	botAPI := NewAfterSaveAPI(request, connection, session)

	err := runBot("AFTERSAVE", request.CollectionName, func(dialect BotDialect, bot *meta.Bot) error {
		return dialect.AfterSave(bot, botAPI, session)
	}, session)
	if err != nil {
		return err
	}

	return nil
}

func CallGeneratorBot(namespace, name string, params map[string]interface{}, session *sess.Session) ([]bundlestore.ItemStream, error) {
	robot := meta.NewGeneratorBot(namespace, name)

	err := bundle.Load(robot, session)
	if err != nil {
		return nil, err
	}

	botAPI := &GeneratorBotAPI{
		session: session,
		Params: &ParamsAPI{
			params: params,
		},
		itemStreams: bundlestore.ItemStreams{},
		bot:         robot,
	}

	err = hydrateBot(robot, session)
	if err != nil {
		return nil, err
	}

	dialect, err := getBotDialect(robot.Dialect)
	if err != nil {
		return nil, err
	}

	err = dialect.CallGeneratorBot(robot, botAPI, session)
	if err != nil {
		return nil, err
	}
	return botAPI.itemStreams, nil
}

func CallListenerBot(namespace, name string, params map[string]interface{}, session *sess.Session) error {
	robot := meta.NewListenerBot(namespace, name)

	err := bundle.Load(robot, session)
	if err != nil {
		return err
	}

	botAPI := &CallBotAPI{
		session: session,
		Params: &ParamsAPI{
			params: params,
		},
	}

	err = hydrateBot(robot, session)
	if err != nil {
		return err
	}

	dialect, err := getBotDialect(robot.Dialect)
	if err != nil {
		return err
	}

	return dialect.CallBot(robot, botAPI, session)
}
