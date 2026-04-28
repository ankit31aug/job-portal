const app = require('./app');

const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

app.listen(PORT, () => {
  console.log(`Job Portal Server running on port ${PORT} [${IS_PROD ? 'production' : 'development'}]`);
});
