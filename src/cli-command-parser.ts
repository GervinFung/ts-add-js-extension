import fs from 'fs';
import path from 'path';

import pkg from './package';
import { guard } from './type';

const commandKeyWords = {
	help: {
		isMandatory: false,
		keyword: 'help',
	},
	version: {
		isMandatory: false,
		keyword: 'version',
	},
	dir: {
		isMandatory: true,
		keyword: 'dir',
	},
	include: {
		isMandatory: false,
		keyword: 'include',
	},
	showChanges: {
		type: 'deprecated',
		isMandatory: false,
		keyword: 'showchanges',
		reason: 'The function `showchanges` is deprecated in favor of `showprogress` and will be removed in version 2.0',
	},
	showProgress: {
		isMandatory: false,
		keyword: 'showprogress',
	},
	assignment: {
		assign: '=',
		key: '--',
	},
} as const;

class TokenParser {
	constructor(private readonly token: Token) {}

	readonly parseVersion = () => {
		const { keyword } = commandKeyWords.version;

		if (this.token.key !== keyword) {
			return {
				exists: false,
			} as const;
		}

		return {
			type: keyword,
			exists: true,
			value: pkg.version,
		} as const;
	};

	readonly parseHelp = () => {
		const { keyword } = commandKeyWords.help;

		if (this.token.key !== commandKeyWords.help.keyword) {
			return {
				exists: false,
			} as const;
		}

		return {
			type: keyword,
			exists: true,
			value: fs.readFileSync('public/help.md', { encoding: 'utf-8' }),
		} as const;
	};

	readonly parseDir = () => {
		const { keyword } = commandKeyWords.dir;

		if (this.token.key !== commandKeyWords.dir.keyword) {
			return {
				exists: false,
			} as const;
		}

		return {
			type: keyword,
			exists: true,
			value: guard({
				value: this.token.value.split(' ').at(0),
				error: new Error(
					'There must be at least one element in values for dir'
				),
			}),
		} as const;
	};

	readonly parseInclude = () => {
		const { keyword } = commandKeyWords.include;

		if (this.token.key !== commandKeyWords.include.keyword) {
			return {
				exists: false,
			} as const;
		}

		return {
			type: keyword,
			exists: true,
			value: this.token.value.split(' '),
		} as const;
	};

	readonly parseBoolean = <Keyword extends string>(keyword: Keyword) => {
		return () => {
			const { key, value } = this.token;

			if (key !== keyword) {
				return {
					exists: false,
				} as const;
			}

			if (value === 'true' || value === 'false') {
				return {
					type: keyword,
					exists: true,
					value: value === 'true',
				} as const;
			}

			throw new Error(
				`${key}=${value} is invalid, it can only receive boolean value`
			);
		};
	};

	readonly parseShowProgress = this.parseBoolean(
		commandKeyWords.showProgress.keyword
	);

	readonly parseShowChanges = this.parseBoolean(
		commandKeyWords.showChanges.keyword
	);

	readonly processNonRecognisableToken = () => {
		return {
			type: 'invalid',
			reason: `'${this.token.key}'='${this.token.value}' token cannot be recognized`,
			token: this.token,
		} as const;
	};
}

type Args = ReadonlyArray<string>;

type Token = Readonly<{
	key: string;
	value: string;
}>;

class ParseArgs {
	private readonly tokens: ReadonlyArray<Token>;

	private constructor(args: Args) {
		this.tokens = this.tokenize(args);
	}

	static readonly create = (arg: string) => {
		const tokens = arg.split(commandKeyWords.assignment.key);

		const result = ParseArgs.checkPackageName(tokens.at(0));

		if (result.isInvalid) {
			throw result.error;
		}

		if (tokens.includes('add')) {
			console.log(
				'The "add" in the command can be removed, as it is only used for backward compatibility'
			);
		}

		return new this(
			tokens
				.map((token) => {
					return token === 'add' ? '' : token;
				})
				.slice(1)
		);
	};

