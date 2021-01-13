package datasource

import (
	"errors"
	"io/ioutil"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// BotDialect interface
type BotDialect interface {
	BeforeSave(bot *metadata.Bot, botAPI *BeforeSaveAPI, session *sess.Session) error
	AfterSave(bot *metadata.Bot, botAPI *AfterSaveAPI, session *sess.Session) error
	CallBot(bot *metadata.Bot, botAPI *CallBotAPI, session *sess.Session) error
}

var botDialectMap = map[string]BotDialect{}

// RegisterBotDialect function
func RegisterBotDialect(name string, dialect BotDialect) {
	botDialectMap[name] = dialect
}

// GetBotDialect function
func getBotDialect(botDialectName string) (BotDialect, error) {
	dialectKey, ok := metadata.GetBotDialects()[botDialectName]
	if !ok {
		return nil, errors.New("Invalid bot dialect name: " + botDialectName)
	}
	dialect, ok := botDialectMap[dialectKey]
	if !ok {
		return nil, errors.New("No dialect found for this bot: " + botDialectName)
	}
	return dialect, nil
}

func hydrateBot(bot *metadata.Bot, session *sess.Session) error {
	stream, err := bundles.GetBotStream(bot, session)
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
func RunBeforeSaveBots(request *adapters.SaveRequest, collectionMetadata *adapters.CollectionMetadata, session *sess.Session) error {
	var robots metadata.BotCollection

	err := bundles.LoadAllFromAny(&robots, metadata.BundleConditions{
		"uesio.collection": collectionMetadata.GetFullName(),
		"uesio.type":       "BEFORESAVE",
	}, session)
	if err != nil {
		return err
	}

	botAPI := &BeforeSaveAPI{
		Changes: &ChangesAPI{
			changes:  request.Changes,
			metadata: collectionMetadata,
		},
		session: session,
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
func RunAfterSaveBots(response *adapters.SaveResponse, request *adapters.SaveRequest, collectionMetadata *adapters.CollectionMetadata, session *sess.Session) error {
	var robots metadata.BotCollection

	err := bundles.LoadAllFromAny(&robots, metadata.BundleConditions{
		"uesio.collection": collectionMetadata.GetFullName(),
		"uesio.type":       "AFTERSAVE",
	}, session)
	if err != nil {
		return err
	}

	botAPI := &AfterSaveAPI{
		Results: &ResultsAPI{
			results:  response.ChangeResults,
			changes:  request.Changes,
			metadata: collectionMetadata,
		},
		session: session,
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
	robot := metadata.NewListenerBot(namespace, name)

	err := bundles.Load(robot, session)
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
