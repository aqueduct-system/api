const { NODE_ENV } = process.env;

export function isDev() {
    return NODE_ENV === 'dev';
}

export function isTest() {
    return NODE_ENV === 'test';
}
