require('dotenv').config();
const express = require('express');
const cors = require('cors');
const afipRoutes = require('./routes/afip');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/afip', afipRoutes);

app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend funcionando correctamente' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});