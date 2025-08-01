package systemdialect

import (
	"context"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/deploy"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runAppAfterSaveBot(ctx context.Context, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	if len(request.Inserts) > 0 {
		err := runStarterTemplates(ctx, request, connection, session)
		if err != nil {
			return err
		}
	}
	return nil

}

func runStarterTemplates(ctx context.Context, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	// Loop over the requests and see if any of the inserts are using a starter template.
	for _, insert := range request.Inserts {
		err := runStarterTemplate(ctx, insert, connection, session)
		if err != nil {
			return err
		}
	}
	return nil
}

func runStarterTemplate(ctx context.Context, appInsert *wire.ChangeItem, connection wire.Connection, session *sess.Session) error {
	appID, err := appInsert.GetFieldAsString("uesio/core.id")
	if err != nil {
		return err
	}
	starterTemplate, err := appInsert.GetFieldAsString("uesio/studio.starter_template")
	if err != nil || starterTemplate == "" {
		return nil
	}

	starterTemplateParts := strings.Split(starterTemplate, ":")
	if len(starterTemplateParts) != 2 {
		return fmt.Errorf("invalid starter template: %s", starterTemplate)
	}
	starterApp := starterTemplateParts[0]
	starterAppVersion := starterTemplateParts[1]

	major, minor, patch, err := meta.ParseVersionString(starterAppVersion)
	if err != nil {
		return err
	}

	starterTemplateParams, err := appInsert.GetField("uesio/studio.starter_template_params")
	if err != nil {
		return err
	}

	starterTemplateParamsMap, ok := starterTemplateParams.(map[string]any)
	if !ok {
		starterTemplateParamsMap = map[string]any{}
	}

	bundleUniqueKey := strings.Join([]string{starterApp, major, minor, patch}, ":")

	newWorkspace := &meta.Workspace{
		Name: "dev",
		App: &meta.App{
			BuiltIn: meta.BuiltIn{
				ID: appID,
			},
		},
	}

	// Create a new workspace called dev
	err = datasource.SaveWithOptions(ctx, []datasource.SaveRequest{
		{
			Collection: "uesio/studio.workspace",
			Wire:       "RunAppAfterSaveBotStarterAddWorkspace",
			Changes: &meta.WorkspaceCollection{
				newWorkspace,
			},
		},
	}, session, datasource.NewSaveOptions(connection, nil))
	if err != nil {
		return err
	}

	// Install the specified version of this app. (create dependency record)
	err = datasource.SaveWithOptions(ctx, []datasource.SaveRequest{
		{
			Collection: "uesio/studio.bundledependency",
			Wire:       "RunAppAfterSaveBotBundleDep",
			Changes: &meta.BundleDependencyCollection{
				{
					App: &meta.App{
						BuiltIn: meta.BuiltIn{
							UniqueKey: starterApp,
						},
					},
					Workspace: &meta.Workspace{
						BuiltIn: meta.BuiltIn{
							ID: newWorkspace.ID,
						},
					},
					Bundle: &meta.Bundle{
						BuiltIn: meta.BuiltIn{
							UniqueKey: bundleUniqueKey,
						},
					},
				},
			},
			Params: map[string]any{
				"workspaceid": newWorkspace.ID,
			},
		},
	}, session, datasource.NewSaveOptions(connection, nil))
	if err != nil {
		return err
	}

	wsSession, err := datasource.AddWorkspaceContextByID(ctx, newWorkspace.ID, session, connection)
	if err != nil {
		return err
	}

	// Lookup this app's starter template generator bot.
	versionSession, err := datasource.EnterVersionContext(ctx, starterApp, wsSession, connection)
	if err != nil {
		return err
	}

	// First run the starter bot
	starterBotName := versionSession.GetContextAppBundle().StarterBot

	if starterBotName == "" {
		return nil
	}

	starterBotNamespace, starterBotName, err := meta.ParseKey(starterBotName)
	if err != nil {
		return err
	}

	_, err = deploy.GenerateToWorkspace(ctx, starterBotNamespace, starterBotName, starterTemplateParamsMap, connection, wsSession, nil)
	if err != nil {
		return err
	}

	// Next run the starter complete bot. Two bots are necessary in order to have the workspace ready to bundle in the second bot
	starterCompleteBotName := versionSession.GetContextAppBundle().StarterCompleteBot

	if starterCompleteBotName == "" {
		return nil
	}

	starterCompleteBotNamespace, starterCompleteBotName, err := meta.ParseKey(starterCompleteBotName)
	if err != nil {
		return err
	}

	_, err = deploy.GenerateToWorkspace(ctx, starterCompleteBotNamespace, starterCompleteBotName, starterTemplateParamsMap, connection, wsSession, nil)
	return err
}
