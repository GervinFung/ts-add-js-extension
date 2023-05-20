const guard = <T, Err extends Error>({
    value,
    error,
}: Readonly<{
    value: T;
    error: () => Err;
}>) => {
    const t = value;
    if (t !== undefined && t != null) {
        return t;
    }
    throw error();
};

export { guard };
