import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import { irisMethodologySchema, type IrisMethodology } from '../types/iris';

export function irisApi(http: Http) {
    return {
        /** Route publique : aucun token requis. */
        async methodology(): Promise<IrisMethodology> {
            return parseOr(irisMethodologySchema, await http.request('/public/iris/methodology'));
        },
    };
}
