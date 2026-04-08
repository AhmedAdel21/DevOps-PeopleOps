export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type Brand<T, B extends string> = T & { readonly _brand: B };
