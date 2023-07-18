package tsdialect

import (
	"fmt"
	"io/ioutil"

	esbuild "github.com/evanw/esbuild/pkg/api"
	"github.com/pkg/errors"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bot/jsdialect"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func Logger(message string) {
	fmt.Println(message)
}

type TSDialect struct {
}

const DefaultListenerBotBody = `import { ListenerBotApi } from "@uesio/bots"

function %s(bot: ListenerBotApi) {
    const a = bot.params.get("a") as number
    const b = bot.params.get("b") as number
    bot.addResult("answer", a + b)
}`

const DefaultBeforeSaveBotBody = `import { BeforeSaveBotApi } from "@uesio/bots"

function %s(bot: BeforeSaveBotApi) {
	bot.inserts.get().forEach(function (change) {
		const recordId = change.get("uesio/core.id");
	});
	bot.deletes.get().forEach(function (change) {
		const recordId = change.getOld("uesio/core.id")
	});
}`

const DefaultAfterSaveBotBody = `import { AfterSaveBotApi } from "@uesio/bots"

function %s(bot: AfterSaveBotApi) {
	bot.inserts.get().forEach(function (change) {
		const recordId = change.get("uesio/core.id");
	});
	bot.deletes.get().forEach(function (change) {
		const recordId = change.getOld("uesio/core.id")
	});
}`

const DefaultBotBody = `function %s(bot) {
}`

// TODO: cache the transformed code, or generate it server-side as part of save of bot.ts
func (b *TSDialect) hydrateBot(bot *meta.Bot, session *sess.Session) error {
	_, stream, err := bundle.GetItemAttachment(bot, b.GetFilePath(), session)
	if err != nil {
		return err
	}
	content, err := ioutil.ReadAll(stream)
	if err != nil {
		return err
	}

	// Transform from TS to JS
	result := esbuild.Transform(string(content), esbuild.TransformOptions{
		Loader: esbuild.LoaderTS,
	})

	if len(result.Errors) > 0 {
		fmt.Println(fmt.Sprintf("TS Bot Compilation %d errors and %d warnings\n",
			len(result.Errors), len(result.Warnings)))
		return errors.Errorf(result.Errors[0].Text)
	}

	bot.FileContents = string(result.Code)
	return nil
}

func RunBot(botName string, contents string, api interface{}, errorFunc func(string)) error {
	return jsdialect.RunBot(botName, contents, api, errorFunc)
}

func (b *TSDialect) BeforeSave(bot *meta.Bot, request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	botAPI := jsdialect.NewBeforeSaveAPI(request, connection, session)
	err := b.hydrateBot(bot, session)
	if err != nil {
		return nil
	}
	return RunBot(bot.Name, bot.FileContents, botAPI, botAPI.AddError)
}

func (b *TSDialect) AfterSave(bot *meta.Bot, request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	botAPI := jsdialect.NewAfterSaveAPI(request, connection, session)
	err := b.hydrateBot(bot, session)
	if err != nil {
		return nil
	}
	return RunBot(bot.Name, bot.FileContents, botAPI, botAPI.AddError)
}

func (b *TSDialect) CallBot(bot *meta.Bot, params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {
	botAPI := &jsdialect.CallBotAPI{
		Session: session,
		Params: &jsdialect.ParamsAPI{
			Params: params,
		},
		AsAdmin: jsdialect.AdminCallBotAPI{
			Session:    session,
			Connection: connection,
		},
		Connection: connection,
		Results:    map[string]interface{}{},
	}
	err := b.hydrateBot(bot, session)
	if err != nil {
		return nil, err
	}
	err = RunBot(bot.Name, bot.FileContents, botAPI, nil)
	if err != nil {
		return nil, err
	}
	return botAPI.Results, nil
}

func (b *TSDialect) CallGeneratorBot(bot *meta.Bot, create retrieve.WriterCreator, params map[string]interface{}, connection adapt.Connection, session *sess.Session) error {
	botAPI := &jsdialect.GeneratorBotAPI{
		Session: session,
		Params: &jsdialect.ParamsAPI{
			Params: params,
		},
		Create:     create,
		Bot:        bot,
		Connection: connection,
	}
	err := b.hydrateBot(bot, session)
	if err != nil {
		return nil
	}
	return RunBot(bot.Name, bot.FileContents, botAPI, nil)
}

func (b *TSDialect) RouteBot(bot *meta.Bot, route *meta.Route, session *sess.Session) error {
	return nil
}

func (b *TSDialect) LoadBot(bot *meta.Bot, op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {
	return nil
}

func (b *TSDialect) SaveBot(bot *meta.Bot, op *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	return nil
}

func (b *TSDialect) GetFilePath() string {
	return "bot.ts"
}

func (b *TSDialect) GetDefaultFileBody(botType string) string {
	switch botType {
	case "LISTENER":
		return DefaultListenerBotBody
	case "BEFORESAVE":
		return DefaultBeforeSaveBotBody
	case "AFTERSAVE":
		return DefaultAfterSaveBotBody
	default:
		return DefaultBotBody
	}
}
