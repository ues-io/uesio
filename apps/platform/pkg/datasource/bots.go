package datasource

import (
	"errors"
	"io/ioutil"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// BotDialect interface
type BotDialect interface {
	BeforeSave(bot *meta.Bot, botAPI *BeforeSaveAPI, session *sess.Session) error
	AfterSave(bot *meta.Bot, botAPI *AfterSaveAPI, session *sess.Session) error
	CallBot(bot *meta.Bot, botAPI *CallBotAPI, session *sess.Session) error
}

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

// RunBeforeSaveBots function
func RunBeforeSaveBots(request *adapt.SaveRequest, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {
	var robots meta.BotCollection

	err := bundle.LoadAllFromAny(&robots, meta.BundleConditions{
		"uesio.collection": collectionMetadata.GetFullName(),
		"uesio.type":       "BEFORESAVE",
	}, session)
	if err != nil {
		return err
	}

	botAPI := NewBeforeSaveAPI(request, collectionMetadata, session)

	for _, bot := range robots {
		err := hydrateBot(&bot, session)
		if err != nil {
			return err
		}

		dialect, err := getBotDialect(bot.Dialect)
		if err != nil {
			return err
		}

		err = dialect.BeforeSave(&bot, botAPI, session)
		if err != nil {
			return err
		}
	}

	if botAPI.HasErrors() {
		return errors.New(botAPI.GetErrorString())
	}

	return nil
}

// RunAfterSaveBots function
func RunAfterSaveBots(response *adapt.SaveResponse, request *adapt.SaveRequest, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {
	var robots meta.BotCollection

	err := bundle.LoadAllFromAny(&robots, meta.BundleConditions{
		"uesio.collection": collectionMetadata.GetFullName(),
		"uesio.type":       "AFTERSAVE",
	}, session)
	if err != nil {
		return err
	}

	botAPI := NewAfterSaveAPI(request, response, collectionMetadata, session)

	for _, bot := range robots {
		err := hydrateBot(&bot, session)
		if err != nil {
			return err
		}

		dialect, err := getBotDialect(bot.Dialect)
		if err != nil {
			return err
		}

		err = dialect.AfterSave(&bot, botAPI, session)
		if err != nil {
			return err
		}
	}

	if botAPI.HasErrors() {
		return errors.New(botAPI.GetErrorString())
	}

	return nil
}

// CallBot function
func CallBot(namespace, name string, params map[string]string, session *sess.Session) error {
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

	err = dialect.CallBot(robot, botAPI, session)
	if err != nil {
		return err
	}

	return nil
}
