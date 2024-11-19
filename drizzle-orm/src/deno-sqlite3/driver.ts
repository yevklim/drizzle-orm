import type { Database } from "@db/sqlite";
import { entityKind } from '~/entity.ts';
import { DefaultLogger } from '~/logger.ts';
import {
	createTableRelationsHelpers,
	extractTablesRelationalConfig,
	type RelationalSchemaConfig,
	type TablesRelationalConfig,
} from '~/relations.ts';
import { BaseSQLiteDatabase } from '~/sqlite-core/db.ts';
import { SQLiteSyncDialect } from '~/sqlite-core/dialect.ts';
import type { DrizzleConfig, IfNotImported, ImportTypeError } from '~/utils.ts';
import { DenoSQLite3Session, type RunResult } from './session.ts';

export class DenoSQLite3Database<TSchema extends Record<string, unknown> = Record<string, never>>
	extends BaseSQLiteDatabase<'sync', RunResult, TSchema>
{
	static override readonly [entityKind]: string = 'DenoSQLite3Database';
}

function construct<TSchema extends Record<string, unknown> = Record<string, never>>(
	client: Database,
	config: DrizzleConfig<TSchema> = {},
): DenoSQLite3Database<TSchema> & {
	$client: Database;
} {
	const dialect = new SQLiteSyncDialect({ casing: config.casing });
	let logger;
	if (config.logger === true) {
		logger = new DefaultLogger();
	} else if (config.logger !== false) {
		logger = config.logger;
	}

	let schema: RelationalSchemaConfig<TablesRelationalConfig> | undefined;
	if (config.schema) {
		const tablesConfig = extractTablesRelationalConfig(
			config.schema,
			createTableRelationsHelpers,
		);
		schema = {
			fullSchema: config.schema,
			schema: tablesConfig.tables,
			tableNamesMap: tablesConfig.tableNamesMap,
		};
	}

	const session = new DenoSQLite3Session(client, dialect, schema, { logger });
	const db = new DenoSQLite3Database('sync', dialect, session, schema);
	(<any> db).$client = client;

	return db as any;
}

export function drizzle<
	TSchema extends Record<string, unknown> = Record<string, never>,
>(
	...params: IfNotImported<
		Database,
		| [ImportTypeError<'@db/sqlite'>],
		| [
			client: Database,
			config: DrizzleConfig<TSchema> | undefined,
		]
	>
): DenoSQLite3Database<TSchema> & {
	$client: Database;
} {
	return construct(...params) as any;
}

export namespace drizzle {
	export function mock<TSchema extends Record<string, unknown> = Record<string, never>>(
		config?: DrizzleConfig<TSchema>,
	): DenoSQLite3Database<TSchema> & {
		$client: '$client is not available on drizzle.mock()';
	} {
		return construct({} as any, config) as any;
	}
}
