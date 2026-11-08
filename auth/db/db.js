import path from "node:path"
import { open } from "sqlite"
import sqlite3 from "sqlite3"

let connection

export function getConnection() {
    if (!connection) {
        const filename = process.env.DATABASE_PATH || path.resolve(import.meta.dirname, "../../login.db")
        connection = open({ filename, driver: sqlite3.Database })
    }
    return connection
}
