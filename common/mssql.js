const sql = require("mssql");

const connectDB = async () => {
  const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_NAME,
    server: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  };

  return sql.connect(sqlConfig);
};

module.exports = {
  async getCert(cnpj) {
    try {
      await connectDB();

      const result =
        await sql.query`select top 1 Senha, RawData from IGCertificadoDigital where CNPJ_Contribuinte = ${cnpj}`;

      return result?.recordsets?.flat() || [];
    } catch (error) {
      console.log(error);
      return null;
    }
  },

  async insert(data) {
    try {
      await connectDB();

      const request = new sql.Request();

      const query = `MERGE INTO IGXMLDownload AS doc
        USING (
            VALUES 
                ${data}
        ) AS source (CNPJ_Contribuinte, ChaveAcessoDOC, Status, tipo)
        ON (doc.ChaveAcessoDOC = source.ChaveAcessoDOC)
        WHEN MATCHED THEN 
            UPDATE SET doc.ChaveAcessoDOC = source.ChaveAcessoDOC 
        WHEN NOT MATCHED THEN 
            INSERT (CNPJ_Contribuinte, ChaveAcessoDOC, Status, tipo)
            VALUES (source.CNPJ_Contribuinte, source.ChaveAcessoDOC, source.Status, source.tipo);`;


            console.log(query)

      const result = await request.query(query);

      return result?.recordsets?.flat() || [];
    } catch (error) {
      throw new Error(error?.message);
    }
  },

  async update(status, nfe) {
    try {
      await connectDB();

      if (status == 1) {
        return sql.query`update IGXMLDownload set Status = ${status}, attempts = attempts + 1 where ChaveAcessoDOC = ${nfe}`;
      }

      return sql.query`update IGXMLDownload set Status = ${status} where ChaveAcessoDOC = ${nfe}`;
    } catch (error) {
      console.log(error);
      return null;
    }
  },
};
