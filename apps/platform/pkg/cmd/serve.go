package cmd

import (
	"fmt"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
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

	rootCmd.AddCommand(&cobra.Command{
		Use:   "serve",
		Short: "Start Webserver",
		Run:   serve,
	})

}

func getNSParam(paramName string) string {
	return fmt.Sprintf("{%s:\\w+\\/\\w+}", paramName)
}

func getFullItemParam(paramName string) string {
	return fmt.Sprintf("{%s:\\w+\\/\\w+\\.\\w+}", paramName)
}

var appParam = getNSParam("app")
var nsParam = getNSParam("namespace")
var itemParam = fmt.Sprintf("%s/{name}", nsParam)

// Version will either be a Uesio bundle version string, e.g. v1.2.3,
// Or an 8-character short Git sha, e.g. abcd1234
var versionedItemParam = nsParam + fmt.Sprintf("/{version:(?:v[0-9]+\\.[0-9]+\\.[0-9]+)|(?:[a-z0-9]{8,})}/{name}")
var groupingParam = getFullItemParam("grouping")
var collectionParam = getFullItemParam("collectionname")

var (
	fontsPrefix  = "/fonts"
	staticPrefix = "/static"
)

func serve(cmd *cobra.Command, args []string) {

	logger.Log("Running serv command!", logger.INFO)
	r := mux.NewRouter()

	cwd, err := os.Getwd()
	if err != nil {
		logger.LogError(err)
		panic("Failed to obtain working directory")
	}

	// If we have gitsha, append that to the prefixes to enable us to have versioned assets
	gitsha := os.Getenv("GITSHA")
	cacheStaticAssets := gitsha != ""
	staticAssetsPath := ""
	if cacheStaticAssets {
		staticAssetsPath = "/" + gitsha
		file.SetAssetsPath(staticAssetsPath)
		fontsPrefix = staticAssetsPath + fontsPrefix
		staticPrefix = staticAssetsPath + staticPrefix
	}

	// Profiler Info
	// r.PathPrefix("/debug/pprof").Handler(http.DefaultServeMux)

	r.Handle(fontsPrefix+"/{filename:.*}", controller.Fonts(cwd, fontsPrefix, cacheStaticAssets)).Methods(http.MethodGet)
	r.Handle(staticPrefix+"/{filename:.*}", file.Vendor(cwd, staticPrefix, cacheStaticAssets)).Methods(http.MethodGet)
	r.HandleFunc("/favicon.ico", file.ServeStatic(filepath.Join("platform", "favicon.ico"))).Methods(http.MethodGet)
	r.HandleFunc("/health", controller.Health).Methods(http.MethodGet)

	// The workspace router
	workspacePath := fmt.Sprintf("/workspace/%s/{workspace}", appParam)
	wr := r.PathPrefix(workspacePath).Subrouter()
	wr.Use(
		middleware.Authenticate,
		middleware.LogRequestHandler,
		middleware.AuthenticateWorkspace,
	)

	// The version router
	versionPath := fmt.Sprintf("/version/%s/%s/{version}", appParam, nsParam)
	vr := r.PathPrefix(versionPath).Subrouter()
	vr.Use(
		middleware.Authenticate,
		middleware.LogRequestHandler,
		middleware.AuthenticateVersion,
	)

	// The site admin router
	siteAdminPath := fmt.Sprintf("/siteadmin/%s/{site}", appParam)
	sa := r.PathPrefix(siteAdminPath).Subrouter()
	sa.Use(
		middleware.Authenticate,
		middleware.LogRequestHandler,
		middleware.AuthenticateSiteAdmin,
	)

	// The site router
	sr := r.PathPrefix("/site").Subrouter()
	sr.Use(
		middleware.Authenticate,
		middleware.LogRequestHandler,
	)

	// The local router
	lr := r.NewRoute().Subrouter()
	lr.Use(
		middleware.Authenticate,
		middleware.LogRequestHandler,
	)

	// Userfile routes for site and workspace context
	userfileUploadPath := "/userfiles/upload"
	sr.HandleFunc(userfileUploadPath, file.UploadUserFile).Methods(http.MethodPost)
	wr.HandleFunc(userfileUploadPath, file.UploadUserFile).Methods(http.MethodPost)
	sa.HandleFunc(userfileUploadPath, file.UploadUserFile).Methods(http.MethodPost)

	userfileDeletePath := "/userfiles/delete/{fileid:.*}"
	sr.HandleFunc(userfileDeletePath, file.DeleteUserFile).Methods(http.MethodPost)
	wr.HandleFunc(userfileDeletePath, file.DeleteUserFile).Methods(http.MethodPost)
	sa.HandleFunc(userfileDeletePath, file.DeleteUserFile).Methods(http.MethodPost)

	userfileDownloadPath := "/userfiles/download"
	sr.HandleFunc(userfileDownloadPath, file.DownloadUserFile).Methods(http.MethodGet)
	wr.HandleFunc(userfileDownloadPath, file.DownloadUserFile).Methods(http.MethodGet)
	sa.HandleFunc(userfileDownloadPath, file.DownloadUserFile).Methods(http.MethodGet)

	// Wire load and save routes for site and workspace context
	wireLoadPath := "/wires/load"
	sr.HandleFunc(wireLoadPath, controller.Load).Methods(http.MethodPost)
	wr.HandleFunc(wireLoadPath, controller.Load).Methods(http.MethodPost)
	sa.HandleFunc(wireLoadPath, controller.Load).Methods(http.MethodPost)

	wireSavePath := "/wires/save"
	sr.HandleFunc(wireSavePath, controller.Save).Methods(http.MethodPost)
	wr.HandleFunc(wireSavePath, controller.Save).Methods(http.MethodPost)
	sa.HandleFunc(wireSavePath, controller.Save).Methods(http.MethodPost)

	// Bot routes for site and workspace context
	callBotPath := fmt.Sprintf("/bots/call/%s", itemParam)
	sr.HandleFunc(callBotPath, controller.CallListenerBot).Methods(http.MethodPost)
	wr.HandleFunc(callBotPath, controller.CallListenerBot).Methods(http.MethodPost)

	botParamPath := fmt.Sprintf("/bots/params/{type}/%s", itemParam)
	sr.HandleFunc(botParamPath, controller.GetBotParams).Methods(http.MethodGet)
	wr.HandleFunc(botParamPath, controller.GetBotParams).Methods(http.MethodGet)

	//
	// File (actual metadata, not userfiles) routes for site and workspace context

	// Un-versioned file serving routes - for backwards compatibility, and for local development
	filesPath := fmt.Sprintf("/files/%s", itemParam)
	sr.HandleFunc(filesPath, file.ServeFile).Methods(http.MethodGet)
	wr.HandleFunc(filesPath, file.ServeFile).Methods(http.MethodGet)
	// Versioned file serving routes
	versionedFilesPath := fmt.Sprintf("/files/%s", versionedItemParam)
	sr.HandleFunc(versionedFilesPath, file.ServeFile).Methods(http.MethodGet)
	wr.HandleFunc(versionedFilesPath, file.ServeFile).Methods(http.MethodGet)

	// Explicit namespaced route page load access for site and workspace context
	serveRoutePath := fmt.Sprintf("/app/%s/{route:.*}", nsParam)
	sr.HandleFunc(serveRoutePath, controller.ServeRoute)
	wr.HandleFunc(serveRoutePath, controller.ServeRoute)

	// Route navigation apis for site and workspace context
	collectionRoutePath := fmt.Sprintf("/routes/collection/%s/{viewtype}", itemParam)
	sr.HandleFunc(collectionRoutePath, controller.CollectionRoute).Methods(http.MethodGet)
	wr.HandleFunc(collectionRoutePath, controller.CollectionRoute).Methods(http.MethodGet)
	sr.HandleFunc(collectionRoutePath+"/{id}", controller.CollectionRoute).Methods(http.MethodGet)
	wr.HandleFunc(collectionRoutePath+"/{id}", controller.CollectionRoute).Methods(http.MethodGet)

	pathRoutePath := fmt.Sprintf("/routes/path/%s/{route:.*}", nsParam)
	sr.HandleFunc(pathRoutePath, controller.Route).Methods(http.MethodGet)
	wr.HandleFunc(pathRoutePath, controller.Route).Methods(http.MethodGet)

	// Currently the only component pack files which we support fetching are:
	// - runtime.js
	// - runtime.js.map
	// NOTE: Gorilla Mux requires use of non-capturing groups, hence the use of ?: here
	componentPackFileSuffix := "/{filename:(?:runtime\\.js(?:\\.map)?)}"

	// Un-versioned Component pack routes - for backwards compatibility, and for local development
	componentPackPath := fmt.Sprintf("/componentpacks/%s", itemParam)
	sr.HandleFunc(componentPackPath+componentPackFileSuffix, file.ServeComponentPackFile).Methods(http.MethodGet)
	wr.HandleFunc(componentPackPath+componentPackFileSuffix, file.ServeComponentPackFile).Methods(http.MethodGet)

	// Versioned component pack file routes
	versionedComponentPackPath := fmt.Sprintf("/componentpacks/%s", versionedItemParam)
	sr.HandleFunc(versionedComponentPackPath+componentPackFileSuffix, file.ServeComponentPackFile).Methods(http.MethodGet)
	wr.HandleFunc(versionedComponentPackPath+componentPackFileSuffix, file.ServeComponentPackFile).Methods(http.MethodGet)

	// Workspace context specific routes
	wr.HandleFunc("/metadata/deploy", controller.Deploy).Methods(http.MethodPost)
	wr.HandleFunc("/metadata/retrieve", controller.Retrieve).Methods(http.MethodGet, http.MethodPost)
	wr.HandleFunc("/metadata/generate/"+itemParam, controller.GenerateToWorkspace).Methods(http.MethodPost)
	wr.HandleFunc("/metadata/builder/"+itemParam, controller.BuilderMetadata).Methods(http.MethodGet)

	// Get Collection Metadata (We may be able to get rid of this someday...)
	collectionMetadataPath := fmt.Sprintf("/collections/meta/%s", collectionParam)
	wr.HandleFunc(collectionMetadataPath, controller.GetCollectionMetadata).Methods(http.MethodGet)
	sa.HandleFunc(collectionMetadataPath, controller.GetCollectionMetadata).Methods(http.MethodGet)

	// List All Available Namespaces
	namespaceListPath := "/metadata/namespaces"
	wr.HandleFunc(namespaceListPath, controller.NamespaceList).Methods(http.MethodGet)
	sa.HandleFunc(namespaceListPath, controller.NamespaceList).Methods(http.MethodGet)
	wr.HandleFunc(namespaceListPath+"/{type}", controller.NamespaceList).Methods(http.MethodGet)
	sa.HandleFunc(namespaceListPath+"/{type}", controller.NamespaceList).Methods(http.MethodGet)

	// List All Namespace Items
	itemListPath := "/metadata/types/{type}/list"
	wr.HandleFunc(itemListPath, controller.MetadataList).Methods(http.MethodGet)
	sa.HandleFunc(itemListPath, controller.MetadataList).Methods(http.MethodGet)
	vr.HandleFunc(itemListPath, controller.MetadataList).Methods(http.MethodGet)

	itemListPathWithGrouping := fmt.Sprintf("/metadata/types/{type}/list/%s", groupingParam)
	wr.HandleFunc(itemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)
	sa.HandleFunc(itemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)
	vr.HandleFunc(itemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)

	nsItemListPath := fmt.Sprintf("/metadata/types/{type}/namespace/%s/list", nsParam)
	wr.HandleFunc(nsItemListPath, controller.MetadataList).Methods(http.MethodGet)
	sa.HandleFunc(nsItemListPath, controller.MetadataList).Methods(http.MethodGet)

	nsItemListPathWithGrouping := fmt.Sprintf("/metadata/types/{type}/namespace/%s/list/%s", nsParam, groupingParam)
	wr.HandleFunc(nsItemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)
	sa.HandleFunc(nsItemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)

	// Bulk Job Routes
	bulkJobPath := "/bulk/job"
	wr.HandleFunc(bulkJobPath, controller.BulkJob).Methods(http.MethodPost)
	sa.HandleFunc(bulkJobPath, controller.BulkJob).Methods(http.MethodPost)

	bulkBatchPath := "/bulk/job/{job}/batch"
	wr.HandleFunc(bulkBatchPath, controller.BulkBatch).Methods(http.MethodPost)
	sa.HandleFunc(bulkBatchPath, controller.BulkBatch).Methods(http.MethodPost)

	// View Preview Routes
	viewPath := fmt.Sprintf("/views/%s", itemParam)
	wr.HandleFunc(viewPath+"/preview", controller.ViewPreview(false)).Methods(http.MethodGet)
	wr.HandleFunc(viewPath+"/edit", controller.ViewPreview(true)).Methods(http.MethodGet)

	// Config Value Routes
	wr.HandleFunc("/configvalues", controller.ConfigValues).Methods("GET")
	sa.HandleFunc("/configvalues", controller.ConfigValues).Methods("GET")
	wr.HandleFunc("/configvalues/"+itemParam, controller.SetConfigValue).Methods("POST")
	sa.HandleFunc("/configvalues/"+itemParam, controller.SetConfigValue).Methods("POST")

	sr.HandleFunc("/configvalues/{key}", controller.ConfigValue).Methods("GET")

	// Secrets Routes
	wr.HandleFunc("/secrets", controller.Secrets).Methods("GET")
	sa.HandleFunc("/secrets", controller.Secrets).Methods("GET")
	wr.HandleFunc("/secrets/"+itemParam, controller.SetSecret).Methods("POST")
	sa.HandleFunc("/secrets/"+itemParam, controller.SetSecret).Methods("POST")

	// Feature Flag Routes
	wr.HandleFunc("/featureflags", controller.FeatureFlag).Methods("GET")
	sa.HandleFunc("/featureflags/{user}", controller.FeatureFlag).Methods("GET")
	wr.HandleFunc("/featureflags/"+itemParam, controller.SetFeatureFlag).Methods("POST")
	sa.HandleFunc("/featureflags/"+itemParam, controller.SetFeatureFlag).Methods("POST")

	// Version context specific routes
	vr.HandleFunc("/metadata/generate/{name}", controller.Generate).Methods("POST")
	vr.HandleFunc("/bots/params/{type}/{name}", controller.GetBotParams).Methods("GET")

	// Auth Routes
	sa.HandleFunc("/auth/"+itemParam+"/createlogin", controller.CreateLogin).Methods("POST")
	sr.HandleFunc("/auth/"+itemParam+"/login", controller.Login).Methods("POST")
	sr.HandleFunc("/auth/"+itemParam+"/signup", controller.Signup).Methods("POST")
	sr.HandleFunc("/auth/"+itemParam+"/signup/confirm", controller.ConfirmSignUp).Methods("POST")
	sa.HandleFunc("/auth/"+itemParam+"/forgotpassword", controller.ForgotPassword).Methods("POST")
	sr.HandleFunc("/auth/"+itemParam+"/forgotpassword", controller.ForgotPassword).Methods("POST")
	sr.HandleFunc("/auth/"+itemParam+"/forgotpassword/confirm", controller.ConfirmForgotPassword).Methods("POST")
	sr.HandleFunc("/auth/"+itemParam+"/checkavailability/{username}", controller.CheckAvailability).Methods("POST")

	sr.HandleFunc("/auth/logout", controller.Logout).Methods("POST")
	sr.HandleFunc("/auth/check", controller.AuthCheck).Methods("GET")

	// Experimental REST api route
	sr.HandleFunc("/rest/"+itemParam, controller.Rest).Methods("GET")

	// Add Invalid Routes to all subrouters to give 404s
	invalidPath := "/{invalidroute:.*}"
	sr.HandleFunc(invalidPath, http.NotFound).Methods(http.MethodGet, http.MethodPost)
	wr.HandleFunc(invalidPath, http.NotFound).Methods(http.MethodGet, http.MethodPost)
	sa.HandleFunc(invalidPath, http.NotFound).Methods(http.MethodGet, http.MethodPost)
	vr.HandleFunc(invalidPath, http.NotFound).Methods(http.MethodGet, http.MethodPost)

	// Special handling for local routes
	lr.HandleFunc("/{route:.*}", controller.ServeLocalRoute)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	// Host can be blank by default, but in local development it should be set to "localhost"
	// to prevent the annoying "Allow incoming connections" firewall warning on Mac OS
	host := os.Getenv("HOST")
	serveAddr := host + ":" + port

	// Universal middlewares
	r.Use(middleware.GZip())

	useSSL := os.Getenv("UESIO_USE_HTTPS")
	var serveErr error
	if useSSL == "true" {
		logger.Log("Service Started over SSL on Port: "+port, logger.INFO)
		serveErr = http.ListenAndServeTLS(serveAddr, "ssl/certificate.crt", "ssl/private.key", r)
	} else {
		logger.Log("Service Started on Port: "+port, logger.INFO)
		serveErr = http.ListenAndServe(serveAddr, r)
	}
	if serveErr != nil {
		logger.LogError(serveErr)
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
