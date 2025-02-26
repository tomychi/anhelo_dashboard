const axios = require('axios');
const xml2js = require('xml2js');
const { exec } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const util = require('util');
const execAsync = util.promisify(exec);

class AfipService {
  constructor() {
    this.wsfeUrl = process.env.AFIP_URL || 'https://servicios1.afip.gov.ar/wsfev1/service.asmx';
    this.wsaaUrl = 'https://wsaa.afip.gov.ar/ws/services/LoginCms';
    this.xmlParser = new xml2js.Parser({ explicitArray: false });
    this.certificatePath = path.join(__dirname, '..', 'certificates', 'certificado.crt');
    this.privateKeyPath = path.join(__dirname, '..', 'certificates', 'MiClavePrivada.key');
    this.basePath = path.join(__dirname, '..');
  }

  async getExistingToken() {
    try {
      const files = await fs.readdir(this.basePath);
      const tokenFiles = files.filter(file => file.endsWith('loginTicketResponse.xml'))
        .sort().reverse();

      if (tokenFiles.length > 0) {
        const lastFile = tokenFiles[0];
        const content = await fs.readFile(path.join(this.basePath, lastFile), 'utf8');
        const result = await this.xmlParser.parseStringPromise(content);
        const loginCmsReturn = result['soapenv:Envelope']['soapenv:Body']
          .loginCmsResponse.loginCmsReturn;

        const decodedXml = loginCmsReturn
          .replace(/</g, '<')
          .replace(/>/g, '>')
          .replace(/"/g, '"');

        const ticketResponse = await this.xmlParser.parseStringPromise(decodedXml);

        const tokenInfo = {
          generationTime: ticketResponse.loginTicketResponse.header.generationTime,
          expirationTime: ticketResponse.loginTicketResponse.header.expirationTime,
          token: ticketResponse.loginTicketResponse.credentials.token,
          sign: ticketResponse.loginTicketResponse.credentials.sign
        };

        if (new Date(tokenInfo.expirationTime) > new Date()) {
          return tokenInfo;
        }
      }
      return null;
    } catch (error) {
      console.error('Error verificando token existente:', error);
      return null;
    }
  }

  async generateToken() {
    const seqNr = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const requestXml = path.join(this.basePath, `${seqNr}-LoginTicketRequest.xml`);
    const signedCms = path.join(this.basePath, `${seqNr}-LoginTicketRequest.xml.cms`);
    const base64Cms = path.join(this.basePath, `${seqNr}-LoginTicketRequest.xml.cms.base64`);
    const responseFile = path.join(this.basePath, `${seqNr}-loginTicketResponse.xml`);

    try {
      await this.cleanOldTokenFiles();

      const xmlContent = this.generateLoginTicketRequest();
      await fs.writeFile(requestXml, xmlContent);
      await execAsync(`openssl cms -sign -in "${requestXml}" -signer "${this.certificatePath}" -inkey "${this.privateKeyPath}" -nodetach -outform der -out "${signedCms}"`);
      await execAsync(`openssl base64 -in "${signedCms}" -out "${base64Cms}"`);
      const cms = await fs.readFile(base64Cms, 'utf8');

      let attempt = 1;
      const maxAttempts = 3;

      while (attempt <= maxAttempts) {
        try {
          const response = await axios.post(this.wsaaUrl,
            `<?xml version="1.0" encoding="UTF-8"?>
             <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
               <soap:Body>
                 <loginCms xmlns="http://wsaa.view.sua.dvadac.desein.afip.gov">
                   <in0>${cms.replace(/[\r\n]+/g, '')}</in0>
                 </loginCms>
               </soap:Body>
             </soap:Envelope>`,
            {
              headers: {
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': 'loginCms'
              }
            }
          );

          await fs.writeFile(responseFile, response.data);
          return await this.parseTokenResponse(response.data);
        } catch (error) {
          console.error(`Intento ${attempt} fallido al generar token:`, error);
          if (error.response && error.response.status === 500) {
            const fault = await this.xmlParser.parseStringPromise(error.response.data);
            const faultString = fault['soapenv:Envelope']['soapenv:Body']['soapenv:Fault']['faultstring'];
            throw new Error(`Error de AFIP: ${faultString}`);
          }
          if (attempt === maxAttempts) throw error;
          attempt++;
        }
      }
    } catch (error) {
      console.error('Error generando token:', error);
      throw error;
    }
  }

  async cleanOldTokenFiles() {
    try {
      const files = await fs.readdir(this.basePath);
      const tokenRelatedFiles = files.filter(file =>
        file.includes('LoginTicketRequest.xml') ||
        file.includes('LoginTicketRequest.xml.cms') ||
        file.includes('LoginTicketRequest.xml.cms.base64') ||
        file.includes('loginTicketResponse.xml')
      );

      for (const file of tokenRelatedFiles) {
        await fs.unlink(path.join(this.basePath, file));
        console.log(`Archivo eliminado: ${file}`);
      }
    } catch (error) {
      console.error('Error al limpiar archivos antiguos:', error);
    }
  }

  generateLoginTicketRequest() {
    const now = new Date();
    const generateTime = new Date(now.getTime() - 20 * 60000);
    const expirationTime = new Date(now.getTime() + 12 * 3600000);

    return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
 <header>
   <uniqueId>${Math.floor(now.getTime() / 1000)}</uniqueId>
   <generationTime>${generateTime.toISOString()}</generationTime>
   <expirationTime>${expirationTime.toISOString()}</expirationTime>
 </header>
 <service>wsfe</service>
</loginTicketRequest>`;
  }

  async parseTokenResponse(xmlResponse) {
    try {
      const result = await this.xmlParser.parseStringPromise(xmlResponse);
      const loginCmsReturn = result['soapenv:Envelope']['soapenv:Body'].loginCmsResponse.loginCmsReturn;
      const decodedXml = loginCmsReturn
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"');
      const ticketResponse = await this.xmlParser.parseStringPromise(decodedXml);

      return {
        generationTime: ticketResponse.loginTicketResponse.header.generationTime,
        expirationTime: ticketResponse.loginTicketResponse.header.expirationTime,
        token: ticketResponse.loginTicketResponse.credentials.token,
        sign: ticketResponse.loginTicketResponse.credentials.sign
      };
    } catch (error) {
      console.error('Error parseando respuesta de token:', error);
      throw new Error('Error al parsear respuesta del token de AFIP');
    }
  }

  async generarFactura(datos) {
    try {
      console.log('Datos recibidos para generar factura:', datos);
      const cbteTipoMap = {
        'A': 1,
        'B': 6,
        'C': 11
      };
      const cbteTipo = cbteTipoMap[datos.tipoFactura] || 11;
      console.log('Tipo de comprobante mapeado:', cbteTipo);
      const ultimoNumero = await this.obtenerUltimoComprobante(datos.puntoVenta, cbteTipo, datos.cuit);
      const nuevoNumero = ultimoNumero + 1;

      let tokenInfo = await this.getExistingToken();
      if (!tokenInfo) {
        tokenInfo = await this.generateToken();
      }

      const xmlBody = this.generarXMLFactura({
        ...datos,
        cbteDesde: nuevoNumero,
        cbteHasta: nuevoNumero,
        token: tokenInfo.token,
        sign: tokenInfo.sign,
        cbteTipo
      });

      console.log('XML enviado a AFIP:', xmlBody);

      const response = await axios({
        method: 'POST',
        url: this.wsfeUrl,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://ar.gov.afip.dif.FEV1/FECAESolicitar'
        },
        data: xmlBody
      });

      console.log('Respuesta de AFIP:', response.data);
      return await this.parsearRespuesta(response.data);
    } catch (error) {
      console.error('Error en AFIP Service:', error);
      if (error.response) {
        console.error('Respuesta de error de AFIP:', error.response.data);
      }
      throw error;
    }
  }

  async obtenerUltimoComprobante(puntoVenta, cbteTipo, cuit) {
    try {
      let tokenInfo = await this.getExistingToken();
      if (!tokenInfo) {
        tokenInfo = await this.generateToken();
      }

      const xmlBody = this.generarXMLUltimoComprobante({
        token: tokenInfo.token,
        sign: tokenInfo.sign,
        cuit: cuit,
        puntoVenta,
        cbteTipo
      });

      const response = await axios({
        method: 'POST',
        url: this.wsfeUrl,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://ar.gov.afip.dif.FEV1/FECompUltimoAutorizado'
        },
        data: xmlBody
      });

      return await this.parsearUltimoComprobante(response.data);
    } catch (error) {
      console.error('Error obteniendo último comprobante:', error);
      throw error;
    }
  }

  generarXMLUltimoComprobante(datos) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
 <soapenv:Header/>
 <soapenv:Body>
   <ar:FECompUltimoAutorizado>
     <ar:Auth>
       <ar:Token>${datos.token}</ar:Token>
       <ar:Sign>${datos.sign}</ar:Sign>
       <ar:Cuit>${datos.cuit}</ar:Cuit>
     </ar:Auth>
     <ar:PtoVta>${datos.puntoVenta}</ar:PtoVta>
     <ar:CbteTipo>${datos.cbteTipo}</ar:CbteTipo>
   </ar:FECompUltimoAutorizado>
 </soapenv:Body>
</soapenv:Envelope>`;
  }

  async parsearUltimoComprobante(xmlResponse) {
    try {
      const result = await this.xmlParser.parseStringPromise(xmlResponse);
      const cbteNro = result['soap:Envelope']['soap:Body']
        .FECompUltimoAutorizadoResponse
        .FECompUltimoAutorizadoResult
        .CbteNro;

      return parseInt(cbteNro) || 0;
    } catch (error) {
      console.error('Error parseando respuesta:', error);
      throw new Error('Error al parsear respuesta de AFIP');
    }
  }

  generarXMLFactura(datos) {
    const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const importeTotal = parseFloat(datos.importeTotal) || 0;
    const importeTrib = parseFloat(datos.importeTrib) || 0;
    const netoGravado = (importeTotal - importeTrib) / 1.21; // Neto = (Total - Tributos) / (1 + IVA)
    const iva = netoGravado * 0.21; // IVA = Neto * 21%
    const cbteTipo = datos.cbteTipo || 11;

    // Verificación de consistencia
    const sumaComponentes = netoGravado + iva + importeTrib;
    if (Math.abs(importeTotal - sumaComponentes) > 0.01) {
      console.warn('Advertencia: La suma de componentes no coincide con ImpTotal por redondeo');
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
     <soapenv:Header/>
     <soapenv:Body>
       <ar:FECAESolicitar>
         <ar:Auth>
           <ar:Token>${datos.token}</ar:Token>
           <ar:Sign>${datos.sign}</ar:Sign>
           <ar:Cuit>${datos.cuit}</ar:Cuit>
         </ar:Auth>
         <ar:FeCAEReq>
           <ar:FeCabReq>
             <ar:CantReg>1</ar:CantReg>
             <ar:PtoVta>${datos.puntoVenta}</ar:PtoVta>
             <ar:CbteTipo>${cbteTipo}</ar:CbteTipo>
           </ar:FeCabReq>
           <ar:FeDetReq>
             <ar:FECAEDetRequest>
               <ar:Concepto>1</ar:Concepto>
               <ar:DocTipo>99</ar:DocTipo>
               <ar:DocNro>0</ar:DocNro>
               <ar:CondicionIVAReceptorId>5</ar:CondicionIVAReceptorId>
               <ar:CbteDesde>${datos.cbteDesde}</ar:CbteDesde>
               <ar:CbteHasta>${datos.cbteHasta}</ar:CbteHasta>
               <ar:CbteFch>${fecha}</ar:CbteFch>
               <ar:ImpTotal>${importeTotal.toFixed(2)}</ar:ImpTotal>
               <ar:ImpTotConc>0</ar:ImpTotConc>
               <ar:ImpNeto>${netoGravado.toFixed(2)}</ar:ImpNeto>
               <ar:ImpOpEx>0</ar:ImpOpEx>
               <ar:ImpTrib>${importeTrib.toFixed(2)}</ar:ImpTrib>
               <ar:ImpIVA>${iva.toFixed(2)}</ar:ImpIVA>
               <ar:MonId>PES</ar:MonId>
               <ar:MonCotiz>1</ar:MonCotiz>
               <ar:Iva>
                 <ar:AlicIva>
                   <ar:Id>5</ar:Id>
                   <ar:BaseImp>${netoGravado.toFixed(2)}</ar:BaseImp>
                   <ar:Importe>${iva.toFixed(2)}</ar:Importe>
                 </ar:AlicIva>
               </ar:Iva>
               ${importeTrib > 0 ? `
               <ar:Tributos>
                 <ar:Tributo>
                   <ar:Id>99</ar:Id>
                   <ar:Desc>Tasa Municipal Río Cuarto</ar:Desc>
                   <ar:BaseImp>${netoGravado.toFixed(2)}</ar:BaseImp>
                   <ar:Alic>${((importeTrib / netoGravado) * 100).toFixed(2)}</ar:Alic>
                   <ar:Importe>${importeTrib.toFixed(2)}</ar:Importe>
                 </ar:Tributo>
               </ar:Tributos>` : ''}
             </ar:FECAEDetRequest>
           </ar:FeDetReq>
         </ar:FeCAEReq>
       </ar:FECAESolicitar>
     </soapenv:Body>
    </soapenv:Envelope>`;
  }

  async parsearRespuesta(xmlResponse) {
    try {
      const result = await this.xmlParser.parseStringPromise(xmlResponse);
      const response = result['soap:Envelope']['soap:Body'].FECAESolicitarResponse.FECAESolicitarResult;

      return {
        resultado: response.FeCabResp.Resultado,
        cae: response.FeDetResp.FECAEDetResponse.CAE || null,
        caeFchVto: response.FeDetResp.FECAEDetResponse.CAEFchVto || null,
        cbteDesde: response.FeDetResp.FECAEDetResponse.CbteDesde,
        cbteHasta: response.FeDetResp.FECAEDetResponse.CbteHasta,
        errores: response.Errors ? response.Errors.Err : null,
        observaciones: response.FeDetResp.FECAEDetResponse.Observaciones ? response.FeDetResp.FECAEDetResponse.Observaciones.Obs : null
      };
    } catch (error) {
      console.error('Error parseando respuesta:', error);
      throw new Error('Error al parsear respuesta de AFIP');
    }
  }
}

module.exports = new AfipService();