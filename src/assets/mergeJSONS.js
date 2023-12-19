import fs from 'fs';
import path from 'path';

const directoryPath = '/home/tomy/Descargas/anhelo_comandas-main/src/assets';

fs.readdir(directoryPath, async (err, files) => {
  if (err) {
    return console.log('Error al leer el directorio:', err);
  }

  let allAddresses = [];

  for (const file of files) {
    if (path.extname(file) === '.json') {
      const filePath = path.join(directoryPath, file);

      try {
        const jsonContent = await fs.promises.readFile(filePath, 'utf8');
        const jsonData = JSON.parse(jsonContent);

        // Agregar la propiedad 'fecha' con valores aleatorios a cada objeto del JSON
        jsonData.forEach((obj) => {
          const randomDate = new Date(
            Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000
          );
          const day = String(randomDate.getDate()).padStart(2, '0');
          const month = String(randomDate.getMonth() + 1).padStart(2, '0');
          const year = randomDate.getFullYear();
          obj.fecha = `${day}-${month}-${year}`;
        });

        allAddresses = allAddresses.concat(jsonData);
      } catch (parseError) {
        console.error('Error al analizar JSON en el archivo:', filePath);
        console.error(parseError);
      }
    }
  }

  const combinedJSON = JSON.stringify(allAddresses, null, 2);
  fs.writeFileSync('combined_addresses.json', combinedJSON);
  console.log(
    'Direcciones combinadas con fechas aleatorias guardadas en combined_addresses.json'
  );
});
