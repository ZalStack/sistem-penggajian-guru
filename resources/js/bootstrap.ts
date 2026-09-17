import { route as ziggyRoute } from 'ziggy-js';
import { Ziggy } from './ziggy';

(window as any).Ziggy = Ziggy;

function createRoute(name?: string, params?: any, absolute?: boolean): any {
    if (name) {
        return ziggyRoute(name as any, params, absolute);
    }
    return ziggyRoute(undefined, undefined, absolute);
}

createRoute.current = (name?: string, params?: any): any => {
    const router = ziggyRoute() as any;
    return router.current(name, params);
};

(window as any).route = createRoute;
