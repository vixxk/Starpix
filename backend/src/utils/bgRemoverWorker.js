const { removeBackground } = require('@imgly/background-removal-node');

process.on('message', async ({ inputPath }) => {
  try {
    const resultBlob = await removeBackground(inputPath);
    const arrayBuf = await resultBlob.arrayBuffer();
    const b64 = Buffer.from(arrayBuf).toString('base64');
    process.send({ success: true, base64: b64 });
  } catch (err) {
    process.send({ success: false, error: err.message });
  }
});
