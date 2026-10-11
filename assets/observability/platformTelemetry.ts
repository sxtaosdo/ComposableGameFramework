import { TelemetryRecord, TelemetrySchema, Scalar, ErrorDetails } from './telemetrySchema';

export interface PlatformEvent {
    readonly key: string;
    readonly name: string;
    readonly parameters: Readonly<Record<string, string | number>>;
}

function value(input: unknown, name: string): unknown {
    if (typeof input !== 'object' || input === null) return undefined;
    const field = Object.getOwnPropertyDescriptor(input, name);
    return field && 'value' in field ? field.value : undefined;
}

/** Revalidate the public adapter boundary; unknown/raw properties are never read or serialized. */
export function platformBatch(records: readonly TelemetryRecord[], platform: 'wechat' | 'native'): readonly PlatformEvent[] | null {
    if (!Array.isArray(records) || records.length > 20) return null;
    const result: PlatformEvent[] = [];
    for (let i = 0; i < records.length; i++) {
        const record = value(records, String(i));
        const context = TelemetrySchema.context(value(record, 'context'));
        const identity = TelemetrySchema.identity(record);
        const kind = value(record, 'kind'), name = value(record, 'name'), time = value(record, 'timestampMs');
        if (value(record, 'schemaVersion') !== 1 || !context || context.platform !== platform || !identity
            || typeof time !== 'number' || !Number.isSafeInteger(time) || time < 0) return null;
        let fields: Readonly<Record<string, Scalar>> | null;
        if (kind === 'event') {
            fields = TelemetrySchema.event(name, value(record, 'fields'));
            if (name === 'ad_reward_committed' && !identity.causationId) return null;
        } else if (kind === 'error') {
            fields = TelemetrySchema.error(value(record, 'fields') as ErrorDetails);
            if (!fields || name !== fields.code) return null;
        } else return null; // Breadcrumbs remain local and cannot become network events.
        if (!fields) return null;
        const key = JSON.stringify([context.environment, context.product, context.gameplay,
            context.sessionId, kind, name, identity.factId]);
        if (value(record, 'eventId') !== key) return null;
        // Firebase strings max 100 chars and max 25 parameters; the long local tuple is reconstructed server-side.
        const parameters: Record<string, string | number> = { schemaVersion: 1, kind, timestampMs: time,
            ...context, factId: identity.factId };
        if (identity.causationId) parameters.causationId = identity.causationId;
        for (const field of Object.keys(fields)) {
            const scalar = fields[field];
            if (scalar !== undefined) parameters[field] = typeof scalar === 'boolean' ? (scalar ? 1 : 0) : scalar;
        }
        if (Object.keys(parameters).length > 25) return null;
        result.push(Object.freeze({ key, name: kind === 'error' ? 'diagnostic_error' : String(name),
            parameters: Object.freeze(parameters) }));
    }
    return Object.freeze(result);
}

/** Bounded retry ledger for partial SDK submission; it cannot establish remote exactly-once delivery. */
export class PlatformSubmissionLedger {
    private readonly submitted = new Map<string, number>();
    public constructor(private readonly now: () => number = Date.now) {}
    public submit(events: readonly PlatformEvent[], send: (event: PlatformEvent) => boolean): boolean {
        const time = this.now();
        if (!Number.isSafeInteger(time) || time < 0) return false;
        for (const [key, created] of this.submitted) if (time - created >= 86400000) this.submitted.delete(key);
        for (const event of events) {
            if (this.submitted.has(event.key)) continue;
            if (!send(event)) return false;
            this.submitted.set(event.key, time);
            if (this.submitted.size > 2000) {
                const oldest = this.submitted.keys().next().value;
                if (oldest !== undefined) this.submitted.delete(oldest);
            }
        }
        return true;
    }
}

/** Also used by direct reflection callers: rebuild the wire DTO without stringifying their object. */
export function nativeParameters(name: string, input: unknown): Readonly<Record<string, string | number>> | null {
    const context = TelemetrySchema.context(input), identity = TelemetrySchema.identity(input);
    if (!context || context.platform !== 'native' || !identity) return null;
    const kind = value(input, 'kind'), time = value(input, 'timestampMs');
    const isError = name === 'diagnostic_error';
    if (kind !== (isError ? 'error' : 'event')) return null;
    // Boolean fields were mapped to 0/1 for Firebase; validate their original semantic value again.
    let fields: unknown = input;
    if (name === 'ad_video_completed') {
        if (value(input, 'completed') !== 1) return null;
        fields = { placementId: value(input, 'placementId'), completed: true };
    }
    const recordName = isError ? value(input, 'code') : name;
    const record = { schemaVersion: value(input, 'schemaVersion'), kind, name: recordName,
        timestampMs: time, context, ...identity, fields,
        eventId: JSON.stringify([context.environment, context.product, context.gameplay,
            context.sessionId, kind, recordName, identity.factId]) };
    const batch = platformBatch([record as TelemetryRecord], 'native');
    return batch?.[0]?.parameters || null;
}
