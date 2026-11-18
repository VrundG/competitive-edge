import {DatabaseSync} from 'node:sqlite';
export function database(filename=':memory:') {
  const sqlite=new DatabaseSync(filename);
  return {
    sqlite,
    async batch(statements) { sqlite.exec('BEGIN');try{const values=[];for(const statement of statements)values.push(await statement.run());sqlite.exec('COMMIT');return values;}catch(error){sqlite.exec('ROLLBACK');throw error;} },
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() { return sqlite.prepare(sql).get(...args)||null; },
            async run() { return sqlite.prepare(sql).run(...args); },
            async all() { return {results:sqlite.prepare(sql).all(...args)}; }
          };
        }
      };
    }
  };
}
