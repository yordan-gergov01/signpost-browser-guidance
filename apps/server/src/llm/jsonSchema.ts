import { z } from 'zod';

type JsonSchemaNode = Record<string, unknown>;

/**
 * Tightens a generated JSON Schema into the shape OpenAI strict mode demands:
 * every property required, no additional properties.
 *
 * The schema itself is generated from the zod definition, so there is one source
 * of truth for the response shape. Strict mode then guarantees the shape of what
 * comes back - but only the shape, which is why the parsed result is still run
 * through zod, and why the element id is still checked against the snapshot.
 */
export function toStrictJsonSchema(schema: z.ZodType): JsonSchemaNode {
  return tighten(z.toJSONSchema(schema, { target: 'draft-2020-12' }) as JsonSchemaNode);
}

function tighten(node: JsonSchemaNode): JsonSchemaNode {
  if (node['type'] === 'object') {
    const properties = (node['properties'] ?? {}) as Record<string, JsonSchemaNode>;
    for (const key of Object.keys(properties)) {
      const child = properties[key];
      if (child) properties[key] = tighten(child);
    }
    node['required'] = Object.keys(properties);
    node['additionalProperties'] = false;
  }

  if (node['type'] === 'array' && node['items']) {
    node['items'] = tighten(node['items'] as JsonSchemaNode);
  }

  for (const key of ['anyOf', 'oneOf', 'allOf'] as const) {
    const branch = node[key];
    if (Array.isArray(branch)) {
      node[key] = branch.map((entry) => tighten(entry as JsonSchemaNode));
    }
  }

  return node;
}
