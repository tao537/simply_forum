import 'dotenv/config';
import app from './app.js';
import './db/init.js';

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 论坛启动: http://localhost:${port}`);
});
