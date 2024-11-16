const express = require('express');//Desarollo de api en node.js
const cors = require('cors');//Pruebas con swagger
const app = express();//Desarollo de api en node.js
const path = require('path'); // Necesario para configurar la ruta estática de 'uploads'
const userRoutes = require('./routes/users'); //Ruta de usuarios
const authRoutes = require('./routes/authenthication'); // Ruta login y registro
const swaggerUi = require('swagger-ui-express');//Declaracion de swagger
const YAML = require('yamljs');//Declaracion del archivo yaml para swagger}
const commentRoutes = require('./routes/comments');//Ruta de los comentarios
const reservationsRoutes = require('./routes/reservations');//Ruta de los comentarios
const multimediaRoutes = require('./routes/multimedia');//Ruta de la multimedia
const ordersRoutes = require('./routes/order');//Ruta de las ordenes
const kitchenRoutes = require('./routes/kitchen');//Ruta de cocina
const barRoutes = require('./routes/bar');//Ruta de bar
const cashRoutes = require('./routes/cash');//Ruta de cocina

app.use(express.json());  // Solicitudes por medio del JSON

app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api', reservationsRoutes);//Ruta de las reservas
app.use('/api', multimediaRoutes);//Ruta de la multimedia
app.use('/api', ordersRoutes);//Ruta de las ordenes
app.use('/api', kitchenRoutes);//Ruta de cocina
app.use('/api', barRoutes);//Ruta de bar
app.use('/api', cashRoutes);//Ruta de cocina

const port = process.env.PORT || 80;
app.listen(port, () => {
    console.log(`Garibaldi API escuchando en el puerto ${port}...`);
});
// usar nodemon index.js para ejecutar en local

