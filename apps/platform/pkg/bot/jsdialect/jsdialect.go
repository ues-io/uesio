package jsdialect

import (
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/dop251/goja"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func Logger() {
}

type JSDialect struct {
}

type HydrateFunc func(bot *meta.Bot, session *sess.Session, connection wire.Connection) error

const MAX_TIMEOUT int = 45
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
	if env.ShouldCacheBotPrograms() {
		botProgramsCache = cache.NewMemoryCache[*goja.Program](15*time.Minute, 5*time.Minute)
	}
}

func (b *JSDialect) hydrateBot(bot *meta.Bot, session *sess.Session, connection wire.Connection) error {
	r, _, err := bundle.GetItemAttachment(session.Context(), bot, b.GetFilePath(), session, connection)
	if err != nil {
		return err
	}
	defer r.Close()

	bytes, err := io.ReadAll(r)
	if err != nil {
		return err
	}

	bot.FileContents = string(bytes)
	return nil
}

func getBotProgramCacheKey(bot *meta.Bot, session *sess.Session) string {
	if session.GetWorkspace() != nil {
		// In workspace mode, we need to cache by the database id (the Unique Key),
		// to ensure we don't have cross-workspace collisions.
		// To prevent needing to do cache invalidation, add the Bot modification timestamp to the key.
		return fmt.Sprintf("%s:%s:%d", bot.GetKey(), bot.GetDBID(session.GetWorkspace().UniqueKey), bot.UpdatedAt)
	} else {
		site := session.GetContextSite()
		// In site mode, include the app and bundle version along with the bot's key in the cache key,
		// to ensure that if the site's bundle is modified a new version of the bot is used.
		return fmt.Sprintf("%s:%s:%s", site.GetAppFullName(), site.Bundle.GetVersionString(), bot.GetKey())
	}
}

func CallGeneratorBot(bot *meta.Bot, create bundlestore.FileCreator, params map[string]any, connection wire.Connection, session *sess.Session, hydrate HydrateFunc) (map[string]any, error) {
	botAPI := NewGeneratorBotAPI(bot, params, create, session, connection)
	err := RunBot(bot, botAPI, session, connection, hydrate, nil)
	if err != nil {
		return nil, err
	}
	return botAPI.Results, nil
}

func CallBot(bot *meta.Bot, params map[string]any, connection wire.Connection, session *sess.Session, hydrate HydrateFunc) (map[string]any, error) {
	botAPI := NewCallBotAPI(bot, session, connection, params)
	if err := RunBot(bot, botAPI, session, connection, hydrate, botAPI.AddError); err != nil {
		return nil, err
	}
	loadErrors := botAPI.GetErrors()
	if len(loadErrors) > 0 {
		return nil, exceptions.NewExecutionException(strings.Join(loadErrors, ", "))
	}
	return botAPI.Results, nil
}

func RunBot(bot *meta.Bot, api any, session *sess.Session, connection wire.Connection, hydrateBot HydrateFunc, errorFunc func(string)) error {

	cacheKey := getBotProgramCacheKey(bot, session)

	var program *goja.Program

	// Check the file contents cache
	if botProgramsCache != nil {
		if cacheItem, err := botProgramsCache.Get(cacheKey); err == nil {
			program = cacheItem
		} else if !errors.Is(err, cache.ErrKeyNotFound) {
			slog.ErrorContext(session.Context(), fmt.Sprintf("error getting bot program for key [%s] from cache: %v", cacheKey, err))
		}
	}
	if program == nil {
		// We need to hydrate using the dialect-specific hydration mechanism
		if hydrateErr := hydrateBot(bot, session, connection); hydrateErr != nil {
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
		// Interrupt native Go functions
		vm.Interrupt("Bot: " + bot.Name + " is running too long, please check your code and run the operation again.")
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
			// errorFunc(jserr.Value().String())
			// Will just give the error without the stack.
			// Maybe we could do that for site mode?
			errorFunc(jserr.String())
		} else {
			// Not a Javascript error
			return err
		}
	}

	return nil
}

func (b *JSDialect) BeforeSave(bot *meta.Bot, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	botAPI := NewBeforeSaveAPI(bot, request, connection, session)
	return RunBot(bot, botAPI, session, connection, b.hydrateBot, botAPI.AddError)
}

func (b *JSDialect) AfterSave(bot *meta.Bot, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	botAPI := NewAfterSaveAPI(bot, request, connection, session)
	return RunBot(bot, botAPI, session, connection, b.hydrateBot, botAPI.AddError)
}

func (b *JSDialect) CallBot(bot *meta.Bot, params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error) {
	return CallBot(bot, params, connection, session, b.hydrateBot)
}

func (b *JSDialect) CallGeneratorBot(bot *meta.Bot, create bundlestore.FileCreator, params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error) {
	return CallGeneratorBot(bot, create, params, connection, session, b.hydrateBot)
}

func (b *JSDialect) RouteBot(bot *meta.Bot, route *meta.Route, request *http.Request, connection wire.Connection, session *sess.Session) (*meta.Route, error) {
	botAPI := NewRouteBotApi(bot, route, request, session, connection)
	err := RunBot(bot, botAPI, session, connection, b.hydrateBot, nil)
	if err != nil {
		return nil, err
	}
	return HandleBotResponse(botAPI)
}

func (b *JSDialect) LoadBot(bot *meta.Bot, op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {
	integrationConnection, err := op.GetIntegrationConnection()
	if err != nil {
		return err
	}
	botAPI := NewLoadBotAPI(bot, op, integrationConnection)
	if err = RunBot(bot, botAPI, session, connection, b.hydrateBot, nil); err != nil {
		return err
	}
	loadErrors := botAPI.GetErrors()
	if len(loadErrors) > 0 {
		return exceptions.NewExecutionException(strings.Join(loadErrors, "\n"))
	}
	return nil
}

func (b *JSDialect) SaveBot(bot *meta.Bot, op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	integrationConnection, err := op.GetIntegration()
	if err != nil {
		return err
	}
	botAPI := NewSaveBotAPI(bot, connection, op, integrationConnection)
	return RunBot(bot, botAPI, session, connection, b.hydrateBot, nil)
}

func (b *JSDialect) RunIntegrationActionBot(bot *meta.Bot, ic *wire.IntegrationConnection, actionName string, params map[string]any) (any, error) {
	botAPI := NewRunIntegrationActionBotAPI(bot, ic, actionName, params)
	err := RunBot(bot, botAPI, ic.GetSession(), ic.GetPlatformConnection(), b.hydrateBot, nil)
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
