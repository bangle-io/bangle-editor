export type InferObjValue<G> = G extends { [key: string]: infer V } ? V : never;
