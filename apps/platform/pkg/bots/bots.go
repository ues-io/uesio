package bots

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// BotDialect interface
type BotDialect interface {
	BeforeSave(bot *metadata.Bot, botAPI *BeforeSaveAPI, session *sess.Session) error
}

var botDialectMap = map[string]BotDialect{}

// RegisterBotDialect function
func RegisterBotDialect(name string, dialect BotDialect) {
	botDialectMap[name] = dialect
}

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

// RunBeforeSave function
func RunBeforeSave(request *reqs.SaveRequest, collectionMetadata *adapters.CollectionMetadata, session *sess.Session) error {
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
