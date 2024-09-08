const guard = <T, Err extends Error>(
	props: Readonly<{
		value: T;
		error: Err;
	}>
) => {
	const t = props.value;
	if (t !== undefined && t !== null) {
		return t;
	}
	// eslint-disable-next-line @typescript-eslint/only-throw-error
	throw props.error;
};

const asString = (props: Parameters<typeof guard>[0]) => {
	const s = props.value;
	if (typeof s === 'string') {
		return s;
	}
	throw props.error;
};

export { guard, asString };
