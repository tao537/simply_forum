import 'dotenv/config';
import app from './app.js';
import { initDb } from './db/init.js';

const port = process.env.PORT || 3000;
await initDb();
app.listen(port, () => {
  console.log(`🚀 论坛启动: http://localhost:${port}`);
});
