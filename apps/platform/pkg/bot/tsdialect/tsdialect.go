package tsdialect

import (
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"

	esbuild "github.com/evanw/esbuild/pkg/api"

	"github.com/thecloudmasters/uesio/pkg/bot/jsdialect"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type TSDialect struct {
}

func (b *TSDialect) hydrateBot(bot *meta.Bot, session *sess.Session, connection wire.Connection) error {
	r, _, err := bundle.GetItemAttachment(bot, b.GetFilePath(), session, connection)
	if err != nil {
		return err
	}
	defer r.Close()

	bytes, err := io.ReadAll(r)
	if err != nil {
		return err
	}
	// Transform from TS to JS
	result := esbuild.Transform(string(bytes), esbuild.TransformOptions{
		Loader: esbuild.LoaderTS,
	})
	if len(result.Errors) > 0 {
		slog.ErrorContext(session.Context(), fmt.Sprintf("TS Bot %s compilation had %d errors and %d warnings\n",
			bot.GetKey(), len(result.Errors), len(result.Warnings)))
		return fmt.Errorf("%s", result.Errors[0].Text)
	}
	bot.FileContents = string(result.Code)
	return nil
}

func (b *TSDialect) BeforeSave(bot *meta.Bot, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	botAPI := jsdialect.NewBeforeSaveAPI(bot, request, connection, session)
	return jsdialect.RunBot(bot, botAPI, session, connection, b.hydrateBot, botAPI.AddError)
}

func (b *TSDialect) AfterSave(bot *meta.Bot, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	botAPI := jsdialect.NewAfterSaveAPI(bot, request, connection, session)
	return jsdialect.RunBot(bot, botAPI, session, connection, b.hydrateBot, botAPI.AddError)
}

func (b *TSDialect) CallBot(bot *meta.Bot, params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error) {
	return jsdialect.CallBot(bot, params, connection, session, b.hydrateBot)
}

func (b *TSDialect) CallGeneratorBot(bot *meta.Bot, create bundlestore.FileCreator, params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error) {
	return jsdialect.CallGeneratorBot(bot, create, params, connection, session, b.hydrateBot)

}

func (b *TSDialect) RouteBot(bot *meta.Bot, route *meta.Route, request *http.Request, connection wire.Connection, session *sess.Session) (*meta.Route, error) {
	botAPI := jsdialect.NewRouteBotApi(bot, route, request, session, connection)
	err := jsdialect.RunBot(bot, botAPI, session, connection, b.hydrateBot, nil)
	if err != nil {
		return nil, err
	}
	return jsdialect.HandleBotResponse(botAPI)
}

func (b *TSDialect) LoadBot(bot *meta.Bot, op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {
	integrationConnection, err := op.GetIntegrationConnection()
	if err != nil {
		return err
	}
	botAPI := jsdialect.NewLoadBotAPI(bot, op, integrationConnection)
	if err = jsdialect.RunBot(bot, botAPI, session, connection, b.hydrateBot, nil); err != nil {
		return err
	}
	loadErrors := botAPI.GetErrors()
	if len(loadErrors) > 0 {
		return exceptions.NewExecutionException(strings.Join(loadErrors, ", "))
	}
	return nil
}

func (b *TSDialect) SaveBot(bot *meta.Bot, op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	integrationConnection, err := op.GetIntegration()
	if err != nil {
		return err
	}
	botAPI := jsdialect.NewSaveBotAPI(bot, connection, op, integrationConnection)
	return jsdialect.RunBot(bot, botAPI, session, connection, b.hydrateBot, nil)
}

func (b *TSDialect) RunIntegrationActionBot(bot *meta.Bot, ic *wire.IntegrationConnection, actionName string, params map[string]any) (any, error) {
	botAPI := jsdialect.NewRunIntegrationActionBotAPI(bot, ic, actionName, params)
	err := jsdialect.RunBot(bot, botAPI, ic.GetSession(), ic.GetPlatformConnection(), b.hydrateBot, nil)
	if err != nil {
		return nil, err
	}
	if len(botAPI.Errors) > 0 {
		err = exceptions.NewExecutionException(strings.Join(botAPI.Errors, ", "))
	}
	return botAPI.Results, err
}

func (b *TSDialect) GetFilePath() string {
	return "bot.ts"
}
