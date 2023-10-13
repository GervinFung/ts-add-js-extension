export default class Log {
	static readonly fromNumberOfFiles = (numberOfFiles: number) => {
		return new Log(numberOfFiles, 0);
	};

	private constructor(
		private readonly numberOfFiles: number,
		private completedFiles: number
	) {
		if (!this.numberOfFiles) {
			throw new Error(
				'Progress cannot be instantiated when there is no files to changes'
			);
		}
	}

	// ref: https://chrisyeh96.github.io/2020/03/28/terminal-colors.html
	private readonly redify = (word: string) => {
		return `\x1b[31m${word}\x1b[0m`;
	};

	private readonly cyanify = (word: string) => {
		return `\x1b[36m${word}\x1b[0m`;
	};

	private readonly boldify = (word: string) => {
		return `\x1b[1:37m${word}\x1b[0m`;
	};

	readonly increment = (
		props: Readonly<{
			file: string;
			repeat: number;
			succeed: boolean;
		}>
	) => {
		if (this.numberOfFiles <= this.completedFiles) {
			throw new Error(
				`Number of files succeed: ${this.completedFiles} cannot be the same as number of files: ${this.numberOfFiles}`
			);
		} else {
			this.completedFiles++;
			console.log(
				`${this.completedFiles}. ${' '.repeat(
					this.numberOfFiles.toString().length -
						this.completedFiles.toString().length
				)}${this.boldify(props.file)}${' '.repeat(
					props.repeat - props.file.length
				)} - ${
					props.succeed
						? this.cyanify('SUCCEED')
						: this.redify('FAILED')
				}`
			);
		}
	};

	readonly end = (
		props: Readonly<{
			errors: ReadonlyArray<
				Readonly<{
					file: string;
					error: NodeJS.ErrnoException;
				}>
			>;
		}>
	) => {
		if (props.errors.length) {
			console.error(
				`The following file${
					props.errors.length === 1 ? '' : 's'
				} failed to add either .js file extension`
			);
			console.error(
				Array.from(props.errors)
					.sort((a, b) => {
						return a.file.length - b.file.length;
					})
					.map(({ file, error }, index) => {
						return `${index}. file: ${file}, reason: ${error.message}`;
					})
					.join('\n')
			);
		}
	};
}
