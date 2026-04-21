'use strict';

const { spawnSync } = require('child_process');
const mysql = require('mysql2/promise');
const path = require('path');

const HELP_FLAGS = new Set(['--help', '-h']);
const CLEAR_FLAGS = new Set(['--clear', '--clear-db', '--fresh']);

function printHelp() {
    console.log('Usage: npm run migrate -- [options]');
    console.log('');
    console.log('Options:');
    console.log('  --clear, --clear-db, --fresh  Drop and recreate the configured database before migrating');
    console.log('  --env <name>                  Run migrations for a specific Sequelize environment');
    console.log('  --help, -h                    Show this help message');
}

function parseArgs(argv) {
    const forwardedArgs = [];
    let shouldClearDatabase = false;
    let environmentName = process.env.NODE_ENV || 'development';

    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];

        if (HELP_FLAGS.has(argument)) {
            return { showHelp: true };
        }

        if (CLEAR_FLAGS.has(argument)) {
            shouldClearDatabase = true;
            continue;
        }

        if (argument === '--env') {
            const nextArgument = argv[index + 1];

            if (!nextArgument) {
                throw new Error('Missing environment name after --env');
            }

            environmentName = nextArgument;
            forwardedArgs.push(argument, nextArgument);
            index += 1;
            continue;
        }

        if (argument.startsWith('--env=')) {
            environmentName = argument.slice('--env='.length);
            forwardedArgs.push(argument);
            continue;
        }

        forwardedArgs.push(argument);
    }

    return {
        environmentName,
        forwardedArgs,
        shouldClearDatabase,
        showHelp: false,
    };
}

function loadEnvironmentConfig(environmentName) {
    const configPath = path.resolve(__dirname, '..', 'config', 'config.js');
    const config = require(configPath);
    const environmentConfig = config[environmentName];

    if (!environmentConfig) {
        throw new Error(`No database config found for environment "${environmentName}"`);
    }

    if (!['mysql', 'mariadb'].includes(environmentConfig.dialect)) {
        throw new Error(`Clear option only supports mysql/mariadb, found "${environmentConfig.dialect}"`);
    }

    return environmentConfig;
}

function escapeIdentifier(identifier) {
    return `\`${String(identifier).replace(/`/g, '``')}\``;
}

async function clearDatabase(environmentName) {
    const environmentConfig = loadEnvironmentConfig(environmentName);
    const connection = await mysql.createConnection({
        host: environmentConfig.host,
        port: environmentConfig.port,
        user: environmentConfig.username,
        password: environmentConfig.password,
    });

    const databaseName = escapeIdentifier(environmentConfig.database);

    try {
        await connection.query(`DROP DATABASE IF EXISTS ${databaseName}`);
        await connection.query(`CREATE DATABASE ${databaseName}`);
    } finally {
        await connection.end();
    }
}

function runSequelizeMigrations(forwardedArgs) {
    const sequelizeCliPath = require.resolve('sequelize-cli/lib/sequelize');
    const result = spawnSync(process.execPath, [sequelizeCliPath, 'db:migrate', ...forwardedArgs], {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit',
    });

    if (result.error) {
        throw result.error;
    }

    process.exit(result.status || 0);
}

async function main() {
    const { environmentName, forwardedArgs, shouldClearDatabase, showHelp } = parseArgs(process.argv.slice(2));

    if (showHelp) {
        printHelp();
        return;
    }

    if (shouldClearDatabase) {
        console.log(`Clearing database for environment "${environmentName}"...`);
        await clearDatabase(environmentName);
    }

    runSequelizeMigrations(forwardedArgs);
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});