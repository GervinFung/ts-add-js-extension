import { parseConfig } from '../../src';

const testParseConfig = () => {
    describe('Config parsing', () => {
        it('should parse config when all config options are given', () => {
            const options = {
                dir: 'dir',
                include: ['hi'],
            };
            expect(
                parseConfig({
                    _: [],
                    $0: '',
                    ...options,
                    showchanges: true,
                })
            ).toStrictEqual({
                ...options,
                showChanges: true,
            });
        });
        it('should parse config when only non optional config options are given', () => {
            const options = {
                dir: 'dir',
            };
            expect(
                parseConfig({
                    _: [],
                    $0: '',
                    ...options,
                })
            ).toStrictEqual({
                ...options,
                include: undefined,
                showChanges: undefined,
            });
        });
    });
};

export default testParseConfig;
