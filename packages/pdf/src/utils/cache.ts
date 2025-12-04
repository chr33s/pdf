class Cache<T> {
  static readonly populatedBy = <T>(populate: () => T | Promise<T>) => new Cache(populate);

  readonly #populate: () => T | Promise<T>;
  #value: T | undefined;
  #pending: Promise<T> | undefined;

  private constructor(populate: () => T | Promise<T>) {
    this.#populate = populate;
    this.#value = undefined;
    this.#pending = undefined;
  }

  getValue(): T | undefined {
    return this.#value;
  }

  access(): T {
    if (!this.#value) {
      const result = this.#populate();
      if (result instanceof Promise) {
        throw new Error(
          "Cache.access() cannot be used with async populators. Use accessAsync() instead.",
        );
      }
      this.#value = result;
    }
    return this.#value;
  }

  async accessAsync(): Promise<T> {
    if (this.#value) return this.#value;
    if (this.#pending) return this.#pending;

    const result = this.#populate();
    if (result instanceof Promise) {
      this.#pending = result;
      this.#value = await result;
      this.#pending = undefined;
    } else {
      this.#value = result;
    }
    return this.#value;
  }

  invalidate(): void {
    this.#value = undefined;
    this.#pending = undefined;
  }
}

export default Cache;
