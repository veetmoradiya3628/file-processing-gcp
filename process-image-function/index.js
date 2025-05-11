const { Storage } = require("@google-cloud/storage");
const sharp = require("sharp");

const storage = new Storage();

exports.processImage = async (event, context) => {
  const bucketName = event.bucket;
  const fileName = event.name;

  if (!fileName.startsWith("uploads/")) return;

  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);
  const baseFileName = fileName.split("/").pop().split(".")[0];
  const extension = fileName.split(".").pop();

  const [contents] = await file.download();

  // Step 1: Create white background version
  const whiteBackgroundBuffer = await sharp(contents)
    .resize({
      width: 300,
      fit: "contain",
      background: { r: 255, g: 255, b: 255 },
    })
    .flatten()
    .jpeg()
    .toBuffer();

  const whiteBackgroundName = `processed/${baseFileName}.${extension}`;
  await bucket.file(whiteBackgroundName).save(whiteBackgroundBuffer, {
    contentType: "image/jpeg",
  });
  console.log(`Saved white background image as ${whiteBackgroundName}`);

  const themeBuffer = await sharp(contents)
    .resize({ width: 300 })
    .grayscale()
    .jpeg()
    .toBuffer();

  const themedFileName = `processed/${baseFileName}-theme.${extension}`;
  await bucket.file(themedFileName).save(themeBuffer, {
    contentType: "image/jpeg",
  });
  console.log(`Saved themed image as ${themedFileName}`);
};
