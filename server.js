const express = require('express');
const printplus = require('./printplus.js').default;

const app = express();
app.use(printplus);

app.get('*', (req, res) => {
    res.json(req.clientData);
});

app.listen(3000, () => {
    console.log('Listening on port 3000');
});
