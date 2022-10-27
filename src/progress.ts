import readline from 'readline';

export default class Progress {
    private numberOfFilesRan: number;
    private numberOfFilesCompleted: number;

    static readonly fromNumberOfFiles = (numberOfFiles: number) =>
        new Progress(numberOfFiles);

    private constructor(private readonly numberOfFiles: number) {
        if (!this.numberOfFiles) {
            throw new Error(
                'Progress cannot be instantiated when there is no files to changes'
            );
        }
        this.numberOfFilesRan = 0;
        this.numberOfFilesCompleted = 0;
    }

    readonly incrementNumberOfFilesRan = () => {
        if (this.numberOfFiles > this.numberOfFilesRan) {
            this.numberOfFilesRan++;
        } else {
            throw new Error(
                `number of files ran: ${this.numberOfFilesRan} cannot be the same as number of files: ${this.numberOfFiles}`
            );
        }
    };

    readonly incrementNumberOfFilesCompleted = () => {
        if (this.numberOfFiles > this.numberOfFilesCompleted) {
            this.numberOfFilesCompleted++;
        } else {
            throw new Error(
                `number of files completed: ${this.numberOfFilesCompleted} cannot be the same as number of files: ${this.numberOfFiles}`
            );
        }
    };

    private readonly cyanify = (number: string | number) =>
        `\x1b[36m${number}\x1b[0m`;

    private readonly progressLog = (
        params: Readonly<
            | {
                  percentage: number;
              } & (
                  | {
                        status: 'completed';
                    }
                  | {
                        status: 'ongoing';
                        filePath: string;
                    }
              )
        >
    ) => {
        const { percentage } = params;
        const diff = this.numberOfFilesRan - this.numberOfFilesCompleted;
        return [
            `Progress: total file${
                !this.numberOfFiles ? '' : 's'
            }: ${this.cyanify(this.numberOfFiles)}`,
            `resolved: ${this.cyanify(this.numberOfFilesCompleted)}`,
            `${!diff ? '' : `unresolved: ${this.cyanify(diff)}`}`,
            `percentage: ${this.cyanify(
                !((percentage * 10) % 10) ? percentage : percentage.toFixed(2)
            )}`,
            `${
                params.status === 'completed'
                    ? ''
                    : `resolved: ${this.cyanify(params.filePath)}`
            }`,
        ]
            .filter(Boolean)
            .join(', ');
    };

    readonly end = <T extends string>({
        errors,
        extension,
    }: Readonly<{
        extension: T;
        errors: ReadonlyArray<
            Readonly<{
                file: string;
                error: NodeJS.ErrnoException;
            }>
        >;
    }>) => {
        console.log(
            this.progressLog({
                status: 'completed',
                percentage: Math.round(
                    (this.numberOfFilesCompleted / this.numberOfFiles) * 100
                ),
            })
        );

        if (errors.length) {
            console.log(
                `The following file${
                    errors.length === 1 ? '' : 's'
                } failed to be add JavaScript file extension of ${extension}`
            );
            console.log(
                Array.from(errors)
                    .sort((a, b) => a.file.length - b.file.length)
                    .map(
                        ({ file, error }) =>
                            `file: ${file}, reason: ${error.message}`
                    )
                    .join('\n')
            );
        }
    };

    readonly show = (filePath: string) => {
        this.incrementNumberOfFilesCompleted();
        const { numberOfFiles, numberOfFilesCompleted } = this;
        const params =
            numberOfFiles === numberOfFilesCompleted
                ? ({
                      status: 'completed',
                  } as const)
                : ({
                      status: 'ongoing',
                      filePath,
                  } as const);

        if (numberOfFilesCompleted === 1) {
            process.stdout.write('\n');
        } else {
            readline.moveCursor(
                process.stdout,
                0,
                numberOfFilesCompleted > 2 ? -1 : -2
            );
            readline.clearScreenDown(process.stdout);
        }

        if (numberOfFiles > numberOfFilesCompleted) {
            const line = this.progressLog({
                ...params,
                percentage: Math.round(
                    (numberOfFilesCompleted / numberOfFiles) * 100
                ),
            });
            process.stdout.write(`${line}\n`);
        }
    };
}
