export declare let _import: (modulePath: string) => Promise<unknown>;
export declare function _resetImport(): void;
export declare function _setImport(importFunction: (modulePath: string) => Promise<unknown>): void;
export declare function main(): Promise<void>;
