export interface DB {
  connect(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: any): Promise<boolean>;
}
