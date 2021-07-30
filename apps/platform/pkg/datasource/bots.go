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
	BeforeInsert(bot *meta.Bot, botAPI *BeforeInsertAPI, session *sess.Session) error
	BeforeUpdate(bot *meta.Bot, botAPI *BeforeUpdateAPI, session *sess.Session) error
	BeforeDelete(bot *meta.Bot, botAPI *BeforeDeleteAPI, session *sess.Session) error
	AfterInsert(bot *meta.Bot, botAPI *AfterInsertAPI, session *sess.Session) error
	AfterUpdate(bot *meta.Bot, botAPI *AfterUpdateAPI, session *sess.Session) error
	AfterDelete(bot *meta.Bot, botAPI *AfterDeleteAPI, session *sess.Session) error
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

// RunBeforeInsertBots function
func RunBeforeInsertBots(changes *adapt.ChangeItems, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {
	var robots meta.BotCollection

	err := bundle.LoadAllFromAny(&robots, meta.BundleConditions{
		"studio.collection": collectionMetadata.GetFullName(),
		"studio.type":       "BEFOREINSERT",
	}, session)
	if err != nil {
		return err
	}

	botAPI := NewBeforeInsertAPI(changes, collectionMetadata, session)

	for _, bot := range robots {
		err := hydrateBot(&bot, session)
		if err != nil {
			return err
		}

		dialect, err := getBotDialect(bot.Dialect)
		if err != nil {
			return err
		}

		err = dialect.BeforeInsert(&bot, botAPI, session)
		if err != nil {
			return err
		}
	}

	if botAPI.HasErrors() {
		return errors.New(botAPI.GetErrorString())
	}

	return nil
}

// RunBeforeUpdateBots function
func RunBeforeUpdateBots(changes *adapt.ChangeItems, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {
	var robots meta.BotCollection

	err := bundle.LoadAllFromAny(&robots, meta.BundleConditions{
		"studio.collection": collectionMetadata.GetFullName(),
		"studio.type":       "BEFOREUPDATE",
	}, session)
	if err != nil {
		return err
	}

	botAPI := NewBeforeUpdateAPI(changes, collectionMetadata, session)

	for _, bot := range robots {
		err := hydrateBot(&bot, session)
		if err != nil {
			return err
		}

		dialect, err := getBotDialect(bot.Dialect)
		if err != nil {
			return err
		}

		err = dialect.BeforeUpdate(&bot, botAPI, session)
		if err != nil {
			return err
		}
	}

	if botAPI.HasErrors() {
		return errors.New(botAPI.GetErrorString())
	}

	return nil
}

// RunBeforeDeleteBots function
func RunBeforeDeleteBots(deletes *adapt.ChangeItems, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {
	var robots meta.BotCollection

	err := bundle.LoadAllFromAny(&robots, meta.BundleConditions{
		"studio.collection": collectionMetadata.GetFullName(),
		"studio.type":       "BEFOREDELETE",
	}, session)
	if err != nil {
		return err
	}

	botAPI := NewBeforeDeleteAPI(deletes, collectionMetadata, session)

	for _, bot := range robots {
		err := hydrateBot(&bot, session)
		if err != nil {
			return err
		}

		dialect, err := getBotDialect(bot.Dialect)
		if err != nil {
			return err
		}

		err = dialect.BeforeDelete(&bot, botAPI, session)
		if err != nil {
			return err
		}
	}

	if botAPI.HasErrors() {
		return errors.New(botAPI.GetErrorString())
	}

	return nil
}

// RunAfterInsertBots function
func RunAfterInsertBots(request *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {
	var robots meta.BotCollection

	err := bundle.LoadAllFromAny(&robots, meta.BundleConditions{
		"studio.collection": collectionMetadata.GetFullName(),
		"studio.type":       "AFTERINSERT",
	}, session)
	if err != nil {
		return err
	}

	botAPI := NewAfterInsertAPI(request, collectionMetadata, session)

	for _, bot := range robots {
		err := hydrateBot(&bot, session)
		if err != nil {
			return err
		}

		dialect, err := getBotDialect(bot.Dialect)
		if err != nil {
			return err
		}

		err = dialect.AfterInsert(&bot, botAPI, session)
		if err != nil {
			return err
		}
	}

	if botAPI.HasErrors() {
		return errors.New(botAPI.GetErrorString())
	}

	return nil
}

// RunAfterUpdateBots function
func RunAfterUpdateBots(request *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {
	var robots meta.BotCollection

	err := bundle.LoadAllFromAny(&robots, meta.BundleConditions{
		"studio.collection": collectionMetadata.GetFullName(),
		"studio.type":       "AFTERUPDATE",
	}, session)
	if err != nil {
		return err
	}

	botAPI := NewAfterUpdateAPI(request, collectionMetadata, session)

	for _, bot := range robots {
		err := hydrateBot(&bot, session)
		if err != nil {
			return err
		}

		dialect, err := getBotDialect(bot.Dialect)
		if err != nil {
			return err
		}

		err = dialect.AfterUpdate(&bot, botAPI, session)
		if err != nil {
			return err
		}
	}

	if botAPI.HasErrors() {
		return errors.New(botAPI.GetErrorString())
	}

	return nil
}

// RunAfterDeleteBots function
func RunAfterDeleteBots(request *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {
	var robots meta.BotCollection

	err := bundle.LoadAllFromAny(&robots, meta.BundleConditions{
		"studio.collection": collectionMetadata.GetFullName(),
		"studio.type":       "AFTERDELETE",
	}, session)
	if err != nil {
		return err
	}

	botAPI := NewAfterDeleteAPI(request, collectionMetadata, session)

	for _, bot := range robots {
		err := hydrateBot(&bot, session)
		if err != nil {
			return err
		}

		dialect, err := getBotDialect(bot.Dialect)
		if err != nil {
			return err
		}

		err = dialect.AfterDelete(&bot, botAPI, session)
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
		StudioAPI: &StudioAPI{
			session: session,
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
