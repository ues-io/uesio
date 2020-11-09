package datasource

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// BotDialect interface
type BotDialect interface {
	BeforeSave(bot *metadata.Bot, botAPI *BeforeSaveAPI, session *sess.Session) error
	AfterSave(bot *metadata.Bot, botAPI *AfterSaveAPI, session *sess.Session) error
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

// RunBeforeSaveBots function
func RunBeforeSaveBots(request *reqs.SaveRequest, collectionMetadata *adapters.CollectionMetadata, session *sess.Session) error {
	var robots metadata.BotCollection

	err := bundles.LoadAll(&robots, collectionMetadata.Namespace, reqs.BundleConditions{
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
func RunAfterSaveBots(response *reqs.SaveResponse, request *reqs.SaveRequest, collectionMetadata *adapters.CollectionMetadata, session *sess.Session) error {
	var robots metadata.BotCollection

	err := bundles.LoadAll(&robots, collectionMetadata.Namespace, reqs.BundleConditions{
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
func CallBot(namespace, name string, session *sess.Session) error {
	robot, err := metadata.NewBot("listener." + namespace + "." + name)
	if err != nil {
		return err
	}

	err = bundles.Load(robot, session)
	if err != nil {
		return err
	}

	fmt.Println("Called Bot")
	fmt.Println(robot)

	return nil
}
