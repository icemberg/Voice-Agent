const app = require('./app');
const { PORT } = require('./config/env');

app.listen(PORT, () => {
    console.log(`Kapture mock collections webhook running on port ${PORT}`);
    console.log(`Webhook URL: http://localhost:${PORT}/webhook`);
    console.log(`Demo account loaded: ACC-88392`);
});