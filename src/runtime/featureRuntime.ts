import { failure, success, type Result } from "../foundation-core/result.js";
import { CapabilityRegistry } from "./capabilityRegistry.js";

export interface FeatureContext {
  readonly capabilities: CapabilityRegistry;
}

export interface Feature {
  readonly id: string;
  readonly dependencies: readonly string[];
  register(context: FeatureContext): Result<void, FeatureOperationError>;
  activate(context: FeatureContext): Result<void, FeatureOperationError>;
  deactivate(context: FeatureContext): void;
}

export interface FeatureGraphError {
  readonly code: "FEATURE_DUPLICATE" | "FEATURE_DEPENDENCY_MISSING" | "FEATURE_DEPENDENCY_CYCLE";
  readonly featureId: string;
  readonly dependencyId?: string;
}

export interface FeatureOperationError {
  readonly code: string;
  readonly featureId: string;
}

export class FeatureRuntime {
  public readonly capabilities = new CapabilityRegistry();
  private readonly features = new Map<string, Feature>();
  private active: Feature[] = [];

  public add(feature: Feature): Result<void, FeatureGraphError> {
    if (this.features.has(feature.id)) {
      return failure({ code: "FEATURE_DUPLICATE", featureId: feature.id });
    }
    this.features.set(feature.id, feature);
    return success(undefined);
  }

  public activate(): Result<void, FeatureGraphError | FeatureOperationError> {
    const order = this.resolveOrder();
    if (!order.ok) {
      return order;
    }
    const context = { capabilities: this.capabilities };
    for (const feature of order.value) {
      const registered = feature.register(context);
      if (!registered.ok) {
        this.rollback(context);
        return registered;
      }
      const activated = feature.activate(context);
      if (!activated.ok) {
        feature.deactivate(context);
        this.rollback(context);
        return activated;
      }
      this.active.push(feature);
    }
    return success(undefined);
  }

  public deactivate(): void {
    this.rollback({ capabilities: this.capabilities });
  }

  public resolveOrder(): Result<readonly Feature[], FeatureGraphError> {
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const ordered: Feature[] = [];
    const visit = (feature: Feature): FeatureGraphError | undefined => {
      if (visiting.has(feature.id)) {
        return { code: "FEATURE_DEPENDENCY_CYCLE", featureId: feature.id };
      }
      if (visited.has(feature.id)) {
        return undefined;
      }
      visiting.add(feature.id);
      for (const dependencyId of [...feature.dependencies].sort()) {
        const dependency = this.features.get(dependencyId);
        if (dependency === undefined) {
          return { code: "FEATURE_DEPENDENCY_MISSING", featureId: feature.id, dependencyId };
        }
        const error = visit(dependency);
        if (error !== undefined) {
          return error;
        }
      }
      visiting.delete(feature.id);
      visited.add(feature.id);
      ordered.push(feature);
      return undefined;
    };
    for (const feature of [...this.features.values()].sort((a, b) => a.id.localeCompare(b.id))) {
      const error = visit(feature);
      if (error !== undefined) {
        return failure(error);
      }
    }
    return success(ordered);
  }

  private rollback(context: FeatureContext): void {
    for (const feature of [...this.active].reverse()) {
      feature.deactivate(context);
    }
    this.active = [];
  }
}

