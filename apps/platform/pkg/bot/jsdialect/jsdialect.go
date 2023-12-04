package jsdialect

import (
	"bytes"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/dop251/goja"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func Logger() {
}

type JSDialect struct {
}

const DefaultListenerBotBody = `export default function %s(bot) {
    const a = bot.params.get("a")
    const b = bot.params.get("b")
    bot.addResult("answer", a + b)
}`

const DefaultRunIntegrationActionBotBody = `export default function %s(bot) {
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

const DefaultLoadBotBody = `export default function %s(bot) {
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

const DefaultSaveBotBody = `export default function %s(bot) {
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

const DefaultBeforeSaveBotBody = `export default function %s(bot) {
	bot.inserts.get().forEach(function (change) {
		const recordId = change.get("uesio/core.id");
	});
	bot.deletes.get().forEach(function (change) {
		const recordId = change.getOld("uesio/core.id");
	});
}`

const DefaultAfterSaveBotBody = `export default function %s(bot) {
	bot.inserts.get().forEach(function (change) {
		const recordId = change.get("uesio/core.id");
	});
	bot.deletes.get().forEach(function (change) {
		const recordId = change.getOld("uesio/core.id");
	});
}`

const DefaultBotBody = `export default function %s(bot) {

}`

const MAX_TIMEOUT int = 30
const DEFAULT_TIMEOUT int = 5

func getTimeout(timeout int) int {
	if timeout <= 0 {
		return DEFAULT_TIMEOUT
	}
	if timeout > MAX_TIMEOUT {
		return MAX_TIMEOUT
	}
	return timeout
}

var botProgramsCache cache.Cache[*goja.Program]

func init() {
	// Always cache bot programs by default
	if os.Getenv("UESIO_CACHE_BOT_PROGRAMS") != "false" {
		botProgramsCache = cache.NewMemoryCache[*goja.Program](15*time.Minute, 5*time.Minute)
	}
}

func (b *JSDialect) hydrateBot(bot *meta.Bot, session *sess.Session) error {
	buf := &bytes.Buffer{}
	if _, err := bundle.GetItemAttachment(buf, bot, b.GetFilePath(), session); err != nil {
		return err
	}
	bot.FileContents = string(buf.Bytes())
	return nil
}

func RunBot(bot *meta.Bot, api interface{}, session *sess.Session, hydrateBot func(*meta.Bot, *sess.Session) error, errorFunc func(string)) error {
	cacheKey := bot.GetKey()
	// In workspace mode, we need to cache by the database id (the Unique Key),
	// to ensure we don't have cross-workspace collisions.
	// To prevent needing to do cache invalidation, add the Bot modification timestamp to the key.
	if session.GetWorkspace() != nil {
		cacheKey = fmt.Sprintf("%s:%d", bot.GetDBID(session.GetWorkspace().UniqueKey), bot.UpdatedAt)
	}

	var program *goja.Program

	// Check the file contents cache
	if botProgramsCache != nil {
		if cacheItem, err := botProgramsCache.Get(cacheKey); err == nil && cacheItem != nil {
			program = cacheItem
		}
	}
	if program == nil {
		// We need to hydrate using the dialect-specific hydration mechanism
		if hydrateErr := hydrateBot(bot, session); hydrateErr != nil {
			return hydrateErr
		}
		if compiledProgram, compileErr := goja.Compile(cacheKey, strings.ReplaceAll("("+bot.FileContents+")", "export default function", "function"), true); compileErr != nil {
			return compileErr
		} else {
			program = compiledProgram
			// add to cache
			if botProgramsCache != nil {
				if cacheErr := botProgramsCache.Set(cacheKey, program); cacheErr != nil {
					return cacheErr
				}
			}
		}
	}

	vm := goja.New()
	vm.SetFieldNameMapper(goja.TagFieldNameMapper("bot", true))
	if err := vm.Set("log", Logger); err != nil {
		return err
	}
	time.AfterFunc(time.Duration(getTimeout(bot.Timeout))*time.Second, func() {
		vm.Interrupt("Bot: " + bot.Name + " is running too long, please check your code and run the operation again.")
		return //Interrupt native Go functions
	})
	runner, err := vm.RunProgram(program)
	if err != nil {
		return err
	}
	change, ok := goja.AssertFunction(runner)
	if !ok {
		// If the bot is not a function, check for a function with the same name as the bot
		change, ok = goja.AssertFunction(vm.Get(bot.Name))
		if !ok {
			return errors.New("invalid bot code. A bot must export a function with the same name as the bot")
		}
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
	botAPI := NewBeforeSaveAPI(bot, request, connection, session)
	return RunBot(bot, botAPI, session, b.hydrateBot, botAPI.AddError)
}

func (b *JSDialect) AfterSave(bot *meta.Bot, request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	botAPI := NewAfterSaveAPI(bot, request, connection, session)
	return RunBot(bot, botAPI, session, b.hydrateBot, botAPI.AddError)
}

func (b *JSDialect) CallBot(bot *meta.Bot, params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {
	botAPI := NewCallBotAPI(bot, session, connection, params)
	if err := RunBot(bot, botAPI, session, b.hydrateBot, nil); err != nil {
		return nil, err
	}
	return botAPI.Results, nil
}

func (b *JSDialect) CallGeneratorBot(bot *meta.Bot, create bundlestore.FileCreator, params map[string]interface{}, connection adapt.Connection, session *sess.Session) error {
	botAPI := &GeneratorBotAPI{
		Session: session,
		Params: &ParamsAPI{
			Params: params,
		},
		Create:     create,
		Bot:        bot,
		Connection: connection,
	}
	return RunBot(bot, botAPI, session, b.hydrateBot, nil)
}

func (b *JSDialect) RouteBot(bot *meta.Bot, route *meta.Route, session *sess.Session) (*meta.Route, error) {
	return route, nil
}

func (b *JSDialect) LoadBot(bot *meta.Bot, op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {
	integrationConnection, err := op.GetIntegrationConnection()
	if err != nil {
		return err
	}
	botAPI := NewLoadBotAPI(bot, connection, op, integrationConnection)
	if err = RunBot(bot, botAPI, session, b.hydrateBot, nil); err != nil {
		return err
	}
	if len(botAPI.loadErrors) > 0 {
		return exceptions.NewExecutionException(strings.Join(botAPI.loadErrors, "\n"))
	}
	return nil
}

func (b *JSDialect) SaveBot(bot *meta.Bot, op *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	integrationConnection, err := op.GetIntegration()
	if err != nil {
		return err
	}
	botAPI := NewSaveBotAPI(bot, connection, op, integrationConnection)
	return RunBot(bot, botAPI, session, b.hydrateBot, nil)
}

func (b *JSDialect) RunIntegrationActionBot(bot *meta.Bot, ic *adapt.IntegrationConnection, actionName string, params map[string]interface{}) (interface{}, error) {
	botAPI := NewRunIntegrationActionBotAPI(bot, ic, actionName, params)
	err := RunBot(bot, botAPI, ic.GetSession(), b.hydrateBot, nil)
	if err != nil {
		return nil, err
	}
	if len(botAPI.Errors) > 0 {
		err = exceptions.NewExecutionException(strings.Join(botAPI.Errors, ", "))
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
