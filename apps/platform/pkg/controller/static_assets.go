package controller

var assetsPath = ""

func SetAssetsPath(path string) {
	assetsPath = path
}

func GetAssetsPath() string {
	return assetsPath
}
