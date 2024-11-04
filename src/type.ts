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

export { guard };
