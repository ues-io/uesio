package context

import "net/http"

type AppContext struct {
	App       string
	Workspace string
	Site      string
}

func NewAppContext(appName string) *AppContext {
	return &AppContext{
		App: appName,
	}
}

func NewWorkspaceContext(appName, workspaceName string) *AppContext {
	return &AppContext{
		App:       appName,
		Workspace: workspaceName,
	}
}

func NewSiteAdminContext(appName, siteName string) *AppContext {
	return &AppContext{
		App:  appName,
		Site: siteName,
	}
}

// GetParamsObject generates a parameters map suitable for inclusion in load/save requests
func (ctx *AppContext) GetParamsObject() map[string]string {
	return map[string]string{
		"app":           ctx.App,
		"workspacename": ctx.Workspace,
		"sitename":      ctx.Site,
	}
}

// AddHeadersToRequest adds appropriate Uesio Studio context headers to the provided http.Request
func (ctx *AppContext) AddHeadersToRequest(r *http.Request) {
	if ctx.App != "" {
		r.Header.Set("x-uesio-app", ctx.App)
	}
	if ctx.Workspace != "" {
		r.Header.Set("x-uesio-workspacename", ctx.Workspace)
	}
	if ctx.Site != "" {
		r.Header.Set("x-uesio-sitename", ctx.Site)
	}
}
