package tsdialect

import (
	"bytes"
	"fmt"
	"log/slog"
	"strings"

	esbuild "github.com/evanw/esbuild/pkg/api"
	"github.com/pkg/errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bot/jsdialect"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type TSDialect struct {
}

const DefaultListenerBotBody = `import { ListenerBotApi } from "@uesio/bots"

export default function %s(bot: ListenerBotApi) {
    const a = bot.params.get("a") as number
    const b = bot.params.get("b") as number
    bot.addResult("answer", a + b)
}`

const DefaultRunIntegrationActionBotBody = `import { RunActionBotApi } from "@uesio/bots"

type OrderDetails = {
	orderNumber: string
}

export default function %s(bot: RunActionBotApi) {
    const itemNumbers = bot.params.get("itemNumbers") as string[]
    const amount = bot.params.get("amount") as number
	const actionName = bot.getActionName()

	if (actionName !== "createOrder") {
		bot.addError("unsupported action name: " + actionName)
		return
	}

	// Call API to create order
	const result = bot.http.request({
		method: "POST",
		url: bot.getIntegration().getBaseURL() + "/api/v1/orders",
		body: {
			lineItems: itemNumbers,
			amount: amount,
		},
	})
	if (result.code !== 200) {
		bot.addError("could not place order: " + result.status)
		return
	}
	const orderDetails = result.body as OrderDetails
	const { orderNumber } = orderDetails

    bot.addResult("orderNumber", orderNumber)
}`

const DefaultLoadBotBody = `import { LoadBotApi } from "@uesio/bots"

export default function %s(bot: LoadBotApi) {
	const { collection, fields, conditions, order, batchSize, batchNumber, collectionMetadata } = bot.loadRequest
	const results = [
		{
			"first_name": "Luigi",
			"last_name": "Vampa"
		},
		{
			"first_name": "Myasia",
			"last_name": "Harvey"
		},
	]
	results.forEach((record) => bot.addRecord(record))
}`

const DefaultSaveBotBody = `import { SaveBotApi } from "@uesio/bots"

export default function %s(bot: SaveBotApi) {
	const { collection, collectionMetadata, upsert } = bot.saveRequest
	bot.deletes.get().forEach((deleteApi) => {
		bot.log.info("got a record to delete, with id: " + deleteApi.getId())
	})
	bot.inserts.get().forEach((insertApi) => {
		bot.log.info("got a record to insert, with id: " + insertApi.getId())
	})
	bot.updates.get().forEach((updateApi) => {
		bot.log.info("got a record to update, with id: " + updateApi.getId())
	})
}`

const DefaultBeforeSaveBotBody = `import { BeforeSaveBotApi } from "@uesio/bots"

export default function %s(bot: BeforeSaveBotApi) {
	bot.inserts.get().forEach(function (change) {
		const recordId = change.get("uesio/core.id");
	});
	bot.deletes.get().forEach(function (change) {
		const recordId = change.getOld("uesio/core.id")
	});
}`

const DefaultAfterSaveBotBody = `import { AfterSaveBotApi } from "@uesio/bots"

export default function %s(bot: AfterSaveBotApi) {
	bot.inserts.get().forEach(function (change) {
		const recordId = change.get("uesio/core.id");
	});
	bot.deletes.get().forEach(function (change) {
		const recordId = change.getOld("uesio/core.id")
	});
}`

const DefaultBotBody = `export default function %s(bot) {

}`

func (b *TSDialect) hydrateBot(bot *meta.Bot, session *sess.Session) error {
	buf := &bytes.Buffer{}
	if _, err := bundle.GetItemAttachment(buf, bot, b.GetFilePath(), session); err != nil {
		return err
	}
	// Transform from TS to JS
	result := esbuild.Transform(string(buf.Bytes()), esbuild.TransformOptions{
		Loader: esbuild.LoaderTS,
	})
	if len(result.Errors) > 0 {
		slog.Error(fmt.Sprintf("TS Bot %s compilation had %d errors and %d warnings\n",
			bot.GetKey(), len(result.Errors), len(result.Warnings)))
		return errors.Errorf(result.Errors[0].Text)
	}
	bot.FileContents = string(result.Code)
	return nil
}

func (b *TSDialect) BeforeSave(bot *meta.Bot, request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	botAPI := jsdialect.NewBeforeSaveAPI(bot, request, connection, session)
	return jsdialect.RunBot(bot, botAPI, session, b.hydrateBot, botAPI.AddError)
}

func (b *TSDialect) AfterSave(bot *meta.Bot, request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	botAPI := jsdialect.NewAfterSaveAPI(bot, request, connection, session)
	return jsdialect.RunBot(bot, botAPI, session, b.hydrateBot, botAPI.AddError)
}

func (b *TSDialect) CallBot(bot *meta.Bot, params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {
	botAPI := jsdialect.NewCallBotAPI(bot, session, connection, params)
	err := jsdialect.RunBot(bot, botAPI, session, b.hydrateBot, nil)
	if err != nil {
		return nil, err
	}
	return botAPI.Results, nil
}

func (b *TSDialect) CallGeneratorBot(bot *meta.Bot, create bundlestore.FileCreator, params map[string]interface{}, connection adapt.Connection, session *sess.Session) error {
	botAPI := &jsdialect.GeneratorBotAPI{
		Session: session,
		Params: &jsdialect.ParamsAPI{
			Params: params,
		},
		Create:     create,
		Bot:        bot,
		Connection: connection,
	}
	return jsdialect.RunBot(bot, botAPI, session, b.hydrateBot, nil)
}

func (b *TSDialect) RouteBot(bot *meta.Bot, route *meta.Route, session *sess.Session) (*meta.Route, error) {
	return route, nil
}

func (b *TSDialect) LoadBot(bot *meta.Bot, op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {
	integrationConnection, err := op.GetIntegrationConnection()
	if err != nil {
		return err
	}
	botAPI := jsdialect.NewLoadBotAPI(bot, connection, op, integrationConnection)
	err = jsdialect.RunBot(bot, botAPI, session, b.hydrateBot, nil)
	if err != nil {
		return err
	}
	loadErrors := botAPI.GetLoadErrors()
	if len(loadErrors) > 0 {
		return meta.NewBotExecutionError(strings.Join(loadErrors, ", "))
	}
	return nil
}

func (b *TSDialect) SaveBot(bot *meta.Bot, op *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	integrationConnection, err := op.GetIntegration()
	if err != nil {
		return err
	}
	botAPI := jsdialect.NewSaveBotAPI(bot, connection, op, integrationConnection)
	return jsdialect.RunBot(bot, botAPI, session, b.hydrateBot, nil)
}

func (b *TSDialect) RunIntegrationActionBot(bot *meta.Bot, ic *adapt.IntegrationConnection, actionName string, params map[string]interface{}) (interface{}, error) {
	botAPI := jsdialect.NewRunIntegrationActionBotAPI(bot, ic, actionName, params)
	err := jsdialect.RunBot(bot, botAPI, ic.GetSession(), b.hydrateBot, nil)
	if err != nil {
		return nil, err
	}
	if len(botAPI.Errors) > 0 {
		err = &meta.BotExecutionError{Message: strings.Join(botAPI.Errors, ", ")}
	}
	return botAPI.Results, err
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
	case "LOAD":
		return DefaultLoadBotBody
	case "SAVE":
		return DefaultSaveBotBody
	case "RUNACTION":
		return DefaultRunIntegrationActionBotBody
	default:
		return DefaultBotBody
	}
}
