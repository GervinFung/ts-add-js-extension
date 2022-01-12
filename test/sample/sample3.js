import s from "../s";
import s from '../s';

/**
 * @Log
 * Log for no reason
 * */
// comment
const Log = () => {
    return {
        /**
         * @log the name of the variable to be shown when Error is thrown
         *
         * ```ts
         * Example:
         * const name = 'example'
         * Expect "name": "example" to have type of "int", actual type is "string"
         * ```
         *
         * @returns the parsed value
         * */
        log: () => console.log(s),
    };
};
// comment

export default Log;
