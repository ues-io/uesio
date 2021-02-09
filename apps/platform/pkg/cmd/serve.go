package cmd

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/gorilla/mux"
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/uesio/pkg/controller"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func init() {

	RootCmd.AddCommand(&cobra.Command{
		Use:   "serve",
		Short: "Start Webserver",
		Run:   serve,
	})

}

func siteAPI(r *mux.Router, path string, f http.HandlerFunc) *mux.Route {
	router := r.PathPrefix(path).Subrouter()
	router.Use(middleware.Authenticate)
	return router.Path("").HandlerFunc(f)
}

func siteAndWorkspaceAPI(wr *mux.Router, sr *mux.Router, path string, f http.HandlerFunc, method string) {
	siteAPI(sr, path, f).Methods(method)
	workspaceAPI(wr, path, f).Methods(method)
}

func workspaceAPI(r *mux.Router, path string, f http.HandlerFunc) *mux.Route {
	router := r.PathPrefix(path).Subrouter()
	router.Use(middleware.Authenticate)
	router.Use(middleware.AuthenticateWorkspace)
	return router.Path("").HandlerFunc(f)
}

func siteAdminAPI(r *mux.Router, path string, f http.HandlerFunc) *mux.Route {
	router := r.PathPrefix(path).Subrouter()
	router.Use(middleware.Authenticate)
	router.Use(middleware.AuthenticateSiteAdmin)
	return router.Path("").HandlerFunc(f)
}

func serve(cmd *cobra.Command, args []string) {

	logger.Log("Running serv command!", logger.INFO)
	r := mux.NewRouter()

	r.HandleFunc("/fonts/{filename}", controller.Fonts).Methods("GET")
	r.HandleFunc("/static/loader", controller.ServeStatic(filepath.Join("platform", "platform.js"))).Methods("GET")
	r.HandleFunc("/static/{filename:.*}", controller.Vendor).Methods("GET")
	r.HandleFunc("/favicon.ico", controller.ServeStatic(filepath.Join("platform", "favicon.ico"))).Methods("GET")
	r.HandleFunc("/health", controller.Health).Methods("GET")

	// The workspace router
	wr := r.PathPrefix("/workspace/{app}/{workspace}").Subrouter()
	// The site admin router
	sar := r.PathPrefix("/siteadmin/{app}/{site}").Subrouter()
	// The site router
	sr := r.PathPrefix("/site").Subrouter()

	siteAndWorkspaceAPI(wr, sr, "/userfiles/upload", controller.UploadUserFile, "POST")
	siteAndWorkspaceAPI(wr, sr, "/userfiles/download", controller.DownloadUserFile, "GET")
	siteAndWorkspaceAPI(wr, sr, "/wires/load", controller.Load, "POST")
	siteAndWorkspaceAPI(wr, sr, "/wires/save", controller.Save, "POST")
	siteAndWorkspaceAPI(wr, sr, "/bots/call/{namespace}/{name}", controller.CallBot, "POST")
	siteAndWorkspaceAPI(wr, sr, "/files/{namespace}/{name}", controller.ServeFile, "GET")
	siteAndWorkspaceAPI(wr, sr, "/app/{namespace}/{route:.*}", controller.ServeRoute, "GET")
	siteAndWorkspaceAPI(wr, sr, "/views/{namespace}/{name}", controller.View, "GET")
	siteAndWorkspaceAPI(wr, sr, "/themes/{namespace}/{name}", controller.Theme, "GET")
	siteAndWorkspaceAPI(wr, sr, "/routes/{namespace}/{route:.*}", controller.Route, "GET")
	siteAndWorkspaceAPI(wr, sr, "/componentpacks/{namespace}/{name}/builder", controller.ServeComponentPack(true), "GET")
	siteAndWorkspaceAPI(wr, sr, "/componentpacks/{namespace}/{name}", controller.ServeComponentPack(false), "GET")

	workspaceAPI(wr, "/metadata/deploy", controller.Deploy).Methods("POST")
	workspaceAPI(wr, "/metadata/retrieve", controller.Retrieve).Methods("POST", "GET")
	workspaceAPI(wr, "/metadata/storebundle", controller.StoreBundle).Methods("POST", "GET")
	workspaceAPI(wr, "/metadata/migrate", controller.Migrate).Methods("POST")

	workspaceAPI(wr, "/metadata/types/{type}/namespace/{namespace}/list", controller.MetadataList).Methods("GET")
	workspaceAPI(wr, "/metadata/types/{type}/namespace/{namespace}/list/{grouping}", controller.MetadataList).Methods("GET")
	workspaceAPI(wr, "/metadata/namespaces", controller.NamespaceList).Methods("GET")

	workspaceAPI(wr, "/bulk/job", controller.BulkJob).Methods("POST")
	workspaceAPI(wr, "/bulk/job/{job}/batch", controller.BulkBatch).Methods("POST")

	workspaceAPI(wr, "/views/{namespace}/{name}/preview", controller.ViewPreview(false)).Methods("GET")
	workspaceAPI(wr, "/views/{namespace}/{name}/edit", controller.ViewPreview(true)).Methods("GET")

	workspaceAPI(wr, "/configvalues", controller.ConfigValue).Methods("GET")
	workspaceAPI(wr, "/secrets", controller.Secret).Methods("GET")

	siteAdminAPI(sar, "/configvalues", controller.ConfigValue).Methods("GET")
	siteAdminAPI(sar, "/secrets", controller.Secret).Methods("GET")

	siteAPI(sr, "/auth/login", controller.Login).Methods("POST")
	siteAPI(sr, "/auth/logout", controller.Logout).Methods("POST")
	siteAPI(sr, "/auth/check", controller.AuthCheck).Methods("GET")
	siteAPI(r, "/{route:.*}", controller.ServeLocalRoute).Methods("GET")

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	useSSL := os.Getenv("UESIO_USE_HTTPS")
	if useSSL == "true" {
		logger.Log("Service Started over SSL on Port: "+port, logger.INFO)
		err := http.ListenAndServeTLS(":"+port, "ssl/certificate.crt", "ssl/private.key", r)
		if err != nil {
			logger.LogError(err)
		}
	} else {
		logger.Log("Service Started on Port: "+port, logger.INFO)
		err := http.ListenAndServe(":"+port, r)
		if err != nil {
			logger.LogError(err)
		}
	}

	// CORS Stuff we don't need right now
	/*
		err := http.ListenAndServe(":"+port, handlers.CORS(
			handlers.AllowedOrigins([]string{"*"}),
			handlers.AllowedMethods([]string{"*"}),
			handlers.AllowedHeaders([]string{"*"}),
		)(r))
	*/

}
