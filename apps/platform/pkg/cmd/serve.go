package cmd

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/gorilla/mux"
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/uesio/pkg/controllers"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

func init() {

	RootCmd.AddCommand(&cobra.Command{
		Use:   "serve",
		Short: "Start Webserver",
		Run:   serve,
	})

}

func makeAPI(r *mux.Router, path string, f http.HandlerFunc, useWorkspace bool) *mux.Route {
	router := r.PathPrefix(path).Subrouter()
	router.Use(middlewares.Authenticate)
	if useWorkspace {
		router.Use(middlewares.AuthenticateWorkspace)
	}
	return router.Path("").HandlerFunc(f)
}

func siteAPI(r *mux.Router, path string, f http.HandlerFunc) *mux.Route {
	return makeAPI(r, path, f, false)
}
func siteAndWorkspaceAPI(wr *mux.Router, sr *mux.Router, path string, f http.HandlerFunc, method string) {
	siteAPI(sr, path, f).Methods(method)
	workspaceAPI(wr, path, f).Methods(method)
}
func workspaceAPI(r *mux.Router, path string, f http.HandlerFunc) *mux.Route {
	return makeAPI(r, path, f, true)
}

func serve(cmd *cobra.Command, args []string) {

	logger.Log("Running serv command!", logger.INFO)
	r := mux.NewRouter()

	r.HandleFunc("/fonts/{filename}", controllers.Fonts).Methods("GET")
	r.HandleFunc("/static/loader", controllers.ServeStatic(filepath.Join("platform", "platform.js"))).Methods("GET")
	r.HandleFunc("/static/{filename:.*}", controllers.Vendor).Methods("GET")
	r.HandleFunc("/favicon.ico", controllers.ServeStatic(filepath.Join("platform", "favicon.ico"))).Methods("GET")
	r.HandleFunc("/health", controllers.Health).Methods("GET")

	// The workspace router
	wr := r.PathPrefix("/workspace/{app}/{workspace}").Subrouter()
	// The site router
	sr := r.PathPrefix("/site").Subrouter()

	siteAndWorkspaceAPI(wr, sr, "/userfiles/upload", controllers.UploadUserFile, "POST")
	siteAndWorkspaceAPI(wr, sr, "/userfiles/download", controllers.DownloadUserFile, "GET")
	siteAndWorkspaceAPI(wr, sr, "/wires/load", controllers.Load, "POST")
	siteAndWorkspaceAPI(wr, sr, "/wires/save", controllers.Save, "POST")
	siteAndWorkspaceAPI(wr, sr, "/bots/call/{namespace}/{name}", controllers.CallBot, "POST")
	siteAndWorkspaceAPI(wr, sr, "/files/{namespace}/{name}", controllers.ServeFile, "GET")
	siteAndWorkspaceAPI(wr, sr, "/app/{namespace}/{route:.*}", controllers.ServeRoute, "GET")
	siteAndWorkspaceAPI(wr, sr, "/views/{namespace}/{name}", controllers.ViewAPI, "GET")
	siteAndWorkspaceAPI(wr, sr, "/themes/{namespace}/{name}", controllers.ThemeAPI, "GET")
	siteAndWorkspaceAPI(wr, sr, "/routes/{namespace}/{route:.*}", controllers.RouteAPI, "GET")
	siteAndWorkspaceAPI(wr, sr, "/componentpacks/{namespace}/{name}/builder", controllers.ServeComponentPack(true), "GET")
	siteAndWorkspaceAPI(wr, sr, "/componentpacks/{namespace}/{name}", controllers.ServeComponentPack(false), "GET")

	workspaceAPI(wr, "/metadata/adddependency/{bundlename}/{bundleversion}", controllers.AddDependency).Methods("POST", "GET")
	workspaceAPI(wr, "/metadata/removedependency/{bundlename}", controllers.RemoveDependency).Methods("POST", "GET")

	workspaceAPI(wr, "/metadata/deploy", controllers.Deploy).Methods("POST")
	workspaceAPI(wr, "/metadata/retrieve", controllers.Retrieve).Methods("POST", "GET")
	workspaceAPI(wr, "/metadata/storebundle", controllers.StoreBundle).Methods("POST", "GET")
	workspaceAPI(wr, "/metadata/migrate", controllers.Migrate).Methods("POST")

	workspaceAPI(wr, "/metadata/types/{type}/namespace/{namespace}/list", controllers.MetadataList).Methods("GET")
	workspaceAPI(wr, "/metadata/types/{type}/namespace/{namespace}/list/{grouping}", controllers.MetadataList).Methods("GET")
	workspaceAPI(wr, "/metadata/namespaces", controllers.NamespaceList).Methods("GET")

	workspaceAPI(wr, "/bulk/job", controllers.BulkJob).Methods("POST")
	workspaceAPI(wr, "/bulk/job/{job}/batch", controllers.BulkBatch).Methods("POST")

	workspaceAPI(wr, "/views/{namespace}/{name}/preview", controllers.ViewPreview(false)).Methods("GET")
	workspaceAPI(wr, "/views/{namespace}/{name}/edit", controllers.ViewPreview(true)).Methods("GET")

	siteAPI(sr, "/auth/login", controllers.Login).Methods("POST")
	siteAPI(sr, "/auth/logout", controllers.Logout).Methods("POST")
	siteAPI(sr, "/auth/check", controllers.AuthCheck).Methods("GET")
	siteAPI(r, "/{route:.*}", controllers.ServeLocalRoute).Methods("GET")

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
