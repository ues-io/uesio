package systemdialect

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/deploy"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runAppAfterSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	if len(request.Deletes) > 0 {
		err := cascadeDeleteWorkspaces(request, connection, session)
		if err != nil {
			return err
		}
	}
	if len(request.Inserts) > 0 {
		err := runStarterTemplates(request, connection, session)
		if err != nil {
			return err
		}
	}
	return nil

}

func runStarterTemplates(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	// Loop over the requests and see if any of the inserts are using a starter template.
	for _, insert := range request.Inserts {
		err := runStarterTemplate(insert, connection, session)
		if err != nil {
			return err
		}
	}
	return nil
}

func runStarterTemplate(appInsert *wire.ChangeItem, connection wire.Connection, session *sess.Session) error {
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
		return errors.New("Invalid starter template: " + starterTemplate)
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

	starterTemplateParamsMap, ok := starterTemplateParams.(map[string]interface{})
	if !ok {
		starterTemplateParamsMap = map[string]interface{}{}
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
	err = datasource.SaveWithOptions([]datasource.SaveRequest{
		{
			Collection: "uesio/studio.workspace",
			Wire:       "RunAppAfterSaveBotStarterAddWorkspace",
			Changes: &meta.WorkspaceCollection{
				newWorkspace,
			},
		},
	}, session, datasource.GetConnectionSaveOptions(connection))
	if err != nil {
		return err
	}

	// Install the specified version of this app. (create dependency record)
	err = datasource.SaveWithOptions([]datasource.SaveRequest{
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
			Params: map[string]interface{}{
				"workspaceid": newWorkspace.ID,
			},
		},
	}, session, datasource.GetConnectionSaveOptions(connection))
	if err != nil {
		return err
	}

	wsSession, err := datasource.AddWorkspaceContextByID(newWorkspace.ID, session, connection)
	if err != nil {
		return err
	}

	// Lookup this app's starter template generator bot.
	versionSession, err := datasource.EnterVersionContext(starterApp, wsSession, connection)
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

	err = deploy.GenerateToWorkspace(starterBotNamespace, starterBotName, starterTemplateParamsMap, connection, wsSession, nil)
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

	return deploy.GenerateToWorkspace(starterCompleteBotNamespace, starterCompleteBotName, starterTemplateParamsMap, connection, wsSession, nil)

}

func cascadeDeleteWorkspaces(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	adminSession := datasource.GetSiteAdminSession(session)
	wc := meta.WorkspaceCollection{}
	err := datasource.PlatformLoad(&wc, &datasource.PlatformLoadOptions{
		Fields: []wire.LoadRequestField{
			{
				ID: commonfields.Id,
			},
			{
				ID: "uesio/studio.name",
			},
		},
		Conditions: []wire.LoadRequestCondition{
			{
				Field:    "uesio/studio.app",
				Values:   request.Deletes.GetIDs(),
				Operator: "IN",
			},
		},
		Connection: connection,
	}, adminSession)
	if err != nil {
		return err
	}

	requests := []datasource.SaveRequest{}

	for _, workspace := range wc {
		requests = append(requests, datasource.SaveRequest{
			Collection: "uesio/studio.workspace",
			Wire:       "RunAppAfterSaveBot",
			Deletes:    &meta.WorkspaceCollection{workspace},
			Params: map[string]interface{}{
				"workspaceid": workspace.ID,
			},
			Options: &wire.SaveOptions{IgnoreMissingRecords: true},
		})
	}

	if len(requests) == 0 {
		return nil
	}

	return datasource.SaveWithOptions(requests, adminSession, datasource.GetConnectionSaveOptions(connection))

}
