const guard = <T, Err extends Error>({
    value,
    error,
}: Readonly<{
    value: T;
    error: Err;
}>) => {
    const t = value;
    if (t !== undefined && t != null) {
        return t;
    }
    throw error;
};

const asString = ({ value, error }: Parameters<typeof guard>[0]) => {
    const s = value;
    if (typeof s === 'string') {
        return s;
    }
    throw error;
};

export { guard, asString };
