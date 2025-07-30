package declarativedialect

import (
	"context"
	"errors"
	"net/http"

	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/bot/jsdialect"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type DeclarativeDialect struct {
}

type BotSaveable interface {
	Save(collection string, changes wire.Collection) error
}

func createRecordStep(stepDef *yaml.Node, api any) error {

	// Make sure our api is capable of saving
	saveAPI, ok := api.(BotSaveable)
	if !ok {
		return errors.New("you can create a record in this declarative context")
	}
	collection := meta.GetNodeValueAsString(stepDef, "collection")
	if collection == "" {
		return errors.New("no collection specified to create record step")
	}

	record, err := meta.GetMapNode(stepDef, "record")
	if err != nil {
		return errors.New("no record provided to create record step")
	}

	var item wire.Item
	record.Decode(&item)

	changes := wire.Collection{}
	changes.AddItem(&item)

	return saveAPI.Save(collection, changes)

}

func runSteps(def *yaml.Node, api any) error {
	steps, err := meta.GetMapNode(def, "steps")
	if err != nil {
		return errors.New("no steps found in declarative bot")
	}
	if steps == nil || steps.Kind != yaml.SequenceNode {
		return errors.New("invalid steps node in declarative bot")
	}
	for i := range steps.Content {
		err := runStep(steps.Content[i], api)
		if err != nil {
			return err
		}
	}
	return nil
}

func runStep(stepDef *yaml.Node, api any) error {
	stepType := meta.GetNodeValueAsString(stepDef, "type")
	switch stepType {
	case "CREATE_RECORD":
		return createRecordStep(stepDef, api)
	default:
		return errors.New("invalid step type")
	}
}

func (b *DeclarativeDialect) BeforeSave(ctx context.Context, bot *meta.Bot, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	botAPI := jsdialect.NewBeforeSaveAPI(ctx, bot, request, connection, session)
	return runSteps((*yaml.Node)(bot.Definition), botAPI)
}

func (b *DeclarativeDialect) AfterSave(ctx context.Context, bot *meta.Bot, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	botAPI := jsdialect.NewAfterSaveAPI(ctx, bot, request, connection, session)
	return runSteps((*yaml.Node)(bot.Definition), botAPI)
}

func (b *DeclarativeDialect) CallBot(ctx context.Context, bot *meta.Bot, params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error) {
	botAPI := jsdialect.NewCallBotAPI(ctx, bot, session, connection, params)
	err := runSteps((*yaml.Node)(bot.Definition), botAPI)
	if err != nil {
		return nil, err
	}
	return botAPI.Results, nil
}

func (b *DeclarativeDialect) CallGeneratorBot(ctx context.Context, bot *meta.Bot, create bundlestore.FileCreator, params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error) {
	return nil, errors.New("declarative dialect not implemented yet")
}

func (b *DeclarativeDialect) RouteBot(ctx context.Context, bot *meta.Bot, route *meta.Route, request *http.Request, connection wire.Connection, session *sess.Session) (*meta.Route, error) {
	return nil, errors.New("declarative dialect not implemented yet")
}

func (b *DeclarativeDialect) LoadBot(ctx context.Context, bot *meta.Bot, op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {
	return errors.New("declarative dialect not implemented yet")
}

func (b *DeclarativeDialect) SaveBot(ctx context.Context, bot *meta.Bot, op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	return errors.New("declarative dialect not implemented yet")
}

func (b *DeclarativeDialect) RunIntegrationActionBot(ctx context.Context, bot *meta.Bot, ic *wire.IntegrationConnection, actionName string, params map[string]any) (any, error) {
	return nil, errors.New("declarative dialect not implemented yet")
}
