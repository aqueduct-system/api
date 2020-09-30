type Properties<T> = { [P in keyof T]: T[P] };

export type Model<T> = Properties<T> & {
    asJson(): T;
    save(): T;
}
