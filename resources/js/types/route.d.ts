type RouteParams = Record<string, string | number | undefined>;

interface ZiggyConfig {
    url: string;
    port: number | null;
    defaults: Record<string, unknown>;
    routes: Record<string, unknown>;
}

interface RouterInstance {
    current(name?: string, params?: any): boolean;
    params: Record<string, any>;
    has(name: string): boolean;
}

interface Route {
    (): RouterInstance;
    (name: string, params?: string | number | RouteParams, absolute?: boolean, config?: ZiggyConfig): string;
    current(name?: string, params?: any): boolean;
}

declare const route: Route;
