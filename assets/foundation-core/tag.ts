declare const tagBrand: unique symbol;

export type Tag = string & { readonly [tagBrand]: true };

export function createTag(value: string): Tag | undefined {
  return /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(value)
    ? (value as Tag)
    : undefined;
}

