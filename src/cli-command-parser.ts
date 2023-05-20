import fs from 'fs';
import { guard } from './type';
import pkg from './package';

const commandKeyWords = {
    help: {
        isMandatory: false,
        keyword: '--help',
    },
    version: {
        isMandatory: false,
        keyword: '--version',
    },
    dir: {
        isMandatory: true,
        keyword: '--dir',
    },
    include: {
        isMandatory: false,
        keyword: '--include',
    },
    showChanges: {
        type: 'deprecated',
        isMandatory: false,
        keyword: '--showchanges',
        reason: 'The function showchanges is deprecated in favor of `showprorgess`',
    },
} as const;

class TokenParser {
    constructor(private readonly token: string) {}

    readonly parseVersion = () => {
        if (this.token !== commandKeyWords.version.keyword) {
            return {
                status: 'no',
            } as const;
        }
        return {
            status: 'yes',
            type: 'version',
            value: pkg.version,
        } as const;
    };

    readonly parseHelp = () => {
        if (this.token !== commandKeyWords.help.keyword) {
            return {
                status: 'no',
            } as const;
        }
        return {
            status: 'yes',
            type: 'help',
            value: fs.readFileSync('public/help.md', { encoding: 'utf-8' }),
        } as const;
    };

    readonly parseDir = () => {
        const [dirWord, dirTarget] = this.token.split('=');

        if (dirWord !== commandKeyWords.dir.keyword) {
            return {
                status: 'no',
            } as const;
        }

        return {
            status: 'yes',
            type: 'dir',
            value: guard({
                value: dirTarget,
                error: () =>
                    new Error(
                        `There is no directory to target since ${dirWord}={empty}`
                    ),
            }),
        } as const;
    };

    readonly parseInclude = () => {
        const [includeWord, includeTarget] = this.token.split('=');

        if (includeWord !== commandKeyWords.include.keyword) {
            return {
                status: 'no',
            } as const;
        }

        return {
            status: 'yes',
            type: 'include',
            value: guard({
                value: includeTarget,
                error: () =>
                    new Error(
                        `There is no include directories to target since ${includeWord}={empty}`
                    ),
            }).split(','),
        } as const;
    };

    readonly processShowChanges = () => {
        const [includeWord, includeTarget] = this.token.split('=');

        if (includeWord !== commandKeyWords.showChanges.keyword) {
            return {
                status: 'no',
            } as const;
        }

        if (includeTarget === 'true' || includeTarget === 'false') {
            return {
                status: 'yes',
                type: 'showChanges',
                value: JSON.parse(includeTarget) as boolean,
            } as const;
        }

        throw new Error(
            `${includeWord}=${includeTarget} is invalid, it can only receive boolean value`
        );
    };

    readonly processNonRecognisableToken = () => {
        return {
            status: 'invalid',
            reason: 'then token cannot be recognized',
            token: this.token,
        } as const;
    };
}

export default class ParseArgs {
    private constructor(private readonly tokens: ReadonlyArray<string>) {}

    static readonly create = (tokens: ReadonlyArray<string>) => {
        const name = ParseArgs.checkPackageName(tokens.at(1));
        if (name !== 'proceed') {
            throw name.error;
        }

        if (tokens.includes('add')) {
            console.warn(
                'The "add" in the command can be removed, as it is only used for backward compatibility'
            );
        }
        return new this(
            tokens
                .map((token) => (token === 'add' ? '' : token))
                .filter((_, index) => index)
        );
    };

    private static readonly checkPackageName = (name: string | undefined) =>
        name?.includes(pkg.name ?? '')
            ? 'proceed'
            : {
                  error: new Error(`The pkg name "${name}" passed is invalid`),
              };

    readonly asVersion = () => {
        type ParseVersion = ReturnType<TokenParser['parseVersion']>;
        const purifiedTokens = this.tokens;

        const version = purifiedTokens.reduce(
            (result, token) => {
                if (result?.status === 'yes') {
                    return result;
                }
                return new TokenParser(token).parseVersion();
            },
            { status: 'no' } as ParseVersion
        );

        if (version.status === 'no') {
            return {
                proceed: false,
            } as const;
        }

        return {
            proceed: true,
            value: version.value,
        } as const;
    };

    readonly asHelp = () => {
        type ParseHelp = ReturnType<TokenParser['parseHelp']>;
        const purifiedTokens = this.tokens;

        const help =
            purifiedTokens.length === 1
                ? ({
                      status: 'yes',
                      type: 'help',
                      value: fs.readFileSync('public/help.md', {
                          encoding: 'utf-8',
                      }),
                  } as ParseHelp)
                : purifiedTokens.reduce(
                      (result, token) => {
                          if (result?.status === 'yes') {
                              return result;
                          }
                          return new TokenParser(token).parseHelp();
                      },
                      { status: 'no' } as ParseHelp
                  );

        if (help.status === 'no') {
            return {
                proceed: false,
            } as const;
        }

        return {
            proceed: true,
            guide: help.value,
        } as const;
    };

    readonly asOperation = () => {
        const purifiedTokens = this.tokens
            .map((token) => (token === 'add' ? '' : token))
            .filter(Boolean)
            .filter((_, index) => index);

        const processedToken = purifiedTokens.map((token) => {
            const parser = new TokenParser(token);
            const dir = parser.parseDir();
            if (dir.status === 'yes') {
                return dir;
            }
            const include = parser.parseInclude();
            if (include.status === 'yes') {
                return include;
            }
            const showChanges = parser.processShowChanges();
            if (showChanges.status === 'yes') {
                return showChanges;
            }
            return parser.processNonRecognisableToken();
        });

        processedToken
            .flatMap((node) => (node.status !== 'invalid' ? [] : [node]))
            .forEach((node) =>
                console.warn(
                    `The "${node.token}" in the command is invalid as ${node.reason}. So please remove it`
                )
            );

        const nodes = processedToken.flatMap((node) =>
            node.status !== 'yes' ? [] : [node]
        );

        return {
            dir: guard({
                value: nodes.find((node) => node.type === 'dir')
                    ?.value as ReturnType<TokenParser['parseDir']>['value'],
                error: () =>
                    new Error(
                        'dir is a mandatory field, it should be present to know which dir it should operate on'
                    ),
            }),
            // optional
            include: nodes.find((node) => node.type === 'include')
                ?.value as ReturnType<TokenParser['parseInclude']>['value'],
            showChanges: nodes.find((node) => node.type === 'showChanges')
                ?.value as ReturnType<
                TokenParser['processShowChanges']
            >['value'],
        } as const;
    };
}

type TrueConfig = ReturnType<ParseArgs['asOperation']>;

type PartialConfig = Partial<Omit<TrueConfig, 'dir'>> & Pick<TrueConfig, 'dir'>;

export type { TrueConfig, PartialConfig };
