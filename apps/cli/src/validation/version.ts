function throwIfBadFormat(version: string) {
	const errorFormat = Error("Version must be formatted like so: \"v#.#.#\" Provided: " + version);
	if(version[0] !== 'v') throw errorFormat
	const parts = version.slice(1).split('.')
	if(parts.length !== 3) {
		throw errorFormat
	}
	const major = parseInt(parts[0]);
	const minor = parseInt(parts[1]);
	const patch = parseInt(parts[2]);
	if(isNaN(major) || isNaN(minor) || isNaN(patch)) {
		throw errorFormat;
	}
}

export {throwIfBadFormat}
