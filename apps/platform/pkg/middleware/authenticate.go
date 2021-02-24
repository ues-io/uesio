package middleware

import (
	"context"
	"errors"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func init() {
	session.Global.Close()
	allowInsecureCookies := os.Getenv("UESIO_ALLOW_INSECURE_COOKIES")
	storageType := os.Getenv("UESIO_SESSION_STORE")

	var store session.Store
	if storageType == "filesystem" {
		store = auth.NewFSSessionStore()
	} else if storageType == "" {
		store = session.NewInMemStore()
	} else {
		panic("UESIO_SESSION_STORE is an unrecognized value: " + storageType)
	}

	options := &session.CookieMngrOptions{
		AllowHTTP: allowInsecureCookies == "true",
	}

	session.Global = session.NewCookieManagerOptions(store, options)
}

// Authenticate checks to see if the current user is logged in
func Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		// Get the site we're currently using from our host
		// TODO: for better performance, we could think about
		// Getting the site from the session if it exists.
		// That way we wouldn't have to look up the site from the
		// host every time we authenticate.
		site, err := auth.GetSiteFromHost(r.Host)
		if err != nil {
			http.Error(w, "Failed to get site from domain:"+err.Error(), http.StatusInternalServerError)
			return
		}

		bundleDef, err := bundle.GetSiteAppBundle(site)
		if err != nil {
			http.Error(w, "Failed to get app bundle from site:"+err.Error(), http.StatusInternalServerError)
			return
		}

		site.SetAppBundle(bundleDef)

		s, err := sess.GetSessionFromRequest(w, r, site)
		if err != nil {
			http.Error(w, "Failed to create session", http.StatusInternalServerError)
			return
		}

		permSet, err := getProfilePermSet(s)
		if err != nil {
			http.Error(w, "Failed to load permissions: "+err.Error(), http.StatusInternalServerError)
			return
		}

		s.SetPermissions(permSet)

		// We have a session, use it
		ctx := context.WithValue(r.Context(), sessionKey, s)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func AuthenticateSiteAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		appName := vars["app"]
		siteName := vars["site"]

		session := GetSession(r)
		site := session.GetSite()
		perms := session.GetPermissions()

		// 1. Make sure we're in a site that can read/modify workspaces
		if site.AppRef != "studio" {
			err := errors.New("this site does not allow administering other sites")
			logger.LogError(err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		// 2. we should have a profile that allows modifying workspaces
		if !perms.HasPermission(&meta.PermissionSet{
			NamedRefs: map[string]bool{
				"workspace_admin": true,
			},
		}) {
			err := errors.New("your profile does not allow you to administer sites")
			logger.LogError(err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Get the Workspace from the DB
		var siteadmin meta.Site
		err := datasource.PlatformLoadOne(
			&siteadmin,
			[]adapt.LoadRequestCondition{
				{
					Field: "uesio.id",
					Value: siteName + "_" + appName,
				},
			},
			session,
		)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Failed querying workspace: "+err.Error(), http.StatusInternalServerError)
			return
		}

		session.SetSiteAdmin(&siteadmin)

		bundleDef, err := bundle.GetAppBundle(session)
		if err != nil {
			http.Error(w, "Failed to get app bundle from site:"+err.Error(), http.StatusInternalServerError)
			return
		}

		session.GetSiteAdmin().SetAppBundle(bundleDef)

		next.ServeHTTP(w, r)
	})
}

// AuthenticateWorkspace checks to see if the current user is logged in
func AuthenticateWorkspace(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		appName := vars["app"]
		workspaceName := vars["workspace"]

		err := datasource.AddContextWorkspace(appName, workspaceName, GetSession(r))
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Failed querying workspace: "+err.Error(), http.StatusInternalServerError)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func loadAndHydrateProfile(profileKey string, session *sess.Session) (*meta.Profile, error) {
	profile, err := meta.NewProfile(profileKey)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(profile, session)
	if err != nil {
		logger.Log("Failed Permission Request: "+profileKey+" : "+err.Error(), logger.INFO)
		return nil, err
	}
	// LoadFromSite in the permission sets for this profile
	for _, permissionSetRef := range profile.PermissionSetRefs {

		permissionSet, err := meta.NewPermissionSet(permissionSetRef)
		if err != nil {
			return nil, err
		}

		err = bundle.Load(permissionSet, session)
		if err != nil {
			logger.Log("Failed Permission Request: "+permissionSetRef+" : "+err.Error(), logger.INFO)
			return nil, err
		}
		profile.PermissionSets = append(profile.PermissionSets, *permissionSet)
	}
	return profile, nil
}

func getProfilePermSet(session *sess.Session) (*meta.PermissionSet, error) {
	profileKey := session.GetProfile()
	if profileKey == "" {
		return nil, errors.New("No profile found in session")
	}
	profile, err := loadAndHydrateProfile(profileKey, session)
	if err != nil {
		return nil, errors.New("Error Loading Profile: " + profileKey + " : " + err.Error())
	}

	return profile.FlattenPermissions(), nil
}
