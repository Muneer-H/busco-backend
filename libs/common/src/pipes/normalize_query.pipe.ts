import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class NormalizeQueryPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (
      metadata.type !== 'query' ||
      value === null ||
      typeof value !== 'object'
    ) {
      return value;
    }

    const query = value as Record<string, unknown>;
    const metatype = metadata.metatype as any;
    const targetPrototype: any | undefined = metatype?.prototype;

    const normalized: Record<string, unknown> = {};

    for (const [key, raw] of Object.entries(query)) {
      // Handle array notation like "service_id[]" -> "service_id"
      const cleanKey = key.endsWith('[]') ? key.slice(0, -2) : key;
      const isArrayNotation = key.endsWith('[]');

      const propertyDesignType = targetPrototype
        ? Reflect.getMetadata('design:type', targetPrototype, cleanKey)
        : undefined;

      if (propertyDesignType === Boolean) {
        normalized[cleanKey] = this.coerceBoolean(raw);
        continue;
      }

      if (propertyDesignType === Number) {
        normalized[cleanKey] = this.coerceNumber(raw);
        continue;
      }

      if (propertyDesignType === Array || isArrayNotation) {
        normalized[cleanKey] = this.coerceArray(raw);
        continue;
      }

      // Default: leave as-is
      normalized[cleanKey] = raw;
    }

    return normalized;
  }

  private coerceBoolean(input: unknown): boolean | undefined | boolean[] {
    if (Array.isArray(input)) {
      return input.map((v) => this.stringToBoolean(v as string));
    }
    if (input === undefined || input === null || input === '') return undefined;
    return this.stringToBoolean(input as string);
  }

  private stringToBoolean(value: string): boolean {
    const lower = String(value).toLowerCase();
    if (lower === 'true' || lower === '1') return true;
    if (lower === 'false' || lower === '0') return false;
    // Fallback: non-empty string treated as true? Better to default to false only for explicit false
    return Boolean(value);
  }

  private coerceNumber(input: unknown) {
    if (Array.isArray(input)) {
      return input.map((v) => this.tryParseNumber(v));
    }
    if (input === undefined || input === null || input === '') return undefined;
    return this.tryParseNumber(input);
  }

  private tryParseNumber(value: unknown): number | string {
    const num = Number(value);
    return Number.isFinite(num) ? num : (value as string);
  }

  private coerceArray(input: unknown): unknown[] | undefined {
    if (input === undefined || input === null || input === '') return undefined;
    if (Array.isArray(input)) {
      // Try to convert array elements to numbers if they look numeric
      return input.map((item) => this.tryParseNumber(item));
    }
    const str = String(input);
    if (str.includes(',')) {
      return str
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((item) => this.tryParseNumber(item));
    }
    return [this.tryParseNumber(input)];
  }
}
