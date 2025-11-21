class Cache<T> {
  static readonly populatedBy = <T>(populate: () => T) => new Cache(populate);

  readonly #populate: () => T;
  #value: T | undefined;

  private constructor(populate: () => T) {
    this.#populate = populate;
    this.#value = undefined;
  }

  getValue(): T | undefined {
    return this.#value;
  }

  access(): T {
    if (!this.#value) this.#value = this.#populate();
    return this.#value;
  }

  invalidate(): void {
    this.#value = undefined;
  }
}

export default Cache;
