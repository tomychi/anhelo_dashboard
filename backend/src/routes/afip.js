const express = require("express");
const router = express.Router();
const afipService = require("../services/afipService");

router.get("/token/status", async (req, res) => {
  try {
    const token = await afipService.getExistingToken();
    res.json({
      success: true,
      data: token
        ? {
            valid: true,
            expirationTime: token.expirationTime,
          }
        : {
            valid: false,
          },
    });
  } catch (error) {
    console.error("Error al verificar token:", error);
    res.status(500).json({
      success: false,
      message: "Error al verificar el estado del token",
    });
  }
});

router.post("/token/generate", async (req, res) => {
  try {
    const token = await afipService.generateToken();
    res.json({
      success: true,
      data: {
        expirationTime: token.expirationTime,
        message: "Token generado exitosamente",
      },
    });
  } catch (error) {
    console.error("Error al generar token:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar el token: " + error.message,
    });
  }
});

router.post("/factura", async (req, res) => {
  try {
    // console.log('Datos recibidos en la ruta:', req.body);
    const { cuit, puntoVenta, importeTotal, importeNeto, tipoFactura } =
      req.body;
    if (!cuit || !puntoVenta || !importeTotal || !importeNeto || !tipoFactura) {
      return res.status(400).json({
        success: false,
        message:
          "Faltan datos requeridos (cuit, puntoVenta, importeTotal, importeNeto, tipoFactura)",
      });
    }
    const respuestaAfip = await afipService.generarFactura(req.body);
    res.json({
      success: true,
      message: "Factura generada correctamente",
      data: respuestaAfip,
    });
  } catch (error) {
    console.error("Error al procesar la factura:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar la factura",
      error: error.message,
    });
  }
});

router.post("/factura/multiple", async (req, res) => {
  try {
    const { facturas } = req.body;
    // console.log('Datos recibidos para múltiples facturas:', facturas);

    if (!facturas || !Array.isArray(facturas) || facturas.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Se requiere un array de facturas",
      });
    }

    const respuestasAfip = [];
    for (const factura of facturas) {
      const { cuit, puntoVenta, importeTotal, importeNeto, tipoFactura } =
        factura;
      if (
        !cuit ||
        !puntoVenta ||
        !importeTotal ||
        !importeNeto ||
        !tipoFactura
      ) {
        respuestasAfip.push({
          error: "Faltan datos requeridos en una factura",
        });
        continue;
      }
      const respuesta = await afipService.generarFactura(factura);
      respuestasAfip.push(respuesta);
    }

    res.json({
      success: true,
      message: "Facturas procesadas",
      data: respuestasAfip,
    });
  } catch (error) {
    console.error("Error al procesar múltiples facturas:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar las facturas",
      error: error.message,
    });
  }
});

module.exports = router;
