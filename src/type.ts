const guard = <T>(
	props: Readonly<{
		value: T;
		error: Error;
	}>
) => {
	const t = props.value;

	if (t !== undefined && t !== null) {
		return t;
	}

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
