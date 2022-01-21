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
	//_ "net/http/pprof"
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

	// Profiler Info
	// r.PathPrefix("/debug/pprof").Handler(http.DefaultServeMux)

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
	siteAndWorkspaceAPI(wr, sr, "/userfiles/delete/{fileid}", controller.DeleteUserFile, "POST")
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

	workspaceAPI(wr, "/collections/meta/{collectionname}", controller.GetCollectionMetadata).Methods("GET")
	workspaceAPI(wr, "/metadata/types/{type}/namespace/{namespace}/list", controller.MetadataList).Methods("GET")
	workspaceAPI(wr, "/metadata/types/{type}/namespace/{namespace}/list/{grouping}", controller.MetadataList).Methods("GET")
	workspaceAPI(wr, "/metadata/namespaces/{type}", controller.NamespaceList).Methods("GET")
	workspaceAPI(wr, "/metadata/namespaces", controller.NamespaceList).Methods("GET")
	workspaceAPI(wr, "/metadata/{badapi:.*}", http.NotFound)

	workspaceAPI(wr, "/bulk/job", controller.BulkJob).Methods("POST")
	workspaceAPI(wr, "/bulk/job/{job}/batch", controller.BulkBatch).Methods("POST")

	workspaceAPI(wr, "/views/{namespace}/{name}/preview", controller.ViewPreview(false)).Methods("GET")
	workspaceAPI(wr, "/views/{namespace}/{name}/edit", controller.ViewPreview(true)).Methods("GET")

	workspaceAPI(wr, "/configvalues", controller.ConfigValues).Methods("GET")
	workspaceAPI(wr, "/configvalues/{key}", controller.SetConfigValue).Methods("POST")
	workspaceAPI(wr, "/secrets", controller.Secrets).Methods("GET")
	workspaceAPI(wr, "/secrets/{key}", controller.SetSecret).Methods("POST")
	workspaceAPI(wr, "/featureflags", controller.FeatureFlag).Methods("GET")
	workspaceAPI(wr, "/featureflags/{key}", controller.SetFeatureFlag).Methods("POST")

	siteAdminAPI(sar, "/configvalues", controller.ConfigValues).Methods("GET")
	siteAdminAPI(sar, "/configvalues/{key}", controller.SetConfigValue).Methods("POST")
	siteAdminAPI(sar, "/secrets", controller.Secrets).Methods("GET")
	siteAdminAPI(sar, "/secrets/{key}", controller.SetSecret).Methods("POST")
	siteAdminAPI(sar, "/featureflags/{user}", controller.FeatureFlag).Methods("GET")
	siteAdminAPI(sar, "/featureflags/{key}", controller.SetFeatureFlag).Methods("POST")
	siteAdminAPI(sar, "/metadata/namespaces", controller.NamespaceList).Methods("GET")
	siteAdminAPI(sar, "/collections/meta/{collectionname}", controller.GetCollectionMetadata).Methods("GET")
	siteAdminAPI(sar, "/metadata/types/{type}/namespace/{namespace}/list", controller.MetadataList).Methods("GET")
	siteAdminAPI(sar, "/metadata/types/{type}/namespace/{namespace}/list/{grouping}", controller.MetadataList).Methods("GET")
	siteAdminAPI(sar, "/wires/load", controller.Load).Methods("POST")
	siteAdminAPI(sar, "/wires/save", controller.Save).Methods("POST")
	siteAdminAPI(sar, "/bulk/job", controller.BulkJob).Methods("POST")
	siteAdminAPI(sar, "/bulk/job/{job}/batch", controller.BulkBatch).Methods("POST")

	siteAPI(sr, "/configvalues/{key}", controller.ConfigValue).Methods("GET")
	siteAPI(sr, "/auth/login", controller.Login).Methods("POST")
	siteAPI(sr, "/auth/logout", controller.Logout).Methods("POST")
	siteAPI(sr, "/auth/check", controller.AuthCheck).Methods("GET")
	siteAPI(r, "/{route:.*}", controller.ServeLocalRoute).Methods("GET")

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	// Verify that required environment variables are set.
	platformDSType := os.Getenv("UESIO_PLATFORM_DATASOURCE_TYPE")
	platformFSType := os.Getenv("UESIO_PLATFORM_FILESOURCE_TYPE")

	if platformDSType == "" {
		logger.Log("No Platform Data Source Type Specified", logger.ERROR)
	}

	if platformFSType == "" {
		logger.Log("No Platform File Source Type Specified", logger.ERROR)
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
