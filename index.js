const express = require('express');//Desarollo de api en node.js
const cors = require('cors');//Pruebas con swagger
const app = express();//Desarollo de api en node.js
const userRoutes = require('./routes/users'); //Ruta de usuarios
const authRoutes = require('./routes/authenthication'); // Ruta login y registro
const swaggerUi = require('swagger-ui-express');//Declaracion de swagger
const YAML = require('yamljs');//Declaracion del archivo yaml para swagger}
const commentRoutes = require('./routes/comments');//Ruta de los comentarios

app.use(express.json());  // Solicitudes por medio del JSON

app.use(cors());
const swaggerDocument = YAML.load('./docs/swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
    res.send('Garibaldi API');
});

// Uso de las rutas
app.use('/api', userRoutes); //Ruta de usuarios
app.use('/api', authRoutes);//Ruta de autenticacion
app.use('/api', commentRoutes);//Ruta de los comentarios

const port = process.env.PORT || 80;
app.listen(port, () => {
    console.log(`Garibaldi API escuchando en el puerto ${port}...`);
});
// usar nodemon index.js para ejecutar en local

