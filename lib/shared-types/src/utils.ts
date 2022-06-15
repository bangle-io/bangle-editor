export type UnnestObjValue<T> = T extends { [k: string]: infer U } ? U : never;
