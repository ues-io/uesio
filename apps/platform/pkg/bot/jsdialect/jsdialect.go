package jsdialect

import (
	"errors"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/dop251/goja"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func Logger(message string) {
	fmt.Println(message)
}

type JSDialect struct {
}

const DefaultListenerBotBody = `function %s(bot) {
    const a = bot.params.get("a")
    const b = bot.params.get("b")
    bot.addResult("answer", a + b)
}`

const DefaultRunIntegrationActionBotBody = `
function %s(bot) {
    const itemNumbers = bot.params.get("itemNumbers")
    const amount = bot.params.get("amount")
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
	const orderDetails = result.body
	const { orderNumber } = orderDetails

    bot.addResult("orderNumber", orderNumber)
}`

const DefaultLoadBotBody = `function %s(bot) {
	const collectionName = bot.loadRequest.GetCollectionName()
	[
		{
			"first_name": "Luigi",
			"last_name": "Vampa"
		},
		{
			"first_name": "Myasia",
			"last_name": "Harvey"
		},
	].forEach((record) => bot.addRecord(record))
}`

const DefaultSaveBotBody = `function %s(bot) {
	const collectionName = bot.getCollectionName()
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

const DefaultBeforeSaveBotBody = `function %s(bot) {
	bot.inserts.get().forEach(function (change) {
		const recordId = change.get("uesio/core.id");
	});
	bot.deletes.get().forEach(function (change) {
		const recordId = change.getOld("uesio/core.id");
	});
}`

const DefaultAfterSaveBotBody = `function %s(bot) {
	bot.inserts.get().forEach(function (change) {
		const recordId = change.get("uesio/core.id");
	});
	bot.deletes.get().forEach(function (change) {
		const recordId = change.getOld("uesio/core.id");
	});
}`

const DefaultBotBody = `function %s(bot) {

}`

const MAX_SECONDS time.Duration = 5

func (b *JSDialect) hydrateBot(bot *meta.Bot, session *sess.Session) error {
	_, stream, err := bundle.GetItemAttachment(bot, b.GetFilePath(), session)
	if err != nil {
		return err
	}
	content, err := io.ReadAll(stream)
	if err != nil {
		return err
	}
	bot.FileContents = string(content)
	return nil
}

func RunBot(botName string, contents string, api interface{}, errorFunc func(string)) error {

	// TODO: We could possibly not start a new VM for every Bot we run.
	vm := goja.New()
	vm.SetFieldNameMapper(goja.TagFieldNameMapper("bot", true))
	err := vm.Set("log", Logger)
	if err != nil {
		return err
	}

	time.AfterFunc(MAX_SECONDS*time.Second, func() {
		vm.Interrupt("Bot: " + botName + " is running too long, please check your code and run the operation again.")
		return //Interrupt native Go functions
	})

	runner, err := vm.RunString("(" + contents + ")")
	if err != nil {
		return err
	}
	change, ok := goja.AssertFunction(runner)
	if !ok {
		return err
	}

	_, err = change(goja.Undefined(), vm.ToValue(api))
	if err != nil {
		if errorFunc == nil {
			return err
		}
		if jserr, ok := err.(*goja.Exception); ok {
			errorFunc(jserr.Error())
		} else {
			// Not a Javascript error
			return err
		}
	}

	return nil
}

func (b *JSDialect) BeforeSave(bot *meta.Bot, request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	botAPI := NewBeforeSaveAPI(request, connection, session)
	err := b.hydrateBot(bot, session)
	if err != nil {
		return nil
	}
	return RunBot(bot.Name, bot.FileContents, botAPI, botAPI.AddError)
}

func (b *JSDialect) AfterSave(bot *meta.Bot, request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	botAPI := NewAfterSaveAPI(request, connection, session)
	err := b.hydrateBot(bot, session)
	if err != nil {
		return nil
	}
	return RunBot(bot.Name, bot.FileContents, botAPI, botAPI.AddError)
}

func (b *JSDialect) CallBot(bot *meta.Bot, params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {
	botAPI := NewCallBotAPI(bot, session, connection, params)
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

func (b *JSDialect) CallGeneratorBot(bot *meta.Bot, create retrieve.WriterCreator, params map[string]interface{}, connection adapt.Connection, session *sess.Session) error {
	botAPI := &GeneratorBotAPI{
		Session: session,
		Params: &ParamsAPI{
			Params: params,
		},
		Create:     create,
		Bot:        bot,
		Connection: connection,
	}
	if err := b.hydrateBot(bot, session); err != nil {
		return err
	}
	return RunBot(bot.Name, bot.FileContents, botAPI, nil)
}

func (b *JSDialect) RouteBot(bot *meta.Bot, route *meta.Route, session *sess.Session) error {
	return nil
}

func (b *JSDialect) LoadBot(bot *meta.Bot, op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {
	integrationConnection, err := op.GetIntegration()
	if err != nil {
		return err
	}
	botAPI := NewLoadBotAPI(bot, session, connection, op, integrationConnection)
	if err = b.hydrateBot(bot, session); err != nil {
		return err
	}
	if err = RunBot(bot.Name, bot.FileContents, botAPI, nil); err != nil {
		return err
	}
	if len(botAPI.loadErrors) > 0 {
		return errors.New(strings.Join(botAPI.loadErrors, "\n"))
	}
	return nil
}

func (b *JSDialect) SaveBot(bot *meta.Bot, op *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	integrationConnection, err := op.GetIntegration()
	if err != nil {
		return err
	}
	botAPI := NewSaveBotAPI(bot, session, connection, op, integrationConnection)
	if err := b.hydrateBot(bot, session); err != nil {
		return err
	}
	return RunBot(bot.Name, bot.FileContents, botAPI, nil)
}

func (b *JSDialect) RunIntegrationActionBot(bot *meta.Bot, action *meta.IntegrationAction, integration adapt.IntegrationConnection, params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {
	botAPI := NewRunIntegrationActionBotAPI(bot, action, integration, params, session, connection)
	err := b.hydrateBot(bot, session)
	if err != nil {
		return nil, err
	}
	err = RunBot(bot.Name, bot.FileContents, botAPI, nil)
	if err != nil {
		return nil, err
	}
	if len(botAPI.Errors) > 0 {
		err = errors.New(strings.Join(botAPI.Errors, ", "))
	}
	return botAPI.Results, err
}

func (b *JSDialect) GetFilePath() string {
	return "bot.js"
}

func (b *JSDialect) GetDefaultFileBody(botType string) string {
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