	private static readonly checkPackageName = (name: string | undefined) => {
		const packageName = guard({
			value: name,
			error: new Error('The pkg name is undefined'),
		});

		return packageName.includes(pkg.name)
			? ({
					isInvalid: false,
				} as const)
			: ({
					isInvalid: true,
					error: new Error(
						`The pkg name "${packageName}" passed is invalid`
					),
				} as const);
	};

	private readonly tokenize = (args: Args) => {
		const { assign } = commandKeyWords.assignment;

		return args
			.flatMap((arg) => {
				if (arg.includes(assign)) {
					return [arg];
				}

				const [nullableKey, ...value] = arg.split(' ');

				const key = guard({
					value: nullableKey,
					error: new Error(
						'Key cannot be undefined after being split'
					),
				});

				return [`${key}${assign}${value.join(' ')}`];
			})
			.map((args) => {
				const [key, value] = args.split(assign);

				return {
					key: guard({
						value: key,
						error: new Error(
							'Key cannot be undefined after being flat mapped'
						),
					}),
					value: guard({
						value,
						error: new Error(
							'Value cannot be undefined after being flat mapped'
						),
					}).trim(),
				} as Token;
			});
	};

	readonly asVersion = () => {
		return this.tokens.reduce(
			(result, token) => {
				if (result.exists) {
					return result;
				}
				return new TokenParser(token).parseVersion();
			},
			{
				exists: false,
			} as ReturnType<TokenParser['parseVersion']>
		);
	};

	readonly asHelp = (): ReturnType<TokenParser['parseHelp']> => {
		if (!this.tokens.length) {
			return {
				type: 'help',
				exists: true,
				value: fs.readFileSync(path.join('public', 'help.md'), {
					encoding: 'utf-8',
				}),
			};
		}
		return this.tokens.reduce(
			(result, token) => {
				if (result.exists) {
					return result;
				}
				return new TokenParser(token).parseHelp();
			},
			{ exists: false } as ReturnType<TokenParser['parseHelp']>
		);
	};

	readonly asOperation = () => {
		const processedToken = this.tokens.map((token) => {
			const parser = new TokenParser(token);
			const dir = parser.parseDir();
			if (dir.exists) {
				return dir;
			}
			const include = parser.parseInclude();
			if (include.exists) {
				return include;
			}
			const showChanges = parser.parseShowChanges();
			if (showChanges.exists) {
				return showChanges;
			}
			const showProgress = parser.parseShowProgress();
			if (showProgress.exists) {
				return showProgress;
			}
			return parser.processNonRecognisableToken();
		});

		processedToken.forEach((node) => {
			if (node.type === 'showchanges') {
				console.warn(commandKeyWords.showChanges.reason);
			}
		});

		processedToken
			.flatMap((node) => {
				return node.type !== 'invalid' ? [] : [node];
			})
			.forEach((node) => {
				console.log(
					`The "${JSON.stringify(node.token, undefined, 4)}" in the command is invalid as ${node.reason}. So please remove it`
				);
			});

		const nodes = processedToken.flatMap((node) => {
			return node.type === 'invalid' ? [] : [node];
		});

		return {
			dir: guard({
				value: nodes.find((node) => {
					return node.type === 'dir';
				})?.value,
				error: new Error(
					'dir is a mandatory field, it should be present to know which dir it should operate on'
				),
			}),
			// optional
			/**
			 * @deprecated
			 * Will be removed in version 2.0
			 * */
			include: nodes.find((node) => {
				return node.type === 'include';
			})?.value,
			/**
			 * @deprecated
			 * Will be removed in version 2.0
			 * `showChanges` is deprecated in favor of `showProgress`
			 * */
			showChanges: nodes.find((node) => {
				return node.type === 'showchanges';
			})?.value,
			showProgress: nodes.find((node) => {
				return node.type === 'showprogress';
			})?.value,
		} as const;
	};
}

type TrueConfig = ReturnType<ParseArgs['asOperation']>;

type PartialConfig = Partial<Omit<TrueConfig, 'dir'>> & Pick<TrueConfig, 'dir'>;

export type { TrueConfig, PartialConfig };

export default ParseArgs;
